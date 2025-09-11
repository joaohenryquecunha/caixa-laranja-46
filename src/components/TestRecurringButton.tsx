import { Button } from '@/components/ui/button';
import { useFinancialData } from '@/hooks/useFinancialData';
import { TransactionType } from '@/types/financial';
import { toast } from '@/components/ui/use-toast';

export function TestRecurringButton() {
  const { addRecurringTransactions } = useFinancialData();

  const handleTestRecurring = () => {
    // Limpar dados existentes para teste limpo
    localStorage.removeItem('financial_transactions');
    localStorage.removeItem('sample_data_loaded');
    
    // Recarregar a página para aplicar dados limpos
    window.location.reload();
  };

  const handleCreateTestData = () => {
    // Criar um exemplo de transação recorrente para teste
    addRecurringTransactions({
      amount: 1500,
      description: 'Financiamento do carro',
      categoryId: '4', // Transporte
      type: TransactionType.EXPENSE,
      startDate: new Date().toISOString().split('T')[0],
      times: 12
    });

    toast({
      title: "Teste criado!",
      description: "12 transações de financiamento criadas para os próximos meses.",
    });
  };

  return (
    <div className="fixed bottom-4 right-4 space-y-2 z-50">
      <Button
        onClick={handleCreateTestData}
        variant="outline"
        size="sm"
        className="bg-card border-border text-foreground hover:bg-accent"
      >
        🧪 Testar Recorrente
      </Button>
      <Button
        onClick={handleTestRecurring}
        variant="outline"
        size="sm"
        className="bg-card border-border text-foreground hover:bg-accent"
      >
        🔄 Limpar Cache
      </Button>
    </div>
  );
}