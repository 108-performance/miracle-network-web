export type CompletedLogRow = {
  completed_at: string;
  workout_id: string | null;
};

export type GuidedTrainSessionRow = {
  id: string;
  title: string | null;
  session_order: number;
  phase_key: 'foundational' | 'engine_build' | 'ball_strike' | 'adaptability';
  phase_label: string;
  training_program_id?: string | null;
  estimated_minutes?: number | null;
};

export type ChallengeWorkoutRow = {
  id: string;
  title: string | null;
  day_order: number | null;
  training_program_id?: string | null;
};

export type ContinuationPathType =
  | 'train'
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

export type RecommendedSessionMeta = {
  workoutId: string | null;
  title: string;
  href: string;
  pathType: 'train' | 'challenge' | 'none';
  dayOrder: number | null;
  sessionOrder?: number | null;
  phaseKey?: GuidedTrainSessionRow['phase_key'] | null;
  phaseLabel?: string | null;
  trainingProgramId?: string | null;
  estimatedMinutes?: number | null;
};

export type NextBestSessionResult = {
  recommendationType:
    | 'start_train_path'
    | 'continue_train_path'
    | 'resume_train_session'
    | 'fallback_to_challenge'
    | 'return_to_dashboard';
  primaryCta: {
    label: string;
    href: string;
  };
  secondaryCta: {
    label: string;
    href: string;
  };
  nextSession: RecommendedSessionMeta;
  optionalSecondSession: RecommendedSessionMeta | null;
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
  trainSessions: GuidedTrainSessionRow[];
  challengeWorkouts?: ChallengeWorkoutRow[];
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
    completedTrainCount: number;
    totalTrainCount: number;
    completedChallengeCount: number;
    totalChallengeCount: number;
    activePhaseKey: GuidedTrainSessionRow['phase_key'] | null;
    activePhaseLabel: string | null;
  };
};