export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense', 
  INVESTMENT = 'investment'
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  type: TransactionType;
}

export interface Company {
  id: string;
  name: string;
}

export interface Transaction {
  id: string;
  amount: number;
  description: string;
  categoryId: string;
  companyId?: string;
  type: TransactionType;
  date: string;
  createdAt: string;
}

export interface FinancialSummary {
  totalBalance: number;
  totalIncome: number;
  totalExpenses: number;
  totalInvestments: number;
}