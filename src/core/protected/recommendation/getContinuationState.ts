import type {
  CompletedLogRow,
  ContinuationPathType,
  ContinuationStateResult,
} from './types';

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

function getDaysSinceLastSession(logs: CompletedLogRow[]) {
  if (!logs.length) return null;

  const latest = logs
    .map((log) => new Date(log.completed_at))
    .sort((a, b) => b.getTime() - a.getTime())[0];

  const today = getStartOfDay(new Date());
  const latestDay = getStartOfDay(latest);

  return Math.floor((today.getTime() - latestDay.getTime()) / 86400000);
}

function calculateStreak(logs: CompletedLogRow[]) {
  if (!logs.length) return 0;

  const uniqueDays = Array.from(
    new Set(
      logs.map((log) => {
        const d = getStartOfDay(new Date(log.completed_at));
        return d.getTime();
      })
    )
  ).sort((a, b) => b - a);

  const today = getStartOfDay(new Date());
  let streak = 0;

  for (let i = 0; i < uniqueDays.length; i += 1) {
    const expected = new Date(today);
    expected.setDate(today.getDate() - i);
    expected.setHours(0, 0, 0, 0);

    if (uniqueDays[i] === expected.getTime()) {
      streak += 1;
    } else {
      break;
    }
  }

  return streak;
}

function calculateSessionsThisWeek(logs: CompletedLogRow[]) {
  if (!logs.length) return 0;

  const weekStart = getStartOfWeek(new Date());

  const uniqueDays = new Set(
    logs
      .map((log) => getStartOfDay(new Date(log.completed_at)))
      .filter((date) => date.getTime() >= weekStart.getTime())
      .map((date) => date.getTime())
  );

  return uniqueDays.size;
}

export function getContinuationState({
  completedLogs,
  currentPathType = 'unknown',
}: {
  completedLogs: CompletedLogRow[];
  currentPathType?: ContinuationPathType;
}): ContinuationStateResult {
  const daysSinceLastSession = getDaysSinceLastSession(completedLogs);
  const streakCount = calculateStreak(completedLogs);
  const sessionsThisWeek = calculateSessionsThisWeek(completedLogs);
  const hasCompletedAnySession = completedLogs.length > 0;

  let state: ContinuationStateResult['state'] = 'new';

  if (!hasCompletedAnySession) {
    state = 'new';
  } else if (daysSinceLastSession !== null && daysSinceLastSession >= 3) {
    state = 'paused';
  } else {
    state = 'active';
  }

  return {
    state,
    daysSinceLastSession,
    streakCount,
    sessionsThisWeek,
    hasCompletedAnySession,
    currentPath: currentPathType,
  };
}