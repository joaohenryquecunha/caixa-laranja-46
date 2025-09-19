import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { useSupabaseFinancialData } from '@/hooks/useSupabaseFinancialData';
import { formatCurrency } from '@/lib/formatters';

export function BalanceChart() {
  const { getChartData } = useSupabaseFinancialData();
  const chartData = getChartData();

  if (chartData.length === 0) {
    return (
      <div className="h-32 w-full flex items-center justify-center text-muted-foreground">
        <p className="text-sm">Sem dados para exibir</p>
      </div>
    );
  }

  return (
    <div className="h-32 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <XAxis 
            dataKey="date" 
            hide
          />
          <YAxis hide />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
                    <p className="text-sm font-medium text-foreground mb-2">{data.tooltipDate || label}</p>
                    <div className="space-y-1 text-xs">
                      <p className="text-primary">
                        Saldo: {formatCurrency(data.balance)}
                      </p>
                      <p className="text-success">
                        Receitas: {formatCurrency(data.income)}
                      </p>
                      <p className="text-destructive">
                        Despesas: {formatCurrency(data.expenses)}
                      </p>
                      <p className="text-blue-400">
                        Investimentos: {formatCurrency(data.investments)}
                      </p>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Line 
            type="monotone" 
            dataKey="balance" 
            stroke="hsl(var(--primary))"
            strokeWidth={3}
            dot={false}
            activeDot={{ 
              r: 4, 
              fill: "hsl(var(--primary))",
              strokeWidth: 0
            }}
          />
          <Line 
            type="monotone" 
            dataKey="income" 
            stroke="#22c55e"
            strokeWidth={2}
            dot={false}
            activeDot={{ 
              r: 3, 
              fill: "#22c55e",
              strokeWidth: 0
            }}
          />
          <Line 
            type="monotone" 
            dataKey="expenses" 
            stroke="#ef4444"
            strokeWidth={2}
            dot={false}
            activeDot={{ 
              r: 3, 
              fill: "#ef4444",
              strokeWidth: 0
            }}
          />
          <Line 
            type="monotone" 
            dataKey="investments" 
            stroke="#06b6d4"
            strokeWidth={2}
            dot={false}
            activeDot={{ 
              r: 3, 
              fill: "#06b6d4",
              strokeWidth: 0
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}