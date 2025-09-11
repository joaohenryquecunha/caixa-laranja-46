import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card } from '@/components/ui/card';
import { formatCurrency } from '@/lib/formatters';
import { Transaction, Category, TransactionType } from '@/types/financial';

interface CategoryData {
  categoryId: string;
  categoryName: string;
  color: string;
  amount: number;
  percentage: number;
  transactionCount: number;
}

interface LocalCategoryPieChartProps {
  transactions: Transaction[];
  categories: Category[];
}

export function LocalCategoryPieChart({ transactions, categories }: LocalCategoryPieChartProps) {
  const categoryData = useMemo(() => {
    if (transactions.length === 0) {
      return [];
    }

    // Agrupar transações por categoria
    const categoryGroups = transactions.reduce((acc, transaction) => {
      const category = categories.find(c => c.id === transaction.categoryId);
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
  }, [transactions, categories]);

  if (categoryData.length === 0) {
    return (
      <Card className="bg-gradient-card border-border shadow-card p-4">
        <div className="text-center text-muted-foreground">
          <p className="text-sm">Nenhuma transação encontrada</p>
        </div>
      </Card>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-foreground text-sm">{data.categoryName}</p>
          <p className="text-xs text-muted-foreground">
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

  return (
    <Card className="bg-gradient-card border-border shadow-card p-6 h-full flex flex-col">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground">
          Distribuição por Categoria
        </h3>
      </div>

      <div className="flex-1 flex flex-col">
        {/* Gráfico de Pizza - Grande e imponente */}
        <div className="flex justify-center mb-6 flex-shrink-0">
          <div className="h-64 w-64 sm:h-80 sm:w-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={120}
                  paddingAngle={2}
                  dataKey="amount"
                >
                  {categoryData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color}
                      className="transition-all duration-200 hover:opacity-80 cursor-pointer"
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Resumo das Categorias - Abaixo do gráfico */}
        <div className="flex-1 overflow-y-auto">
          <div className={`grid gap-3 ${
            categoryData.length <= 2 ? 'grid-cols-1' :
            categoryData.length <= 4 ? 'grid-cols-1 sm:grid-cols-2' :
            categoryData.length <= 6 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' :
            'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
          }`}>
            {categoryData.map((category) => (
              <div 
                key={category.categoryId}
                className="flex items-center gap-3 p-4 rounded-lg bg-background/50 border border-border/50 hover:bg-background/70 transition-colors"
              >
                <div 
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: category.color }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground truncate">
                        {category.categoryName}
                      </span>
                      <span className="text-sm font-semibold text-foreground">
                        {category.percentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {formatCurrency(category.amount)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {category.transactionCount} transação{category.transactionCount !== 1 ? 'ões' : ''}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}