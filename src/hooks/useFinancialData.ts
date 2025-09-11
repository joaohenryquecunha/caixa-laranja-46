import { useState, useEffect, useCallback } from 'react';
import { addMonths, isToday, isThisMonth, isThisYear, startOfDay, endOfDay, startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval, format, getDaysInMonth, isSameDay, isSameMonth, isSameYear } from 'date-fns';
import { Transaction, Category, TransactionType, FinancialSummary } from '@/types/financial';

export type FilterPeriod = 'day' | 'month' | 'year' | 'all';

export interface SpecificFilter {
  type: FilterPeriod;
  day?: number;
  month?: number;
  year?: number;
}

export interface ChartDataPoint {
  date: string;
  balance: number;
  income: number;
  expenses: number;
}

const TRANSACTIONS_KEY = 'financial_transactions';
const CATEGORIES_KEY = 'financial_categories';

const DEFAULT_CATEGORIES: Category[] = [
  {
    id: '1',
    name: 'Salário',
    color: '#22c55e',
    icon: 'Wallet',
    type: TransactionType.INCOME
  },
  {
    id: '2', 
    name: 'Freelance',
    color: '#3b82f6',
    icon: 'Briefcase',
    type: TransactionType.INCOME
  },
  {
    id: '3',
    name: 'Alimentação',
    color: '#ef4444',
    icon: 'UtensilsCrossed',
    type: TransactionType.EXPENSE
  },
  {
    id: '4',
    name: 'Transporte',
    color: '#f59e0b',
    icon: 'Car',
    type: TransactionType.EXPENSE
  },
  {
    id: '5',
    name: 'Ações',
    color: '#8b5cf6',
    icon: 'TrendingUp',
    type: TransactionType.INVESTMENT
  },
  {
    id: '6',
    name: 'Criptomoedas',
    color: '#06b6d4',
    icon: 'Bitcoin',
    type: TransactionType.INVESTMENT
  }
];

// Singleton para garantir que os dados sejam compartilhados
let globalTransactions: Transaction[] = [];
let globalCategories: Category[] = DEFAULT_CATEGORIES;

// Carregar dados do localStorage uma única vez
const loadInitialData = () => {
  if (globalTransactions.length === 0) {
    const savedTransactions = localStorage.getItem(TRANSACTIONS_KEY);
    if (savedTransactions) {
      try {
        globalTransactions = JSON.parse(savedTransactions);
        console.log('📁 Transações carregadas do cache:', globalTransactions.length);
      } catch (e) {
        console.error('❌ Erro ao carregar transações:', e);
        globalTransactions = [];
      }
    }
  }

  const savedCategories = localStorage.getItem(CATEGORIES_KEY);
  if (savedCategories) {
    try {
      globalCategories = JSON.parse(savedCategories);
      console.log('📁 Categorias carregadas do cache:', globalCategories.length);
    } catch (e) {
      console.error('❌ Erro ao carregar categorias:', e);
      globalCategories = DEFAULT_CATEGORIES;
    }
  }
};

export function useFinancialData() {
  // Carregar dados sempre que o hook for usado
  loadInitialData();
  
  const [transactions, setTransactions] = useState<Transaction[]>(() => [...globalTransactions]);
  const [categories, setCategories] = useState<Category[]>(() => [...globalCategories]);
  const [specificFilter, setSpecificFilter] = useState<SpecificFilter>({ type: 'all' });

  // Sincronizar alterações com o estado global e localStorage
  useEffect(() => {
    if (JSON.stringify(transactions) !== JSON.stringify(globalTransactions)) {
      globalTransactions = [...transactions];
      console.log('💾 Salvando', transactions.length, 'transações no localStorage');
      localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
    }
  }, [transactions]);

  // Atualizar estado local quando dados globais mudarem
  useEffect(() => {
    if (JSON.stringify(transactions) !== JSON.stringify(globalTransactions)) {
      console.log('🔄 Atualizando estado local com', globalTransactions.length, 'transações');
      setTransactions([...globalTransactions]);
    }
  }, [globalTransactions]);

  useEffect(() => {
    if (categories !== globalCategories) {
      globalCategories = [...categories];
      localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
    }
  }, [categories]);

  const addRecurringTransactions = useCallback((data: {
    amount: number;
    description: string;
    categoryId: string;
    type: TransactionType;
    startDate: string;
    times: number;
  }) => {
    const newTransactions: Transaction[] = [];
    const startDate = new Date(data.startDate);
    
    console.log('🔄 Criando transações recorrentes:', {
      description: data.description,
      amount: data.amount,
      times: data.times,
      startDate: data.startDate
    });
    
    for (let i = 0; i < data.times; i++) {
      // Adiciona i meses à data inicial usando addMonths do date-fns
      const currentDate = addMonths(startDate, i);
      // Usar formato local para evitar problemas de timezone
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const day = String(currentDate.getDate()).padStart(2, '0');
      const transactionDate = `${year}-${month}-${day}`;
      
      const newTransaction: Transaction = {
        id: `recurring-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 5)}`,
        amount: data.amount,
        description: `${data.description} (${i + 1}/${data.times})`,
        categoryId: data.categoryId,
        type: data.type,
        date: transactionDate,
        createdAt: new Date().toISOString()
      };
      
      newTransactions.push(newTransaction);
      console.log(`📅 Transação ${i + 1}: ${transactionDate} - ${data.description} - R$ ${data.amount}`);
    }
    
    console.log(`✅ Criadas ${newTransactions.length} transações recorrentes!`);
    
    const updatedTransactions = [...newTransactions, ...globalTransactions];
    globalTransactions = updatedTransactions;
    setTransactions(updatedTransactions);
  }, []);

  const addTransaction = useCallback((transaction: Omit<Transaction, 'id' | 'createdAt'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString()
    };
    console.log('💰 Adicionando nova transação:', newTransaction);
    
    const updatedTransactions = [newTransaction, ...globalTransactions];
    globalTransactions = updatedTransactions;
    setTransactions(updatedTransactions);
    
    console.log('📊 Total de transações após adicionar:', updatedTransactions.length);
  }, []);

  const deleteTransaction = useCallback((id: string) => {
    console.log('🗑️ Removendo transação:', id);
    setTransactions(prev => {
      const updated = prev.filter(t => t.id !== id);
      console.log('📊 Total de transações após remover:', updated.length);
      return updated;
    });
  }, []);

  const addCategory = useCallback((category: Omit<Category, 'id'>) => {
    const newCategory: Category = {
      ...category,
      id: Date.now().toString()
    };
    setCategories(prev => [...prev, newCategory]);
  }, []);

  const updateCategory = useCallback((id: string, updatedCategory: Omit<Category, 'id'>) => {
    setCategories(prev => prev.map(cat => 
      cat.id === id ? { ...updatedCategory, id } : cat
    ));
    console.log('✏️ Categoria atualizada:', id, updatedCategory);
  }, []);

  const deleteCategory = useCallback((id: string) => {
    // Verificar se a categoria está sendo usada
    const isInUse = globalTransactions.some(transaction => transaction.categoryId === id);
    
    if (isInUse) {
      console.log('❌ Não é possível deletar categoria em uso:', id);
      return { success: false, message: 'Esta categoria está sendo usada em transações e não pode ser excluída.' };
    }
    
    setCategories(prev => prev.filter(cat => cat.id !== id));
    console.log('🗑️ Categoria deletada:', id);
    return { success: true, message: 'Categoria excluída com sucesso.' };
  }, []);

  const isCategoryInUse = useCallback((id: string) => {
    return globalTransactions.some(transaction => transaction.categoryId === id);
  }, []);

  const getFilteredTransactions = useCallback(() => {
    const now = new Date();
    
    console.log('🔍 Filtrando transações. Total:', transactions.length, 'Filtro:', specificFilter);
    
    const filtered = transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      
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
    
    console.log('✅ Transações filtradas:', filtered.length);
    console.log('📅 Transações por data:', filtered.map(t => ({ date: t.date, description: t.description })));
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

    const summary = {
      totalBalance,
      totalIncome,
      totalExpenses,
      totalInvestments
    };

    console.log('📈 Summary calculado:', summary);
    return summary;
  }, [getFilteredTransactions]);

  const getRecentTransactions = useCallback((limit: number = 5) => {
    const filteredTransactions = getFilteredTransactions();
    const recent = filteredTransactions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
    
    console.log('📋 Transações recentes:', recent.length);
    return recent;
  }, [getFilteredTransactions]);

  const getCategoryById = useCallback((id: string) => {
    return categories.find(c => c.id === id);
  }, [categories]);

  const getAvailableYears = useCallback(() => {
    const years = transactions.map(t => new Date(t.date).getFullYear());
    const uniqueYears = Array.from(new Set(years)).sort((a, b) => b - a);
    console.log('📅 Anos disponíveis:', uniqueYears);
    return uniqueYears;
  }, [transactions]);

  const getAvailableMonths = useCallback((year?: number) => {
    const targetYear = year || new Date().getFullYear();
    const months = transactions
      .filter(t => new Date(t.date).getFullYear() === targetYear)
      .map(t => new Date(t.date).getMonth());
    const uniqueMonths = Array.from(new Set(months)).sort((a, b) => a - b);
    console.log(`📅 Meses disponíveis para ${targetYear}:`, uniqueMonths.map(m => ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'][m]));
    return uniqueMonths;
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
    
    const uniqueDays = Array.from(new Set(days)).sort((a, b) => a - b);
    console.log('📅 Dias disponíveis no mês atual:', uniqueDays);
    return uniqueDays;
  }, [transactions]);

  const getChartData = useCallback((): ChartDataPoint[] => {
    const filteredTransactions = getFilteredTransactions();
    
    if (filteredTransactions.length === 0) {
      return [];
    }

    // Group transactions by date
    const transactionsByDate = filteredTransactions.reduce((acc, transaction) => {
      const date = transaction.date;
      if (!acc[date]) {
        acc[date] = { income: 0, expenses: 0, investments: 0 };
      }
      
      if (transaction.type === TransactionType.INCOME) {
        acc[date].income += transaction.amount;
      } else if (transaction.type === TransactionType.EXPENSE) {
        acc[date].expenses += transaction.amount;
      } else if (transaction.type === TransactionType.INVESTMENT) {
        acc[date].investments += transaction.amount;
      }
      
      return acc;
    }, {} as Record<string, { income: number; expenses: number; investments: number }>);

    // Sort dates and create chart data
    const sortedDates = Object.keys(transactionsByDate).sort();
    let runningBalance = 0;
    
    return sortedDates.map(date => {
      const dayData = transactionsByDate[date];
      runningBalance += dayData.income - dayData.expenses - dayData.investments;
      
      return {
        date: format(new Date(date), specificFilter.type === 'day' ? 'dd/MM' : specificFilter.type === 'month' ? 'dd/MM' : 'MMM yy'),
        balance: runningBalance,
        income: dayData.income,
        expenses: dayData.expenses,
        investments: dayData.investments
      };
    });
  }, [getFilteredTransactions, specificFilter.type]);

  return {
    transactions,
    categories,
    specificFilter,
    setSpecificFilter,
    addTransaction,
    addRecurringTransactions,
    deleteTransaction,
    addCategory,
    updateCategory,
    deleteCategory,
    isCategoryInUse,
    getFinancialSummary,
    getRecentTransactions,
    getCategoryById,
    getChartData,
    getFilteredTransactions,
    getAvailableYears,
    getAvailableMonths,
    getAvailableDays
  };
}