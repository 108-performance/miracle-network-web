type ExerciseLogRow = {
  exercise_name?: string | null;
  actual_reps?: number | null;
  actual_time_seconds?: number | null;
  actual_score?: number | null;
  actual_exit_velocity?: number | null;
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

export type RingProgress = {
  label: string;
  current: number;
  goal: number;
  percent: number;
};

const ANCHORED_GOAL = 300;
const DYNAMIC_GOAL = 300;
const GAME_SKILL_GOAL = 300;

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

function buildRing(label: string, current: number, goal: number): RingProgress {
  return {
    label,
    current,
    goal,
    percent: clamp(Math.round((current / goal) * 100), 0, 100),
  };
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

export function getDashboardRingState({
  weeklyExerciseLogs,
  exerciseVariants,
  movements,
}: {
  weeklyExerciseLogs: ExerciseLogRow[];
  exerciseVariants: ExerciseVariantRow[];
  movements: MovementRow[];
}) {
  const ringTotals = getWeeklyRingTotals(
    weeklyExerciseLogs,
    exerciseVariants,
    movements
  );

  return {
    anchored: buildRing('Anchored', ringTotals.anchored, ANCHORED_GOAL),
    dynamic: buildRing('Dynamic', ringTotals.dynamic, DYNAMIC_GOAL),
    gameSkill: buildRing('Game / Skill', ringTotals.gameSkill, GAME_SKILL_GOAL),
  };
}