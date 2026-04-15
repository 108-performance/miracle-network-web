import type {
  ChallengeWorkoutRow,
  CompletedLogRow,
  ContinuationPathType,
  NextBestSessionResult,
} from './types';

const CHALLENGE_HUB_HREF = '/dashboard/compete/108-athlete-challenge';
const DASHBOARD_HREF = '/dashboard';
const WORKOUT_BROWSE_HREF = '/dashboard/workout';

function getChallengeRunHref(workoutId: string) {
  return `/dashboard/training/${workoutId}/run`;
}

function sortChallengeWorkouts(workouts: ChallengeWorkoutRow[]) {
  return [...workouts].sort(
    (a, b) =>
      (a.day_order ?? Number.MAX_SAFE_INTEGER) -
      (b.day_order ?? Number.MAX_SAFE_INTEGER)
  );
}

export function getNextBestSession({
  completedLogs,
  challengeWorkouts,
  currentWorkoutId,
  currentPathType = 'unknown',
}: {
  completedLogs: CompletedLogRow[];
  challengeWorkouts: ChallengeWorkoutRow[];
  currentWorkoutId?: string | null;
  currentPathType?: ContinuationPathType;
}): NextBestSessionResult {
  if (!challengeWorkouts.length) {
    return {
      recommendationType: 'return_to_dashboard',
      primaryCta: {
        label: 'Back to Dashboard',
        href: DASHBOARD_HREF,
      },
      secondaryCta: {
        label: 'Browse Workouts',
        href: WORKOUT_BROWSE_HREF,
      },
      nextSession: {
        workoutId: null,
        title: 'Choose your next workout',
        href: DASHBOARD_HREF,
        pathType: 'none',
        dayOrder: null,
      },
    };
  }

  const sortedChallengeWorkouts = sortChallengeWorkouts(challengeWorkouts);
  const challengeWorkoutIds = new Set(
    sortedChallengeWorkouts.map((workout) => workout.id)
  );

  const completedChallengeWorkoutIds = new Set(
    completedLogs
      .map((log) => log.workout_id)
      .filter(
        (workoutId): workoutId is string =>
          Boolean(workoutId && challengeWorkoutIds.has(workoutId))
      )
  );

  const nextIncompleteChallengeWorkout =
    sortedChallengeWorkouts.find(
      (workout) => !completedChallengeWorkoutIds.has(workout.id)
    ) ?? null;

  const latestWorkoutId =
    completedLogs.length > 0 ? completedLogs[0].workout_id : null;

  if (latestWorkoutId && !challengeWorkoutIds.has(latestWorkoutId)) {
    return {
      recommendationType: 'resume_program',
      primaryCta: {
        label: 'Resume Training',
        href: `/dashboard/training/${latestWorkoutId}/run`,
      },
      secondaryCta: {
        label: 'Back to Dashboard',
        href: DASHBOARD_HREF,
      },
      nextSession: {
        workoutId: latestWorkoutId,
        title: 'Resume your last session',
        href: `/dashboard/training/${latestWorkoutId}/run`,
        pathType: 'program',
        dayOrder: null,
      },
    };
  }

  const isCurrentWorkoutChallenge =
    (currentWorkoutId ? challengeWorkoutIds.has(currentWorkoutId) : false) ||
    currentPathType === 'challenge';

  if (nextIncompleteChallengeWorkout) {
    return {
      recommendationType:
        completedChallengeWorkoutIds.size > 0 || isCurrentWorkoutChallenge
          ? 'continue_challenge'
          : 'start_challenge',
      primaryCta: {
        label:
          completedChallengeWorkoutIds.size > 0 || isCurrentWorkoutChallenge
            ? 'Continue Challenge'
            : 'Start Challenge',
        href: CHALLENGE_HUB_HREF,
      },
      secondaryCta: {
        label: 'Back to Dashboard',
        href: DASHBOARD_HREF,
      },
      nextSession: {
        workoutId: nextIncompleteChallengeWorkout.id,
        title:
          nextIncompleteChallengeWorkout.title ??
          (nextIncompleteChallengeWorkout.day_order != null
            ? `Challenge Day ${nextIncompleteChallengeWorkout.day_order}`
            : 'Next Challenge Session'),
        href: getChallengeRunHref(nextIncompleteChallengeWorkout.id),
        pathType: 'challenge',
        dayOrder: nextIncompleteChallengeWorkout.day_order ?? null,
      },
    };
  }

  return {
    recommendationType: 'return_to_dashboard',
    primaryCta: {
      label: 'Back to Dashboard',
      href: DASHBOARD_HREF,
    },
    secondaryCta: {
      label: 'Browse Workouts',
      href: WORKOUT_BROWSE_HREF,
    },
    nextSession: {
      workoutId: null,
      title: 'Choose your next workout',
      href: DASHBOARD_HREF,
      pathType: 'none',
      dayOrder: null,
    },
  };
}