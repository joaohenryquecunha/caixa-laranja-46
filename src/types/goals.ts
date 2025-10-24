export interface Goal {
  id: string;
  title: string;
  description?: string;
  targetAmount: number;
  initialBalance: number;
  currentProgress: number;
  targetDate: string;
  createdAt: string;
  completed: boolean;
  completedAt?: string;
  mode: 'automatic' | 'manual';
}

export interface GoalHistory {
  id: string;
  goalId: string;
  amount: number;
  transactionId: string;
  date: string;
  description: string;
}

export interface GoalProgress {
  remainingAmount: number;
  remainingDays: number;
  dailyTarget: number;
  monthlyTarget: number;
  progressPercentage: number;
  isOnTrack: boolean;
}
