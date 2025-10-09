import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Target, 
  Calendar, 
  TrendingUp, 
  Edit, 
  Trash2, 
  CheckCircle,
  Clock,
  DollarSign,
  CalendarDays
} from 'lucide-react';
import { Goal } from '@/types/goals';
import { useSupabaseFinancialData } from '@/hooks/useSupabaseFinancialData';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { differenceInDays } from 'date-fns';

interface GoalCardProps {
  goal: Goal;
  onEdit: (goal: Goal) => void;
  onDelete: (goalId: string) => void;
}

export function GoalCard({ goal, onEdit, onDelete }: GoalCardProps) {
  const { getGoalProgress, completeGoal } = useSupabaseFinancialData();
  const [showDetails, setShowDetails] = useState(false);
  const [viewMode, setViewMode] = useState<'daily' | 'monthly'>('daily');
  
  const progress = getGoalProgress(goal);
  
  const getStatusColor = () => {
    if (goal.completed) return 'bg-success text-success-foreground';
    if (progress.remainingDays <= 7) return 'bg-destructive text-destructive-foreground';
    if (!progress.isOnTrack) return 'bg-warning text-warning-foreground';
    return 'bg-primary text-primary-foreground';
  };

  const getStatusText = () => {
    if (goal.completed) return 'Concluída';
    if (progress.remainingDays <= 0) return 'Vencida';
    if (progress.remainingDays <= 7) return 'Urgente';
    if (!progress.isOnTrack) return 'Atrasada';
    return 'No prazo';
  };

  return (
    <Card className="bg-gradient-card border-border shadow-card overflow-hidden transition-all duration-300 hover:shadow-lg animate-fade-in">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <Target className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">{goal.title}</h3>
              <Badge className={getStatusColor()}>
                {getStatusText()}
              </Badge>
            </div>
            {goal.description && (
              <p className="text-sm text-muted-foreground">{goal.description}</p>
            )}
          </div>
          
          <div className="flex items-center space-x-1">
            {!goal.completed && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(goal)}
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => completeGoal(goal.id)}
                  className="h-8 w-8 text-muted-foreground hover:text-success"
                  title="Marcar como concluída"
                >
                  <CheckCircle className="h-4 w-4" />
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(goal.id)}
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Progresso</span>
            <span className="text-sm font-medium">{progress.progressPercentage.toFixed(1)}%</span>
          </div>
          <Progress value={progress.progressPercentage} className="h-2" />
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {formatCurrency(goal.currentProgress)}
            </span>
            <span className="text-foreground font-medium">
              {formatCurrency(goal.targetAmount)}
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-border">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Restam</p>
              <p className="text-sm font-medium">
                {progress.remainingDays > 0 ? `${progress.remainingDays} dias` : 'Vencida'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Faltam</p>
              <p className="text-sm font-medium">{formatCurrency(progress.remainingAmount)}</p>
            </div>
          </div>
        </div>

        {/* Target Info Toggle */}
        {!goal.completed && progress.remainingDays > 0 && (
          <div className="mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
              className="w-full"
            >
              {showDetails ? 'Ocultar Detalhes' : 'Ver Metas de Economia'}
            </Button>
            
            {showDetails && (
              <div className="mt-3 space-y-3">
                <div className="flex items-center justify-center space-x-2">
                  <Button
                    variant={viewMode === 'daily' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('daily')}
                  >
                    <CalendarDays className="h-4 w-4 mr-1" />
                    Diário
                  </Button>
                  <Button
                    variant={viewMode === 'monthly' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('monthly')}
                  >
                    <Calendar className="h-4 w-4 mr-1" />
                    Mensal
                  </Button>
                </div>
                
                <div className="bg-muted/50 p-3 rounded-lg text-center">
                  <div className="flex items-center justify-center space-x-2 mb-1">
                    <DollarSign className="h-4 w-4 text-primary" />
                    <span className="text-sm text-muted-foreground">
                      Para atingir sua meta, economize:
                    </span>
                  </div>
                  <p className="text-lg font-bold text-primary">
                    {formatCurrency(viewMode === 'daily' ? progress.dailyTarget : progress.monthlyTarget)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    por {viewMode === 'daily' ? 'dia' : 'mês'}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Completion Info */}
        {goal.completed && goal.completedAt && (
          <div className="mt-4 p-3 bg-success/10 border border-success/20 rounded-lg">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-success" />
              <span className="text-sm text-success font-medium">
                Meta concluída em {formatDate(goal.completedAt)}
              </span>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}