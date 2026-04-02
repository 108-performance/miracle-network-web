'use client';

import { useMemo, useState, useTransition } from 'react';
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

export default function WorkoutRunner({
  workoutId,
  title,
  exercises,
  isGuest,
}: {
  workoutId: string;
  title: string;
  exercises: Exercise[];
  isGuest: boolean;
}) {
  const [started, setStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isPending, startTransition] = useTransition();
  const [logs, setLogs] = useState<Record<string, LogState>>({});

  const current = exercises[currentIndex];
  const progressPercent =
    exercises.length > 0 ? ((currentIndex + 1) / exercises.length) * 100 : 0;

  const currentLog = current ? logs[current.exerciseId] ?? EMPTY_LOG : EMPTY_LOG;

  const currentContent = useMemo(() => {
    if (!current?.content) return [];
    return current.content;
  }, [current]);

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

  function renderPrescription() {
    if (!current) return null;

    const parts: string[] = [];

    if (current.prescribedSets) {
      parts.push(`${current.prescribedSets} set${current.prescribedSets === 1 ? '' : 's'}`);
    }

    if (current.metricType === 'reps' || current.metricType === 'mixed') {
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
        parts.push(`target score ${current.prescribedScore}`);
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

    if (parts.length === 0) return null;

    return (
      <div className="mb-6 rounded-xl border border-zinc-800 bg-black/40 p-4">
        <p className="mb-1 text-sm uppercase tracking-[0.2em] text-zinc-500">
          Prescription
        </p>
        <p className="text-zinc-300">{parts.join(' • ')}</p>
      </div>
    );
  }

  function renderMetricInputs() {
    if (!current) return null;

    const metricType = current.metricType ?? 'reps';

    if (metricType === 'reps') {
      return (
        <MetricInputCard
          label="Reps"
          value={currentLog.reps}
          onChange={(value) => updateLog(current.exerciseId, 'reps', value)}
          placeholder="Enter reps"
        />
      );
    }

    if (metricType === 'time') {
      return (
        <MetricInputCard
          label="Time (seconds)"
          value={currentLog.timeSeconds}
          onChange={(value) => updateLog(current.exerciseId, 'timeSeconds', value)}
          placeholder="Enter time in seconds"
        />
      );
    }

    if (metricType === 'score') {
      return (
        <MetricInputCard
          label="Score"
          value={currentLog.score}
          onChange={(value) => updateLog(current.exerciseId, 'score', value)}
          placeholder="Enter score"
        />
      );
    }

    if (metricType === 'exit_velocity') {
      return (
        <MetricInputCard
          label="Exit Velocity"
          value={currentLog.exitVelocity}
          onChange={(value) => updateLog(current.exerciseId, 'exitVelocity', value)}
          placeholder="Enter exit velocity"
        />
      );
    }

    if (metricType === 'mixed') {
      return (
        <div className="grid gap-4 md:grid-cols-2">
          <MetricInputCard
            label="Reps"
            value={currentLog.reps}
            onChange={(value) => updateLog(current.exerciseId, 'reps', value)}
            placeholder="Enter reps"
          />
          <MetricInputCard
            label="Time (seconds)"
            value={currentLog.timeSeconds}
            onChange={(value) => updateLog(current.exerciseId, 'timeSeconds', value)}
            placeholder="Enter time"
          />
          <MetricInputCard
            label="Score"
            value={currentLog.score}
            onChange={(value) => updateLog(current.exerciseId, 'score', value)}
            placeholder="Enter score"
          />
          <MetricInputCard
            label="Exit Velocity"
            value={currentLog.exitVelocity}
            onChange={(value) => updateLog(current.exerciseId, 'exitVelocity', value)}
            placeholder="Enter exit velocity"
          />
        </div>
      );
    }

    return (
      <MetricInputCard
        label="Reps"
        value={currentLog.reps}
        onChange={(value) => updateLog(current.exerciseId, 'reps', value)}
        placeholder="Enter reps"
      />
    );
  }

  function renderFeedback() {
    if (!current) return null;

    const metricType = current.metricType ?? 'reps';

    let currentValue: number | null = null;
    let lastValue: number | null = null;
    let bestValue: number | null = null;
    let label = 'Value';

    if (metricType === 'reps') {
      currentValue = toNumberOrNull(currentLog.reps);
      lastValue = current.lastResult?.reps ?? null;
      bestValue = current.bestResult?.reps ?? null;
      label = 'Reps';
    } else if (metricType === 'time') {
      currentValue = toNumberOrNull(currentLog.timeSeconds);
      lastValue = current.lastResult?.timeSeconds ?? null;
      bestValue = current.bestResult?.timeSeconds ?? null;
      label = 'Time';
    } else if (metricType === 'score') {
      currentValue = toNumberOrNull(currentLog.score);
      lastValue = current.lastResult?.score ?? null;
      bestValue = current.bestResult?.score ?? null;
      label = 'Score';
    } else if (metricType === 'exit_velocity') {
      currentValue = toNumberOrNull(currentLog.exitVelocity);
      lastValue = current.lastResult?.exitVelocity ?? null;
      bestValue = current.bestResult?.exitVelocity ?? null;
      label = 'Exit Velocity';
    }

    if (currentValue == null && lastValue == null && bestValue == null) return null;

    const vsLast =
      currentValue != null && lastValue != null ? currentValue - lastValue : null;
    const vsBest =
      currentValue != null && bestValue != null ? currentValue - bestValue : null;

    return (
      <div className="mb-6 rounded-xl border border-zinc-800 bg-black/40 p-4">
        <p className="mb-3 text-sm uppercase tracking-[0.2em] text-zinc-500">
          Feedback
        </p>

        <div className="grid gap-3 md:grid-cols-3">
          <FeedbackStat label={`Last ${label}`} value={formatMetricValue(lastValue, metricType)} />
          <FeedbackStat label={`Best ${label}`} value={formatMetricValue(bestValue, metricType)} />
          <FeedbackStat label={`Current ${label}`} value={formatMetricValue(currentValue, metricType)} />
        </div>

        {(vsLast != null || vsBest != null) && (
          <div className="mt-4 space-y-1 text-sm">
            {vsLast != null ? (
              <p className={vsLast >= 0 ? 'text-lime-400' : 'text-red-400'}>
                vs last: {vsLast >= 0 ? '+' : ''}
                {formatDelta(vsLast, metricType)}
              </p>
            ) : null}

            {vsBest != null ? (
              <p className={vsBest >= 0 ? 'text-lime-400' : 'text-zinc-400'}>
                vs best: {vsBest >= 0 ? '+' : ''}
                {formatDelta(vsBest, metricType)}
              </p>
            ) : null}
          </div>
        )}
      </div>
    );
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
    return (
      <div className="mx-auto w-full max-w-2xl rounded-3xl border border-zinc-800 bg-zinc-950 p-8 text-center">
        <p className="mb-2 text-sm uppercase tracking-[0.2em] text-zinc-500">
          Session Complete
        </p>

        <h1 className="mb-4 text-4xl font-bold">{title}</h1>

        <p className="mb-4 text-zinc-300">
          Nice work. You completed all {exercises.length} exercises in this
          session.
        </p>

        {saveMessage ? (
          <p className="mb-8 text-sm text-lime-400">{saveMessage}</p>
        ) : null}

        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button
            onClick={() => {
              setCompleted(false);
              setStarted(true);
              setCurrentIndex(0);
            }}
            className="rounded-full bg-white px-6 py-3 font-semibold text-black"
          >
            Restart Session
          </button>

          <button
            onClick={() => {
              setCompleted(false);
              setStarted(false);
              setCurrentIndex(0);
            }}
            className="rounded-full border border-zinc-700 px-6 py-3 font-semibold text-white"
          >
            Back to Start
          </button>
        </div>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="mx-auto w-full max-w-2xl rounded-3xl border border-zinc-800 bg-zinc-950 p-8 text-center">
        <p className="mb-2 text-sm uppercase tracking-[0.2em] text-zinc-500">
          Workout Session
        </p>

        <h1 className="mb-4 text-4xl font-bold">{title}</h1>

        <p className="mb-8 text-zinc-400">
          {exercises.length} exercises in this session
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
          className="rounded-full bg-white px-6 py-3 font-semibold text-black"
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

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <p className="mb-2 text-sm uppercase tracking-[0.2em] text-zinc-500">
          {title}
        </p>

        <div className="mb-3 h-2 w-full rounded-full bg-zinc-800">
          <div
            className="h-2 rounded-full bg-white transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <p className="text-sm text-zinc-500">
          Exercise {currentIndex + 1} / {exercises.length}
        </p>
      </div>

      <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
        <h1 className="mb-4 text-3xl font-bold">{current.name}</h1>

        {current.description ? (
          <p className="mb-4 text-zinc-300">{current.description}</p>
        ) : null}

        {current.instructions ? (
          <div className="mb-6 rounded-xl border border-zinc-800 bg-black/40 p-4">
            <p className="mb-1 text-sm uppercase tracking-[0.2em] text-zinc-500">
              Instructions
            </p>
            <p className="text-zinc-300">{current.instructions}</p>
          </div>
        ) : null}

        {renderPrescription()}

        <div className="mb-6 rounded-2xl border border-zinc-800 bg-black/40 p-4">
          <p className="mb-3 text-sm uppercase tracking-[0.2em] text-zinc-500">
            Log Result
          </p>
          {renderMetricInputs()}
        </div>

        {renderFeedback()}

        {currentContent.length > 0 ? (
          <div className="space-y-4">
            {currentContent.map((item, index) => (
              <div
                key={`${item.title}-${index}`}
                className="rounded-2xl border border-zinc-800 bg-black/40 p-4"
              >
                <p className="mb-3 text-sm uppercase tracking-[0.2em] text-zinc-500">
                  Video
                </p>

                {item.url ? (
                  <div className="flex flex-wrap gap-3">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-black"
                    >
                      Open {item.title}
                    </a>

                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex rounded-full border border-zinc-700 px-4 py-2 text-sm font-semibold text-white"
                    >
                      Open in New Tab
                    </a>
                  </div>
                ) : (
                  <p className="text-zinc-500">No video link available</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-zinc-800 bg-black/40 p-4">
            <p className="text-zinc-500">
              No linked content for this exercise yet.
            </p>
          </div>
        )}

        {errorMessage ? (
          <p className="mt-6 text-sm text-red-400">{errorMessage}</p>
        ) : null}

        <div className="mt-10 flex justify-between gap-3">
          <button
            disabled={currentIndex === 0 || isPending}
            onClick={() => setCurrentIndex((index) => index - 1)}
            className="rounded border border-zinc-700 px-4 py-2 disabled:opacity-40"
          >
            Back
          </button>

          {currentIndex < exercises.length - 1 ? (
            <button
              disabled={isPending}
              onClick={() => setCurrentIndex((index) => index + 1)}
              className="rounded bg-white px-4 py-2 text-black disabled:opacity-40"
            >
              Next
            </button>
          ) : (
            <button
              disabled={isPending}
              onClick={handleCompleteSession}
              className="rounded bg-green-500 px-4 py-2 font-semibold text-black disabled:opacity-40"
            >
              {isGuest ? 'Finish and Save After Signup' : isPending ? 'Saving...' : 'Complete Session'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricInputCard({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm text-zinc-400">{label}</label>
      <input
        type="number"
        inputMode="decimal"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none placeholder:text-zinc-500"
      />
    </div>
  );
}

function FeedbackStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3">
      <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">{label}</p>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

function toNumberOrNull(value: string) {
  if (!value || value.trim() === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatMetricValue(
  value: number | null | undefined,
  metricType: string | null | undefined
) {
  if (value == null) return '—';

  if (metricType === 'time') return `${value}s`;
  return `${value}`;
}

function formatDelta(
  value: number,
  metricType: string | null | undefined
) {
  if (metricType === 'time') return `${value}s`;
  return `${value}`;
}