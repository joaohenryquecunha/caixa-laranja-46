import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFinancialData } from '@/hooks/useFinancialData';
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
  const { deleteTransaction, getCategoryById } = useFinancialData();

  const handleDelete = (id: string) => {
    deleteTransaction(id);
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
    <div className={`space-y-3 p-4 ${!showScrollbar ? 'max-h-96 overflow-y-auto scrollbar-hide' : ''}`}>
      {transactions.map(transaction => {
        const category = getCategoryById(transaction.categoryId);
        const colorClass = getTransactionColor(transaction.type);
        const sign = getAmountSign(transaction.type);

        return (
          <div
            key={transaction.id}
            className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg border border-border hover:bg-secondary/70 transition-smooth"
          >
            <div className="flex items-center space-x-3">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium"
                style={{ 
                  backgroundColor: `${category?.color}20`,
                  color: category?.color 
                }}
              >
                {category?.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-foreground">
                  {transaction.description || category?.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {category?.name} • {formatDate(transaction.date)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <p className={`font-semibold ${colorClass}`}>
                {sign}{formatCurrency(transaction.amount)}
              </p>
              
              {showDeleteButton && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(transaction.id)}
                  className="text-muted-foreground hover:text-destructive p-2"
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