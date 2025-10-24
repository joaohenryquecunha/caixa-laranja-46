import { useState, useEffect, useCallback } from 'react';
import { addMonths, isToday, isThisMonth, isThisYear, startOfDay, endOfDay, startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval, format, getDaysInMonth, isSameDay, isSameMonth, isSameYear } from 'date-fns';
import { Transaction, Category, TransactionType, FinancialSummary, Company } from '@/types/financial';

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

const TRANSACTIONS_KEY = 'financial_transactions';
const CATEGORIES_KEY = 'financial_categories';
const COMPANIES_KEY = 'financial_companies';

const DEFAULT_CATEGORIES: Category[] = [
  {
    id: '1',
    name: 'Salário',
    color: '#22c55e',
    icon: 'Wallet',
    type: TransactionType.INCOME,
  },
  {
    id: '2',
    name: 'Alimentação',
    color: '#ef4444',
    icon: 'UtensilsCrossed',
    type: TransactionType.EXPENSE,
  },
  {
    id: '3',
    name: 'Ações',
    color: '#8b5cf6',
    icon: 'TrendingUp',
    type: TransactionType.INVESTMENT,
  },
];

// Singleton para garantir que os dados sejam compartilhados
let globalTransactions: Transaction[] = [];
let globalCategories: Category[] = DEFAULT_CATEGORIES;
let globalCompanies: Company[] = [];

// Carregar dados do localStorage uma única vez
const loadInitialData = () => {
  if (globalTransactions.length === 0) {
    const savedTransactions = localStorage.getItem(TRANSACTIONS_KEY);
    if (savedTransactions) {
      try {
        globalTransactions = JSON.parse(savedTransactions);
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
      } catch (e) {
      console.error('❌ Erro ao carregar categorias:', e);
      globalCategories = DEFAULT_CATEGORIES;
    }
  }

  const savedCompanies = localStorage.getItem(COMPANIES_KEY);
  if (savedCompanies) {
      try {
        globalCompanies = JSON.parse(savedCompanies);
      } catch (e) {
      console.error('❌ Erro ao carregar empresas:', e);
      globalCompanies = [];
    }
  }
};

export function useFinancialData() {
  // Carregar dados sempre que o hook for usado
  loadInitialData();
  
  const [transactions, setTransactions] = useState<Transaction[]>(() => [...globalTransactions]);
  const [categories, setCategories] = useState<Category[]>(() => [...globalCategories]);
  const [companies, setCompanies] = useState<Company[]>(() => [...globalCompanies]);
  const [specificFilter, setSpecificFilter] = useState<SpecificFilter>({ 
    type: 'month',
    year: new Date().getFullYear(),
    month: new Date().getMonth(),
    companyId: undefined
  });

  // Sincronizar alterações com o estado global e localStorage
  useEffect(() => {
    if (JSON.stringify(transactions) !== JSON.stringify(globalTransactions)) {
      globalTransactions = [...transactions];
      localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
    }
  }, [transactions]);

  // Atualizar estado local quando dados globais mudarem
  useEffect(() => {
    if (JSON.stringify(transactions) !== JSON.stringify(globalTransactions)) {
      setTransactions([...globalTransactions]);
    }
  }, [globalTransactions]);

  useEffect(() => {
    if (categories !== globalCategories) {
      globalCategories = [...categories];
      localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
    }
  }, [categories]);

  useEffect(() => {
    if (companies !== globalCompanies) {
      globalCompanies = [...companies];
      localStorage.setItem(COMPANIES_KEY, JSON.stringify(companies));
    }
  }, [companies]);

  const addRecurringTransactions = useCallback((data: {
    amount: number;
    description: string;
    categoryId: string;
    companyId?: string;
    type: TransactionType;
    startDate: string;
    times: number;
  }) => {
    const newTransactions: Transaction[] = [];
    const startDate = new Date(data.startDate);
    
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
        companyId: data.companyId,
        type: data.type,
        date: transactionDate,
        createdAt: new Date().toISOString()
      };
      
      newTransactions.push(newTransaction);
    }
    
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
    const updatedTransactions = [newTransaction, ...globalTransactions];
    globalTransactions = updatedTransactions;
    setTransactions(updatedTransactions);
    
  }, []);

  const deleteTransaction = useCallback((id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
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
  }, []);

  const deleteCategory = useCallback((id: string) => {
    // Verificar se a categoria está sendo usada
    const isInUse = globalTransactions.some(transaction => transaction.categoryId === id);
    
    if (isInUse) {
      return { success: false, message: 'Esta categoria está sendo usada em transações e não pode ser excluída.' };
    }
    
    setCategories(prev => prev.filter(cat => cat.id !== id));
    return { success: true, message: 'Categoria excluída com sucesso.' };
  }, []);

  const isCategoryInUse = useCallback((id: string) => {
    return globalTransactions.some(transaction => transaction.categoryId === id);
  }, []);

  // Company management functions
  const addCompany = useCallback((company: Omit<Company, 'id'>) => {
    const newCompany: Company = {
      ...company,
      id: `company-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
    setCompanies(prev => [...prev, newCompany]);
  }, []);

  const updateCompany = useCallback((id: string, updatedCompany: Omit<Company, 'id'>) => {
    setCompanies(prev => prev.map(company => 
      company.id === id ? { ...updatedCompany, id } : company
    ));
    return { success: true, message: 'Empresa atualizada com sucesso.' };
  }, []);

  const deleteCompany = useCallback((id: string) => {
    // Verificar se a empresa está sendo usada
    const isInUse = globalTransactions.some(transaction => transaction.companyId === id);
    
    if (isInUse) {
      return { success: false, message: 'Esta empresa está sendo usada em transações e não pode ser excluída.' };
    }
    
    setCompanies(prev => prev.filter(company => company.id !== id));
    return { success: true, message: 'Empresa excluída com sucesso.' };
  }, []);

  const getCompanyById = useCallback((id: string) => {
    return companies.find(c => c.id === id);
  }, [companies]);

  const getFilteredTransactions = useCallback(() => {
    const now = new Date();
    
    
    const filtered = transactions.filter(transaction => {
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

    return summary;
  }, [getFilteredTransactions]);

  const getRecentTransactions = useCallback((limit: number = 5) => {
    const filteredTransactions = getFilteredTransactions();
    const recent = filteredTransactions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
    
    return recent;
  }, [getFilteredTransactions]);

  const getCategoryById = useCallback((id: string) => {
    return categories.find(c => c.id === id);
  }, [categories]);

  const getAvailableYears = useCallback(() => {
    const years = transactions.map(t => new Date(t.date).getFullYear());
    const uniqueYears = Array.from(new Set(years)).sort((a, b) => b - a);
    return uniqueYears;
  }, [transactions]);

  const getAvailableMonths = useCallback((year?: number) => {
    const targetYear = year || new Date().getFullYear();
    const months = transactions
      .filter(t => new Date(t.date).getFullYear() === targetYear)
      .map(t => new Date(t.date).getMonth());
    const uniqueMonths = Array.from(new Set(months)).sort((a, b) => a - b);
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
    return uniqueDays;
  }, [transactions]);

  const getChartData = useCallback((): ChartDataPoint[] => {
    const filteredTransactions = getFilteredTransactions();
    
    if (filteredTransactions.length === 0) {
      return [];
    }

    // Group transactions based on filter type
    const transactionsByPeriod = filteredTransactions.reduce((acc, transaction) => {
      let periodKey = '';
      
      // Para filtro de mês, agrupe por dias
      if (specificFilter.type === 'month') {
        periodKey = format(new Date(transaction.date), 'yyyy-MM-dd');
      }
      // Para filtro de ano, agrupe por meses  
      else if (specificFilter.type === 'year') {
        periodKey = format(new Date(transaction.date), 'yyyy-MM');
      }
      // Para outros filtros (dia, all), use a data completa
      else {
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

    // Sort periods and create chart data
    const sortedPeriods = Object.keys(transactionsByPeriod).sort();
    let runningBalance = 0;
    
    return sortedPeriods.map(period => {
      const periodData = transactionsByPeriod[period];
      runningBalance += periodData.income - periodData.expenses - periodData.investments;
      
      // Format display based on filter type
      let displayDate = '';
      let tooltipDate = '';
      
      if (specificFilter.type === 'month') {
        displayDate = format(new Date(period), 'dd'); // Apenas o dia para o eixo X
        tooltipDate = format(new Date(period), 'dd/MMM/yyyy'); // "01/set/2025" para o tooltip
      } else if (specificFilter.type === 'year') {
        displayDate = format(new Date(period + '-01'), 'MMM'); // Apenas o mês para o eixo X
        tooltipDate = format(new Date(period + '-01'), 'MMM/yyyy'); // "jan/2025" para o tooltip
      } else {
        displayDate = format(new Date(period), 'dd/MM');
        tooltipDate = format(new Date(period), 'dd/MM/yyyy');
      }
      
      return {
        date: displayDate,
        tooltipDate: tooltipDate,
        balance: runningBalance,
        income: periodData.income,
        expenses: periodData.expenses,
        investments: periodData.investments
      };
    });
  }, [getFilteredTransactions, specificFilter]);

  return {
    transactions,
    categories,
    companies,
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
