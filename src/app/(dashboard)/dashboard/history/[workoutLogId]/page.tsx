import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

type WorkoutLogPageProps = {
  params: Promise<{
    workoutLogId: string;
  }>;
};

type WorkoutLogRow = {
  id: string;
  athlete_id: string;
  workout_id: string;
  notes: string | null;
  completed_at: string | null;
  created_at: string;
};

type WorkoutRow = {
  id: string;
  title: string | null;
  description: string | null;
};

type ExerciseRow = {
  id: string;
  name: string | null;
  description: string | null;
};

type ExerciseLogRow = {
  id: string;
  exercise_id: string;
  actual_sets: number | null;
  actual_reps: number | null;
  actual_time_seconds: number | null;
  actual_score: number | null;
  actual_exit_velocity: number | null;
  completed: boolean;
  notes: string | null;
  created_at: string;
  exercise: ExerciseRow | ExerciseRow[] | null;
};

type MetricKey = 'reps' | 'time' | 'score' | 'exitVelocity' | null;

function getExerciseObject(
  exercise: ExerciseLogRow['exercise']
): ExerciseRow | null {
  if (!exercise) return null;
  return Array.isArray(exercise) ? exercise[0] ?? null : exercise;
}

function getPrimaryMetricFromExerciseLog(log: {
  actual_reps: number | null;
  actual_time_seconds: number | null;
  actual_score: number | null;
  actual_exit_velocity: number | null;
}): { metric: MetricKey; value: number | null } {
  if (log.actual_reps != null) {
    return { metric: 'reps', value: log.actual_reps };
  }

  if (log.actual_time_seconds != null) {
    return { metric: 'time', value: log.actual_time_seconds };
  }

  if (log.actual_score != null) {
    return { metric: 'score', value: log.actual_score };
  }

  if (log.actual_exit_velocity != null) {
    return { metric: 'exitVelocity', value: log.actual_exit_velocity };
  }

  return { metric: null, value: null };
}

function getMetricValueFromExerciseLog(
  log: ExerciseLogRow,
  metric: MetricKey
): number | null {
  if (!metric) return null;

  switch (metric) {
    case 'reps':
      return log.actual_reps;
    case 'time':
      return log.actual_time_seconds;
    case 'score':
      return log.actual_score;
    case 'exitVelocity':
      return log.actual_exit_velocity;
    default:
      return null;
  }
}

function formatWorkoutDate(dateString: string | null) {
  if (!dateString) return 'No completion date';

  const date = new Date(dateString);

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function formatMetricValue(metric: MetricKey, value: number | null) {
  if (value == null) return '—';

  switch (metric) {
    case 'reps':
      return `${value} reps`;
    case 'time':
      return `${value}s`;
    case 'score':
      return `score ${value}`;
    case 'exitVelocity':
      return `${value} EV`;
    default:
      return String(value);
  }
}

function formatDelta(metric: MetricKey, delta: number | null) {
  if (delta == null) return null;

  switch (metric) {
    case 'reps':
      return `${delta > 0 ? '+' : ''}${delta} reps`;
    case 'time':
      return `${delta > 0 ? '+' : ''}${delta}s`;
    case 'score':
      return `${delta > 0 ? '+' : ''}${delta} score`;
    case 'exitVelocity':
      return `${delta > 0 ? '+' : ''}${delta} EV`;
    default:
      return `${delta > 0 ? '+' : ''}${delta}`;
  }
}

function getFeedbackState(item: {
  isPR: boolean;
  improved: boolean;
  matchedBest: boolean;
  firstEntry: boolean;
  delta: number | null;
}) {
  if (item.isPR) return 'New PR';
  if (item.firstEntry) return 'First recorded result';
  if (item.improved) return 'Improved from last session';
  if (item.matchedBest) return 'Matched best';
  if (item.delta != null && item.delta < 0) return 'Below last session';
  if (item.delta === 0) return 'Unchanged from last session';
  return 'Result recorded';
}

function getFeedbackStyles(item: {
  isPR: boolean;
  improved: boolean;
  matchedBest: boolean;
  firstEntry: boolean;
}) {
  if (item.isPR) {
    return {
      border: '1px solid #d4af37',
      background: '#fff8db',
      badgeBg: '#f5d76e',
      badgeColor: '#111',
    };
  }

  if (item.improved) {
    return {
      border: '1px solid #b7e4c7',
      background: '#f1fff5',
      badgeBg: '#d3f9d8',
      badgeColor: '#14532d',
    };
  }

  if (item.matchedBest) {
    return {
      border: '1px solid #d9d9d9',
      background: '#fafafa',
      badgeBg: '#efefef',
      badgeColor: '#333',
    };
  }

  if (item.firstEntry) {
    return {
      border: '1px solid #cfe2ff',
      background: '#f4f8ff',
      badgeBg: '#dce9ff',
      badgeColor: '#1d4ed8',
    };
  }

  return {
    border: '1px solid #f0d0d0',
    background: '#fff7f7',
    badgeBg: '#f8d7da',
    badgeColor: '#7f1d1d',
  };
}

export default async function WorkoutHistoryDetailPage({
  params,
}: WorkoutLogPageProps) {
  const resolvedParams = await params;
  const workoutLogId = resolvedParams?.workoutLogId;

  if (!workoutLogId) {
    notFound();
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: athlete } = await supabase
    .from('athletes')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!athlete?.id) {
    notFound();
  }

  const { data: workoutLog } = await supabase
    .from('workout_logs')
    .select('id, athlete_id, workout_id, notes, completed_at, created_at')
    .eq('id', workoutLogId)
    .eq('athlete_id', athlete.id)
    .maybeSingle<WorkoutLogRow>();

  if (!workoutLog) {
    notFound();
  }

  const { data: workout } = await supabase
    .from('workouts')
    .select('id, title, description')
    .eq('id', workoutLog.workout_id)
    .maybeSingle<WorkoutRow>();

  const { data: exerciseLogs } = await supabase
    .from('exercise_logs')
    .select(
      `
      id,
      exercise_id,
      actual_sets,
      actual_reps,
      actual_time_seconds,
      actual_score,
      actual_exit_velocity,
      completed,
      notes,
      created_at,
      exercise:exercises (
        id,
        name,
        description
      )
    `
    )
    .eq('workout_log_id', workoutLog.id)
    .eq('athlete_id', athlete.id)
    .order('created_at', { ascending: true });

  const completedExerciseLogs = ((exerciseLogs ?? []) as ExerciseLogRow[]).filter(
    (log) => log.completed
  );

  const exerciseFeedback = [];

  for (const currentLog of completedExerciseLogs) {
    const exercise = getExerciseObject(currentLog.exercise);
    const { metric, value: currentValue } =
      getPrimaryMetricFromExerciseLog(currentLog);

    const { data: priorLogs } = await supabase
      .from('exercise_logs')
      .select(
        'id, exercise_id, actual_sets, actual_reps, actual_time_seconds, actual_score, actual_exit_velocity, completed, notes, created_at'
      )
      .eq('athlete_id', athlete.id)
      .eq('exercise_id', currentLog.exercise_id)
      .eq('completed', true)
      .neq('workout_log_id', workoutLog.id)
      .order('created_at', { ascending: false });

    const typedPriorLogs = (priorLogs ?? []) as ExerciseLogRow[];

    const comparableHistory = typedPriorLogs
      .map((log) => getMetricValueFromExerciseLog(log, metric))
      .filter((value): value is number => value != null);

    const hasHistory = comparableHistory.length > 0;
    const lastValue = hasHistory ? comparableHistory[0] : null;
    const bestValue = hasHistory ? Math.max(...comparableHistory) : null;
    const firstEntry = !hasHistory;
    const delta =
      lastValue != null && currentValue != null ? currentValue - lastValue : null;
    const improved = delta != null && delta > 0;
    const isPR =
      hasHistory &&
      bestValue != null &&
      currentValue != null &&
      currentValue > bestValue;
    const matchedBest =
      hasHistory &&
      bestValue != null &&
      currentValue != null &&
      currentValue === bestValue;

    exerciseFeedback.push({
      exerciseId: currentLog.exercise_id,
      exerciseName: exercise?.name ?? 'Unnamed Exercise',
      exerciseDescription: exercise?.description ?? null,
      actualSets: currentLog.actual_sets,
      current: currentValue,
      last: lastValue,
      best: bestValue,
      delta,
      metric,
      isPR,
      improved,
      matchedBest,
      firstEntry,
      notes: currentLog.notes,
    });
  }

  const summary = {
    completedExercises: completedExerciseLogs.length,
    prCount: exerciseFeedback.filter((item) => item.isPR).length,
    improvedCount: exerciseFeedback.filter((item) => item.improved).length,
  };

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      <section
        style={{
          background: '#fff',
          border: '1px solid #e5e5e5',
          borderRadius: 20,
          padding: 24,
          display: 'grid',
          gap: 10,
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 12,
            fontWeight: 700,
            color: '#777',
            textTransform: 'uppercase',
          }}
        >
          Workout Detail
        </p>

        <h1 style={{ margin: 0 }}>
          {workout?.title ?? 'Untitled Workout'}
        </h1>

        <p style={{ margin: 0, color: '#666' }}>
          {workout?.description ?? 'No description'}
        </p>

        <p style={{ margin: 0, color: '#666' }}>
          Completed: {formatWorkoutDate(workoutLog.completed_at)}
        </p>

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 4 }}>
          <Link href="/dashboard/history">Back to History</Link>
          <Link href="/dashboard/training">Back to Training</Link>
        </div>
      </section>

      <section
        style={{
          background: '#fff',
          border: '1px solid #e5e5e5',
          borderRadius: 20,
          padding: 24,
          display: 'grid',
          gap: 12,
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 12,
            fontWeight: 700,
            color: '#777',
            textTransform: 'uppercase',
          }}
        >
          Session Summary
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 12,
          }}
        >
          <div
            style={{
              border: '1px solid #e5e5e5',
              borderRadius: 12,
              padding: 14,
              background: '#fafafa',
            }}
          >
            <p style={{ margin: 0, fontSize: 12, color: '#777', fontWeight: 700 }}>
              EXERCISES COMPLETED
            </p>
            <p style={{ margin: '8px 0 0', fontSize: 24, fontWeight: 700 }}>
              {summary.completedExercises}
            </p>
          </div>

          <div
            style={{
              border: '1px solid #e5e5e5',
              borderRadius: 12,
              padding: 14,
              background: '#fafafa',
            }}
          >
            <p style={{ margin: 0, fontSize: 12, color: '#777', fontWeight: 700 }}>
              PRS
            </p>
            <p style={{ margin: '8px 0 0', fontSize: 24, fontWeight: 700 }}>
              {summary.prCount}
            </p>
          </div>

          <div
            style={{
              border: '1px solid #e5e5e5',
              borderRadius: 12,
              padding: 14,
              background: '#fafafa',
            }}
          >
            <p style={{ margin: 0, fontSize: 12, color: '#777', fontWeight: 700 }}>
              IMPROVEMENTS
            </p>
            <p style={{ margin: '8px 0 0', fontSize: 24, fontWeight: 700 }}>
              {summary.improvedCount}
            </p>
          </div>
        </div>

        {workoutLog.notes && (
          <div
            style={{
              marginTop: 4,
              padding: 14,
              borderRadius: 12,
              border: '1px solid #e5e5e5',
              background: '#fafafa',
            }}
          >
            <p style={{ margin: 0, fontWeight: 700 }}>Workout Notes</p>
            <p style={{ margin: '6px 0 0', color: '#666' }}>{workoutLog.notes}</p>
          </div>
        )}
      </section>

      <section
        style={{
          background: '#fff',
          border: '1px solid #e5e5e5',
          borderRadius: 20,
          padding: 24,
          display: 'grid',
          gap: 16,
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 12,
            fontWeight: 700,
            color: '#777',
            textTransform: 'uppercase',
          }}
        >
          Exercise Results
        </p>

        {exerciseFeedback.length > 0 ? (
          exerciseFeedback.map((item) => {
            const styles = getFeedbackStyles(item);

            return (
              <div
                key={item.exerciseId}
                style={{
                  border: styles.border,
                  background: styles.background,
                  borderRadius: 16,
                  padding: 18,
                  display: 'grid',
                  gap: 10,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 12,
                    flexWrap: 'wrap',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ display: 'grid', gap: 4 }}>
                    <strong style={{ fontSize: 18 }}>{item.exerciseName}</strong>
                    <span style={{ color: '#666', fontSize: 14 }}>
                      {item.exerciseDescription ?? 'No description'}
                    </span>
                  </div>

                  <span
                    style={{
                      padding: '4px 8px',
                      borderRadius: 999,
                      background: styles.badgeBg,
                      color: styles.badgeColor,
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    {getFeedbackState(item)}
                  </span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 14,
                    color: '#4b5563',
                    fontSize: 14,
                  }}
                >
                  {item.actualSets != null && (
                    <span>
                      <strong>Sets:</strong> {item.actualSets}
                    </span>
                  )}

                  <span>
                    <strong>Current:</strong> {formatMetricValue(item.metric, item.current)}
                  </span>

                  <span>
                    <strong>Last:</strong> {formatMetricValue(item.metric, item.last)}
                  </span>

                  <span>
                    <strong>Best:</strong> {formatMetricValue(item.metric, item.best)}
                  </span>

                  {item.delta != null && (
                    <span>
                      <strong>Delta:</strong> {formatDelta(item.metric, item.delta)}
                    </span>
                  )}
                </div>

                {item.notes && (
                  <div
                    style={{
                      padding: 12,
                      borderRadius: 12,
                      background: 'rgba(255,255,255,0.7)',
                      border: '1px solid rgba(0,0,0,0.06)',
                    }}
                  >
                    <p style={{ margin: 0, fontWeight: 700 }}>Exercise Notes</p>
                    <p style={{ margin: '6px 0 0', color: '#666' }}>{item.notes}</p>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <p style={{ margin: 0, color: '#666' }}>
            No completed exercise logs found for this workout.
          </p>
        )}
      </section>
    </div>
  );
}