import { useState, useEffect, useRef } from 'react';
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
import ErrorBoundary from '@/components/ErrorBoundary';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface TransactionFormProps {
  onClose: () => void;
}

export function TransactionForm({ onClose }: TransactionFormProps) {
  const { addTransaction, addRecurringTransactions, categories, companies } = useSupabaseFinancialData();
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [companyOpen, setCompanyOpen] = useState(false);
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

  // Refs para rastrear se o componente está montado e evitar condições de corrida
  const isMountedRef = useRef(true);
  const categoryCloseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const companyCloseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevCategoriesLengthRef = useRef(categories.length);
  const prevCompaniesLengthRef = useRef(companies.length);

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

  // Limpar timeouts quando o componente desmontar
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (categoryCloseTimeoutRef.current) {
        clearTimeout(categoryCloseTimeoutRef.current);
      }
      if (companyCloseTimeoutRef.current) {
        clearTimeout(companyCloseTimeoutRef.current);
      }
    };
  }, []);

  // Fechar select de categoria de forma segura quando a lista mudar
  useEffect(() => {
    // Só fecha se a lista realmente mudou (não apenas na primeira renderização)
    const categoriesChanged = categories.length !== prevCategoriesLengthRef.current;
    
    if (categoriesChanged && categoryOpen && isMountedRef.current) {
      // Limpa timeout anterior se existir
      if (categoryCloseTimeoutRef.current) {
        clearTimeout(categoryCloseTimeoutRef.current);
      }
      
      // Usa um pequeno delay para permitir que o Portal termine sua animação
      categoryCloseTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          setCategoryOpen(false);
        }
      }, 100);
    }
    
    prevCategoriesLengthRef.current = categories.length;
  }, [categories, categoryOpen]);

  // Fechar select de empresa de forma segura quando a lista mudar
  useEffect(() => {
    // Só fecha se a lista realmente mudou (não apenas na primeira renderização)
    const companiesChanged = companies.length !== prevCompaniesLengthRef.current;
    
    if (companiesChanged && companyOpen && isMountedRef.current) {
      // Limpa timeout anterior se existir
      if (companyCloseTimeoutRef.current) {
        clearTimeout(companyCloseTimeoutRef.current);
      }
      
      // Usa um pequeno delay para permitir que o Portal termine sua animação
      companyCloseTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          setCompanyOpen(false);
        }
      }, 100);
    }
    
    prevCompaniesLengthRef.current = companies.length;
  }, [companies, companyOpen]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-auto">
      <Card className="w-full max-w-md bg-gradient-card border-border shadow-card max-h-[calc(100vh-4rem)] overflow-y-auto">
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
                onValueChange={(value) => {
                  setFormData(prev => ({ ...prev, categoryId: value }));
                  // Fechar o select após um pequeno delay para evitar condições de corrida
                  setTimeout(() => {
                    if (isMountedRef.current) {
                      setCategoryOpen(false);
                    }
                  }, 50);
                }}
                disabled={!formData.type}
                open={categoryOpen}
                onOpenChange={(open) => {
                  if (isMountedRef.current) {
                    setCategoryOpen(open);
                  }
                }}
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
                  onValueChange={(value) => {
                    setFormData(prev => ({ ...prev, companyId: value === "none" ? "" : value }));
                    // Fechar o select após um pequeno delay para evitar condições de corrida
                    setTimeout(() => {
                      if (isMountedRef.current) {
                        setCompanyOpen(false);
                      }
                    }, 50);
                  }}
                  open={companyOpen}
                  onOpenChange={(open) => {
                    if (isMountedRef.current) {
                      setCompanyOpen(open);
                    }
                  }}
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
                  <Label>Início *</Label>
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
                        {recurringData.startDate ? format(recurringData.startDate, "dd MMM yyyy", { locale: ptBR }) : "Selecione a data"}
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
        <ErrorBoundary onReset={() => setShowCategoryManager(false)}>
          <CategoryManager onClose={() => setShowCategoryManager(false)} />
        </ErrorBoundary>
      )}
    </div>
  );
}
