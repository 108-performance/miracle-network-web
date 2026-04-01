'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type ExerciseRecord = {
  id: string;
  name: string;
  category: string | null;
  description: string | null;
  default_metric_type: string | null;
};

type WorkoutExercise = {
  id: string;
  workout_id: string;
  exercise_id: string;
  sort_order: number;
  prescribed_sets: number | null;
  prescribed_reps: number | null;
  prescribed_time_seconds: number | null;
  prescribed_score: number | null;
  prescribed_exit_velocity: number | null;
  metric_type: 'reps' | 'time' | 'score' | 'exit_velocity' | 'mixed';
  instructions: string | null;
  notes: string | null;
  is_required: boolean;
  exercise: ExerciseRecord | ExerciseRecord[] | null;
};

type ExerciseProgression = {
  last: {
    actual_sets: number | null;
    actual_reps: number | null;
    actual_time_seconds: number | null;
    actual_score: number | null;
    actual_exit_velocity: number | null;
    completed: boolean;
    created_at: string;
  } | null;
  best: {
    actual_score: number | null;
    actual_exit_velocity: number | null;
    actual_reps: number | null;
    actual_time_seconds: number | null;
  } | null;
  completionCount: number;
};

type Props = {
  athleteId: string;
  workoutId: string;
  workoutExercises: WorkoutExercise[];
  progressionByExerciseId: Record<string, ExerciseProgression>;
};

type ExerciseFormState = {
  completed: boolean;
  actualSets: string;
  actualReps: string;
  actualTimeSeconds: string;
  actualScore: string;
  actualExitVelocity: string;
  notes: string;
};

function getExerciseRecord(
  exercise: ExerciseRecord | ExerciseRecord[] | null
): ExerciseRecord | null {
  if (!exercise) return null;
  return Array.isArray(exercise) ? exercise[0] ?? null : exercise;
}

function isChallengeExercise(item: WorkoutExercise): boolean {
  const exercise = getExerciseRecord(item.exercise);
  const name = exercise?.name ?? '';
  return name.toUpperCase().startsWith('CHALLENGE:');
}

function toNumberOrNull(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function getMetricLabel(item: WorkoutExercise): string {
  switch (item.metric_type) {
    case 'score':
      return 'Score';
    case 'time':
      return 'Time';
    case 'exit_velocity':
      return 'Exit Velocity';
    case 'mixed':
      return 'Results';
    case 'reps':
    default:
      return 'Reps';
  }
}

function formatPrescription(item: WorkoutExercise): string {
  if (item.metric_type === 'score') {
    return item.prescribed_score != null
      ? `Pro Score • ${item.prescribed_score}`
      : 'Score Challenge';
  }

  if (item.metric_type === 'time') {
    const sets = item.prescribed_sets ? `${item.prescribed_sets} sets` : null;
    const time =
      item.prescribed_time_seconds != null
        ? `${item.prescribed_time_seconds} sec`
        : null;
    return [sets, time].filter(Boolean).join(' • ') || 'Timed Drill';
  }

  if (item.metric_type === 'exit_velocity') {
    const sets = item.prescribed_sets ? `${item.prescribed_sets} sets` : null;
    const velo =
      item.prescribed_exit_velocity != null
        ? `${item.prescribed_exit_velocity} EV`
        : null;
    return [sets, velo].filter(Boolean).join(' • ') || 'Velocity Drill';
  }

  const sets = item.prescribed_sets ? `${item.prescribed_sets} sets` : null;
  const reps = item.prescribed_reps ? `${item.prescribed_reps} reps` : null;

  return [sets, reps].filter(Boolean).join(' • ') || 'Complete as prescribed';
}

function getInitialState(
  item: WorkoutExercise,
  progression?: ExerciseProgression
): ExerciseFormState {
  const last = progression?.last;

  return {
    completed: last?.completed ?? false,
    actualSets:
      last?.actual_sets != null
        ? String(last.actual_sets)
        : item.prescribed_sets != null
          ? String(item.prescribed_sets)
          : '',
    actualReps:
      last?.actual_reps != null
        ? String(last.actual_reps)
        : item.prescribed_reps != null && item.metric_type === 'reps'
          ? String(item.prescribed_reps)
          : '',
    actualTimeSeconds:
      last?.actual_time_seconds != null
        ? String(last.actual_time_seconds)
        : item.prescribed_time_seconds != null && item.metric_type === 'time'
          ? String(item.prescribed_time_seconds)
          : '',
    actualScore:
      last?.actual_score != null ? String(last.actual_score) : '',
    actualExitVelocity:
      last?.actual_exit_velocity != null ? String(last.actual_exit_velocity) : '',
    notes: '',
  };
}

export default function WorkoutExecutionForm({
  athleteId,
  workoutId,
  workoutExercises,
  progressionByExerciseId,
}: Props) {
  const router = useRouter();

  const initialState = useMemo(() => {
    if (!Array.isArray(workoutExercises)) return {};

    return Object.fromEntries(
      workoutExercises.map((item) => [
        item.id,
        getInitialState(item, progressionByExerciseId[item.exercise_id]),
      ])
    ) as Record<string, ExerciseFormState>;
  }, [workoutExercises, progressionByExerciseId]);

  const [formState, setFormState] =
    useState<Record<string, ExerciseFormState>>(initialState);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<'success' | 'error' | null>(null);

  const challengeExercise = Array.isArray(workoutExercises)
    ? workoutExercises.find((item) => isChallengeExercise(item)) ?? null
    : null;

  const standardExercises = Array.isArray(workoutExercises)
    ? workoutExercises.filter((item) => !isChallengeExercise(item))
    : [];

  const buildExercises = standardExercises.slice(0, 2);
  const applyExercises = standardExercises.slice(2);

  function updateExerciseState(
    workoutExerciseId: string,
    patch: Partial<ExerciseFormState>
  ) {
    setFormState((current) => ({
      ...current,
      [workoutExerciseId]: {
        ...current[workoutExerciseId],
        ...patch,
      },
    }));
  }

  async function handleSubmit() {
    try {
      setIsSaving(true);
      setStatusMessage(null);
      setStatusType(null);

      const exercises = workoutExercises.map((item) => {
        const state = formState[item.id];

        return {
          workoutExerciseId: item.id,
          exerciseId: item.exercise_id,
          completed: state.completed,
          actualSets: toNumberOrNull(state.actualSets),
          actualReps: toNumberOrNull(state.actualReps),
          actualTimeSeconds: toNumberOrNull(state.actualTimeSeconds),
          actualScore: toNumberOrNull(state.actualScore),
          actualExitVelocity: toNumberOrNull(state.actualExitVelocity),
          notes: state.notes.trim() || null,
        };
      });

      const response = await fetch('/api/workout-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          athleteId,
          workoutId,
          exercises,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.error || 'Unable to save session. Please try again.'
        );
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Unable to save session.');
      }

      if (data.workoutCompleted) {
        setStatusType('success');
        setStatusMessage('Day complete. Nice work.');

        const nextWorkoutId =
          typeof data.nextWorkoutId === 'string' ? data.nextWorkoutId : null;

        if (nextWorkoutId) {
          router.push(`/dashboard/training/${nextWorkoutId}`);
          router.refresh();
          return;
        }

        router.push('/dashboard');
        router.refresh();
        return;
      }

      setStatusType('success');
      setStatusMessage('Session progress saved.');
      router.refresh();
    } catch (error) {
      setStatusType('error');
      setStatusMessage(
        error instanceof Error
          ? error.message
          : 'Unable to save session. Please try again.'
      );
    } finally {
      setIsSaving(false);
    }
  }

  function renderInputBlock(item: WorkoutExercise) {
    const state = formState[item.id];

    if (!state) return null;

    if (item.metric_type === 'score') {
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-zinc-300">
              Your Score
            </span>
            <input
              type="number"
              inputMode="numeric"
              value={state.actualScore}
              onChange={(e) =>
                updateExerciseState(item.id, { actualScore: e.target.value })
              }
              className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none ring-0 placeholder:text-zinc-500"
              placeholder="Enter score"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-zinc-300">
              Mark Complete
            </span>
            <button
              type="button"
              onClick={() =>
                updateExerciseState(item.id, { completed: !state.completed })
              }
              className={`w-full rounded-xl px-4 py-3 text-sm font-semibold transition ${
                state.completed
                  ? 'bg-lime-400 text-black'
                  : 'border border-zinc-700 bg-zinc-900 text-zinc-200'
              }`}
            >
              {state.completed ? 'Completed' : 'Tap to Complete'}
            </button>
          </label>
        </div>
      );
    }

    return (
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-zinc-300">
            Sets
          </span>
          <input
            type="number"
            inputMode="numeric"
            value={state.actualSets}
            onChange={(e) =>
              updateExerciseState(item.id, { actualSets: e.target.value })
            }
            className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none ring-0 placeholder:text-zinc-500"
            placeholder="Sets"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-zinc-300">
            {getMetricLabel(item)}
          </span>
          <input
            type="number"
            inputMode="numeric"
            value={
              item.metric_type === 'time'
                ? state.actualTimeSeconds
                : item.metric_type === 'exit_velocity'
                  ? state.actualExitVelocity
                  : state.actualReps
            }
            onChange={(e) => {
              const value = e.target.value;

              if (item.metric_type === 'time') {
                updateExerciseState(item.id, { actualTimeSeconds: value });
                return;
              }

              if (item.metric_type === 'exit_velocity') {
                updateExerciseState(item.id, { actualExitVelocity: value });
                return;
              }

              updateExerciseState(item.id, { actualReps: value });
            }}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none ring-0 placeholder:text-zinc-500"
            placeholder={getMetricLabel(item)}
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-zinc-300">
            Mark Complete
          </span>
          <button
            type="button"
            onClick={() =>
              updateExerciseState(item.id, { completed: !state.completed })
            }
            className={`w-full rounded-xl px-4 py-3 text-sm font-semibold transition ${
              state.completed
                ? 'bg-lime-400 text-black'
                : 'border border-zinc-700 bg-zinc-900 text-zinc-200'
            }`}
          >
            {state.completed ? 'Completed' : 'Tap to Complete'}
          </button>
        </label>
      </div>
    );
  }

  function renderDrillCard(
    item: WorkoutExercise,
    sectionTone: 'default' | 'challenge' = 'default'
  ) {
    const exercise = getExerciseRecord(item.exercise);
    if (!exercise) return null;

    const progression = progressionByExerciseId[item.exercise_id];
    const state = formState[item.id];

    return (
      <div
        key={item.id}
        className={`rounded-2xl p-5 ${
          sectionTone === 'challenge'
            ? 'border border-lime-400/50 bg-zinc-950 shadow-[0_0_0_1px_rgba(132,204,22,0.12)]'
            : 'border border-zinc-800 bg-zinc-950'
        }`}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-xl font-bold text-white">
              {sectionTone === 'challenge'
                ? exercise.name.replace('CHALLENGE: ', '')
                : exercise.name}
            </h3>
            <p
              className={`mt-2 text-sm font-medium ${
                sectionTone === 'challenge' ? 'text-lime-400' : 'text-zinc-400'
              }`}
            >
              {formatPrescription(item)}
            </p>
          </div>

          {progression?.completionCount ? (
            <span className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 text-xs font-semibold text-zinc-300">
              {progression.completionCount} prior{' '}
              {progression.completionCount === 1 ? 'log' : 'logs'}
            </span>
          ) : null}
        </div>

        {item.notes ? (
          <p className="mt-3 text-sm text-zinc-300">{item.notes}</p>
        ) : null}

        <div className="mt-5">{renderInputBlock(item)}</div>

        <label className="mt-4 block">
          <span className="mb-2 block text-sm font-medium text-zinc-300">
            Notes
          </span>
          <textarea
            value={state.notes}
            onChange={(e) =>
              updateExerciseState(item.id, { notes: e.target.value })
            }
            rows={2}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none ring-0 placeholder:text-zinc-500"
            placeholder="Optional session note"
          />
        </label>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {buildExercises.length > 0 ? (
        <section className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
              Build
            </p>
            <h2 className="mt-2 text-2xl font-bold text-white">
              Build the movement pattern
            </h2>
          </div>

          <div className="space-y-4">
            {buildExercises.map((item) => renderDrillCard(item))}
          </div>
        </section>
      ) : null}

      {applyExercises.length > 0 ? (
        <section className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
              Apply
            </p>
            <h2 className="mt-2 text-2xl font-bold text-white">
              Transfer it into the swing
            </h2>
          </div>

          <div className="space-y-4">
            {applyExercises.map((item) => renderDrillCard(item))}
          </div>
        </section>
      ) : null}

      {challengeExercise ? (
        <section className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-lime-400">
              Compete
            </p>
            <h2 className="mt-2 text-2xl font-bold text-white">
              Finish with the challenge
            </h2>
          </div>

          {renderDrillCard(challengeExercise, 'challenge')}
        </section>
      ) : null}

      {statusMessage ? (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm font-medium ${
            statusType === 'success'
              ? 'border-lime-400/50 bg-lime-400/10 text-lime-300'
              : 'border-red-500/50 bg-red-500/10 text-red-300'
          }`}
        >
          {statusMessage}
        </div>
      ) : null}

      <div className="sticky bottom-4 rounded-2xl border border-zinc-800 bg-black/90 p-4 backdrop-blur">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSaving}
          className="w-full rounded-2xl bg-lime-400 px-6 py-4 text-lg font-bold text-black transition hover:bg-lime-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? 'Saving Session...' : 'Finish Session'}
        </button>
      </div>
    </div>
  );
}