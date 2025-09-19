import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSupabaseFinancialData } from '@/hooks/useSupabaseFinancialData';
import { Transaction, TransactionType } from '@/types/financial';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { toast } from '@/components/ui/use-toast';

interface TransactionListProps {
  transactions: Transaction[];
  showDeleteButton?: boolean;
  onEditTransaction?: (transaction: Transaction) => void;
  onDeleteTransaction?: (id: string) => void;
  showScrollbar?: boolean;
}

export function TransactionList({ 
  transactions, 
  showDeleteButton = false, 
  onEditTransaction,
  onDeleteTransaction,
  showScrollbar = true 
}: TransactionListProps) {
  const { getCategoryById } = useSupabaseFinancialData();

  const handleDelete = (id: string) => {
    if (onDeleteTransaction) {
      onDeleteTransaction(id);
    }
    toast({
      title: "Transação removida",
      description: "A transação foi removida com sucesso.",
    });
  };

  const getTransactionColor = (type: TransactionType) => {
    switch (type) {
      case TransactionType.INCOME:
        return 'text-success';
      case TransactionType.EXPENSE:
        return 'text-destructive';
      case TransactionType.INVESTMENT:
        return 'text-primary';
      default:
        return 'text-foreground';
    }
  };

  const getAmountSign = (type: TransactionType) => {
    return type === TransactionType.INCOME ? '+' : '-';
  };

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Nenhuma transação encontrada</p>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${showScrollbar ? 'p-4' : 'px-4 pb-4'}`}>
      {transactions.map((transaction, index) => {
        const category = getCategoryById(transaction.categoryId);
        const colorClass = getTransactionColor(transaction.type);
        const sign = getAmountSign(transaction.type);

        return (
          <div
            key={transaction.id}
            className="flex items-center justify-between p-4 rounded-lg border border-border transition-all duration-300 hover:scale-[1.02] hover:shadow-md animate-fade-in"
            style={{ 
              backgroundColor: `${category?.color}08`,
              borderColor: `${category?.color}20`,
              animationDelay: `${index * 50}ms`
            }}
          >
            <div className="flex items-center space-x-3">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 hover:scale-110"
                style={{ 
                  backgroundColor: `${category?.color}20`,
                  color: category?.color 
                }}
              >
                {category?.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-foreground transition-colors duration-200">
                  {transaction.description || category?.name}
                </p>
                <p className="text-sm text-muted-foreground transition-colors duration-200">
                  {category?.name} • {formatDate(transaction.date)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <p className={`font-semibold transition-all duration-300 ${colorClass}`}>
                {sign}{formatCurrency(transaction.amount)}
              </p>
              
              {showDeleteButton && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(transaction.id)}
                  className="text-muted-foreground hover:text-destructive p-2 transition-all duration-200 hover:scale-110"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}