type MetricSnapshot = {
  reps?: number | null;
  timeSeconds?: number | null;
  score?: number | null;
  exitVelocity?: number | null;
};

type ExerciseLogState = {
  reps: string;
  timeSeconds: string;
  score: string;
  exitVelocity: string;
};

type SessionExercise = {
  exerciseId: string;
  metricType?: string | null;
  lastResult?: MetricSnapshot | null;
  bestResult?: MetricSnapshot | null;
};

type CompletionSource = 'challenge' | 'workout';

type CompletionAnchor = {
  currentValue: number | null;
  lastValue: number | null;
  bestValue: number | null;
  changeValue: number | null;
};

type NextStepMeta = {
  nextPath: string;
  nextLabel: string;
  nextSubtext: string;
  primaryLabel: string;
};

type SessionCompletionStateInput = {
  title: string;
  exercises: SessionExercise[];
  logs: Record<string, ExerciseLogState>;
  workoutHistory: string[];
};

type SessionCompletionState = {
  source: CompletionSource;
  streak: number;
  weekSessions: number;
  nextStep: NextStepMeta;
  anchor: CompletionAnchor | null;
  redirectUrl: string;
};

function toNumberOrNull(value: string) {
  if (!value || value.trim() === '') return null;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function getMetricValueFromLog(
  log: ExerciseLogState,
  metricType?: string | null
) {
  if (metricType === 'time') return toNumberOrNull(log.timeSeconds);
  if (metricType === 'score') return toNumberOrNull(log.score);
  if (metricType === 'exit_velocity') return toNumberOrNull(log.exitVelocity);

  if (metricType === 'mixed') {
    return (
      toNumberOrNull(log.score) ??
      toNumberOrNull(log.exitVelocity) ??
      toNumberOrNull(log.reps) ??
      toNumberOrNull(log.timeSeconds)
    );
  }

  return toNumberOrNull(log.reps);
}

function getMetricValueFromSnapshot(
  snapshot: MetricSnapshot | null | undefined,
  metricType?: string | null
) {
  if (!snapshot) return null;
  if (metricType === 'time') return snapshot.timeSeconds ?? null;
  if (metricType === 'score') return snapshot.score ?? null;
  if (metricType === 'exit_velocity') return snapshot.exitVelocity ?? null;

  if (metricType === 'mixed') {
    return (
      snapshot.score ??
      snapshot.exitVelocity ??
      snapshot.reps ??
      snapshot.timeSeconds ??
      null
    );
  }

  return snapshot.reps ?? null;
}

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function getStartOfWeek(date: Date) {
  const start = new Date(date);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;

  start.setDate(start.getDate() + diff);
  start.setHours(0, 0, 0, 0);

  return start;
}

function getStreakData(workoutHistory: string[]) {
  const today = new Date();
  const todayKey = formatDateKey(today);

  const merged = Array.from(new Set([...(workoutHistory ?? []), todayKey])).sort();

  const uniqueDaysDescending = [...merged].sort((a, b) => b.localeCompare(a));

  let streak = 0;
  const cursor = new Date(today);
  cursor.setHours(0, 0, 0, 0);

  for (const dayKey of uniqueDaysDescending) {
    const expectedKey = formatDateKey(cursor);

    if (dayKey === expectedKey) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else if (dayKey > expectedKey) {
      continue;
    } else {
      break;
    }
  }

  const startOfWeek = getStartOfWeek(today);

  const weekSessions = merged.filter((dayKey) => {
    const date = new Date(`${dayKey}T00:00:00`);
    return date >= startOfWeek;
  }).length;

  return {
    mergedHistory: merged,
    streak,
    weekSessions,
  };
}

function getNextStepMeta(source: CompletionSource, titleText: string): NextStepMeta {
  if (source === 'challenge') {
    const dayMatch = titleText.match(/day\s*(\d+)/i);
    const currentDay = dayMatch ? Number(dayMatch[1]) : null;
    const nextDay = currentDay != null ? currentDay + 1 : null;

    return {
      nextPath: '/dashboard/compete/108-athlete-challenge',
      nextLabel: nextDay ? `Next up: Day ${nextDay}` : 'Continue Challenge',
      nextSubtext: nextDay
        ? `Keep the streak alive and move into Day ${nextDay}.`
        : 'Your next challenge session is ready.',
      primaryLabel: 'Continue Challenge',
    };
  }

  return {
    nextPath: '/dashboard',
    nextLabel: 'Next up: Return to Dashboard',
    nextSubtext: 'Choose your next workout and keep momentum going.',
    primaryLabel: 'Back to Dashboard',
  };
}

function getCompletionAnchor(
  exercises: SessionExercise[],
  logs: Record<string, ExerciseLogState>
): CompletionAnchor | null {
  const candidates = exercises
    .map((exercise) => {
      const metricType = exercise.metricType ?? 'reps';
      const values = logs[exercise.exerciseId] ?? {
        reps: '',
        timeSeconds: '',
        score: '',
        exitVelocity: '',
      };

      const currentValue = getMetricValueFromLog(values, metricType);
      const lastValue = getMetricValueFromSnapshot(
        exercise.lastResult,
        metricType
      );
      const bestValue = getMetricValueFromSnapshot(
        exercise.bestResult,
        metricType
      );

      const changeValue =
        currentValue != null && lastValue != null ? currentValue - lastValue : null;

      const hasData =
        currentValue != null || lastValue != null || bestValue != null;

      const improvedFromLast =
        changeValue != null && changeValue > 0 ? 1 : 0;

      const matchedBest =
        currentValue != null &&
        bestValue != null &&
        currentValue === bestValue
          ? 1
          : 0;

      const hasCurrentValue = currentValue != null ? 1 : 0;

      return {
        currentValue,
        lastValue,
        bestValue,
        changeValue,
        hasData,
        improvedFromLast,
        matchedBest,
        hasCurrentValue,
      };
    })
    .filter((candidate) => candidate.hasData)
    .sort((a, b) => {
      if (b.improvedFromLast !== a.improvedFromLast) {
        return b.improvedFromLast - a.improvedFromLast;
      }

      if (b.matchedBest !== a.matchedBest) {
        return b.matchedBest - a.matchedBest;
      }

      if (b.hasCurrentValue !== a.hasCurrentValue) {
        return b.hasCurrentValue - a.hasCurrentValue;
      }

      return 0;
    });

  if (!candidates[0]) return null;

  return {
    currentValue: candidates[0].currentValue,
    lastValue: candidates[0].lastValue,
    bestValue: candidates[0].bestValue,
    changeValue: candidates[0].changeValue,
  };
}

export function getSessionCompletionState({
  title,
  exercises,
  logs,
  workoutHistory,
}: SessionCompletionStateInput): SessionCompletionState {
  const normalizedTitle = title.toLowerCase();
  const source: CompletionSource = normalizedTitle.includes('challenge')
    ? 'challenge'
    : 'workout';

  const { mergedHistory, streak, weekSessions } = getStreakData(workoutHistory);
  const nextStep = getNextStepMeta(source, title);
  const anchor = getCompletionAnchor(exercises, logs);

  const params = new URLSearchParams({
    title: title || 'Workout Session',
    source,
    today: anchor?.currentValue != null ? String(anchor.currentValue) : '',
    best: anchor?.bestValue != null ? String(anchor.bestValue) : '',
    last: anchor?.lastValue != null ? String(anchor.lastValue) : '',
    change: anchor?.changeValue != null ? String(anchor.changeValue) : '',
    streak: String(streak),
    week: String(weekSessions),
    next: nextStep.nextPath,
    nextLabel: nextStep.nextLabel,
    nextSubtext: nextStep.nextSubtext,
    primaryLabel: nextStep.primaryLabel,
  });

  return {
    source,
    streak,
    weekSessions,
    nextStep,
    anchor,
    redirectUrl: `/dashboard/session-complete?${params.toString()}`,
  };
}

export function getWorkoutHistoryFromStorage(storageKey: string) {
  try {
    if (typeof window === 'undefined') return [];

    const raw = window.localStorage.getItem(storageKey);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function persistWorkoutHistoryToStorage(
  storageKey: string,
  workoutHistory: string[]
) {
  try {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(storageKey, JSON.stringify(workoutHistory));
  } catch {
    // no-op
  }
}