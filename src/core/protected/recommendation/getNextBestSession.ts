import type {
  ChallengeWorkoutRow,
  CompletedLogRow,
  ContinuationPathType,
  GuidedTrainSessionRow,
  NextBestSessionResult,
} from './types';

const CHALLENGE_HUB_HREF = '/dashboard/compete/108-athlete-challenge';
const DASHBOARD_HREF = '/dashboard';
const TRAIN_HUB_HREF = '/dashboard/training';

function getRunHref(workoutId: string) {
  return `/dashboard/training/${workoutId}/run`;
}

function sortTrainSessions(sessions?: GuidedTrainSessionRow[] | null) {
  return [...(sessions ?? [])].sort((a, b) => a.session_order - b.session_order);
}

function sortChallengeWorkouts(workouts?: ChallengeWorkoutRow[] | null) {
  return [...(workouts ?? [])].sort(
    (a, b) =>
      (a.day_order ?? Number.MAX_SAFE_INTEGER) -
      (b.day_order ?? Number.MAX_SAFE_INTEGER)
  );
}

export function getNextBestSession({
  completedLogs,
  trainSessions,
  challengeWorkouts = [],
  currentWorkoutId,
  currentPathType = 'unknown',
}: {
  completedLogs: CompletedLogRow[];
  trainSessions?: GuidedTrainSessionRow[] | null;
  challengeWorkouts?: ChallengeWorkoutRow[] | null;
  currentWorkoutId?: string | null;
  currentPathType?: ContinuationPathType;
}): NextBestSessionResult {
  const sortedTrainSessions = sortTrainSessions(trainSessions);
  const sortedChallengeWorkouts = sortChallengeWorkouts(challengeWorkouts);

  const completedWorkoutIds = new Set(
    (completedLogs ?? [])
      .map((log) => log.workout_id)
      .filter((workoutId): workoutId is string => Boolean(workoutId))
  );

  const latestWorkoutId =
    completedLogs && completedLogs.length > 0 ? completedLogs[0].workout_id : null;

  const trainWorkoutIds = new Set(sortedTrainSessions.map((session) => session.id));
  const challengeWorkoutIds = new Set(
    sortedChallengeWorkouts.map((workout) => workout.id)
  );

  const nextIncompleteTrainSession =
    sortedTrainSessions.find((session) => !completedWorkoutIds.has(session.id)) ??
    null;

  const isCurrentWorkoutTrain =
    (currentWorkoutId ? trainWorkoutIds.has(currentWorkoutId) : false) ||
    currentPathType === 'train';

  if (latestWorkoutId && trainWorkoutIds.has(latestWorkoutId) && isCurrentWorkoutTrain) {
    const matchingTrainSession =
      sortedTrainSessions.find((session) => session.id === latestWorkoutId) ?? null;

    if (matchingTrainSession && !completedWorkoutIds.has(matchingTrainSession.id)) {
      return {
        recommendationType: 'resume_train_session',
        primaryCta: {
          label: 'Resume Session',
          href: getRunHref(matchingTrainSession.id),
        },
        secondaryCta: {
          label: 'View Path',
          href: TRAIN_HUB_HREF,
        },
        nextSession: {
          workoutId: matchingTrainSession.id,
          title: matchingTrainSession.title ?? 'Resume your session',
          href: getRunHref(matchingTrainSession.id),
          pathType: 'train',
          dayOrder: null,
          sessionOrder: matchingTrainSession.session_order,
          phaseKey: matchingTrainSession.phase_key,
          phaseLabel: matchingTrainSession.phase_label,
          trainingProgramId: matchingTrainSession.training_program_id ?? null,
          estimatedMinutes: matchingTrainSession.estimated_minutes ?? null,
        },
      };
    }
  }

  if (nextIncompleteTrainSession) {
    const completedTrainCount = sortedTrainSessions.filter((session) =>
      completedWorkoutIds.has(session.id)
    ).length;

    return {
      recommendationType:
        completedTrainCount > 0 || isCurrentWorkoutTrain
          ? 'continue_train_path'
          : 'start_train_path',
      primaryCta: {
        label:
          completedTrainCount > 0 || isCurrentWorkoutTrain
            ? 'Continue Session'
            : 'Start Session',
        href: getRunHref(nextIncompleteTrainSession.id),
      },
      secondaryCta: {
        label: 'View Path',
        href: TRAIN_HUB_HREF,
      },
      nextSession: {
        workoutId: nextIncompleteTrainSession.id,
        title: nextIncompleteTrainSession.title ?? 'Next Train Session',
        href: getRunHref(nextIncompleteTrainSession.id),
        pathType: 'train',
        dayOrder: null,
        sessionOrder: nextIncompleteTrainSession.session_order,
        phaseKey: nextIncompleteTrainSession.phase_key,
        phaseLabel: nextIncompleteTrainSession.phase_label,
        trainingProgramId: nextIncompleteTrainSession.training_program_id ?? null,
        estimatedMinutes: nextIncompleteTrainSession.estimated_minutes ?? null,
      },
    };
  }

  const nextIncompleteChallengeWorkout =
    sortedChallengeWorkouts.find((workout) => !completedWorkoutIds.has(workout.id)) ??
    null;

  if (nextIncompleteChallengeWorkout) {
    return {
      recommendationType: 'fallback_to_challenge',
      primaryCta: {
        label: 'View Challenge',
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
        href: getRunHref(nextIncompleteChallengeWorkout.id),
        pathType: 'challenge',
        dayOrder: nextIncompleteChallengeWorkout.day_order ?? null,
        sessionOrder: null,
        phaseKey: null,
        phaseLabel: null,
        trainingProgramId: nextIncompleteChallengeWorkout.training_program_id ?? null,
        estimatedMinutes: null,
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
      label: 'View Train',
      href: TRAIN_HUB_HREF,
    },
    nextSession: {
      workoutId: null,
      title: 'No session available',
      href: DASHBOARD_HREF,
      pathType: 'none',
      dayOrder: null,
      sessionOrder: null,
      phaseKey: null,
      phaseLabel: null,
      trainingProgramId: null,
      estimatedMinutes: null,
    },
  };
}