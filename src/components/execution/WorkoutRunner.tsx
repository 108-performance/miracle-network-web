'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { saveWorkoutSessionAction } from '@/app/(dashboard)/dashboard/workout/[elementSlug]/[levelSlug]/actions';

type ExerciseContent = {
  title: string;
  url: string | null;
};

type MetricSnapshot = {
  reps?: number | null;
  timeSeconds?: number | null;
  score?: number | null;
  exitVelocity?: number | null;
};

type Exercise = {
  id: string;
  workoutExerciseId: string;
  exerciseId: string;
  name: string;
  description?: string | null;
  instructions?: string | null;
  metricType?: string | null;
  prescribedSets?: number | null;
  prescribedReps?: number | null;
  prescribedTimeSeconds?: number | null;
  prescribedScore?: number | null;
  prescribedExitVelocity?: number | null;
  prescribedYards?: number | null;
  lastResult?: MetricSnapshot | null;
  bestResult?: MetricSnapshot | null;
  content?: ExerciseContent[];
};

type LogState = {
  reps: string;
  timeSeconds: string;
  score: string;
  exitVelocity: string;
};

type PendingSessionPayload = {
  workoutId: string;
  workoutTitle: string;
  exercises: {
    workoutExerciseId: string;
    exerciseId: string;
    metricType: string | null;
    reps: string;
    timeSeconds: string;
    score: string;
    exitVelocity: string;
  }[];
};

const EMPTY_LOG: LogState = {
  reps: '',
  timeSeconds: '',
  score: '',
  exitVelocity: '',
};

const PENDING_SESSION_COOKIE = 'mn_pending_session';
const WORKOUT_HISTORY_STORAGE_KEY = 'mn_workout_history_v1';

function extractVimeoVideoId(url: string): string | null {
  const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
  return match?.[1] ?? null;
}

function getVimeoEmbedUrl(url?: string | null): string | null {
  if (!url) return null;

  try {
    const parsed = new URL(url);

    if (
      parsed.hostname.includes('player.vimeo.com') &&
      parsed.pathname.includes('/video/')
    ) {
      const embed = new URL(parsed.toString());

      embed.searchParams.set('playsinline', '1');
      embed.searchParams.set('title', '0');
      embed.searchParams.set('byline', '0');
      embed.searchParams.set('portrait', '0');

      return embed.toString();
    }

    if (parsed.hostname.includes('vimeo.com')) {
      const videoId = extractVimeoVideoId(url);

      if (!videoId) return null;

      const embed = new URL(`https://player.vimeo.com/video/${videoId}`);

      const h = parsed.searchParams.get('h');
      if (h) {
        embed.searchParams.set('h', h);
      }

      embed.searchParams.set('playsinline', '1');
      embed.searchParams.set('title', '0');
      embed.searchParams.set('byline', '0');
      embed.searchParams.set('portrait', '0');

      return embed.toString();
    }

    return null;
  } catch {
    return null;
  }
}

function InlineVideoPlayer({
  url,
  title = 'Workout video',
  className = '',
}: {
  url?: string | null;
  title?: string;
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const embedUrl = getVimeoEmbedUrl(url);

  if (!embedUrl) return null;

  const fullscreenUrl = embedUrl.includes('?')
    ? `${embedUrl}&autoplay=1`
    : `${embedUrl}?autoplay=1`;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`group relative block w-full overflow-hidden rounded-3xl border border-white/10 bg-black shadow-[0_0_20px_rgba(255,255,255,0.03)] transition-transform active:scale-[0.98] ${className}`}
      >
        <div className="relative mx-auto w-full max-w-[600px]">
          <div className="relative w-full pt-[177.78%]">
            <iframe
              src={embedUrl}
              title={title}
              className="pointer-events-none absolute inset-0 h-full w-full opacity-95"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 bg-black/95">
          <div className="flex items-center justify-between px-4 py-4 sm:px-6">
            <p className="truncate pr-4 text-sm font-medium text-white/75">
              {title}
            </p>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold text-white"
            >
              Close
            </button>
          </div>

          <div className="flex h-[calc(100%-72px)] items-center justify-center px-4 pb-6">
            <div className="h-full w-full max-w-[520px]">
              <div className="relative h-full w-full">
                <iframe
                  src={fullscreenUrl}
                  title={title}
                  className="absolute inset-0 h-full w-full rounded-2xl"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export default function WorkoutRunner({
  workoutId,
  title,
  exercises,
  isGuest,
  autoStart = false,
}: {
  workoutId: string;
  title: string;
  exercises: Exercise[];
  isGuest: boolean;
  autoStart?: boolean;
}) {
  const [started, setStarted] = useState(autoStart);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isPending, startTransition] = useTransition();
  const [logs, setLogs] = useState<Record<string, LogState>>({});

  useEffect(() => {
    if (autoStart) {
      setStarted(true);
    }
  }, [autoStart]);

  const current = exercises[currentIndex];
  const progressPercent =
    exercises.length > 0 ? ((currentIndex + 1) / exercises.length) * 100 : 0;

  const currentLog = current ? logs[current.exerciseId] ?? EMPTY_LOG : EMPTY_LOG;

  const currentContent = useMemo(() => {
    if (!current?.content) return [];
    return current.content;
  }, [current]);

  useEffect(() => {
    const input = document.getElementById(
      'runner-primary-input'
    ) as HTMLInputElement | null;

    if (input) {
      input.focus();
      input.select();
    }
  }, [currentIndex]);

  function updateLog(exerciseId: string, field: keyof LogState, value: string) {
    setLogs((prev) => ({
      ...prev,
      [exerciseId]: {
        ...(prev[exerciseId] ?? EMPTY_LOG),
        [field]: value,
      },
    }));
  }

  function buildExercisePayload() {
    return exercises.map((exercise) => {
      const values = logs[exercise.exerciseId] ?? EMPTY_LOG;

      return {
        workoutExerciseId: exercise.workoutExerciseId,
        exerciseId: exercise.exerciseId,
        metricType: exercise.metricType ?? null,
        reps: values.reps,
        timeSeconds: values.timeSeconds,
        score: values.score,
        exitVelocity: values.exitVelocity,
      };
    });
  }

  function storePendingGuestSession() {
    const payload: PendingSessionPayload = {
      workoutId,
      workoutTitle: title,
      exercises: buildExercisePayload(),
    };

    const encoded = encodeURIComponent(JSON.stringify(payload));

    document.cookie = `${PENDING_SESSION_COOKIE}=${encoded}; path=/; max-age=3600; samesite=lax`;
  }

  function redirectGuestToClaimFlow() {
    const nextPath = `/dashboard/claim-first-session?workoutId=${encodeURIComponent(
      workoutId
    )}`;

    window.location.href = `/login?next=${encodeURIComponent(nextPath)}`;
  }

  function toNumberOrNull(value: string) {
    if (!value || value.trim() === '') return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function getMetricValueFromLog(log: LogState, metricType?: string | null) {
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

  function getStreakData() {
    try {
      const raw = window.localStorage.getItem(WORKOUT_HISTORY_STORAGE_KEY);
      const history: string[] = raw ? JSON.parse(raw) : [];

      const today = new Date();
      const todayKey = formatDateKey(today);

      const merged = Array.from(new Set([...history, todayKey])).sort();

      window.localStorage.setItem(
        WORKOUT_HISTORY_STORAGE_KEY,
        JSON.stringify(merged)
      );

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
        streak,
        weekSessions,
      };
    } catch {
      return {
        streak: 1,
        weekSessions: 1,
      };
    }
  }

  function getNextStepMeta(source: 'challenge' | 'workout', titleText: string) {
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

  function buildCompletionRedirectUrl() {
    const normalizedTitle = title.toLowerCase();
    const isChallengeSession = normalizedTitle.includes('challenge');
    const source: 'challenge' | 'workout' = isChallengeSession
      ? 'challenge'
      : 'workout';

    const { streak, weekSessions } = getStreakData();
    const nextStep = getNextStepMeta(source, title);

    const candidates = exercises
      .map((exercise) => {
        const metricType = exercise.metricType ?? 'reps';
        const values = logs[exercise.exerciseId] ?? EMPTY_LOG;

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

    const anchor = candidates[0];

    const params = new URLSearchParams({
      title: title ?? 'Workout Session',
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

    return `/dashboard/session-complete?${params.toString()}`;
  }

  function formatPrescription() {
    if (!current) return '';

    const parts: string[] = [];

    if (current.prescribedSets) {
      parts.push(`${current.prescribedSets} set${current.prescribedSets === 1 ? '' : 's'}`);
    }

    if (current.metricType === 'reps' || current.metricType === 'mixed' || !current.metricType) {
      if (current.prescribedReps) {
        parts.push(`${current.prescribedReps} rep${current.prescribedReps === 1 ? '' : 's'}`);
      }
    }

    if (current.metricType === 'time' || current.metricType === 'mixed') {
      if (current.prescribedTimeSeconds) {
        parts.push(`${current.prescribedTimeSeconds}s`);
      }
    }

    if (current.metricType === 'score' || current.metricType === 'mixed') {
      if (current.prescribedScore) {
        parts.push(`target ${current.prescribedScore}`);
      }
    }

    if (current.metricType === 'exit_velocity' || current.metricType === 'mixed') {
      if (current.prescribedExitVelocity) {
        parts.push(`target EV ${current.prescribedExitVelocity}`);
      }
    }

    if (current.prescribedYards) {
      parts.push(
        `${current.prescribedYards} ${current.prescribedYards === 1 ? 'yd' : 'yds'}`
      );
    }

    return parts.join(' • ');
  }

  function getPrimaryField(metricType?: string | null): keyof LogState {
    if (metricType === 'time') return 'timeSeconds';
    if (metricType === 'score') return 'score';
    if (metricType === 'exit_velocity') return 'exitVelocity';
    if (metricType === 'mixed') return 'score';
    return 'reps';
  }

  function getPrimaryLabel(metricType?: string | null) {
    if (metricType === 'time') return 'Time';
    if (metricType === 'score') return 'Score';
    if (metricType === 'exit_velocity') return 'Exit Velocity';
    if (metricType === 'mixed') return 'Score';
    return 'Reps';
  }

  function getCurrentInputValue() {
    if (!current) return '';
    const field = getPrimaryField(current.metricType);
    return currentLog[field];
  }

  function setCurrentInputValue(value: string) {
    if (!current) return;
    const field = getPrimaryField(current.metricType);
    updateLog(current.exerciseId, field, value);
  }

  function formatMetricValue(
    value: number | null | undefined,
    metricType: string | null | undefined
  ) {
    if (value == null) return '—';
    if (metricType === 'time') return `${value}s`;
    return `${value}`;
  }

  function handleContinue() {
    if (currentIndex < exercises.length - 1) {
      setCurrentIndex((index) => index + 1);
      return;
    }

    handleCompleteSession();
  }

  function handleCompleteSession() {
    setErrorMessage('');
    setSaveMessage('');

    if (isGuest) {
      try {
        storePendingGuestSession();
        redirectGuestToClaimFlow();
      } catch (error) {
        console.error(error);
        setErrorMessage('Failed to prepare guest session for account claim.');
      }
      return;
    }

    startTransition(async () => {
      try {
        const result = await saveWorkoutSessionAction({
          workoutId,
          workoutTitle: title,
          elementSlug: 'training',
          levelSlug: 'session',
          exercises: buildExercisePayload(),
        });

        setSaveMessage(
          `Session saved. ${result.savedExerciseLogs} exercise log${
            result.savedExerciseLogs === 1 ? '' : 's'
          } recorded.`
        );
        setCompleted(true);
        setStarted(false);
      } catch (error) {
        console.error(error);
        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'Failed to save workout session.'
        );
      }
    });
  }

  if (completed) {
    if (typeof window !== 'undefined') {
      window.location.href = buildCompletionRedirectUrl();
    }

    return null;
  }

  if (!started) {
    return (
      <div className="mx-auto w-full max-w-xl rounded-[32px] border border-zinc-800 bg-zinc-950 p-8 text-center">
        <p className="mb-2 text-sm uppercase tracking-[0.2em] text-zinc-500">
          Workout Session
        </p>

        <h1 className="mb-4 text-4xl font-bold">{title}</h1>

        <p className="mb-8 text-zinc-400">
          {exercises.length} exercise{exercises.length === 1 ? '' : 's'} in this session
        </p>

        {errorMessage ? (
          <p className="mb-4 text-sm text-red-400">{errorMessage}</p>
        ) : null}

        <button
          onClick={() => {
            setCompleted(false);
            setStarted(true);
            setCurrentIndex(0);
          }}
          className="rounded-2xl bg-lime-400 px-6 py-3 font-semibold text-black shadow-[0_0_20px_rgba(132,204,22,0.25)]"
        >
          Start Session
        </button>
      </div>
    );
  }

  if (!current) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center text-white">
        <h1 className="text-3xl font-bold">No exercises available</h1>
      </div>
    );
  }

  const primaryMetricType = current.metricType ?? 'reps';
  const primaryFieldLabel = getPrimaryLabel(primaryMetricType);
  const primaryInputValue = getCurrentInputValue();
  const prescriptionText = formatPrescription();
  const lastValue = getMetricValueFromSnapshot(current.lastResult, primaryMetricType);
  const bestValue = getMetricValueFromSnapshot(current.bestResult, primaryMetricType);

  return (
    <div className="mx-auto w-full max-w-3xl px-4">
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold leading-tight sm:text-5xl">
          {current.name}
        </h1>

        {prescriptionText ? (
          <p className="mt-3 text-lg text-zinc-400">{prescriptionText}</p>
        ) : null}
      </div>

      <div className="mb-6">
        <div className="mb-3 h-1.5 w-full rounded-full bg-zinc-800">
          <div
            className="h-1.5 rounded-full bg-lime-400 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
          {currentIndex + 1}/{exercises.length}
        </p>
      </div>

      {currentContent.length > 0 && currentContent[0]?.url ? (
        <div className="mb-10">
          <InlineVideoPlayer url={currentContent[0].url} title={current.name} />
        </div>
      ) : null}

      <div className="mb-10">
        <p className="mb-3 text-xs uppercase tracking-[0.18em] text-zinc-500">
          Log {primaryFieldLabel}
        </p>

        <input
          id="runner-primary-input"
          type="number"
          inputMode="decimal"
          value={primaryInputValue}
          onChange={(e) => setCurrentInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleContinue();
            }
          }}
          placeholder="Enter result"
          className="w-full rounded-3xl border border-zinc-700 bg-black px-6 py-8 text-center text-4xl font-bold text-white outline-none placeholder:text-zinc-600"
        />
      </div>

      {(lastValue != null || bestValue != null) && (
        <div className="mb-10 grid grid-cols-2 gap-4 text-center">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/90 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
              Last
            </p>
            <p className="mt-2 text-2xl font-bold text-white">
              {formatMetricValue(lastValue, primaryMetricType)}
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/90 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
              Best
            </p>
            <p className="mt-2 text-2xl font-bold text-white">
              {formatMetricValue(bestValue, primaryMetricType)}
            </p>
          </div>
        </div>
      )}

      {errorMessage ? (
        <p className="mb-4 text-center text-sm text-red-400">{errorMessage}</p>
      ) : null}

      {saveMessage ? (
        <p className="mb-4 text-center text-sm text-lime-400">{saveMessage}</p>
      ) : null}

      <div className="flex gap-3">
        <button
          disabled={currentIndex === 0 || isPending}
          onClick={() => setCurrentIndex((i) => i - 1)}
          className="rounded-2xl border border-zinc-700 px-5 py-4 text-sm font-semibold text-zinc-300 disabled:opacity-40"
        >
          Back
        </button>

        <button
          disabled={isPending}
          onClick={handleContinue}
          className="flex-1 rounded-2xl bg-lime-400 py-5 text-lg font-bold text-black shadow-[0_0_20px_rgba(132,204,22,0.25)]"
        >
          {currentIndex < exercises.length - 1
            ? 'Next'
            : isGuest
              ? 'Finish'
              : isPending
                ? 'Saving...'
                : 'Complete'}
        </button>
      </div>
    </div>
  );
}