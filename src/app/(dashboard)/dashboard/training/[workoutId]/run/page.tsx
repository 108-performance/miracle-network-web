import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import WorkoutRunner from '@/components/execution/WorkoutRunner';

type MetricSnapshot = {
  reps?: number | null;
  timeSeconds?: number | null;
  score?: number | null;
  exitVelocity?: number | null;
};

function buildMetricSnapshot(log: any): MetricSnapshot {
  return {
    reps: log?.actual_reps ?? null,
    timeSeconds: log?.actual_time_seconds ?? null,
    score: log?.actual_score ?? null,
    exitVelocity: log?.actual_exit_velocity ?? null,
  };
}

function getMetricValue(
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

function pickBestLog(logs: any[], metricType?: string | null) {
  if (!logs.length) return null;

  const validLogs = logs.filter((log) => {
    const value = getMetricValue(buildMetricSnapshot(log), metricType);
    return value != null;
  });

  if (!validLogs.length) return null;

  if (metricType === 'time') {
    return validLogs.reduce((best, current) => {
      const bestValue = getMetricValue(buildMetricSnapshot(best), metricType);
      const currentValue = getMetricValue(buildMetricSnapshot(current), metricType);

      if (bestValue == null) return current;
      if (currentValue == null) return best;

      return currentValue < bestValue ? current : best;
    });
  }

  return validLogs.reduce((best, current) => {
    const bestValue = getMetricValue(buildMetricSnapshot(best), metricType);
    const currentValue = getMetricValue(buildMetricSnapshot(current), metricType);

    if (bestValue == null) return current;
    if (currentValue == null) return best;

    return currentValue > bestValue ? current : best;
  });
}

export default async function RunWorkoutPage({
  params,
}: {
  params: Promise<{ workoutId: string }>;
}) {
  const { workoutId } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isGuest = !user;

  const { data: workout } = await supabase
    .from('workouts')
    .select('*')
    .eq('id', workoutId)
    .maybeSingle();

  if (!workout) notFound();

  const { data: exercisesData } = await supabase
    .from('workout_exercises')
    .select(`
      id,
      exercise_id,
      metric_type,
      prescribed_sets,
      prescribed_reps,
      prescribed_time_seconds,
      prescribed_score,
      prescribed_exit_velocity,
      instructions,
      notes,
      exercise:exercises (
        id,
        name,
        description,
        default_metric_type
      )
    `)
    .eq('workout_id', workoutId)
    .order('sort_order', { ascending: true });

  const exerciseIds = (exercisesData ?? [])
    .map((item: any) => item.exercise_id)
    .filter(Boolean);

  let logsByExerciseId = new Map<string, any[]>();

  if (user && exerciseIds.length > 0) {
    const { data: exerciseLogs } = await supabase
      .from('exercise_logs')
      .select(`
        exercise_id,
        actual_reps,
        actual_time_seconds,
        actual_score,
        actual_exit_velocity,
        created_at
      `)
      .eq('user_id', user.id)
      .in('exercise_id', exerciseIds)
      .order('created_at', { ascending: false });

    logsByExerciseId = new Map<string, any[]>();

    for (const log of exerciseLogs ?? []) {
      const existing = logsByExerciseId.get(log.exercise_id) ?? [];
      existing.push(log);
      logsByExerciseId.set(log.exercise_id, existing);
    }
  }

  const exercises = (exercisesData ?? []).map((item: any) => {
    const ex = Array.isArray(item.exercise) ? item.exercise[0] : item.exercise;

    const metricType = item.metric_type ?? ex?.default_metric_type ?? 'reps';
    const exerciseLogs = logsByExerciseId.get(item.exercise_id) ?? [];

    const lastLog = exerciseLogs[0] ?? null;
    const bestLog = pickBestLog(exerciseLogs, metricType);

    return {
      id: item.id,
      workoutExerciseId: item.id,
      exerciseId: item.exercise_id,
      name: ex?.name ?? 'Exercise',
      description: ex?.description ?? null,
      instructions: item.instructions ?? null,
      metricType,
      prescribedSets: item.prescribed_sets,
      prescribedReps: item.prescribed_reps,
      prescribedTimeSeconds: item.prescribed_time_seconds,
      prescribedScore: item.prescribed_score,
      prescribedExitVelocity: item.prescribed_exit_velocity,
      lastResult: lastLog ? buildMetricSnapshot(lastLog) : null,
      bestResult: bestLog ? buildMetricSnapshot(bestLog) : null,
      content: [],
    };
  });

  return (
    <main className="min-h-screen bg-black px-6 py-6 text-white">
      <div className="mx-auto max-w-xl">
        <WorkoutRunner
          workoutId={workout.id}
          title={workout.title ?? 'Workout'}
          exercises={exercises}
          isGuest={isGuest}
          autoStart={true}
        />
      </div>
    </main>
  );
}