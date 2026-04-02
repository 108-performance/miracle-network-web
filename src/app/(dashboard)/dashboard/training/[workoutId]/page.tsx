import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import WorkoutRunner from '@/components/execution/WorkoutRunner';

type WorkoutDetailPageProps = {
  params: Promise<{
    workoutId: string;
  }>;
};

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

type ExerciseProgressionRow = {
  exercise_id: string;
  actual_sets: number | null;
  actual_reps: number | null;
  actual_time_seconds: number | null;
  actual_score: number | null;
  actual_exit_velocity: number | null;
  completed: boolean;
  created_at: string;
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

type ContentPost = {
  id: string;
  title: string | null;
  description: string | null;
  content_type: 'video' | 'gif' | 'image' | 'pdf' | string;
  status: 'draft' | 'published' | string;
  audience: 'athletes' | 'coaches' | 'both' | string;
  training_program_id: string | null;
  workout_id: string | null;
  exercise_id: string | null;
  external_url: string | null;
  file_url: string | null;
  short_text: string | null;
  is_primary: boolean | null;
  sort_order: number | null;
  thumbnail_url: string | null;
  created_at: string | null;
};

function buildProgressionByExerciseId(
  rows: ExerciseProgressionRow[]
): Record<string, ExerciseProgression> {
  const grouped = new Map<string, ExerciseProgressionRow[]>();

  for (const row of rows) {
    const existing = grouped.get(row.exercise_id) ?? [];
    existing.push(row);
    grouped.set(row.exercise_id, existing);
  }

  const result: Record<string, ExerciseProgression> = {};

  for (const [exerciseId, logs] of grouped.entries()) {
    const sorted = [...logs].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    const completedLogs = sorted.filter((log) => log.completed);

    const best = {
      actual_score:
        completedLogs.length > 0
          ? Math.max(
              ...completedLogs
                .map((log) => log.actual_score)
                .filter((value): value is number => value != null),
              0
            ) || null
          : null,
      actual_exit_velocity:
        completedLogs.length > 0
          ? Math.max(
              ...completedLogs
                .map((log) => log.actual_exit_velocity)
                .filter((value): value is number => value != null),
              0
            ) || null
          : null,
      actual_reps:
        completedLogs.length > 0
          ? Math.max(
              ...completedLogs
                .map((log) => log.actual_reps)
                .filter((value): value is number => value != null),
              0
            ) || null
          : null,
      actual_time_seconds:
        completedLogs.length > 0
          ? Math.max(
              ...completedLogs
                .map((log) => log.actual_time_seconds)
                .filter((value): value is number => value != null),
              0
            ) || null
          : null,
    };

    result[exerciseId] = {
      last: sorted[0] ?? null,
      best,
      completionCount: completedLogs.length,
    };
  }

  return result;
}

function getExerciseRecord(
  exercise: ExerciseRecord | ExerciseRecord[] | null
): ExerciseRecord | null {
  if (!exercise) return null;
  return Array.isArray(exercise) ? exercise[0] ?? null : exercise;
}

export default async function WorkoutDetailPage({
  params,
}: WorkoutDetailPageProps) {
  const resolvedParams = await params;
  const workoutId = resolvedParams?.workoutId;

  if (!workoutId || workoutId === 'undefined') {
    notFound();
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isGuest = !user;

  let athlete:
    | {
        id: string;
        first_name: string | null;
        last_name: string | null;
      }
    | null = null;

  if (user) {
    const { data } = await supabase
      .from('athletes')
      .select('id, first_name, last_name')
      .eq('user_id', user.id)
      .maybeSingle();

    athlete = data;
  }

  const { data: workout } = await supabase
    .from('workouts')
    .select(
      'id, title, description, difficulty_level, day_order, training_program_id'
    )
    .eq('id', workoutId)
    .maybeSingle();

  if (!workout) {
    notFound();
  }

  const { data: workoutExercisesData } = await supabase
    .from('workout_exercises')
    .select(`
      id,
      workout_id,
      exercise_id,
      sort_order,
      prescribed_sets,
      prescribed_reps,
      prescribed_time_seconds,
      prescribed_score,
      prescribed_exit_velocity,
      metric_type,
      instructions,
      notes,
      is_required,
      exercise:exercises (
        id,
        name,
        category,
        description,
        default_metric_type
      )
    `)
    .eq('workout_id', workoutId)
    .order('sort_order', { ascending: true });

  const workoutExercises = (workoutExercisesData ?? []) as WorkoutExercise[];
  const exerciseIds = workoutExercises.map((item) => item.exercise_id);

  const { data: contentPostsData } = await supabase
    .from('content_posts')
    .select(
      'id, title, description, content_type, status, audience, training_program_id, workout_id, exercise_id, external_url, file_url, short_text, is_primary, sort_order, thumbnail_url, created_at'
    )
    .eq('status', 'published')
    .in('audience', ['athletes', 'both'])
    .or(
      [
        `workout_id.eq.${workout.id}`,
        workout.training_program_id
          ? `training_program_id.eq.${workout.training_program_id}`
          : null,
        exerciseIds.length > 0
          ? `exercise_id.in.(${exerciseIds.join(',')})`
          : null,
      ]
        .filter(Boolean)
        .join(',')
    )
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  const contentPosts = (contentPostsData ?? []) as ContentPost[];

  const exerciseContentById =
    exerciseIds.reduce<Record<string, ContentPost | null>>(
      (acc, exerciseId) => {
        const contentForExercise =
          contentPosts.find((content) => content.exercise_id === exerciseId) ??
          null;

        acc[exerciseId] = contentForExercise;
        return acc;
      },
      {}
    );

  let progressionByExerciseId: Record<string, ExerciseProgression> = {};

  if (athlete?.id && exerciseIds.length > 0) {
    const { data: progressionRows } = await supabase
      .from('exercise_logs')
      .select(
        'exercise_id, actual_sets, actual_reps, actual_time_seconds, actual_score, actual_exit_velocity, completed, created_at'
      )
      .eq('athlete_id', athlete.id)
      .in('exercise_id', exerciseIds)
      .order('created_at', { ascending: false });

    progressionByExerciseId = buildProgressionByExerciseId(
      (progressionRows ?? []) as ExerciseProgressionRow[]
    );
  }

  const runnerExercises = workoutExercises.map((item) => {
    const exercise = getExerciseRecord(item.exercise);
    const progression = progressionByExerciseId[item.exercise_id];
    const content = exerciseContentById[item.exercise_id];

    return {
      id: item.id,
      workoutExerciseId: item.id,
      exerciseId: item.exercise_id,
      name: exercise?.name ?? 'Exercise',
      description: exercise?.description ?? null,
      instructions: item.instructions ?? null,
      metricType: item.metric_type ?? exercise?.default_metric_type ?? 'reps',
      prescribedSets: item.prescribed_sets,
      prescribedReps: item.prescribed_reps,
      prescribedTimeSeconds: item.prescribed_time_seconds,
      prescribedScore: item.prescribed_score,
      prescribedExitVelocity: item.prescribed_exit_velocity,
      prescribedYards: null,
      lastResult: {
        reps: progression?.last?.actual_reps ?? null,
        timeSeconds: progression?.last?.actual_time_seconds ?? null,
        score: progression?.last?.actual_score ?? null,
        exitVelocity: progression?.last?.actual_exit_velocity ?? null,
      },
      bestResult: {
        reps: progression?.best?.actual_reps ?? null,
        timeSeconds: progression?.best?.actual_time_seconds ?? null,
        score: progression?.best?.actual_score ?? null,
        exitVelocity: progression?.best?.actual_exit_velocity ?? null,
      },
      content: content
        ? [
            {
              title: content.title ?? 'Exercise Demo',
              url: content.external_url || content.file_url,
            },
          ]
        : [],
    };
  });

  return (
    <main className="min-h-screen bg-black px-6 py-8 text-white">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6">
          <Link
            href={
              isGuest
                ? '/dashboard/compete/108-athlete-challenge'
                : '/dashboard/training'
            }
            className="inline-block text-sm font-semibold text-zinc-300 no-underline"
          >
            ← Back
          </Link>
        </div>

        <div className="mb-6 rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-lime-400">
            {isGuest ? 'Guest Session' : 'Workout Session'}
          </p>
          <h1 className="mt-2 text-3xl font-extrabold text-white">
            {workout.title ?? 'Workout Session'}
          </h1>
          <p className="mt-3 text-sm text-zinc-400">
            {workout.description ?? 'Move through one drill at a time.'}
          </p>
        </div>

        <WorkoutRunner
          workoutId={workout.id}
          title={workout.title ?? 'Workout Session'}
          exercises={runnerExercises}
          isGuest={isGuest}
        />
      </div>
    </main>
  );
}