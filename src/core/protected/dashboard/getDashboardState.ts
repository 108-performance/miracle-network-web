type CompletedLogRow = {
  completed_at: string;
  workout_id: string | null;
};

type ChallengeWorkoutRow = {
  id: string;
  title: string | null;
  day_order: number | null;
};

type ExerciseLogRow = {
  actual_reps?: number | null;
  actual_time_seconds?: number | null;
  actual_score?: number | null;
  actual_exit_velocity?: number | null;
  completed: boolean | null;
  created_at: string;
};

type DashboardStateInput = {
  completedLogs: CompletedLogRow[];
  challengeWorkouts: ChallengeWorkoutRow[];
  latestWorkoutTitle: string;
  latestScore: string | number | null;
  weeklyExerciseLogs: ExerciseLogRow[];
};

type DashboardHeroState = {
  headline: string;
  subtext: string;
  ctaLabel: string;
  ctaHref: string;
  progressCurrent: number;
  progressGoal: number;
  progressPercent: number;
  progressLabel: string;
  supportLabel: string;
};

type DashboardState = {
  daysAgo: number | null;
  streakCount: number;
  lastWorkoutLabel: string;
  streakBadgeLabel: string;
  heroState: DashboardHeroState;
  momentumTitle: string;
  momentumLine: string;
  lastSessionReflection: string;
  challengeCompletedCount: number;
  challengeTotalCount: number;
  latestWorkoutTitle: string;
  latestScoreLabel: string | number;
};

const DEFAULT_CHALLENGE_TOTAL = 8;
const WEEKLY_PROGRESS_GOAL = 1000;
const CURRENT_TRAINING_CTA_HREF = '/dashboard/compete/108-athlete-challenge';

function getStartOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function getStartOfWeek(date: Date) {
  const next = getStartOfDay(date);
  const day = next.getDay();
  const diffToMonday = day === 0 ? 6 : day - 1;
  next.setDate(next.getDate() - diffToMonday);
  return next;
}

function getDaysAgoFromNow(dateString: string | null) {
  if (!dateString) return null;

  const now = new Date();
  const target = new Date(dateString);

  const nowStart = getStartOfDay(now);
  const targetStart = getStartOfDay(target);

  const diffMs = nowStart.getTime() - targetStart.getTime();
  return Math.floor(diffMs / 86400000);
}

function calculateStreak(logs: CompletedLogRow[]) {
  if (!logs || logs.length === 0) return 0;

  const uniqueDays = new Set(
    logs.map((log) => {
      const d = new Date(log.completed_at);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    })
  );

  const sortedDays = Array.from(uniqueDays).sort((a, b) => b - a);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let streak = 0;

  for (let i = 0; i < sortedDays.length; i++) {
    const expectedDay = new Date(today);
    expectedDay.setDate(today.getDate() - i);
    expectedDay.setHours(0, 0, 0, 0);

    if (sortedDays[i] === expectedDay.getTime()) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

function getRelativeDayLabel(daysAgo: number | null) {
  if (daysAgo === null) return 'No session logged yet';
  if (daysAgo === 0) return 'Completed today';
  if (daysAgo === 1) return 'Completed yesterday';
  return `Completed ${daysAgo} days ago`;
}

function getStreakBadgeLabel(streakCount: number, daysAgo: number | null) {
  if (streakCount > 1) return `🔥 ${streakCount} day streak`;
  if (streakCount === 1 && daysAgo === 0) return '🔥 1 day streak';
  if (daysAgo === 1) return 'Train today';
  return 'Start your streak';
}

function getMomentumTitle(streakCount: number) {
  if (streakCount >= 3) return 'You’re building real momentum.';
  if (streakCount === 2) return 'You’re building momentum.';
  return 'Build momentum today.';
}

function getMomentumLine(streakCount: number) {
  if (streakCount >= 3) return 'Consistency is starting to stack.';
  if (streakCount === 2) return 'One more day makes this feel real.';
  return 'A quick session today gets you moving again.';
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getExerciseLogUnits(log: ExerciseLogRow) {
  const reps = Math.max(0, log.actual_reps ?? 0);
  const time = Math.max(0, log.actual_time_seconds ?? 0);
  const score = Math.max(0, log.actual_score ?? 0);
  const exitVelocity = Math.max(0, Math.round(log.actual_exit_velocity ?? 0));

  return reps + time + score + exitVelocity;
}

function hasLoggedWork(log: ExerciseLogRow) {
  return getExerciseLogUnits(log) > 0;
}

function getWeeklyProgressTotal(logs: ExerciseLogRow[]) {
  const weekStart = getStartOfWeek(new Date());

  return logs.reduce((total, log) => {
    const logDate = getStartOfDay(new Date(log.created_at));
    if (logDate.getTime() < weekStart.getTime()) return total;
    if (!hasLoggedWork(log)) return total;

    return total + getExerciseLogUnits(log);
  }, 0);
}

function getYesterdayProgressTotal(logs: ExerciseLogRow[]) {
  const yesterday = getStartOfDay(new Date());
  yesterday.setDate(yesterday.getDate() - 1);

  return logs.reduce((total, log) => {
    const logDate = getStartOfDay(new Date(log.created_at));
    if (logDate.getTime() !== yesterday.getTime()) return total;
    if (!hasLoggedWork(log)) return total;

    return total + getExerciseLogUnits(log);
  }, 0);
}

function getHeroStateFromWeeklyProgress({
  weeklyProgress,
  yesterdayProgress,
  daysAgo,
}: {
  weeklyProgress: number;
  yesterdayProgress: number;
  daysAgo: number | null;
}): DashboardHeroState {
  const progressPercent = clamp(
    Math.round((weeklyProgress / WEEKLY_PROGRESS_GOAL) * 100),
    0,
    100
  );

  const dayOfWeek = new Date().getDay();
  const normalizedDay = dayOfWeek === 0 ? 7 : dayOfWeek;
  const expectedByToday = Math.round((WEEKLY_PROGRESS_GOAL / 7) * normalizedDay);

  if (weeklyProgress <= 0) {
    return {
      headline: 'Start your week strong.',
      subtext: 'Your weekly training goal starts with the first work you log.',
      ctaLabel: 'Continue Training',
      ctaHref: CURRENT_TRAINING_CTA_HREF,
      progressCurrent: 0,
      progressGoal: WEEKLY_PROGRESS_GOAL,
      progressPercent: 0,
      progressLabel: '0 / 1000 weekly units',
      supportLabel: 'No training units logged yet',
    };
  }

  if (weeklyProgress >= WEEKLY_PROGRESS_GOAL) {
    return {
      headline: 'You hit your weekly goal.',
      subtext: 'Great work. Keep stacking quality sessions and stay sharp.',
      ctaLabel: 'Continue Training',
      ctaHref: CURRENT_TRAINING_CTA_HREF,
      progressCurrent: weeklyProgress,
      progressGoal: WEEKLY_PROGRESS_GOAL,
      progressPercent,
      progressLabel: `${weeklyProgress} / ${WEEKLY_PROGRESS_GOAL} weekly units`,
      supportLabel:
        yesterdayProgress > 0
          ? `+${yesterdayProgress} units yesterday`
          : 'Weekly goal complete',
    };
  }

  if (weeklyProgress >= expectedByToday) {
    return {
      headline: 'You’re on track this week.',
      subtext: 'Stay consistent and keep building progress toward your goal.',
      ctaLabel: 'Continue Training',
      ctaHref: CURRENT_TRAINING_CTA_HREF,
      progressCurrent: weeklyProgress,
      progressGoal: WEEKLY_PROGRESS_GOAL,
      progressPercent,
      progressLabel: `${weeklyProgress} / ${WEEKLY_PROGRESS_GOAL} weekly units`,
      supportLabel:
        yesterdayProgress > 0
          ? `+${yesterdayProgress} units yesterday`
          : daysAgo === 0
            ? 'You trained today'
            : 'Keep momentum moving today',
    };
  }

  if (daysAgo === null || daysAgo >= 3) {
    return {
      headline: 'Let’s get back on track.',
      subtext: 'A quick session today starts rebuilding your weekly progress.',
      ctaLabel: 'Continue Training',
      ctaHref: CURRENT_TRAINING_CTA_HREF,
      progressCurrent: weeklyProgress,
      progressGoal: WEEKLY_PROGRESS_GOAL,
      progressPercent,
      progressLabel: `${weeklyProgress} / ${WEEKLY_PROGRESS_GOAL} weekly units`,
      supportLabel:
        yesterdayProgress > 0
          ? `+${yesterdayProgress} units yesterday`
          : 'Time to log work today',
    };
  }

  return {
    headline: 'You’re slightly behind pace.',
    subtext: 'A strong session today will close the gap and keep you moving.',
    ctaLabel: 'Continue Training',
    ctaHref: CURRENT_TRAINING_CTA_HREF,
    progressCurrent: weeklyProgress,
    progressGoal: WEEKLY_PROGRESS_GOAL,
    progressPercent,
    progressLabel: `${weeklyProgress} / ${WEEKLY_PROGRESS_GOAL} weekly units`,
    supportLabel:
      yesterdayProgress > 0
        ? `+${yesterdayProgress} units yesterday`
        : 'A session today gets you back in rhythm',
  };
}

export function getDashboardState({
  completedLogs,
  challengeWorkouts,
  latestWorkoutTitle,
  latestScore,
  weeklyExerciseLogs,
}: DashboardStateInput): DashboardState {
  const streakCount = calculateStreak(completedLogs);

  const latestWorkoutLog =
    completedLogs.length > 0
      ? {
          id: 'latest',
          completed_at: completedLogs[0].completed_at,
          workout_id: completedLogs[0].workout_id,
        }
      : null;

  const challengeWorkoutIds = new Set(challengeWorkouts.map((row) => row.id));

  const completedChallengeWorkoutIds = new Set(
    completedLogs
      .map((log) => log.workout_id)
      .filter((id): id is string => Boolean(id && challengeWorkoutIds.has(id)))
  );

  const challengeCompletedCount = completedChallengeWorkoutIds.size;
  const challengeTotalCount =
    challengeWorkouts.length > 0
      ? challengeWorkouts.length
      : DEFAULT_CHALLENGE_TOTAL;

  const daysAgo = getDaysAgoFromNow(latestWorkoutLog?.completed_at ?? null);
  const lastWorkoutLabel = getRelativeDayLabel(daysAgo);
  const streakBadgeLabel = getStreakBadgeLabel(streakCount, daysAgo);

  const weeklyProgress = getWeeklyProgressTotal(weeklyExerciseLogs);
  const yesterdayProgress = getYesterdayProgressTotal(weeklyExerciseLogs);

  const heroState = getHeroStateFromWeeklyProgress({
    weeklyProgress,
    yesterdayProgress,
    daysAgo,
  });

  const momentumTitle = getMomentumTitle(streakCount);
  const momentumLine =
    weeklyProgress > 0
      ? `${weeklyProgress} weekly units logged this week.`
      : getMomentumLine(streakCount);

  const lastSessionReflection =
    daysAgo === 0
      ? 'You completed this session today.'
      : daysAgo === 1
        ? 'You trained yesterday. Stay consistent.'
        : daysAgo === null
          ? 'Start your first session to begin tracking progress.'
          : 'Pick this back up today.';

  return {
    daysAgo,
    streakCount,
    lastWorkoutLabel,
    streakBadgeLabel,
    heroState,
    momentumTitle,
    momentumLine,
    lastSessionReflection,
    challengeCompletedCount,
    challengeTotalCount,
    latestWorkoutTitle,
    latestScoreLabel: latestScore ?? 'No score yet',
  };
}