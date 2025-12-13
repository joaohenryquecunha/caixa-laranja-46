import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSupabaseFinancialData } from '@/hooks/useSupabaseFinancialData';
import { Transaction, TransactionType } from '@/types/financial';
import { formatCurrency, formatDate } from '@/lib/formatters';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';

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
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);

  const requestDelete = (transaction: Transaction) => {
    setTransactionToDelete(transaction);
  };

  const handleConfirmDelete = () => {
    if (!transactionToDelete) return;
    const id = transactionToDelete.id;
    if (onDeleteTransaction) {
      onDeleteTransaction(id);
    }
    setTransactionToDelete(null);
  };

  const handleCancelDelete = () => {
    setTransactionToDelete(null);
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
        
        // Formatar hora de criação
        let timeStr = '';
        if (transaction.createdAt) {
          try {
            const date = new Date(transaction.createdAt);
            if (!isNaN(date.getTime())) {
              timeStr = date.toLocaleTimeString('pt-BR', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false 
              });
            } else {
              console.warn('Data inválida para transaction:', transaction.id, 'createdAt:', transaction.createdAt);
            }
          } catch (e) {
            console.error('Erro ao formatar hora:', e, 'transaction:', transaction);
          }
        }

        return (
          <div
            key={transaction.id}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-lg border border-border transition-all duration-300 hover:scale-[1.02] hover:shadow-md animate-fade-in"
            style={{ 
              backgroundColor: `${category?.color}08`,
              borderColor: `${category?.color}20`,
              animationDelay: `${index * 50}ms`
            }}
          >
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 transition-all duration-300 hover:scale-110"
                style={{ 
                  backgroundColor: `${category?.color}20`,
                  color: category?.color 
                }}
              >
                {category?.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="font-medium text-foreground transition-colors duration-200 break-words leading-tight">
                  {transaction.description || category?.name}
                </p>
                <p className="text-sm text-muted-foreground transition-colors duration-200">
                  {category?.name}
                </p>
                <p className="text-sm text-muted-foreground transition-colors duration-200">
                  {formatDate(transaction.date)}
                  {timeStr && ` às ${timeStr}`}
                </p>
              </div>
            </div>
            
            <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
              <p className={`font-semibold transition-all duration-300 ${colorClass} text-right sm:text-right`}> 
                {sign}{formatCurrency(transaction.amount)}
              </p>
              {showDeleteButton && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => requestDelete(transaction)}
                  className="text-muted-foreground hover:text-destructive p-2 transition-all duration-200 hover:scale-110"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        );
      })}

      <AlertDialog open={!!transactionToDelete} onOpenChange={(open) => !open && handleCancelDelete()}>
        <AlertDialogContent className="bg-gradient-card border-border z-[120]">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir transação?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é definitiva e irá atualizar todos os cálculos relacionados a esta transação. Tem certeza que deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelDelete}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir definitivamente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
