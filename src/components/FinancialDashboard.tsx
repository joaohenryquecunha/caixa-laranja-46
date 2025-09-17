import { useState } from 'react';
import { Plus, TrendingUp, TrendingDown, DollarSign, List, Settings, Building2, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useFinancialData } from '@/hooks/useFinancialData';
import { useSampleData } from '@/hooks/useSampleData';
import { TransactionForm } from '@/components/TransactionForm';
import { TransactionList } from '@/components/TransactionList';
import { BalanceChart } from '@/components/BalanceChart';
import { AllTransactions } from '@/components/AllTransactions';
import { TestRecurringButton } from '@/components/TestRecurringButton';
import { PeriodFilter } from '@/components/PeriodFilter';
import { CategoryManager } from '@/components/CategoryManager';
import { CompanyManager } from '@/components/CompanyManager';
import { CategoryPieChart } from '@/components/CategoryPieChart';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { formatCurrency } from '@/lib/formatters';

export function FinancialDashboard() {
  const navigate = useNavigate();
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [showCompanyManager, setShowCompanyManager] = useState(false);
  const { 
    getFinancialSummary, 
    getRecentTransactions, 
    getFilteredTransactions,
    deleteTransaction,
    specificFilter, 
    setSpecificFilter,
    getAvailableYears,
    getAvailableMonths,
    getAvailableDays,
    companies,
    getCompanyById
  } = useFinancialData();
  
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  
  // Load sample data on first visit
  useSampleData();
  
  const summary = getFinancialSummary();
  const recentTransactions = getRecentTransactions();
  
  console.log('📈 Summary calculado:', summary);
  console.log('📋 Transações recentes:', recentTransactions.length);
  const availableYears = getAvailableYears();
  const availableMonths = getAvailableMonths();
  const availableDays = getAvailableDays();

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Sua Carteira
            </h1>
            <p className="text-muted-foreground">
              Gerencie suas finanças pessoais
            </p>
          </div>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <PeriodFilter 
              specificFilter={specificFilter}
              onFilterChange={setSpecificFilter}
              availableYears={availableYears}
              availableMonths={availableMonths}
              availableDays={availableDays}
              getAvailableMonthsForYear={getAvailableMonths}
            />
            {/* Botões visíveis apenas no desktop */}
            <div className="hidden md:flex gap-2">
              <Button
                onClick={() => navigate('/metas')}
                variant="outline"
                size="sm"
              >
                <Target className="mr-2 h-4 w-4" />
                Metas
              </Button>
              <Button
                onClick={() => setShowCategoryManager(true)}
                variant="outline"
                size="sm"
              >
                <Settings className="mr-2 h-4 w-4" />
                Categorias
              </Button>
              <Button
                onClick={() => setShowCompanyManager(true)}
                variant="outline"
                size="sm"
              >
                <Building2 className="mr-2 h-4 w-4" />
                Empresas
              </Button>
              <Button
                onClick={() => setShowTransactionForm(true)}
                variant="gradient"
              >
                <Plus className="mr-2 h-4 w-4" />
                Nova Transação
              </Button>
            </div>
          </div>
        </div>

        {/* Balance Card */}
        <Card className="bg-gradient-card border-border shadow-card p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <p className="text-muted-foreground mb-2">Saldo Total</p>
              <p className="text-4xl font-bold bg-gradient-balance bg-clip-text text-transparent">
                {formatCurrency(summary.totalBalance)}
              </p>
              <p className="text-muted-foreground text-sm mt-1">
                Período: {
                  specificFilter.type === 'day' 
                    ? (specificFilter.day ? `Dia ${specificFilter.day}` : 'Hoje')
                    : specificFilter.type === 'month' 
                      ? (specificFilter.month !== undefined ? ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'][specificFilter.month] : 'Este mês')
                      : specificFilter.type === 'year' 
                        ? (specificFilter.year || 'Este ano')
                        : 'Todos os períodos'
                }
              </p>
            </div>
            <div className="flex-1 max-w-md">
              <BalanceChart />
            </div>
          </div>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-card border-border shadow-card p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-success/20 rounded-lg">
                <TrendingUp className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Receitas</p>
                <p className="text-xl font-bold text-success">
                  {formatCurrency(summary.totalIncome)}
                </p>
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-card border-border shadow-card p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-destructive/20 rounded-lg">
                <TrendingDown className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Despesas</p>
                <p className="text-xl font-bold text-destructive">
                  {formatCurrency(summary.totalExpenses)}
                </p>
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-card border-border shadow-card p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <DollarSign className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Investimentos</p>
                <p className="text-xl font-bold text-blue-500">
                  {formatCurrency(summary.totalInvestments)}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Layout com Gráfico e Transações lado a lado */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico de Categoria */}
          <CategoryPieChart />

          {/* Transações */}
          <Card className="bg-gradient-card border-border shadow-card">
            <div className="p-6 pb-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">
                  Transações
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAllTransactions(true)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <List className="mr-2 h-4 w-4" />
                  Ver Todas
                </Button>
              </div>
            </div>
            <div className="max-h-96 overflow-y-auto scrollbar-hide">
              <TransactionList 
                transactions={getFilteredTransactions()} 
                onEditTransaction={(transaction) => {
                  setSelectedTransaction(transaction);
                  setShowTransactionForm(true);
                }}
                onDeleteTransaction={deleteTransaction}
                showScrollbar={true}
              />
            </div>
          </Card>
        </div>

        {/* Transaction Form Modal */}
        {showTransactionForm && (
          <TransactionForm onClose={() => {
            setShowTransactionForm(false);
            setSelectedTransaction(null);
          }} />
        )}

        {/* All Transactions Modal */}
        {showAllTransactions && (
          <AllTransactions onClose={() => setShowAllTransactions(false)} />
        )}

        {/* Category Manager Modal */}
        {showCategoryManager && (
          <CategoryManager onClose={() => setShowCategoryManager(false)} />
        )}

        {/* Company Manager Modal */}
        {showCompanyManager && (
          <CompanyManager onClose={() => setShowCompanyManager(false)} />
        )}

        {/* Test buttons for development */}
        <TestRecurringButton />

        {/* Floating Action Button para Mobile */}
        <FloatingActionButton
          onNewTransaction={() => setShowTransactionForm(true)}
          onCategoryManager={() => setShowCategoryManager(true)}
          onCompanyManager={() => setShowCompanyManager(true)}
        />
      </div>
    </div>
  );
}