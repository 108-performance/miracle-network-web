import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

type WorkoutLogRow = {
  id: string;
  workout_id: string;
  completed_at: string | null;
  created_at: string;
};

type WorkoutRow = {
  id: string;
  title: string | null;
  description: string | null;
};

type ExerciseLogRow = {
  id: string;
  exercise_id: string;
  actual_reps: number | null;
  actual_time_seconds: number | null;
  actual_score: number | null;
  actual_exit_velocity: number | null;
  completed: boolean;
  created_at: string;
};

type MetricKey = 'reps' | 'time' | 'score' | 'exitVelocity' | null;

type WorkoutHistoryItem = {
  workoutLogId: string;
  workoutId: string;
  workoutTitle: string;
  workoutDescription: string | null;
  completedAt: string | null;
  completedExercises: number;
  prCount: number;
  improvedCount: number;
};

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

async function buildWorkoutHistoryItem(
  supabase: Awaited<ReturnType<typeof createClient>>,
  athleteId: string,
  workoutLog: WorkoutLogRow,
  workoutMap: Map<string, WorkoutRow>
): Promise<WorkoutHistoryItem> {
  const workout = workoutMap.get(workoutLog.workout_id);

  const { data: exerciseLogs } = await supabase
    .from('exercise_logs')
    .select(
      'id, exercise_id, actual_reps, actual_time_seconds, actual_score, actual_exit_velocity, completed, created_at'
    )
    .eq('athlete_id', athleteId)
    .eq('workout_log_id', workoutLog.id)
    .eq('completed', true)
    .order('created_at', { ascending: true });

  const completedExerciseLogs = (exerciseLogs ?? []) as ExerciseLogRow[];

  let prCount = 0;
  let improvedCount = 0;

  for (const currentLog of completedExerciseLogs) {
    const { metric, value: currentValue } =
      getPrimaryMetricFromExerciseLog(currentLog);

    if (!metric || currentValue == null) {
      continue;
    }

    const { data: priorLogs } = await supabase
      .from('exercise_logs')
      .select(
        'id, exercise_id, actual_reps, actual_time_seconds, actual_score, actual_exit_velocity, completed, created_at'
      )
      .eq('athlete_id', athleteId)
      .eq('exercise_id', currentLog.exercise_id)
      .eq('completed', true)
      .neq('workout_log_id', workoutLog.id)
      .order('created_at', { ascending: false });

    const comparableHistory = ((priorLogs ?? []) as ExerciseLogRow[])
      .map((log) => getMetricValueFromExerciseLog(log, metric))
      .filter((value): value is number => value != null);

    if (comparableHistory.length === 0) {
      continue;
    }

    const lastValue = comparableHistory[0];
    const bestValue = Math.max(...comparableHistory);

    if (currentValue > lastValue) {
      improvedCount += 1;
    }

    if (currentValue > bestValue) {
      prCount += 1;
    }
  }

  return {
    workoutLogId: workoutLog.id,
    workoutId: workoutLog.workout_id,
    workoutTitle: workout?.title ?? 'Untitled Workout',
    workoutDescription: workout?.description ?? null,
    completedAt: workoutLog.completed_at,
    completedExercises: completedExerciseLogs.length,
    prCount,
    improvedCount,
  };
}

export default async function WorkoutHistoryPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: athlete } = await supabase
    .from('athletes')
    .select('id, first_name, last_name')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!athlete?.id) {
    return (
      <div style={{ display: 'grid', gap: 20 }}>
        <h1 style={{ margin: 0 }}>Workout History</h1>
        <p style={{ margin: 0, color: '#666' }}>
          No athlete profile found.
        </p>
        <Link href="/dashboard/training">Back to Training</Link>
      </div>
    );
  }

  const { data: workoutLogs } = await supabase
    .from('workout_logs')
    .select('id, workout_id, completed_at, created_at')
    .eq('athlete_id', athlete.id)
    .not('completed_at', 'is', null)
    .order('completed_at', { ascending: false });

  const typedWorkoutLogs = (workoutLogs ?? []) as WorkoutLogRow[];

  const workoutIds = Array.from(
    new Set(
      typedWorkoutLogs
        .map((log) => log.workout_id)
        .filter((workoutId): workoutId is string => Boolean(workoutId))
    )
  );

  let workoutMap = new Map<string, WorkoutRow>();

  if (workoutIds.length > 0) {
    const { data: workouts } = await supabase
      .from('workouts')
      .select('id, title, description')
      .in('id', workoutIds);

    workoutMap = new Map(
      ((workouts ?? []) as WorkoutRow[]).map((workout) => [workout.id, workout])
    );
  }

  const historyItems: WorkoutHistoryItem[] = [];

  for (const workoutLog of typedWorkoutLogs) {
    const item = await buildWorkoutHistoryItem(
      supabase,
      athlete.id,
      workoutLog,
      workoutMap
    );

    historyItems.push(item);
  }

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
          History
        </p>

        <h1 style={{ margin: 0 }}>Workout History</h1>

        <p style={{ margin: 0, color: '#666' }}>
          Review your completed sessions, performance gains, and recent progress.
        </p>

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 4 }}>
          <Link href="/dashboard/training">Back to Training</Link>
          <Link href="/dashboard">Back to Dashboard</Link>
        </div>
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
        {historyItems.length > 0 ? (
          historyItems.map((item) => (
            <Link
              key={item.workoutLogId}
              href={`/dashboard/history/${item.workoutLogId}`}
              style={{
                textDecoration: 'none',
                color: '#111',
                border: '1px solid #e5e5e5',
                borderRadius: 16,
                padding: 18,
                background: '#fafafa',
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
                  <strong style={{ fontSize: 18 }}>{item.workoutTitle}</strong>
                  <span style={{ color: '#666', fontSize: 14 }}>
                    {item.workoutDescription ?? 'No description'}
                  </span>
                </div>

                <span style={{ color: '#666', fontSize: 14 }}>
                  {formatWorkoutDate(item.completedAt)}
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 16,
                  color: '#4b5563',
                  fontSize: 14,
                }}
              >
                <span>
                  <strong>Exercises:</strong> {item.completedExercises}
                </span>
                <span>
                  <strong>PRs:</strong> {item.prCount}
                </span>
                <span>
                  <strong>Improvements:</strong> {item.improvedCount}
                </span>
              </div>
            </Link>
          ))
        ) : (
          <p style={{ margin: 0, color: '#666' }}>
            No completed workout history yet.
          </p>
        )}
      </section>
    </div>
  );
}