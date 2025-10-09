import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { X, Target, Calendar, DollarSign } from 'lucide-react';
import { useSupabaseFinancialData } from '@/hooks/useSupabaseFinancialData';
import { formatCurrency } from '@/lib/formatters';
import { Goal } from '@/types/goals';
import { format } from 'date-fns';

interface GoalFormProps {
  onClose: () => void;
  editingGoal?: Goal;
}

export function GoalForm({ onClose, editingGoal }: GoalFormProps) {
  const { getFinancialSummary, addGoal, updateGoal } = useSupabaseFinancialData();
  const summary = getFinancialSummary();

  const [formData, setFormData] = useState({
    title: editingGoal?.title || '',
    description: editingGoal?.description || '',
    targetAmount: editingGoal?.targetAmount || 0,
    targetDate: editingGoal?.targetDate ? format(new Date(editingGoal.targetDate), 'yyyy-MM-dd') : '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.targetAmount || !formData.targetDate) {
      return;
    }

    if (editingGoal) {
      await updateGoal(editingGoal.id, {
        title: formData.title,
        description: formData.description,
        targetAmount: formData.targetAmount,
        targetDate: new Date(formData.targetDate).toISOString(),
      });
    } else {
      await addGoal({
        title: formData.title,
        description: formData.description,
        targetAmount: formData.targetAmount,
        targetDate: new Date(formData.targetDate).toISOString(),
        initialBalance: summary.totalBalance,
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md bg-background border-border shadow-lg">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">
                {editingGoal ? 'Editar Meta' : 'Nova Meta'}
              </h2>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Título da Meta</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Ex: Comprar um carro"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Descrição (opcional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descreva sua meta..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="targetAmount">Valor da Meta</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="targetAmount"
                  type="number"
                  value={formData.targetAmount || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, targetAmount: Number(e.target.value) }))}
                  placeholder="0,00"
                  className="pl-10"
                  step="0.01"
                  min="0"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="targetDate">Data Limite</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="targetDate"
                  type="date"
                  value={formData.targetDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, targetDate: e.target.value }))}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {!editingGoal && (
              <div className="bg-muted/50 p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Saldo atual:</strong> {formatCurrency(summary.totalBalance)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Esta meta começará com seu saldo atual e será atualizada conforme suas transações.
                </p>
              </div>
            )}

            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
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
                {editingGoal ? 'Salvar' : 'Criar Meta'}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}