export type CompletedLogRow = {
  completed_at: string;
  workout_id: string | null;
};

export type ChallengeWorkoutRow = {
  id: string;
  title: string | null;
  day_order: number | null;
};

export type ContinuationPathType =
  | 'challenge'
  | 'program'
  | 'workout'
  | 'none'
  | 'unknown';

export type ContinuationStateResult = {
  state: 'new' | 'active' | 'paused';
  daysSinceLastSession: number | null;
  streakCount: number;
  sessionsThisWeek: number;
  hasCompletedAnySession: boolean;
  currentPath: ContinuationPathType;
};

export type NextBestSessionResult = {
  recommendationType:
    | 'continue_challenge'
    | 'resume_program'
    | 'start_challenge'
    | 'return_to_dashboard';
  primaryCta: {
    label: string;
    href: string;
  };
  secondaryCta: {
    label: string;
    href: string;
  };
  nextSession: {
    workoutId: string | null;
    title: string;
    href: string;
    pathType: 'challenge' | 'program' | 'none';
    dayOrder: number | null;
  };
};

export type AdaptiveMessageResult = {
  headline: string;
  subtext: string;
  supportLabel: string;
};

export type RecommendationInput = {
  completedLogs: CompletedLogRow[];
  challengeWorkouts: ChallengeWorkoutRow[];
  currentWorkoutId?: string | null;
  currentWorkoutTitle?: string | null;
  currentWorkoutDayOrder?: number | null;
  currentPathType?: ContinuationPathType;
};

export type RecommendationState = {
  continuation: ContinuationStateResult;
  nextBestSession: NextBestSessionResult;
  messaging: AdaptiveMessageResult;
  context: {
    completedChallengeCount: number;
    totalChallengeCount: number;
  };
};