export type CompletedLogRow = {
  completed_at: string;
  workout_id: string | null;
};

export type ChallengeWorkoutRow = {
  id: string;
  title: string | null;
  day_order: number | null;
  training_program_id?: string | null;
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
    trainingProgramId?: string | null;
  };
};

export type AdaptiveMessageResult = {
  headline: string;
  subtext: string;
  supportLabel: string;
};

export type SupportContentCandidate = {
  id: string;
  title: string | null;
  description: string | null;
  short_text: string | null;
  content_type: string | null;
  intel_type: string | null;
  system_key: string | null;
  training_program_id: string | null;
  workout_id: string | null;
  external_url: string | null;
  file_url: string | null;
  is_primary: boolean | null;
};

export type RecommendedSupportContent = {
  id: string;
  title: string;
  body: string;
  href: string;
  contentType: string;
  reasonLabel: string;
};

export type RecommendationInput = {
  completedLogs: CompletedLogRow[];
  challengeWorkouts: ChallengeWorkoutRow[];
  currentWorkoutId?: string | null;
  currentWorkoutTitle?: string | null;
  currentWorkoutDayOrder?: number | null;
  currentPathType?: ContinuationPathType;
  supportContentCandidates?: SupportContentCandidate[];
};

export type RecommendationState = {
  continuation: ContinuationStateResult;
  nextBestSession: NextBestSessionResult;
  messaging: AdaptiveMessageResult;
  supportContent: RecommendedSupportContent | null;
  context: {
    completedChallengeCount: number;
    totalChallengeCount: number;
  };
};