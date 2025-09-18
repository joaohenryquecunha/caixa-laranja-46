import { useState, useEffect, useCallback } from 'react';
import { Goal, GoalHistory, GoalProgress } from '@/types/goals';
import { useFinancialData } from '@/hooks/useFinancialData';
import { differenceInDays, parseISO, format } from 'date-fns';

const GOALS_KEY = 'financial_goals';
const GOAL_HISTORY_KEY = 'financial_goal_history';

let globalGoals: Goal[] = [];
let globalGoalHistory: GoalHistory[] = [];

const loadInitialGoalData = () => {
  if (globalGoals.length === 0) {
    const savedGoals = localStorage.getItem(GOALS_KEY);
    if (savedGoals) {
      try {
        globalGoals = JSON.parse(savedGoals);
      } catch (e) {
        console.error('❌ Erro ao carregar metas:', e);
        globalGoals = [];
      }
    }
  }

  if (globalGoalHistory.length === 0) {
    const savedHistory = localStorage.getItem(GOAL_HISTORY_KEY);
    if (savedHistory) {
      try {
        globalGoalHistory = JSON.parse(savedHistory);
      } catch (e) {
        console.error('❌ Erro ao carregar histórico de metas:', e);
        globalGoalHistory = [];
      }
    }
  }
};

export function useGoals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [goalHistory, setGoalHistory] = useState<GoalHistory[]>([]);
  const { getFinancialSummary, transactions } = useFinancialData();

  // Carregar dados do localStorage
  useEffect(() => {
    console.log('📁 Carregando dados iniciais das metas...');
    loadInitialGoalData();
    console.log('📁 Metas carregadas do cache:', globalGoals.length);
    setGoals([...globalGoals]);
    setGoalHistory([...globalGoalHistory]);
  }, []);

  // Salvar metas no localStorage
  useEffect(() => {
    console.log('💾 Salvando metas no localStorage:', goals);
    localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
    globalGoals = [...goals];
    console.log('💾 Metas salvas. Total:', goals.length);
  }, [goals]);

  // Salvar histórico no localStorage
  useEffect(() => {
    console.log('💾 Salvando histórico no localStorage:', goalHistory);
    localStorage.setItem(GOAL_HISTORY_KEY, JSON.stringify(goalHistory));
    globalGoalHistory = [...goalHistory];
  }, [goalHistory]);

  // Atualizar progresso das metas baseado em transações
  useEffect(() => {
    if (goals.length > 0) {
      goals.forEach(goal => {
        if (!goal.completed) {
          updateGoalProgress(goal.id);
        }
      });
    }
  }, [transactions]); // Removido goals da dependência para evitar loop

  const addGoal = useCallback((goalData: Omit<Goal, 'id' | 'createdAt' | 'currentProgress' | 'completed'>) => {
    console.log('🎯 Adicionando nova meta:', goalData);
    const summary = getFinancialSummary();
    const newGoal: Goal = {
      ...goalData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      currentProgress: summary.totalBalance,
      completed: false,
    };

    console.log('🎯 Meta criada:', newGoal);
    setGoals(prev => {
      const newGoals = [...prev, newGoal];
      console.log('🎯 Atualizando state de metas:', newGoals);
      return newGoals;
    });
    return newGoal.id;
  }, [getFinancialSummary]);

  const updateGoal = useCallback((goalId: string, updates: Partial<Goal>) => {
    setGoals(prev => prev.map(goal => 
      goal.id === goalId ? { ...goal, ...updates } : goal
    ));
  }, []);

  const deleteGoal = useCallback((goalId: string) => {
    setGoals(prev => prev.filter(goal => goal.id !== goalId));
    setGoalHistory(prev => prev.filter(history => history.goalId !== goalId));
  }, []);

  const completeGoal = useCallback((goalId: string) => {
    setGoals(prev => prev.map(goal => 
      goal.id === goalId 
        ? { ...goal, completed: true, completedAt: new Date().toISOString() }
        : goal
    ));
  }, []);

  const updateGoalProgress = useCallback((goalId: string) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal || goal.completed) return;

    // Calcular transações desde a criação da meta
    const goalCreationDate = parseISO(goal.createdAt);
    const relevantTransactions = transactions.filter(transaction => 
      parseISO(transaction.date) >= goalCreationDate
    );

    // Calcular progresso baseado nas transações
    let progressChange = 0;
    relevantTransactions.forEach(transaction => {
      if (transaction.type === 'income') {
        progressChange += transaction.amount;
      } else if (transaction.type === 'expense') {
        progressChange -= transaction.amount;
      }
      // Investimentos não afetam o progresso da meta
    });

    const newProgress = goal.initialBalance + progressChange;
    
    setGoals(prev => prev.map(g => 
      g.id === goalId ? { ...g, currentProgress: newProgress } : g
    ));

    // Verificar se a meta foi atingida
    if (newProgress >= goal.targetAmount && !goal.completed) {
      completeGoal(goalId);
    }
  }, [goals, transactions, completeGoal]);

  const getGoalProgress = useCallback((goal: Goal): GoalProgress => {
    const remainingAmount = Math.max(0, goal.targetAmount - goal.currentProgress);
    const remainingDays = Math.max(0, differenceInDays(parseISO(goal.targetDate), new Date()));
    const dailyTarget = remainingDays > 0 ? remainingAmount / remainingDays : 0;
    const monthlyTarget = dailyTarget * 30;
    const progressPercentage = (goal.currentProgress / goal.targetAmount) * 100;
    
    // Calcular se está no caminho certo
    const totalDays = differenceInDays(parseISO(goal.targetDate), parseISO(goal.createdAt));
    const daysPassed = totalDays - remainingDays;
    const expectedProgress = (daysPassed / totalDays) * goal.targetAmount;
    const isOnTrack = goal.currentProgress >= expectedProgress * 0.9; // 90% de tolerância

    return {
      remainingAmount,
      remainingDays,
      dailyTarget,
      monthlyTarget,
      progressPercentage: Math.min(100, progressPercentage),
      isOnTrack
    };
  }, []);

  const getGoalHistory = useCallback((goalId: string) => {
    return goalHistory.filter(history => history.goalId === goalId);
  }, [goalHistory]);

  const getActiveGoals = useCallback(() => {
    return goals.filter(goal => !goal.completed);
  }, [goals]);

  const getCompletedGoals = useCallback(() => {
    return goals.filter(goal => goal.completed);
  }, [goals]);

  return {
    goals,
    addGoal,
    updateGoal,
    deleteGoal,
    completeGoal,
    getGoalProgress,
    getGoalHistory,
    getActiveGoals,
    getCompletedGoals,
    updateGoalProgress
  };
}