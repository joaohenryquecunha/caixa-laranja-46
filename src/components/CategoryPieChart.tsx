import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card } from '@/components/ui/card';
import { formatCurrency } from '@/lib/formatters';
import { TransactionType, Transaction, Category } from '@/types/financial';
import type { SpecificFilter } from '@/hooks/useSupabaseFinancialData';

interface CategoryData {
  categoryId: string;
  categoryName: string;
  color: string;
  amount: number;
  percentage: number;
  transactionCount: number;
}

interface CategoryPieChartProps {
  transactions: Transaction[];
  specificFilter: SpecificFilter;
  getCategoryById: (id: string) => Category | undefined;
}

export function CategoryPieChart({ transactions, getCategoryById, specificFilter }: CategoryPieChartProps) {
  const categoryData = useMemo(() => {
    const filteredTransactions = transactions;

    if (filteredTransactions.length === 0) {
      return [];
    }

    // Agrupar transações por categoria
    const categoryGroups = filteredTransactions.reduce((acc, transaction) => {
      const category = getCategoryById(transaction.categoryId);
      if (!category) return acc;

      if (!acc[transaction.categoryId]) {
        acc[transaction.categoryId] = {
          categoryId: transaction.categoryId,
          categoryName: category.name,
          color: category.color,
          amount: 0,
          transactionCount: 0,
          type: category.type
        };
      }

      acc[transaction.categoryId].amount += transaction.amount;
      acc[transaction.categoryId].transactionCount += 1;
      return acc;
    }, {} as Record<string, {
      categoryId: string;
      categoryName: string;
      color: string;
      amount: number;
      transactionCount: number;
      type: TransactionType;
    }>);

    const totalAmount = Object.values(categoryGroups).reduce((sum, category) => sum + category.amount, 0);

    // Converter para array e calcular percentuais
    const data: CategoryData[] = Object.values(categoryGroups)
      .map(category => ({
        ...category,
        percentage: totalAmount > 0 ? (category.amount / totalAmount) * 100 : 0
      }))
      .sort((a, b) => b.amount - a.amount);

    return data;
  }, [transactions, getCategoryById, specificFilter]);

  if (categoryData.length === 0) {
    return (
      <Card className="bg-gradient-card border-border shadow-card p-6">
        <div className="text-center text-muted-foreground">
          <p>Nenhuma transação encontrada para o período selecionado</p>
        </div>
      </Card>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const categoryInfo = getCategoryById(data.categoryId);
      const typeLabel = getTypeLabel(categoryInfo?.type || TransactionType.EXPENSE);
      
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-foreground">{data.categoryName} ({typeLabel})</p>
          <p className="text-sm text-muted-foreground">
            {formatCurrency(data.amount)} ({data.percentage.toFixed(1)}%)
          </p>
          <p className="text-xs text-muted-foreground">
            {data.transactionCount} transação{data.transactionCount !== 1 ? 'ões' : ''}
          </p>
        </div>
      );
    }
    return null;
  };

  const getTypeIcon = (type: TransactionType) => {
    switch (type) {
      case TransactionType.INCOME:
        return '💰';
      case TransactionType.EXPENSE:
        return '💸';
      case TransactionType.INVESTMENT:
        return '📈';
      default:
        return '💳';
    }
  };

  const getTypeLabel = (type: TransactionType) => {
    switch (type) {
      case TransactionType.INCOME:
        return 'Receita';
      case TransactionType.EXPENSE:
        return 'Despesa';
      case TransactionType.INVESTMENT:
        return 'Investimento';
      default:
        return 'Transação';
    }
  };

  return (
    <div className="w-full">
      <Card className="bg-gradient-card border-border shadow-card p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-foreground">
            Distribuição Financeira
          </h2>
          <p className="text-xs text-muted-foreground">
            Período: {
              specificFilter.type === 'day' 
                ? (specificFilter.day ? `Dia ${specificFilter.day}` : 'Hoje')
                : specificFilter.type === 'month' 
                  ? (specificFilter.month !== undefined ? ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'][specificFilter.month] + ' ' + (specificFilter.year || new Date().getFullYear()) : 'Este mês')
                  : specificFilter.type === 'year' 
                    ? (specificFilter.year || 'Este ano')
                    : 'Todos os períodos'
            }
          </p>
        </div>

        {/* Gráfico de Pizza */}
        <div className="flex justify-center mb-6">
          <div className="w-full max-w-xs sm:max-w-sm aspect-square">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={100}
                  paddingAngle={1}
                  dataKey="amount"
                >
                  {categoryData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color}
                      className="transition-all duration-200 hover:opacity-80"
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Resumo das Categorias - Layout discreto horizontal */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {categoryData.map((category) => (
            <div
              key={category.categoryId}
              className="flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-xs text-foreground"
              style={{ backgroundColor: `${category.color}1a` }}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: category.color }}
                />
                <span className="truncate" style={{ color: category.color }}>
                  {category.categoryName}
                </span>
              </div>
              <span className="font-medium">
                {formatCurrency(category.amount)}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
