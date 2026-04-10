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
  exercise_id?: string | null;
  exercise_name?: string | null;
  athlete_id?: string;
  actual_reps?: number | null;
  actual_time_seconds?: number | null;
  actual_score?: number | null;
  actual_exit_velocity?: number | null;
  completed: boolean | null;
  created_at: string;
};

type ExerciseVariantRow = {
  id: string;
  movement_id: string | null;
  name: string | null;
};

type MovementRow = {
  id: string;
  name: string | null;
};

type RingProgress = {
  label: string;
  current: number;
  goal: number;
  percent: number;
};

type DashboardStateInput = {
  completedLogs: CompletedLogRow[];
  challengeWorkouts: ChallengeWorkoutRow[];
  latestWorkoutTitle: string;
  latestScore: string | number | null;
  weeklyExerciseLogs: ExerciseLogRow[];
  exerciseVariants: ExerciseVariantRow[];
  movements: MovementRow[];
};

type DashboardHeroState = {
  headline: string;
  subtext: string;
  ctaLabel: string;
  ctaHref: string;
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
  rings: {
    anchored: RingProgress;
    dynamic: RingProgress;
    gameSkill: RingProgress;
  };
};

const DEFAULT_CHALLENGE_TOTAL = 8;
const CURRENT_TRAINING_CTA_HREF = '/dashboard/compete/108-athlete-challenge';

const ANCHORED_GOAL = 300;
const DYNAMIC_GOAL = 300;
const GAME_SKILL_GOAL = 300;

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

function normalizeName(value: string | null | undefined) {
  return (value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
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

function buildVariantMovementLookup(
  exerciseVariants: ExerciseVariantRow[],
  movements: MovementRow[]
) {
  const movementById = new Map<string, string>();

  for (const movement of movements) {
    if (!movement.id) continue;
    movementById.set(movement.id, normalizeName(movement.name));
  }

  const movementByVariantName = new Map<string, string>();

  for (const variant of exerciseVariants) {
    const variantName = normalizeName(variant.name);
    const movementName =
      variant.movement_id ? movementById.get(variant.movement_id) ?? '' : '';

    if (!variantName || !movementName) continue;
    movementByVariantName.set(variantName, movementName);
  }

  return movementByVariantName;
}

function classifyBucketFromSchema(
  log: ExerciseLogRow,
  movementByVariantName: Map<string, string>
): 'anchored' | 'dynamic' | 'gameSkill' {
  const exerciseName = normalizeName(log.exercise_name);
  const movementName = movementByVariantName.get(exerciseName) ?? '';

  if (movementName.includes('anchored')) return 'anchored';
  if (movementName.includes('dynamic')) return 'dynamic';
  if (movementName.includes('game specific')) return 'gameSkill';

  return 'dynamic';
}

function getWeeklyRingTotals(
  logs: ExerciseLogRow[],
  exerciseVariants: ExerciseVariantRow[],
  movements: MovementRow[]
) {
  const weekStart = getStartOfWeek(new Date());
  const movementByVariantName = buildVariantMovementLookup(exerciseVariants, movements);

  let anchored = 0;
  let dynamic = 0;
  let gameSkill = 0;

  for (const log of logs) {
    const logDate = getStartOfDay(new Date(log.created_at));
    if (logDate.getTime() < weekStart.getTime()) continue;
    if (!hasLoggedWork(log)) continue;

    const units = getExerciseLogUnits(log);
    const bucket = classifyBucketFromSchema(log, movementByVariantName);

    if (bucket === 'anchored') anchored += units;
    if (bucket === 'dynamic') dynamic += units;
    if (bucket === 'gameSkill') gameSkill += units;
  }

  return { anchored, dynamic, gameSkill };
}

function getYesterdayTotals(logs: ExerciseLogRow[]) {
  const yesterday = getStartOfDay(new Date());
  yesterday.setDate(yesterday.getDate() - 1);

  let total = 0;

  for (const log of logs) {
    const logDate = getStartOfDay(new Date(log.created_at));
    if (logDate.getTime() !== yesterday.getTime()) continue;
    if (!hasLoggedWork(log)) continue;

    total += getExerciseLogUnits(log);
  }

  return total;
}

function buildRing(label: string, current: number, goal: number): RingProgress {
  return {
    label,
    current,
    goal,
    percent: clamp(Math.round((current / goal) * 100), 0, 100),
  };
}

function getHeroState({
  anchored,
  dynamic,
  gameSkill,
  yesterdayUnits,
  daysAgo,
}: {
  anchored: RingProgress;
  dynamic: RingProgress;
  gameSkill: RingProgress;
  yesterdayUnits: number;
  daysAgo: number | null;
}): DashboardHeroState {
  const totalCurrent = anchored.current + dynamic.current + gameSkill.current;
  const totalGoal = anchored.goal + dynamic.goal + gameSkill.goal;
  const percent = clamp(Math.round((totalCurrent / totalGoal) * 100), 0, 100);

  const dayOfWeek = new Date().getDay();
  const normalizedDay = dayOfWeek === 0 ? 7 : dayOfWeek;
  const expectedByToday = Math.round((totalGoal / 7) * normalizedDay);

  if (totalCurrent <= 0) {
    return {
      headline: 'Start closing your rings.',
      subtext: 'Build anchored, dynamic, and game skill work this week.',
      ctaLabel: 'Continue Training',
      ctaHref: CURRENT_TRAINING_CTA_HREF,
      progressLabel: `0 / ${totalGoal} total weekly units`,
      supportLabel: 'No training units logged yet',
    };
  }

  if (percent >= 100) {
    return {
      headline: 'You closed your rings.',
      subtext: 'Great week. Keep stacking quality work across all three buckets.',
      ctaLabel: 'Continue Training',
      ctaHref: CURRENT_TRAINING_CTA_HREF,
      progressLabel: `${totalCurrent} / ${totalGoal} total weekly units`,
      supportLabel:
        yesterdayUnits > 0
          ? `+${yesterdayUnits} units yesterday`
          : 'Weekly rings complete',
    };
  }

  if (totalCurrent >= expectedByToday) {
    return {
      headline: 'You’re on track this week.',
      subtext: 'Keep building all three buckets and close your rings.',
      ctaLabel: 'Continue Training',
      ctaHref: CURRENT_TRAINING_CTA_HREF,
      progressLabel: `${totalCurrent} / ${totalGoal} total weekly units`,
      supportLabel:
        yesterdayUnits > 0
          ? `+${yesterdayUnits} units yesterday`
          : daysAgo === 0
            ? 'You trained today'
            : 'Keep momentum moving today',
    };
  }

  if (daysAgo === null || daysAgo >= 3) {
    return {
      headline: 'Let’s get back on track.',
      subtext: 'A quick session today starts closing your rings again.',
      ctaLabel: 'Continue Training',
      ctaHref: CURRENT_TRAINING_CTA_HREF,
      progressLabel: `${totalCurrent} / ${totalGoal} total weekly units`,
      supportLabel:
        yesterdayUnits > 0
          ? `+${yesterdayUnits} units yesterday`
          : 'Time to log work today',
    };
  }

  return {
    headline: 'You’re slightly behind pace.',
    subtext: 'A strong session today will help close your rings.',
    ctaLabel: 'Continue Training',
    ctaHref: CURRENT_TRAINING_CTA_HREF,
    progressLabel: `${totalCurrent} / ${totalGoal} total weekly units`,
    supportLabel:
      yesterdayUnits > 0
        ? `+${yesterdayUnits} units yesterday`
        : 'A session today gets you back in rhythm',
  };
}

export function getDashboardState({
  completedLogs,
  challengeWorkouts,
  latestWorkoutTitle,
  latestScore,
  weeklyExerciseLogs,
  exerciseVariants,
  movements,
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

  const ringTotals = getWeeklyRingTotals(
    weeklyExerciseLogs,
    exerciseVariants,
    movements
  );
  const yesterdayUnits = getYesterdayTotals(weeklyExerciseLogs);

  const rings = {
    anchored: buildRing('Anchored', ringTotals.anchored, ANCHORED_GOAL),
    dynamic: buildRing('Dynamic', ringTotals.dynamic, DYNAMIC_GOAL),
    gameSkill: buildRing('Game / Skill', ringTotals.gameSkill, GAME_SKILL_GOAL),
  };

  const heroState = getHeroState({
    anchored: rings.anchored,
    dynamic: rings.dynamic,
    gameSkill: rings.gameSkill,
    yesterdayUnits,
    daysAgo,
  });

  const totalCurrent =
    rings.anchored.current + rings.dynamic.current + rings.gameSkill.current;

  const momentumTitle = getMomentumTitle(streakCount);
  const momentumLine =
    totalCurrent > 0
      ? `${totalCurrent} total weekly units logged this week.`
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
    rings,
  };
}