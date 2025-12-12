import { useState } from 'react';
import { X, Plus, Calendar as CalendarIcon } from 'lucide-react';
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
import ErrorBoundary from '@/components/ErrorBoundary';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface TransactionFormProps {
  onClose: () => void;
}

export function TransactionForm({ onClose }: TransactionFormProps) {
  const { addTransaction, addRecurringTransactions, categories, companies } = useSupabaseFinancialData();
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  
  const [type, setType] = useState<TransactionType | ''>('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringTimes, setRecurringTimes] = useState('12');
  const [recurringStartDate, setRecurringStartDate] = useState(new Date());

  // Filtrar categorias pelo tipo selecionado
  const filteredCategories = type 
    ? (categories || []).filter(cat => cat?.type === type)
    : [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || !categoryId || !type) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    if (isRecurring) {
      const times = parseInt(recurringTimes);
      if (times < 1 || times > 60) {
        toast({
          title: "Erro",
          description: "A quantidade de vezes deve ser entre 1 e 60.",
          variant: "destructive"
        });
        return;
      }

      addRecurringTransactions({
        amount: parseFloat(amount),
        description,
        categoryId,
        companyId: companyId || undefined,
        type,
        startDate: format(recurringStartDate, 'yyyy-MM-dd'),
        times
      });

      toast({
        title: "Sucesso!",
        description: `${times} transações recorrentes criadas com sucesso.`,
      });
    } else {
      addTransaction({
        amount: parseFloat(amount),
        description,
        categoryId,
        companyId: companyId || undefined,
        type,
        date
      });

      toast({
        title: "Sucesso!",
        description: "Transação adicionada com sucesso.",
      });
    }

    onClose();
  };

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    setCategoryId(''); // Limpar categoria quando tipo muda
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md bg-gradient-card border-border shadow-card">
        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <h2 className="text-lg font-semibold text-foreground">
              Nova Transação
            </h2>
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
            {/* Tipo */}
            <div className="space-y-3">
              <Label>Tipo *</Label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant={type === TransactionType.INCOME ? "default" : "outline"}
                  onClick={() => handleTypeChange(TransactionType.INCOME)}
                  className={`h-12 text-xs ${
                    type === TransactionType.INCOME 
                      ? 'bg-success text-success-foreground' 
                      : ''
                  }`}
                >
                  Receita
                </Button>
                <Button
                  type="button"
                  variant={type === TransactionType.EXPENSE ? "default" : "outline"}
                  onClick={() => handleTypeChange(TransactionType.EXPENSE)}
                  className={`h-12 text-xs ${
                    type === TransactionType.EXPENSE 
                      ? 'bg-destructive text-destructive-foreground' 
                      : ''
                  }`}
                >
                  Despesa
                </Button>
                <Button
                  type="button"
                  variant={type === TransactionType.INVESTMENT ? "default" : "outline"}
                  onClick={() => handleTypeChange(TransactionType.INVESTMENT)}
                  className={`h-12 text-xs ${
                    type === TransactionType.INVESTMENT 
                      ? 'bg-sky-500 text-white' 
                      : ''
                  }`}
                >
                  Investimento
                </Button>
              </div>
            </div>

            {/* Valor */}
            <div className="space-y-2">
              <Label htmlFor="amount">Valor *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-input border-border"
              />
            </div>

            {/* Categoria */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="category">Categoria *</Label>
                {type && filteredCategories.length === 0 && (
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
                value={categoryId || undefined}
                onValueChange={setCategoryId}
                disabled={!type || filteredCategories.length === 0}
              >
                <SelectTrigger className="bg-input border-border">
                  <SelectValue placeholder={
                    !type 
                      ? "Selecione o tipo primeiro" 
                      : filteredCategories.length === 0 
                        ? "Nenhuma categoria disponível"
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

            {/* Empresa */}
            {companies && companies.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="company">Empresa</Label>
                <Select
                  value={companyId || "none"}
                  onValueChange={(value) => setCompanyId(value === "none" ? "" : value)}
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

            {/* Descrição */}
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                placeholder="Descrição da transação..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-input border-border resize-none"
                rows={3}
              />
            </div>

            {/* Transação Recorrente */}
            <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/40 px-3 py-2">
              <div>
                <p className="text-sm font-medium text-foreground">Transação recorrente</p>
                <p className="text-xs text-muted-foreground">
                  Gere múltiplas transações automáticas com base na data inicial.
                </p>
              </div>
              <Button
                type="button"
                variant={isRecurring ? "default" : "outline"}
                size="sm"
                onClick={() => setIsRecurring(!isRecurring)}
                className={isRecurring ? "bg-primary text-primary-foreground" : ""}
              >
                {isRecurring ? "Ativada" : "Ativar"}
              </Button>
            </div>

            {/* Campos de Recorrencia */}
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
                    value={recurringTimes}
                    onChange={(e) => setRecurringTimes(e.target.value)}
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
                          !recurringStartDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {recurringStartDate ? format(recurringStartDate, "dd MMM yyyy", { locale: ptBR }) : "Selecione a data"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={recurringStartDate}
                        onSelect={(date) => date && setRecurringStartDate(date)}
                        initialFocus
                        className="p-3"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            )}

            {/* Data */}
            <div className="space-y-2">
              <Label htmlFor="date">Data {isRecurring ? "(será ignorada)" : "*"}</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-input border-border"
                disabled={isRecurring}
              />
            </div>

            {/* Botões */}
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
                {isRecurring ? `Criar ${recurringTimes} Transações` : 'Adicionar'}
              </Button>
            </div>
          </form>
        </div>
      </Card>
      
      {/* Category Manager Modal */}
      {showCategoryManager && (
        <ErrorBoundary onReset={() => setShowCategoryManager(false)}>
          <CategoryManager 
            onClose={() => setShowCategoryManager(false)} 
          />
        </ErrorBoundary>
      )}
    </div>
  );
}
