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

function buildSupportResult(
  candidate: SupportContentCandidate,
  reasonLabel: string
): RecommendedSupportContent {
  return {
    id: candidate.id,
    title: normalizeText(candidate.title) || 'Support content',
    body: getSupportBody(candidate),
    href: getSupportHref(candidate),
    contentType: candidate.content_type || 'content',
    reasonLabel,
  };
}

function getUniqueCandidates(candidates: SupportContentCandidate[]) {
  const seen = new Set<string>();
  return candidates.filter((candidate) => {
    if (seen.has(candidate.id)) return false;
    seen.add(candidate.id);
    return true;
  });
}

function buildRecommendedSupportContent(
  input: RecommendationInput,
  recommendationType: RecommendationState['nextBestSession']['recommendationType'],
  continuationState: RecommendationState['continuation']['state'],
  nextWorkoutId: string | null,
  nextTrainingProgramId: string | null
): RecommendedSupportContent | null {
  const candidates = getUniqueCandidates(
    (input.supportContentCandidates ?? []).filter((candidate) => {
      const href = getSupportHref(candidate);
      if (!href) return false;
      if (candidate.intel_type === 'quick_action_intro') return false;
      return true;
    })
  );

  if (!candidates.length) {
    return null;
  }

  const byWorkout = nextWorkoutId
    ? candidates.find((candidate) => candidate.workout_id === nextWorkoutId)
    : null;

  if (byWorkout) {
    return buildSupportResult(byWorkout, 'Support your next session');
  }

  const byProgram = nextTrainingProgramId
    ? candidates.find(
        (candidate) => candidate.training_program_id === nextTrainingProgramId
      )
    : null;

  if (byProgram) {
    return buildSupportResult(byProgram, 'Built for your training path');
  }

  const systemKeyPriority =
    recommendationType === 'start_challenge'
      ? ['challenge_start', 'methodology_intro', 'onboarding']
      : recommendationType === 'continue_challenge'
        ? ['challenge_continue', 'habit_loop', 'methodology']
        : recommendationType === 'resume_program'
          ? ['resume_training', 'methodology', 'habit_loop']
          : continuationState === 'paused'
            ? ['reset', 'restart', 'mindset']
            : continuationState === 'new'
              ? ['onboarding', 'methodology_intro']
              : ['methodology', 'habit_loop'];

  for (const key of systemKeyPriority) {
    const systemKeyMatch = candidates.find(
      (candidate) => candidate.system_key === key
    );
    if (systemKeyMatch) {
      return buildSupportResult(systemKeyMatch, 'Support for today');
    }
  }

  const strictPrimaryFallback = candidates.find(
    (candidate) =>
      candidate.is_primary === true &&
      (
        candidate.training_program_id === nextTrainingProgramId ||
        candidate.workout_id === nextWorkoutId ||
        candidate.system_key === 'methodology' ||
        candidate.system_key === 'habit_loop' ||
        candidate.system_key === 'post_session' ||
        candidate.system_key === 'recovery' ||
        candidate.system_key === 'reflection'
      )
  );

  if (strictPrimaryFallback) {
    return buildSupportResult(strictPrimaryFallback, 'Support for today');
  }

  return null;
}

export function buildRecommendationState(
  input: RecommendationInput
): RecommendationState {
  const continuation = getContinuationState({
    completedLogs: input.completedLogs,
    currentPathType: input.currentPathType,
  });

  const nextBestSession = getNextBestSession({
    completedLogs: input.completedLogs,
    challengeWorkouts: input.challengeWorkouts,
    currentWorkoutId: input.currentWorkoutId,
    currentPathType: input.currentPathType,
  });

  const messaging = getAdaptiveMessage({
    continuation,
    nextBestSession,
  });

  const challengeWorkoutIds = new Set(
    input.challengeWorkouts.map((workout) => workout.id)
  );

  const completedChallengeCount = new Set(
    input.completedLogs
      .map((log) => log.workout_id)
      .filter(
        (workoutId): workoutId is string =>
          Boolean(workoutId && challengeWorkoutIds.has(workoutId))
      )
  ).size;

  const nextWorkout = input.challengeWorkouts.find(
    (workout) => workout.id === nextBestSession.nextSession.workoutId
  );

  const supportContent = buildRecommendedSupportContent(
    input,
    nextBestSession.recommendationType,
    continuation.state,
    nextBestSession.nextSession.workoutId,
    nextWorkout?.training_program_id ??
      nextBestSession.nextSession.trainingProgramId ??
      null
  );

  return {
    continuation,
    nextBestSession,
    messaging,
    supportContent,
    context: {
      completedChallengeCount,
      totalChallengeCount: input.challengeWorkouts.length,
    },
  };
}