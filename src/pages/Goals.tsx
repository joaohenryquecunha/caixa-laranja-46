import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Target, Trophy, TrendingUp, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGoals } from '@/hooks/useGoals';
import { GoalForm } from '@/components/GoalForm';
import { GoalCard } from '@/components/GoalCard';
import { Goal } from '@/types/goals';
import { formatCurrency } from '@/lib/formatters';

export default function Goals() {
  const navigate = useNavigate();
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | undefined>();
  const { goals, deleteGoal, getActiveGoals, getCompletedGoals, addGoal, updateGoal } = useGoals();

  const activeGoals = getActiveGoals();
  const completedGoals = getCompletedGoals();

  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
    setShowGoalForm(true);
  };

  const handleCloseForm = () => {
    setShowGoalForm(false);
    setEditingGoal(undefined);
  };

  const totalActiveAmount = activeGoals.reduce((sum, goal) => sum + goal.targetAmount, 0);
  const totalCompletedAmount = completedGoals.reduce((sum, goal) => sum + goal.targetAmount, 0);

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center space-x-2">
                <Target className="h-6 w-6 text-primary" />
                <span>Metas Financeiras</span>
              </h1>
              <p className="text-muted-foreground">
                Defina e acompanhe suas metas de economia
              </p>
            </div>
          </div>
          <Button
            onClick={() => setShowGoalForm(true)}
            variant="gradient"
            className="md:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nova Meta
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-card border-border shadow-card p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/20 rounded-lg">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Metas Ativas</p>
                <p className="text-xl font-bold text-foreground">
                  {activeGoals.length}
                </p>
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-card border-border shadow-card p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-success/20 rounded-lg">
                <Trophy className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Metas Concluídas</p>
                <p className="text-xl font-bold text-success">
                  {completedGoals.length}
                </p>
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-card border-border shadow-card p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <TrendingUp className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Valor Total</p>
                <p className="text-xl font-bold text-blue-500">
                  {formatCurrency(totalActiveAmount + totalCompletedAmount)}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Goals Tabs */}
        <Card className="bg-gradient-card border-border shadow-card">
          <Tabs defaultValue="active" className="w-full">
            <div className="p-6 pb-0">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="active" className="flex items-center space-x-2">
                  <Target className="h-4 w-4" />
                  <span>Ativas ({activeGoals.length})</span>
                </TabsTrigger>
                <TabsTrigger value="completed" className="flex items-center space-x-2">
                  <Trophy className="h-4 w-4" />
                  <span>Concluídas ({completedGoals.length})</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="active" className="p-6 pt-4">
              {activeGoals.length === 0 ? (
                <div className="text-center py-12">
                  <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    Nenhuma meta ativa
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Crie sua primeira meta financeira para começar a economizar
                  </p>
                  <Button
                    onClick={() => setShowGoalForm(true)}
                    variant="gradient"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Criar Meta
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeGoals.map((goal, index) => (
                    <div
                      key={goal.id}
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <GoalCard
                        goal={goal}
                        onEdit={handleEditGoal}
                        onDelete={deleteGoal}
                      />
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="completed" className="p-6 pt-4">
              {completedGoals.length === 0 ? (
                <div className="text-center py-12">
                  <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    Nenhuma meta concluída
                  </h3>
                  <p className="text-muted-foreground">
                    Suas metas concluídas aparecerão aqui
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {completedGoals.map((goal, index) => (
                    <div
                      key={goal.id}
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <GoalCard
                        goal={goal}
                        onEdit={handleEditGoal}
                        onDelete={deleteGoal}
                      />
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </Card>

        {/* Goal Form Modal */}
        {showGoalForm && (
          <GoalForm
            onClose={handleCloseForm}
            editingGoal={editingGoal}
            addGoal={addGoal}
            updateGoal={updateGoal}
          />
        )}
      </div>
    </div>
  );
}