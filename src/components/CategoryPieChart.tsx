import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { useFinancialData } from '@/hooks/useFinancialData';
import { formatCurrency } from '@/lib/formatters';
import { TransactionType } from '@/types/financial';

interface CategoryData {
  categoryId: string;
  categoryName: string;
  color: string;
  amount: number;
  percentage: number;
  transactionCount: number;
}

export function CategoryPieChart() {
  const { 
    getFilteredTransactions, 
    getCategoryById, 
    categories, 
    specificFilter 
  } = useFinancialData();

  const categoryData = useMemo(() => {
    console.log('🔄 Recalculando dados do gráfico com filtro:', specificFilter);
    const filteredTransactions = getFilteredTransactions();
    
    console.log('📊 Transações filtradas para o gráfico:', filteredTransactions.length);
    
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

    console.log('📈 Dados do gráfico calculados:', data);
    return data;
  }, [getFilteredTransactions, getCategoryById, specificFilter]);

  const chartConfig = useMemo(() => {
    return categoryData.reduce((config, category) => {
      config[category.categoryId] = {
        label: category.categoryName,
        color: category.color
      };
      return config;
    }, {} as Record<string, { label: string; color: string }>);
  }, [categoryData]);

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
            Período: {specificFilter.type === 'all' ? 'todos os períodos' : 
                     specificFilter.type === 'month' ? 'mês atual' :
                     specificFilter.type === 'year' ? 'ano atual' : 'dia atual'}
          </p>
        </div>

        {/* Gráfico de Pizza */}
        <div className="flex justify-center mb-6">
          <div className="h-64 w-64">
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
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {categoryData.map((category) => {
            const categoryInfo = getCategoryById(category.categoryId);
            return (
              <div 
                key={category.categoryId}
                className="flex items-center gap-2 text-xs"
              >
                <div 
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: category.color }}
                />
                <span className="text-muted-foreground truncate">
                  {category.categoryName}
                </span>
                <span className="text-foreground font-medium">
                  {formatCurrency(category.amount)}
                </span>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}