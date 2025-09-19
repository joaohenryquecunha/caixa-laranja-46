import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Transaction, Category, TransactionType, FinancialSummary, Company } from '@/types/financial';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { addMonths, format, isToday, isThisMonth, isThisYear, isSameDay } from 'date-fns';

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
    type: TransactionType.INCOME
  },
  {
    name: 'Freelance',
    color: '#3b82f6',
    icon: 'Briefcase',
    type: TransactionType.INCOME
  },
  {
    name: 'Alimentação',
    color: '#ef4444',
    icon: 'UtensilsCrossed',
    type: TransactionType.EXPENSE
  },
  {
    name: 'Transporte',
    color: '#f59e0b',
    icon: 'Car',
    type: TransactionType.EXPENSE
  },
  {
    name: 'Ações',
    color: '#8b5cf6',
    icon: 'TrendingUp',
    type: TransactionType.INVESTMENT
  },
  {
    name: 'Criptomoedas',
    color: '#06b6d4',
    icon: 'Bitcoin',
    type: TransactionType.INVESTMENT
  }
];

export function useSupabaseFinancialData() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [specificFilter, setSpecificFilter] = useState<SpecificFilter>({ 
    type: 'month',
    year: new Date().getFullYear(),
    month: new Date().getMonth(),
    companyId: undefined
  });

  // Load data when user is authenticated
  useEffect(() => {
    if (!authLoading && user) {
      loadData();
    } else if (!authLoading && !user) {
      // Clear data when user logs out
      setTransactions([]);
      setCategories([]);
      setCompanies([]);
      setLoading(false);
    }
  }, [user, authLoading]);

  const loadData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      await Promise.all([
        loadCategories(),
        loadCompanies(),
        loadTransactions()
      ]);
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
      .eq('user_id', user.id)
      .order('name');

    if (error) {
      console.error('Error loading categories:', error);
      return;
    }

    if (data.length === 0) {
      // Create default categories for new users
      await createDefaultCategories();
    } else {
      setCategories(data.map(cat => ({
        id: cat.id,
        name: cat.name,
        color: cat.color,
        icon: cat.icon,
        type: cat.type as TransactionType
      })));
    }
  };

  const createDefaultCategories = async () => {
    if (!user) return;

    const categoriesToInsert = DEFAULT_CATEGORIES.map(cat => ({
      ...cat,
      user_id: user.id
    }));

    const { data, error } = await supabase
      .from('categories')
      .insert(categoriesToInsert)
      .select();

    if (error) {
      console.error('Error creating default categories:', error);
      return;
    }

    setCategories(data.map(cat => ({
      id: cat.id,
      name: cat.name,
      color: cat.color,
      icon: cat.icon,
      type: cat.type as TransactionType
    })));
  };

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

    setCompanies(data.map(comp => ({
      id: comp.id,
      name: comp.name
    })));
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

  const addTransaction = useCallback(async (transaction: Omit<Transaction, 'id' | 'createdAt'>) => {
    if (!user) return;

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
      return;
    }

    const newTransaction: Transaction = {
      id: data.id,
      amount: Number(data.amount),
      description: data.description,
      categoryId: data.category_id,
      companyId: data.company_id || undefined,
      type: data.type as TransactionType,
      date: data.date,
      createdAt: data.created_at
    };

    setTransactions(prev => [newTransaction, ...prev]);
    
    toast({
      title: "Sucesso",
      description: "Transação adicionada com sucesso"
    });
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

    setTransactions(prev => prev.filter(t => t.id !== id));
    
    toast({
      title: "Sucesso",
      description: "Transação excluída com sucesso"
    });
  }, [user, toast]);

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

    setCategories(prev => [...prev, newCategory]);
    
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

    setCompanies(prev => [...prev, newCompany]);
    
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
    
    return transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      
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
    return filteredTransactions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
  }, [getFilteredTransactions]);

  const getCategoryById = useCallback((id: string) => {
    return categories.find(c => c.id === id);
  }, [categories]);

  const getAvailableYears = useCallback(() => {
    const years = transactions.map(t => new Date(t.date).getFullYear());
    return Array.from(new Set(years)).sort((a, b) => b - a);
  }, [transactions]);

  const getAvailableMonths = useCallback((year?: number) => {
    const targetYear = year || new Date().getFullYear();
    const months = transactions
      .filter(t => new Date(t.date).getFullYear() === targetYear)
      .map(t => new Date(t.date).getMonth());
    return Array.from(new Set(months)).sort((a, b) => a - b);
  }, [transactions]);

  const getAvailableDays = useCallback(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const days = transactions
      .filter(t => {
        const date = new Date(t.date);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      })
      .map(t => new Date(t.date).getDate());
    
    return Array.from(new Set(days)).sort((a, b) => a - b);
  }, [transactions]);

  const getChartData = useCallback((): ChartDataPoint[] => {
    const filteredTransactions = getFilteredTransactions();
    
    if (filteredTransactions.length === 0) {
      return [];
    }

    const transactionsByPeriod = filteredTransactions.reduce((acc, transaction) => {
      let periodKey = '';
      
      if (specificFilter.type === 'month') {
        periodKey = format(new Date(transaction.date), 'yyyy-MM-dd');
      } else if (specificFilter.type === 'year') {
        periodKey = format(new Date(transaction.date), 'yyyy-MM');
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
    
    return sortedPeriods.map(period => {
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
  }, [getFilteredTransactions, specificFilter]);

  return {
    transactions,
    categories,
    companies,
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
    getChartData
  };
}