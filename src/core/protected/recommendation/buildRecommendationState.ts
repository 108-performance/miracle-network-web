import { getAdaptiveMessage } from './getAdaptiveMessage';
import { getContinuationState } from './getContinuationState';
import { getNextBestSession } from './getNextBestSession';
import type {
  RecommendationInput,
  RecommendationState,
  RecommendedSupportContent,
  SupportContentCandidate,
} from './types';

function normalizeText(value?: string | null) {
  return (value ?? '').trim();
}

function getSupportHref(candidate: SupportContentCandidate) {
  return candidate.external_url || candidate.file_url || '';
}

function getSupportBody(candidate: SupportContentCandidate) {
  return (
    normalizeText(candidate.short_text) ||
    normalizeText(candidate.description) ||
    'Open this to support your next step.'
  );
}

function buildRecommendedSupportContent(
  input: RecommendationInput,
  recommendationType: RecommendationState['nextBestSession']['recommendationType'],
  continuationState: RecommendationState['continuation']['state'],
  nextWorkoutId: string | null,
  nextTrainingProgramId: string | null
): RecommendedSupportContent | null {
  const candidates = (input.supportContentCandidates ?? []).filter((candidate) => {
    const href = getSupportHref(candidate);
    if (!href) return false;
    if (candidate.intel_type === 'quick_action_intro') return false;
    return true;
  });

  if (!candidates.length) {
    return null;
  }

  const byWorkout = nextWorkoutId
    ? candidates.find((candidate) => candidate.workout_id === nextWorkoutId)
    : null;

  if (byWorkout) {
    return {
      id: byWorkout.id,
      title: normalizeText(byWorkout.title) || 'Support content',
      body: getSupportBody(byWorkout),
      href: getSupportHref(byWorkout),
      contentType: byWorkout.content_type || 'content',
      reasonLabel: 'Support your next session',
    };
  }

  const byProgram = nextTrainingProgramId
    ? candidates.find(
        (candidate) => candidate.training_program_id === nextTrainingProgramId
      )
    : null;

  if (byProgram) {
    return {
      id: byProgram.id,
      title: normalizeText(byProgram.title) || 'Support content',
      body: getSupportBody(byProgram),
      href: getSupportHref(byProgram),
      contentType: byProgram.content_type || 'content',
      reasonLabel: 'Built for your path',
    };
  }

  const systemKeyPriority =
    recommendationType === 'start_train_path'
      ? ['train_start', 'methodology_intro', 'onboarding']
      : recommendationType === 'continue_train_path' ||
          recommendationType === 'resume_train_session'
        ? ['train_continue', 'habit_loop', 'methodology']
        : recommendationType === 'fallback_to_challenge'
          ? ['challenge_continue', 'habit_loop', 'methodology']
          : continuationState === 'paused'
            ? ['reset', 'restart', 'mindset']
            : continuationState === 'new'
              ? ['onboarding', 'methodology_intro']
              : ['methodology', 'habit_loop'];

  for (const key of systemKeyPriority) {
    const systemKeyMatch = candidates.find((candidate) => candidate.system_key === key);
    if (systemKeyMatch) {
      return {
        id: systemKeyMatch.id,
        title: normalizeText(systemKeyMatch.title) || 'Support content',
        body: getSupportBody(systemKeyMatch),
        href: getSupportHref(systemKeyMatch),
        contentType: systemKeyMatch.content_type || 'content',
        reasonLabel: 'Support for today',
      };
    }
  }

  const primaryFallback =
    candidates.find((candidate) => candidate.is_primary === true) ?? candidates[0];

  if (!primaryFallback) {
    return null;
  }

  return {
    id: primaryFallback.id,
    title: normalizeText(primaryFallback.title) || 'Support content',
    body: getSupportBody(primaryFallback),
    href: getSupportHref(primaryFallback),
    contentType: primaryFallback.content_type || 'content',
    reasonLabel: 'Support for today',
  };
}

export function buildRecommendationState(
  input: RecommendationInput
): RecommendationState {
  const trainSessions = input.trainSessions ?? [];
  const challengeWorkouts = input.challengeWorkouts ?? [];

  const continuation = getContinuationState({
    completedLogs: input.completedLogs,
    currentPathType: input.currentPathType,
  });

  const nextBestSession = getNextBestSession({
    completedLogs: input.completedLogs,
    trainSessions,
    challengeWorkouts,
    currentWorkoutId: input.currentWorkoutId,
    currentPathType: input.currentPathType,
  });

  const messaging = getAdaptiveMessage({
    continuation,
    nextBestSession,
  });

  const trainWorkoutIds = new Set(trainSessions.map((session) => session.id));
  const challengeWorkoutIds = new Set(
    challengeWorkouts.map((workout) => workout.id)
  );

  const completedTrainCount = new Set(
    input.completedLogs
      .map((log) => log.workout_id)
      .filter(
        (workoutId): workoutId is string =>
          Boolean(workoutId && trainWorkoutIds.has(workoutId))
      )
  ).size;

  const completedChallengeCount = new Set(
    input.completedLogs
      .map((log) => log.workout_id)
      .filter(
        (workoutId): workoutId is string =>
          Boolean(workoutId && challengeWorkoutIds.has(workoutId))
      )
  ).size;

  const nextTrainSession = trainSessions.find(
    (session) => session.id === nextBestSession.nextSession.workoutId
  );

  const supportContent = buildRecommendedSupportContent(
    input,
    nextBestSession.recommendationType,
    continuation.state,
    nextBestSession.nextSession.workoutId,
    nextTrainSession?.training_program_id ??
      nextBestSession.nextSession.trainingProgramId ??
      null
  );

  return {
    continuation,
    nextBestSession,
    messaging,
    supportContent,
    context: {
      completedTrainCount,
      totalTrainCount: trainSessions.length,
      completedChallengeCount,
      totalChallengeCount: challengeWorkouts.length,
      activePhaseKey: nextTrainSession?.phase_key ?? null,
      activePhaseLabel: nextTrainSession?.phase_label ?? null,
    },
  };
}