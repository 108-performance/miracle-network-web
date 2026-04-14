import { getAdaptiveMessage } from './getAdaptiveMessage';
import { getContinuationState } from './getContinuationState';
import { getNextBestSession } from './getNextBestSession';
import type { RecommendationInput, RecommendationState } from './types';

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

  const challengeWorkoutIds = new Set(input.challengeWorkouts.map((workout) => workout.id));

  const completedChallengeCount = new Set(
    input.completedLogs
      .map((log) => log.workout_id)
      .filter((workoutId): workoutId is string => Boolean(workoutId && challengeWorkoutIds.has(workoutId)))
  ).size;

  return {
    continuation,
    nextBestSession,
    messaging,
    context: {
      completedChallengeCount,
      totalChallengeCount: input.challengeWorkouts.length,
    },
  };
}