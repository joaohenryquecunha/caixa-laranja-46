import { useState, useEffect, useCallback, createContext, useContext, ReactNode, createElement, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Transaction, Category, TransactionType, FinancialSummary, Company } from '@/types/financial';
import { Goal, GoalProgress, GoalHistory } from '@/types/goals';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { addMonths, format, isToday, isThisMonth, isThisYear, isSameDay, differenceInDays, parseISO } from 'date-fns';
import { formatCurrency } from '@/lib/formatters';

export type FilterPeriod = 'day' | 'month' | 'year' | 'all';

export interface SpecificFilter {
  type: FilterPeriod;
  day?: number;
  month?: number;
  year?: number;
  companyId?: string;
}

export interface ChartDataPoint {
  date: string;
  tooltipDate?: string;
  balance: number;
  income: number;
  expenses: number;
  investments: number;
}

const DEFAULT_CATEGORIES: Omit<Category, 'id'>[] = [
  {
    name: 'Salário',
    color: '#22c55e',
    icon: 'Wallet',
    type: TransactionType.INCOME,
  },
  {
    name: 'Alimentação',
    color: '#ef4444',
    icon: 'UtensilsCrossed',
    type: TransactionType.EXPENSE,
  },
  {
    name: 'Ações',
    color: '#8b5cf6',
    icon: 'TrendingUp',
    type: TransactionType.INVESTMENT,
  },
];

// Normalize DB row -> Transaction type used in the app
const mapDbTransaction = (tx: any): Transaction => ({
  id: tx.id,
  amount: Number(tx.amount),
  description: tx.description,
  categoryId: tx.category_id,
  companyId: tx.company_id || undefined,
  type: tx.type as TransactionType,
  date: tx.date,
  createdAt: tx.created_at
});

const mapDbGoalHistory = (entry: any): GoalHistory => ({
  id: entry.id,
  goalId: entry.goal_id,
  transactionId: entry.transaction_id,
  amount: Number(entry.amount),
  date: entry.date,
  description: entry.description,
  createdAt: entry.created_at
});

function useSupabaseFinancialDataInternal() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [goalHistory, setGoalHistory] = useState<GoalHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const hasLoadedDataRef = useRef(false);
  const [specificFilter, setSpecificFilter] = useState<SpecificFilter>({ 
    type: 'month',
    year: new Date().getFullYear(),
    month: new Date().getMonth(),
    companyId: undefined
  });

  const userId = user?.id;

  // Load data when user is authenticated (userId evita recarregar ao renovar token)
  useEffect(() => {
    if (!authLoading && userId) {
      loadData();
    } else if (!authLoading && !userId) {
      // Clear data when user logs out
      hasLoadedDataRef.current = false;
      setTransactions([]);
      setCategories([]);
      setCompanies([]);
      setGoals([]);
      setGoalHistory([]);
      setLoading(false);
    }
  }, [userId, authLoading]);

  // Real-time updates for transactions
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`transactions-changes-${user.id}-${Date.now()}-${Math.random()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const tx = mapDbTransaction(payload.new);
            setTransactions(prev => [tx, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            const tx = mapDbTransaction(payload.new);
            setTransactions(prev => 
              prev.map(t => t.id === tx.id ? tx : t)
            );
          } else if (payload.eventType === 'DELETE') {
            const oldId = payload.old?.id;
            if (!oldId) return;
            setTransactions(prev => 
              prev.filter(t => t.id !== oldId)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Real-time updates for categories
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`categories-changes-${user.id}-${Date.now()}-${Math.random()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'categories',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            // Validação robusta antes de inserir
            if (!payload.new?.id || !payload.new?.name || !payload.new?.type) return;
            if (typeof payload.new.id !== 'string' || !payload.new.id.trim()) return;
            if (typeof payload.new.name !== 'string' || !payload.new.name.trim()) return;
            
            const inserted = {
              id: String(payload.new.id).trim(),
              name: String(payload.new.name).trim(),
              color: String(payload.new.color || '#6b7280'),
              icon: String(payload.new.icon || 'Tag'),
              type: payload.new.type as TransactionType,
            };
            setCategories(prev => {
              if (prev.some(c => c.id === inserted.id)) return prev;
              return [...prev, inserted];
            });
          } else if (payload.eventType === 'UPDATE') {
            // Validação robusta antes de atualizar
            if (!payload.new?.id || !payload.new?.name || !payload.new?.type) return;
            if (typeof payload.new.id !== 'string' || !payload.new.id.trim()) return;
            if (typeof payload.new.name !== 'string' || !payload.new.name.trim()) return;
            
            const updated = {
              id: String(payload.new.id).trim(),
              name: String(payload.new.name).trim(),
              color: String(payload.new.color || '#6b7280'),
              icon: String(payload.new.icon || 'Tag'),
              type: payload.new.type as TransactionType,
            };
            setCategories(prev => prev.map(c => (c.id === updated.id ? updated : c)));
          } else if (payload.eventType === 'DELETE') {
            if (!payload.old?.id) return;
            setCategories(prev => prev.filter(c => c.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Real-time updates for companies
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`companies-changes-${user.id}-${Date.now()}-${Math.random()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'companies',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            // Validação robusta antes de inserir
            if (!payload.new?.id || !payload.new?.name) return;
            if (typeof payload.new.id !== 'string' || !payload.new.id.trim()) return;
            if (typeof payload.new.name !== 'string' || !payload.new.name.trim()) return;
            
            const inserted: Company = {
              id: String(payload.new.id).trim(),
              name: String(payload.new.name).trim(),
            };
            setCompanies((prev) => {
              if (prev.some((company) => company.id === inserted.id)) return prev;
              return [...prev, inserted];
            });
          } else if (payload.eventType === 'UPDATE') {
            // Validação robusta antes de atualizar
            if (!payload.new?.id || !payload.new?.name) return;
            if (typeof payload.new.id !== 'string' || !payload.new.id.trim()) return;
            if (typeof payload.new.name !== 'string' || !payload.new.name.trim()) return;
            
            const updated: Company = {
              id: String(payload.new.id).trim(),
              name: String(payload.new.name).trim(),
            };
            setCompanies((prev) =>
              prev.map((company) => (company.id === updated.id ? updated : company))
            );
          } else if (payload.eventType === 'DELETE') {
            if (!payload.old?.id) return;
            setCompanies((prev) => prev.filter((company) => company.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Real-time updates for goals
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`goals-changes-${user.id}-${Date.now()}-${Math.random()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'goals',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newGoal: Goal = {
              id: payload.new.id,
              title: payload.new.title,
              description: payload.new.description || undefined,
              targetAmount: Number(payload.new.target_amount),
              initialBalance: Number(payload.new.initial_balance || 0),
              currentProgress: Number(payload.new.current_progress || 0),
              targetDate: payload.new.target_date,
              createdAt: payload.new.created_at,
              completed: payload.new.completed || false,
              completedAt: payload.new.completed_at || undefined,
              mode: (payload.new.mode as 'automatic' | 'manual') || 'automatic'
            };
            setGoals(prev => {
              if (prev.some(g => g.id === newGoal.id)) {
                return prev.map(g => (g.id === newGoal.id ? newGoal : g));
              }
              return [newGoal, ...prev];
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedGoal: Goal = {
              id: payload.new.id,
              title: payload.new.title,
              description: payload.new.description || undefined,
              targetAmount: Number(payload.new.target_amount),
              initialBalance: Number(payload.new.initial_balance || 0),
              currentProgress: Number(payload.new.current_progress || 0),
              targetDate: payload.new.target_date,
              createdAt: payload.new.created_at,
              completed: payload.new.completed || false,
              completedAt: payload.new.completed_at || undefined,
              mode: (payload.new.mode as 'automatic' | 'manual') || 'automatic'
            };
            setGoals(prev => {
              return prev.map(g => g.id === updatedGoal.id ? updatedGoal : g);
            });
          } else if (payload.eventType === 'DELETE') {
            setGoals(prev => 
              prev.filter(g => g.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Real-time updates for goal history
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`goal-history-changes-${user.id}-${Date.now()}-${Math.random()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'goal_history',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const entry = mapDbGoalHistory(payload.new);
            setGoalHistory((prev) => {
              if (prev.some((item) => item.id === entry.id)) return prev;
              return [entry, ...prev];
            });
          } else if (payload.eventType === 'UPDATE') {
            const entry = mapDbGoalHistory(payload.new);
            setGoalHistory((prev) =>
              prev.map((item) => (item.id === entry.id ? entry : item))
            );
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old?.id;
            if (!deletedId) return;
            setGoalHistory((prev) => prev.filter((item) => item.id !== deletedId));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Update goal progress when transactions change
  useEffect(() => {
    if (!user || goals.length === 0) return;
    
    goals.forEach(goal => {
      if (!goal.completed) {
        updateGoalProgressInDB(goal.id);
      }
    });
  }, [transactions, goals.length, user]);

  const loadData = async () => {
    if (!user) return;
    
    if (!hasLoadedDataRef.current) {
      setLoading(true);
    }
    try {
      await Promise.all([
        loadCategories(),
        loadCompanies(),
        loadTransactions(),
        loadGoals(),
        loadGoalHistory()
      ]);
      hasLoadedDataRef.current = true;
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error loading categories:', error);
      return;
    }

    const normalized = await synchronizeCategories(data ?? []);
    setCategories(normalized);
  };

  const synchronizeCategories = async (existing: any[]): Promise<Category[]> => {
    if (!user) return [];

    const keyFor = (type: string, name: string) => `${type}:${name.trim().toLowerCase()}`;
    const map = new Map<string, any[]>();

    for (const cat of existing) {
      // Validação robusta: filtrar categorias inválidas antes de processar
      if (!cat || typeof cat !== 'object') continue;
      if (!cat.id || typeof cat.id !== 'string' || !cat.id.trim()) continue;
      if (!cat.name || typeof cat.name !== 'string' || !cat.name.trim()) continue;
      if (!cat.type || typeof cat.type !== 'string') continue;
      
      const key = keyFor(cat.type, cat.name);
      const list = map.get(key) ?? [];
      list.push(cat);
      map.set(key, list);
    }

    const toDelete: string[] = [];
    const keep: Category[] = [];
    const toInsert: Omit<Category, 'id'>[] = [];

    const toCategory = (cat: any): Category => ({
      id: String(cat.id || '').trim(),
      name: String(cat.name || '').trim(),
      color: String(cat.color || '#6b7280'),
      icon: String(cat.icon || 'Tag'),
      type: cat.type as TransactionType,
    });

    for (const required of DEFAULT_CATEGORIES) {
      const key = keyFor(required.type, required.name);
      const matches = map.get(key);

      if (matches && matches.length > 0) {
        const primary = matches.shift()!;
        keep.push(toCategory(primary));

        if (matches.length > 0) {
          matches.forEach((duplicate) => toDelete.push(duplicate.id));
        }

        map.delete(key);
      } else {
        toInsert.push(required);
      }
    }

    for (const remaining of map.values()) {
      if (remaining.length > 0) {
        const [first, ...duplicates] = remaining;
        keep.push(toCategory(first));
        duplicates.forEach((dup) => toDelete.push(dup.id));
      }
    }

    if (toDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from('categories')
        .delete()
        .in('id', toDelete);

      if (deleteError) {
        console.error('Error deleting extra categories:', deleteError);
      }
    }

    let insertedCategories: Category[] = [];
    if (toInsert.length > 0) {
      const payload = toInsert.map((cat) => ({
        ...cat,
        user_id: user.id,
      }));

      const { data: inserted, error: insertError } = await supabase
        .from('categories')
        .insert(payload)
        .select();

      if (insertError) {
        console.error('Error inserting required categories:', insertError);
      } else if (inserted) {
        insertedCategories = inserted.map(toCategory);
      }
    }

    const finalCategories = [...keep, ...insertedCategories];
    const typeOrder = [
      TransactionType.INCOME,
      TransactionType.EXPENSE,
      TransactionType.INVESTMENT,
    ];

    finalCategories.sort((a, b) => {
      const typeDiff = typeOrder.indexOf(a.type) - typeOrder.indexOf(b.type);
      if (typeDiff !== 0) return typeDiff;
      return a.name.localeCompare(b.name);
    });

    return finalCategories;
  };

  const ensureMetaCategory = useCallback(async (): Promise<Category> => {
    if (!user) throw new Error('Usuário não autenticado');

    const existing = categories.find(
      (cat) => cat.type === TransactionType.EXPENSE && cat.name.toLowerCase() === 'meta'
    );
    if (existing) {
      return existing;
    }

    const { data, error } = await supabase
      .from('categories')
      .insert({
        user_id: user.id,
        name: 'Meta',
        color: '#7c3aed',
        icon: 'Target',
        type: TransactionType.EXPENSE,
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar categoria Meta:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar a categoria Meta automaticamente.',
        variant: 'destructive',
      });
      throw error;
    }

    const newCategory: Category = {
      id: data.id,
      name: data.name,
      color: data.color,
      icon: data.icon,
      type: data.type as TransactionType,
    };

    setCategories((prev) => [...prev, newCategory]);
    return newCategory;
  }, [user, categories, toast]);

  const loadCompanies = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('user_id', user.id)
      .order('name');

    if (error) {
      console.error('Error loading companies:', error);
      return;
    }

    const unique: Company[] = [];
    const seen = new Set<string>();
    (data ?? []).forEach((comp) => {
      // Validação robusta: verificar id e name válidos
      if (!comp?.id || typeof comp.id !== 'string' || !comp.id.trim()) return;
      if (!comp?.name || typeof comp.name !== 'string' || !comp.name.trim()) return;
      if (seen.has(comp.id)) return;
      seen.add(comp.id);
      unique.push({ id: comp.id.trim(), name: comp.name.trim() });
    });

    setCompanies(unique);
  };

  const loadTransactions = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error loading transactions:', error);
      return;
    }

    setTransactions(data.map(tx => ({
      id: tx.id,
      amount: Number(tx.amount),
      description: tx.description,
      categoryId: tx.category_id,
      companyId: tx.company_id || undefined,
      type: tx.type as TransactionType,
      date: tx.date,
      createdAt: tx.created_at
    })));
  };

  const loadGoals = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading goals:', error);
      return;
    }

    setGoals(data.map(goal => ({
      id: goal.id,
      title: goal.title,
      description: goal.description || undefined,
      targetAmount: Number(goal.target_amount),
      initialBalance: Number(goal.initial_balance || 0),
      currentProgress: Number(goal.current_progress || 0),
      targetDate: goal.target_date,
      createdAt: goal.created_at,
      completed: goal.completed || false,
      completedAt: goal.completed_at || undefined,
      mode: (goal.mode as 'automatic' | 'manual') || 'automatic'
    })));
  };

  const loadGoalHistory = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('goal_history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading goal history:', error);
      return;
    }

    setGoalHistory((data ?? []).map(mapDbGoalHistory));
  };

  const addTransaction = useCallback(async (transaction: Omit<Transaction, 'id' | 'createdAt'>): Promise<Transaction | null> => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        amount: transaction.amount,
        description: transaction.description,
        category_id: transaction.categoryId,
        company_id: transaction.companyId || null,
        type: transaction.type,
        date: transaction.date
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding transaction:', error);
      toast({
        title: "Erro",
        description: "Erro ao adicionar transação",
        variant: "destructive"
      });
      return null;
    }

    const newTransaction: Transaction = mapDbTransaction(data);

    // Otimista + sincroniza com o servidor para evitar discrepâncias entre abas
    setTransactions(prev => [newTransaction, ...prev]);
    // Força recarregar do banco para garantir consistência e refletir RLS/ordenção
    await loadTransactions();
    return newTransaction;
  }, [user, toast]);

  const addRecurringTransactions = useCallback(async (data: {
    amount: number;
    description: string;
    categoryId: string;
    companyId?: string;
    type: TransactionType;
    startDate: string;
    times: number;
  }) => {
    if (!user) return;

    const transactionsToInsert = [];
    const startDate = new Date(data.startDate);
    
    for (let i = 0; i < data.times; i++) {
      const currentDate = addMonths(startDate, i);
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const day = String(currentDate.getDate()).padStart(2, '0');
      const transactionDate = `${year}-${month}-${day}`;
      
      transactionsToInsert.push({
        user_id: user.id,
        amount: data.amount,
        description: `${data.description} (${i + 1}/${data.times})`,
        category_id: data.categoryId,
        company_id: data.companyId || null,
        type: data.type,
        date: transactionDate
      });
    }

    const { data: insertedData, error } = await supabase
      .from('transactions')
      .insert(transactionsToInsert)
      .select();

    if (error) {
      console.error('Error adding recurring transactions:', error);
      toast({
        title: "Erro",
        description: "Erro ao adicionar transações recorrentes",
        variant: "destructive"
      });
      return;
    }

    const newTransactions: Transaction[] = insertedData.map(tx => ({
      id: tx.id,
      amount: Number(tx.amount),
      description: tx.description,
      categoryId: tx.category_id,
      companyId: tx.company_id || undefined,
      type: tx.type as TransactionType,
      date: tx.date,
      createdAt: tx.created_at
    }));

    setTransactions(prev => [...newTransactions, ...prev]);
    
    toast({
      title: "Sucesso",
      description: `${data.times} transações recorrentes adicionadas`
    });
  }, [user, toast]);

  const deleteTransaction = useCallback(async (id: string) => {
    if (!user) return;

    let relatedHistory = goalHistory.find((entry) => entry.transactionId === id);

    if (!relatedHistory) {
      const { data: historyRow, error: fetchHistoryError } = await supabase
        .from('goal_history')
        .select('*')
        .eq('transaction_id', id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchHistoryError) {
        console.error('Error fetching goal history for transaction:', fetchHistoryError);
      } else if (historyRow) {
        relatedHistory = mapDbGoalHistory(historyRow);
      }
    }

    const relatedGoal = relatedHistory
      ? goals.find((goal) => goal.id === relatedHistory.goalId)
      : undefined;
    const manualGoalNewProgress =
      relatedHistory && relatedGoal && relatedGoal.mode === 'manual'
        ? Math.max(0, relatedGoal.currentProgress - relatedHistory.amount)
        : null;

    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting transaction:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir transação",
        variant: "destructive"
      });
      return;
    }

    if (relatedHistory && relatedGoal && relatedGoal.mode === 'manual' && manualGoalNewProgress !== null) {
      const { error: goalUpdateError } = await supabase
        .from('goals')
        .update({ current_progress: manualGoalNewProgress })
        .eq('id', relatedGoal.id)
        .eq('user_id', user.id);

      if (goalUpdateError) {
        console.error('Error updating goal after transaction deletion:', goalUpdateError);
      } else {
        setGoals((prev) =>
          prev.map((goal) =>
            goal.id === relatedGoal.id ? { ...goal, currentProgress: manualGoalNewProgress } : goal
          )
        );
      }
    }

    if (relatedHistory) {
      const { error: deleteHistoryError } = await supabase
        .from('goal_history')
        .delete()
        .eq('transaction_id', id)
        .eq('user_id', user.id);

      if (deleteHistoryError) {
        console.error('Error deleting goal history after transaction deletion:', deleteHistoryError);
      }

      setGoalHistory((prev) => prev.filter((entry) => entry.transactionId !== id));
    }

    setTransactions(prev => prev.filter(t => t.id !== id));
    
    toast({
      title: "Sucesso",
      description: "Transação excluída com sucesso"
    });
  }, [user, toast, goalHistory, goals]);

  const addCategory = useCallback(async (category: Omit<Category, 'id'>) => {
    if (!user) return;

    const { data, error } = await supabase
      .from('categories')
      .insert({
        user_id: user.id,
        name: category.name,
        color: category.color,
        icon: category.icon,
        type: category.type
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding category:', error);
      toast({
        title: "Erro",
        description: "Erro ao adicionar categoria",
        variant: "destructive"
      });
      return;
    }

    const newCategory: Category = {
      id: data.id,
      name: data.name,
      color: data.color,
      icon: data.icon,
      type: data.type as TransactionType
    };

    setCategories(prev => {
      if (prev.some(c => c.id === newCategory.id)) return prev;
      return [...prev, newCategory];
    });

    toast({
      title: "Sucesso",
      description: "Categoria adicionada com sucesso"
    });
  }, [user, toast]);

  const updateCategory = useCallback(async (id: string, updatedCategory: Omit<Category, 'id'>) => {
    if (!user) return;

    const { error } = await supabase
      .from('categories')
      .update({
        name: updatedCategory.name,
        color: updatedCategory.color,
        icon: updatedCategory.icon,
        type: updatedCategory.type
      })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error updating category:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar categoria",
        variant: "destructive"
      });
      return;
    }

    setCategories(prev => prev.map(cat => 
      cat.id === id ? { ...updatedCategory, id } : cat
    ));
    
    toast({
      title: "Sucesso",
      description: "Categoria atualizada com sucesso"
    });
  }, [user, toast]);

  const deleteCategory = useCallback(async (id: string) => {
    if (!user) return;

    // Check if category is in use
    const isInUse = transactions.some(transaction => transaction.categoryId === id);
    
    if (isInUse) {
      return { success: false, message: 'Esta categoria está sendo usada em transações e não pode ser excluída.' };
    }

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting category:', error);
      return { success: false, message: 'Erro ao excluir categoria.' };
    }

    setCategories(prev => prev.filter(cat => cat.id !== id));
    return { success: true, message: 'Categoria excluída com sucesso.' };
  }, [user, transactions]);

  const isCategoryInUse = useCallback((id: string) => {
    return transactions.some(transaction => transaction.categoryId === id);
  }, [transactions]);

  const addCompany = useCallback(async (company: Omit<Company, 'id'>) => {
    if (!user) return;

    const { data, error } = await supabase
      .from('companies')
      .insert({
        user_id: user.id,
        name: company.name
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding company:', error);
      toast({
        title: "Erro",
        description: "Erro ao adicionar empresa",
        variant: "destructive"
      });
      return;
    }

    const newCompany: Company = {
      id: data.id,
      name: data.name
    };

    setCompanies(prev => {
      if (prev.some(company => company.id === newCompany.id)) return prev;
      return [...prev, newCompany];
    });
    
    toast({
      title: "Sucesso",
      description: "Empresa adicionada com sucesso"
    });
  }, [user, toast]);

  const updateCompany = useCallback(async (id: string, updatedCompany: Omit<Company, 'id'>) => {
    if (!user) return;

    const { error } = await supabase
      .from('companies')
      .update({
        name: updatedCompany.name
      })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error updating company:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar empresa",
        variant: "destructive"
      });
      return { success: false, message: 'Erro ao atualizar empresa.' };
    }

    setCompanies(prev => prev.map(company => 
      company.id === id ? { ...updatedCompany, id } : company
    ));
    
    toast({
      title: "Sucesso",
      description: "Empresa atualizada com sucesso"
    });
    return { success: true, message: 'Empresa atualizada com sucesso.' };
  }, [user, toast]);

  const deleteCompany = useCallback(async (id: string) => {
    if (!user) return;

    // Check if company is in use
    const isInUse = transactions.some(transaction => transaction.companyId === id);
    
    if (isInUse) {
      return { success: false, message: 'Esta empresa está sendo usada em transações e não pode ser excluída.' };
    }

    const { error } = await supabase
      .from('companies')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting company:', error);
      return { success: false, message: 'Erro ao excluir empresa.' };
    }

    setCompanies(prev => prev.filter(company => company.id !== id));
    return { success: true, message: 'Empresa excluída com sucesso.' };
  }, [user, transactions]);

  const getCompanyById = useCallback((id: string) => {
    return companies.find(c => c.id === id);
  }, [companies]);

  const getFilteredTransactions = useCallback(() => {
    const now = new Date();
    
    // Função auxiliar para parsear data local (evita problemas de timezone)
    const parseLocalDate = (dateString: string): Date => {
      if (!dateString) return new Date(NaN);
      // Se a data está no formato YYYY-MM-DD (sem hora), parse como local
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        const [year, month, day] = dateString.split('-').map(Number);
        return new Date(year, month - 1, day);
      }
      return new Date(dateString);
    };
    
    const filtered = transactions.filter(transaction => {
      const transactionDate = parseLocalDate(transaction.date);
      
      // Filter by company
      if (specificFilter.companyId) {
        if (specificFilter.companyId === 'none' && transaction.companyId) {
          return false;
        }
        if (specificFilter.companyId !== 'none' && transaction.companyId !== specificFilter.companyId) {
          return false;
        }
      }
      
      switch (specificFilter.type) {
        case 'day':
          if (specificFilter.day !== undefined) {
            const currentYear = now.getFullYear();
            const currentMonth = now.getMonth();
            const targetDate = new Date(currentYear, currentMonth, specificFilter.day);
            return isSameDay(transactionDate, targetDate);
          }
          return isToday(transactionDate);
        case 'month':
          if (specificFilter.month !== undefined) {
            const targetYear = specificFilter.year || now.getFullYear();
            return transactionDate.getFullYear() === targetYear && 
                   transactionDate.getMonth() === specificFilter.month;
          }
          return isThisMonth(transactionDate);
        case 'year':
          if (specificFilter.year !== undefined) {
            return transactionDate.getFullYear() === specificFilter.year;
          }
          return isThisYear(transactionDate);
        case 'all':
        default:
          return true;
      }
    });
    
    return filtered;
  }, [transactions, specificFilter]);

  const getFinancialSummary = useCallback((): FinancialSummary => {
    const filteredTransactions = getFilteredTransactions();
    
    const totalIncome = filteredTransactions
      .filter(t => t.type === TransactionType.INCOME)
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpenses = filteredTransactions
      .filter(t => t.type === TransactionType.EXPENSE)
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalInvestments = filteredTransactions
      .filter(t => t.type === TransactionType.INVESTMENT)
      .reduce((sum, t) => sum + t.amount, 0);

    const totalBalance = totalIncome - totalExpenses - totalInvestments;

    return {
      totalBalance,
      totalIncome,
      totalExpenses,
      totalInvestments
    };
  }, [getFilteredTransactions]);

  const getRecentTransactions = useCallback((limit: number = 5) => {
    const filteredTransactions = getFilteredTransactions();
    // Função auxiliar para parsear data local
    const parseLocalDate = (dateString: string): Date => {
      if (!dateString) return new Date(NaN);
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        const [year, month, day] = dateString.split('-').map(Number);
        return new Date(year, month - 1, day);
      }
      return new Date(dateString);
    };
    return filteredTransactions
      .sort((a, b) => {
        const dateA = parseLocalDate(a.date);
        const dateB = parseLocalDate(b.date);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, limit);
  }, [getFilteredTransactions]);

  const getCategoryById = useCallback((id: string) => {
    return categories.find(c => c.id === id);
  }, [categories]);

  const getAvailableYears = useCallback(() => {
    // Função auxiliar para parsear data local
    const parseLocalDate = (dateString: string): Date => {
      if (!dateString) return new Date(NaN);
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        const [year, month, day] = dateString.split('-').map(Number);
        return new Date(year, month - 1, day);
      }
      return new Date(dateString);
    };
    const years = transactions.map(t => parseLocalDate(t.date).getFullYear());
    return Array.from(new Set(years)).sort((a, b) => b - a);
  }, [transactions]);

  const getAvailableMonths = useCallback((year?: number) => {
    // Função auxiliar para parsear data local
    const parseLocalDate = (dateString: string): Date => {
      if (!dateString) return new Date(NaN);
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        const [year, month, day] = dateString.split('-').map(Number);
        return new Date(year, month - 1, day);
      }
      return new Date(dateString);
    };
    const targetYear = year || new Date().getFullYear();
    const months = transactions
      .filter(t => parseLocalDate(t.date).getFullYear() === targetYear)
      .map(t => parseLocalDate(t.date).getMonth());
    return Array.from(new Set(months)).sort((a, b) => a - b);
  }, [transactions]);

  const getAvailableDays = useCallback(() => {
    // Função auxiliar para parsear data local
    const parseLocalDate = (dateString: string): Date => {
      if (!dateString) return new Date(NaN);
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        const [year, month, day] = dateString.split('-').map(Number);
        return new Date(year, month - 1, day);
      }
      return new Date(dateString);
    };
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const days = transactions
      .filter(t => {
        const date = parseLocalDate(t.date);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      })
      .map(t => parseLocalDate(t.date).getDate());
    
    return Array.from(new Set(days)).sort((a, b) => a - b);
  }, [transactions]);

  const getChartData = useCallback((): ChartDataPoint[] => {
    const filteredTransactions = getFilteredTransactions();
    
    
    if (filteredTransactions.length === 0) {
      return [];
    }

    // Função auxiliar para parsear data local
    const parseLocalDate = (dateString: string): Date => {
      if (!dateString) return new Date(NaN);
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        const [year, month, day] = dateString.split('-').map(Number);
        return new Date(year, month - 1, day);
      }
      return new Date(dateString);
    };
    
    const transactionsByPeriod = filteredTransactions.reduce((acc, transaction) => {
      let periodKey = '';
      const transactionDate = parseLocalDate(transaction.date);
      
      if (specificFilter.type === 'month') {
        periodKey = format(transactionDate, 'yyyy-MM-dd');
      } else if (specificFilter.type === 'year') {
        periodKey = format(transactionDate, 'yyyy-MM');
      } else {
        periodKey = transaction.date;
      }
      
      if (!acc[periodKey]) {
        acc[periodKey] = { income: 0, expenses: 0, investments: 0 };
      }
      
      if (transaction.type === TransactionType.INCOME) {
        acc[periodKey].income += transaction.amount;
      } else if (transaction.type === TransactionType.EXPENSE) {
        acc[periodKey].expenses += transaction.amount;
      } else if (transaction.type === TransactionType.INVESTMENT) {
        acc[periodKey].investments += transaction.amount;
      }
      
      return acc;
    }, {} as Record<string, { income: number; expenses: number; investments: number }>);

    const sortedPeriods = Object.keys(transactionsByPeriod).sort();
    let runningBalance = 0;
    
    const chartData = sortedPeriods.map(period => {
      const periodData = transactionsByPeriod[period];
      runningBalance += periodData.income - periodData.expenses - periodData.investments;
      
      let displayDate = '';
      let tooltipDate = '';
      
      if (specificFilter.type === 'month') {
        displayDate = format(new Date(period), 'dd');
        tooltipDate = format(new Date(period), 'dd/MMM/yyyy');
      } else if (specificFilter.type === 'year') {
        displayDate = format(new Date(period + '-01'), 'MMM');
        tooltipDate = format(new Date(period + '-01'), 'MMM/yyyy');
      } else {
        displayDate = format(new Date(period), 'dd/MM');
        tooltipDate = format(new Date(period), 'dd/MMM/yyyy');
      }
      
      return {
        date: displayDate,
        tooltipDate,
        balance: runningBalance,
        income: periodData.income,
        expenses: periodData.expenses,
        investments: periodData.investments,
      };
    });
    
    return chartData;
  }, [getFilteredTransactions, specificFilter]);

  // ============ GOALS FUNCTIONS ============
  
  const addGoal = useCallback(async (goalData: Omit<Goal, 'id' | 'createdAt' | 'currentProgress' | 'completed' | 'completedAt'>) => {
    if (!user) return '';

    const mode = goalData.mode || 'automatic';
    const initialBalance = mode === 'automatic' ? goalData.initialBalance : 0;

    const { data, error } = await supabase
      .from('goals')
      .insert({
        user_id: user.id,
        title: goalData.title,
        description: goalData.description || null,
        target_amount: goalData.targetAmount,
        initial_balance: initialBalance,
        current_progress: initialBalance,
        target_date: goalData.targetDate,
        completed: false,
        mode
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao criar meta:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar meta",
        variant: "destructive"
      });
      return '';
    }

    // Adiciona otimisticamente ao state também (caso o real-time demore)
    const newGoal: Goal = {
      id: data.id,
      title: data.title,
      description: data.description || undefined,
      targetAmount: Number(data.target_amount),
      initialBalance: Number(data.initial_balance || 0),
      currentProgress: Number(data.current_progress || 0),
      targetDate: data.target_date,
      createdAt: data.created_at,
      completed: data.completed || false,
      completedAt: data.completed_at || undefined,
      mode: (data.mode as 'automatic' | 'manual') || 'automatic'
    };

    setGoals(prev => [newGoal, ...prev]);
    
    toast({
      title: "Sucesso",
      description: "Meta criada com sucesso"
    });
    
    return data.id;
  }, [user, toast]);


  const updateGoal = useCallback(async (goalId: string, updates: Partial<Goal>) => {
    if (!user) return;

    const updateData: any = {};
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.targetAmount !== undefined) updateData.target_amount = updates.targetAmount;
    if (updates.targetDate !== undefined) updateData.target_date = updates.targetDate;
    if (updates.completed !== undefined) updateData.completed = updates.completed;
    if (updates.completedAt !== undefined) updateData.completed_at = updates.completedAt;
    if (updates.currentProgress !== undefined) updateData.current_progress = updates.currentProgress;
    if (updates.mode !== undefined) updateData.mode = updates.mode;

    const { error } = await supabase
      .from('goals')
      .update(updateData)
      .eq('id', goalId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error updating goal:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar meta",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Sucesso",
      description: "Meta atualizada com sucesso"
    });
  }, [user, toast]);

  const deleteGoal = useCallback(async (goalId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', goalId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting goal:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir meta",
        variant: "destructive"
      });
      return;
    }

    // Also delete goal history
    await supabase
      .from('goal_history')
      .delete()
      .eq('goal_id', goalId)
      .eq('user_id', user.id);

    toast({
      title: "Sucesso",
      description: "Meta excluída com sucesso"
    });
  }, [user, toast]);

  const completeGoal = useCallback(async (goalId: string) => {
    if (!user) return;

    const goal = goals.find(g => g.id === goalId);
    if (!goal) {
      toast({
        title: "Meta não encontrada",
        description: "Não foi possível localizar esta meta para concluir.",
        variant: "destructive"
      });
      return;
    }

    const remainingAmount = Math.max(0, goal.targetAmount - goal.currentProgress);
    const progressPercentage = goal.targetAmount > 0
      ? (goal.currentProgress / goal.targetAmount) * 100
      : 0;

    const hasReachedTarget = remainingAmount <= 0.01 || progressPercentage >= 100;

    if (!hasReachedTarget) {
      toast({
        title: "Meta ainda em andamento",
        description: `Você precisa economizar ${formatCurrency(remainingAmount)} para concluir esta meta.`,
        variant: "destructive"
      });
      return;
    }

    const { error } = await supabase
      .from('goals')
      .update({
        completed: true,
        completed_at: new Date().toISOString()
      })
      .eq('id', goalId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error completing goal:', error);
      toast({
        title: "Erro",
        description: "Erro ao completar meta",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Parabéns!",
      description: "Meta concluída com sucesso! 🎉"
    });
  }, [user, toast, goals]);
  const addManualGoalContribution = useCallback(async (goalId: string, amount: number) => {
    if (!user) return;

    if (!amount || amount <= 0 || Number.isNaN(amount)) {
      toast({
        title: 'Valor inválido',
        description: 'Informe um valor maior que zero.',
        variant: 'destructive',
      });
      return;
    }

    const goal = goals.find((g) => g.id === goalId);
    if (!goal) {
      toast({
        title: 'Meta não encontrada',
        description: 'Não foi possível localizar a meta selecionada.',
        variant: 'destructive',
      });
      return;
    }

    if (goal.mode !== 'manual') {
      toast({
        title: 'Meta automática',
        description: 'Somente metas manuais aceitam aportes manuais.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const category = await ensureMetaCategory();

      const today = format(new Date(), 'yyyy-MM-dd');
      const transaction = await addTransaction({
        amount,
        description: 'Saldo para meta',
        categoryId: category.id,
        companyId: undefined,
        type: TransactionType.EXPENSE,
        date: today,
      });

      if (!transaction) {
        throw new Error('Não foi possível registrar a transação da meta.');
      }

      const { data: historyData, error: historyError } = await supabase
        .from('goal_history')
        .insert({
          user_id: user.id,
          goal_id: goalId,
          transaction_id: transaction.id,
          amount,
          date: today,
          description: transaction.description || 'Aporte manual'
        })
        .select()
        .single();

      if (historyError) {
        throw historyError;
      }

      if (historyData) {
        const entry = mapDbGoalHistory(historyData);
        setGoalHistory((prev) => {
          if (prev.some((item) => item.id === entry.id)) return prev;
          return [entry, ...prev];
        });
      }

      const newProgress = goal.currentProgress + amount;
      const { error } = await supabase
        .from('goals')
        .update({ current_progress: newProgress })
        .eq('id', goalId)
        .eq('user_id', user.id)
        .select('id');

      if (error) {
        throw error;
      }

      setGoals((prev) =>
        prev.map((g) =>
          g.id === goalId
            ? {
                ...g,
                currentProgress: newProgress,
              }
            : g
        )
      );

      if (newProgress >= goal.targetAmount && !goal.completed) {
        await completeGoal(goalId);
      }

      toast({
        title: 'Aporte registrado',
        description: 'O saldo foi adicionado à meta e registrado como despesa.',
      });
    } catch (error) {
      console.error('Erro ao registrar aporte manual:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível registrar o aporte manual.',
        variant: 'destructive',
      });
    }
  }, [user, goals, ensureMetaCategory, addTransaction, toast, completeGoal]);


  const updateGoalProgressInDB = useCallback(async (goalId: string) => {
    if (!user) return;
    
    const goal = goals.find(g => g.id === goalId);
    if (!goal || goal.completed) {
      return;
    }

    if (goal.mode === 'manual') {
      return;
    }
    // Calculate transactions since goal creation (by creation timestamp, not financial date)
    const goalCreationDate = parseISO(goal.createdAt);
    const relevantTransactions = transactions.filter(transaction => 
      parseISO(transaction.createdAt) >= goalCreationDate
    );

    // Calculate progress based on transactions
    let progressChange = 0;
    relevantTransactions.forEach(transaction => {
      if (transaction.type === 'income') {
        progressChange += transaction.amount;
      } else if (transaction.type === 'expense' || transaction.type === 'investment') {
        progressChange -= transaction.amount;
      }
    });

    const newProgress = Math.max(0, goal.initialBalance + progressChange);
    
    // Update in database
    const { error } = await supabase
      .from('goals')
      .update({ current_progress: newProgress })
      .eq('id', goalId)
      .eq('user_id', user.id);

    if (error) {
      console.error('❌ Erro ao atualizar progresso da meta:', error);
      return;
    }

    setGoals((prev) =>
      prev.map((g) =>
        g.id === goalId
          ? {
              ...g,
              currentProgress: newProgress,
            }
          : g
      )
    );

    // Check if goal is completed
    if (newProgress >= goal.targetAmount && !goal.completed) {
      await completeGoal(goalId);
    }
  }, [user, goals, transactions, completeGoal]);

  const getGoalProgress = useCallback((goal: Goal): GoalProgress => {
    const remainingAmount = Math.max(0, goal.targetAmount - goal.currentProgress);
    const remainingDays = Math.max(0, differenceInDays(parseISO(goal.targetDate), new Date()));
    let dailyTarget = 0;
    let monthlyTarget = 0;
    let isOnTrack = true;

    if (goal.targetAmount > 0) {
      if (goal.mode === 'automatic') {
        dailyTarget = remainingDays > 0 ? remainingAmount / remainingDays : 0;
        monthlyTarget = dailyTarget * 30;

        const totalDays = differenceInDays(parseISO(goal.targetDate), parseISO(goal.createdAt)) || 1;
        const daysPassed = totalDays - remainingDays;
        const expectedProgress = (daysPassed / totalDays) * goal.targetAmount;
        isOnTrack = goal.currentProgress >= expectedProgress * 0.9;
      } else {
        isOnTrack = true;
      }
    }

    const progressPercentage = goal.targetAmount > 0
      ? Math.min(100, (goal.currentProgress / goal.targetAmount) * 100)
      : 0;

    return {
      remainingAmount,
      remainingDays,
      dailyTarget,
      monthlyTarget,
      progressPercentage,
      isOnTrack,
    };
  }, []);

  const getActiveGoals = useCallback(() => {
    return goals.filter(goal => !goal.completed);
  }, [goals]);

  const getCompletedGoals = useCallback(() => {
    return goals.filter(goal => goal.completed);
  }, [goals]);

  return {
    transactions,
    categories,
    companies,
    goals,
    goalHistory,
    loading: loading || authLoading,
    specificFilter,
    setSpecificFilter,
    addTransaction,
    addRecurringTransactions,
    deleteTransaction,
    addCategory,
    updateCategory,
    deleteCategory,
    isCategoryInUse,
    addCompany,
    updateCompany,
    deleteCompany,
    getCompanyById,
    getFilteredTransactions,
    getFinancialSummary,
    getRecentTransactions,
    getCategoryById,
    getAvailableYears,
    getAvailableMonths,
    getAvailableDays,
    getChartData,
    // Goals
    addGoal,
    updateGoal,
    deleteGoal,
    completeGoal,
    addManualGoalContribution,
    getGoalProgress,
    getActiveGoals,
    getCompletedGoals
  };
}

type SupabaseFinancialDataContextValue = ReturnType<typeof useSupabaseFinancialDataInternal>;

const SupabaseFinancialDataContext = createContext<SupabaseFinancialDataContextValue | undefined>(undefined);

interface SupabaseFinancialDataProviderProps {
  children: ReactNode;
}

export function SupabaseFinancialDataProvider({ children }: SupabaseFinancialDataProviderProps) {
  const value = useSupabaseFinancialDataInternal();

  return createElement(
    SupabaseFinancialDataContext.Provider,
    { value },
    children
  );
}

export function useSupabaseFinancialData() {
  const context = useContext(SupabaseFinancialDataContext);

  if (!context) {
    throw new Error('useSupabaseFinancialData deve ser usado dentro de SupabaseFinancialDataProvider');
  }

  return context;
}
