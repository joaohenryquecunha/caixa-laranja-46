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
    <Card className="bg-gradient-card border-border shadow-card p-4 h-full flex flex-col">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-foreground mb-2">
          Distribuição por Categoria
        </h3>
      </div>

      {/* Layout horizontal - Lista das categorias primeiro */}
      <div className="flex-1 flex flex-col">
        {/* Resumo das Categorias - Formato horizontal compacto */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
          {categoryData.slice(0, 4).map((category) => (
            <div 
              key={category.categoryId}
              className="flex items-center gap-3 p-3 rounded-lg bg-background/50 border border-border/50"
            >
              <div 
                className="w-4 h-4 rounded-full flex-shrink-0"
                style={{ backgroundColor: category.color }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground truncate">
                    {category.categoryName}
                  </span>
                  <span className="text-xs text-muted-foreground ml-2">
                    {category.percentage.toFixed(1)}%
                  </span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {formatCurrency(category.amount)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Mostrar categorias restantes se houver mais de 4 */}
        {categoryData.length > 4 && (
          <div className="max-h-24 overflow-y-auto mb-4">
            <div className="grid grid-cols-1 gap-1">
              {categoryData.slice(4).map((category) => (
                <div 
                  key={category.categoryId}
                  className="flex items-center justify-between text-xs p-2 rounded bg-background/30"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div 
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="text-muted-foreground truncate">
                      {category.categoryName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-foreground font-medium">
                      {formatCurrency(category.amount)}
                    </span>
                    <span className="text-muted-foreground">
                      {category.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Gráfico de Pizza - Menor e no final */}
        <div className="flex justify-center">
          <div className="h-32 w-32">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={20}
                  outerRadius={55}
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
      </div>
    </Card>
  );
}