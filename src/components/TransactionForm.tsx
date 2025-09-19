import { useState } from 'react';
import { X, Calendar as CalendarIcon, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useSupabaseFinancialData } from '@/hooks/useSupabaseFinancialData';
import { TransactionType } from '@/types/financial';
import { CategoryManager } from '@/components/CategoryManager';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface TransactionFormProps {
  onClose: () => void;
}

export function TransactionForm({ onClose }: TransactionFormProps) {
  const { addTransaction, addRecurringTransactions, categories, companies } = useSupabaseFinancialData();
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    categoryId: '',
    companyId: '',
    type: '' as TransactionType,
    date: format(new Date(), 'yyyy-MM-dd')
  });
  
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringData, setRecurringData] = useState({
    times: '12',
    startDate: new Date()
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.amount || !formData.categoryId || !formData.type) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    if (isRecurring) {
      const times = parseInt(recurringData.times);
      if (times < 1 || times > 60) {
        toast({
          title: "Erro",
          description: "A quantidade de vezes deve ser entre 1 e 60.",
          variant: "destructive"
        });
        return;
      }

      console.log('📝 Criando transações recorrentes:', {
        amount: parseFloat(formData.amount),
        description: formData.description,
        categoryId: formData.categoryId,
        type: formData.type,
        startDate: recurringData.startDate.toISOString().split('T')[0],
        times: times
      });

      addRecurringTransactions({
        amount: parseFloat(formData.amount),
        description: formData.description,
        categoryId: formData.categoryId,
        companyId: formData.companyId || undefined,
        type: formData.type,
        startDate: recurringData.startDate.toISOString().split('T')[0],
        times: times
      });

      toast({
        title: "Sucesso!",
        description: `${times} transações recorrentes criadas com sucesso.`,
      });
    } else {
      console.log('📝 Criando transação única:', {
        amount: parseFloat(formData.amount),
        description: formData.description,
        categoryId: formData.categoryId,
        type: formData.type,
        date: formData.date
      });

      addTransaction({
        amount: parseFloat(formData.amount),
        description: formData.description,
        categoryId: formData.categoryId,
        companyId: formData.companyId || undefined,
        type: formData.type,
        date: formData.date
      });

      toast({
        title: "Sucesso!",
        description: "Transação adicionada com sucesso.",
      });
    }

    onClose();
  };

  const filteredCategories = categories.filter(cat => 
    !formData.type || cat.type === formData.type
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md bg-gradient-card border-border shadow-card">
        <div className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <h2 className="text-lg font-semibold text-foreground">
              Nova Transação
            </h2>
            <Button
              type="button"
              variant={isRecurring ? "default" : "outline"}
              size="sm"
              onClick={() => setIsRecurring(!isRecurring)}
              className={isRecurring ? "bg-primary text-primary-foreground" : ""}
            >
              Recorrente
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="ml-auto text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-3">
              <Label>Tipo *</Label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant={formData.type === TransactionType.INCOME ? "default" : "outline"}
                  onClick={() => {
                    setFormData(prev => ({ 
                      ...prev, 
                      type: TransactionType.INCOME,
                      categoryId: ''
                    }));
                  }}
                  className={`h-12 text-xs transition-all ${
                    formData.type === TransactionType.INCOME 
                      ? 'bg-success text-success-foreground shadow-[0_0_20px_rgba(34,197,94,0.4)]' 
                      : 'hover:shadow-[0_0_15px_rgba(34,197,94,0.2)]'
                  }`}
                >
                  Receita
                </Button>
                <Button
                  type="button"
                  variant={formData.type === TransactionType.EXPENSE ? "default" : "outline"}
                  onClick={() => {
                    setFormData(prev => ({ 
                      ...prev, 
                      type: TransactionType.EXPENSE,
                      categoryId: ''
                    }));
                  }}
                  className={`h-12 text-xs transition-all ${
                    formData.type === TransactionType.EXPENSE 
                      ? 'bg-destructive text-destructive-foreground shadow-[0_0_20px_rgba(239,68,68,0.4)]' 
                      : 'hover:shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                  }`}
                >
                  Despesa
                </Button>
                <Button
                  type="button"
                  variant={formData.type === TransactionType.INVESTMENT ? "default" : "outline"}
                  onClick={() => {
                    setFormData(prev => ({ 
                      ...prev, 
                      type: TransactionType.INVESTMENT,
                      categoryId: ''
                    }));
                  }}
                  className={`h-12 text-xs transition-all ${
                    formData.type === TransactionType.INVESTMENT 
                      ? 'bg-sky-500 text-white shadow-[0_0_20px_rgba(14,165,233,0.4)]' 
                      : 'hover:shadow-[0_0_15px_rgba(14,165,233,0.2)]'
                  }`}
                >
                  Investimento
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Valor *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0,00"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                className="bg-input border-border"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="category">Categoria *</Label>
                {formData.type && filteredCategories.length === 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCategoryManager(true)}
                    className="text-xs text-primary hover:text-primary/80"
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    Criar categoria
                  </Button>
                )}
              </div>
              <Select
                value={formData.categoryId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, categoryId: value }))}
                disabled={!formData.type}
              >
                <SelectTrigger className="bg-input border-border">
                  <SelectValue placeholder={
                    !formData.type 
                      ? "Selecione o tipo primeiro" 
                      : filteredCategories.length === 0 
                        ? "Nenhuma categoria disponível - Crie uma nova"
                        : "Selecione uma categoria"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {filteredCategories.map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {companies.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="company">Empresa</Label>
                <Select
                  value={formData.companyId || "none"}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, companyId: value === "none" ? "" : value }))}
                >
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue placeholder="Selecione uma empresa (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhuma empresa</SelectItem>
                    {companies.map(company => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                placeholder="Descrição da transação..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="bg-input border-border resize-none"
                rows={3}
              />
            </div>

            {isRecurring && (
              <div className="grid grid-cols-2 gap-4 p-4 bg-secondary/50 rounded-lg border border-border">
                <div className="space-y-2">
                  <Label htmlFor="times">Quantidade de vezes *</Label>
                  <Input
                    id="times"
                    type="number"
                    min="1"
                    max="60"
                    placeholder="12"
                    value={recurringData.times}
                    onChange={(e) => setRecurringData(prev => ({ ...prev, times: e.target.value }))}
                    className="bg-input border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data inicial *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal bg-input border-border",
                          !recurringData.startDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {recurringData.startDate ? format(recurringData.startDate, "PPP", { locale: ptBR }) : "Selecione a data"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={recurringData.startDate}
                        onSelect={(date) => date && setRecurringData(prev => ({ ...prev, startDate: date }))}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="date">Data {isRecurring ? "(será ignorada)" : "*"}</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className="bg-input border-border"
                disabled={isRecurring}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="gradient"
                className="flex-1"
              >
                {isRecurring ? `Criar ${recurringData.times} Transações` : 'Adicionar'}
              </Button>
            </div>
          </form>
        </div>
      </Card>
      
      {/* Category Manager Modal */}
      {showCategoryManager && (
        <CategoryManager onClose={() => setShowCategoryManager(false)} />
      )}
    </div>
  );
}