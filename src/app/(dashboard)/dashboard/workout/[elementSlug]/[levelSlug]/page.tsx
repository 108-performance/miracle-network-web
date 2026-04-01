import { createClient } from '@/lib/supabase/server';
import WorkoutSessionPage from './WorkoutSessionPage';

type ExerciseRow = {
  id: string;
  exercise_id: string;
  sort_order: number | null;
  metric_type: string | null;
  instructions: string | null;
  notes: string | null;
  prescribed_sets: number | null;
  prescribed_reps: number | null;
  prescribed_time_seconds: number | null;
  prescribed_score: number | null;
  prescribed_exit_velocity: number | null;
  prescribed_yards: number | null;
  exercise: {
    id: string;
    name: string;
    description?: string | null;
    default_metric_type?: string | null;
  } | null;
};

type ContentPost = {
  id: string;
  title: string;
  description: string | null;
  content_type: string | null;
  external_url: string | null;
  file_url: string | null;
  exercise_id: string | null;
  status: string | null;
};

type ExerciseLogRow = {
  id: string;
  exercise_id: string;
  actual_reps: number | null;
  actual_time_seconds: number | null;
  actual_score: number | null;
  actual_exit_velocity: number | null;
  created_at: string | null;
};

function extractLevel(levelSlug: string) {
  return parseInt(levelSlug.replace('level-', ''), 10);
}

function formatElementTitle(slug: string) {
  if (slug === 'force') return 'Force';
  if (slug === 'direction') return 'Direction';
  if (slug === 'efficiency') return 'Efficiency';
  if (slug === 'deceleration') return 'Deceleration';
  return 'Workout';
}

export default async function WorkoutLevelPage({
  params,
}: {
  params: Promise<{ elementSlug: string; levelSlug: string }>;
}) {
  const { elementSlug, levelSlug } = await params;

  const elementTitle = formatElementTitle(elementSlug);
  const levelNumber = extractLevel(levelSlug);

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let athleteId: string | null = null;

  if (user) {
    const { data: athlete } = await supabase
      .from('athletes')
      .select('id')
      .eq('user_id', user.id)
      .single();

    athleteId = athlete?.id ?? null;
  }

  const { data: program, error: programError } = await supabase
    .from('training_programs')
    .select('id, title')
    .eq('title', elementTitle)
    .single();

  if (programError) {
    console.error('WorkoutLevelPage program error:', programError);
  }

  if (!program) {
    return (
      <main className="min-h-screen bg-black px-6 py-8 text-white">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-3xl font-bold">{elementTitle} program not found</h1>
        </div>
      </main>
    );
  }

  const { data: workout, error: workoutError } = await supabase
    .from('workouts')
    .select('id, title, day_order, description')
    .eq('training_program_id', program.id)
    .eq('day_order', levelNumber)
    .single();

  if (workoutError) {
    console.error('WorkoutLevelPage workout error:', workoutError);
  }

  if (!workout) {
    return (
      <main className="min-h-screen bg-black px-6 py-8 text-white">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-3xl font-bold">
            No workout found for {elementTitle} Level {levelNumber}
          </h1>
        </div>
      </main>
    );
  }

  const { data: exercises, error: exercisesError } = await supabase
    .from('workout_exercises')
    .select(
      `
      id,
      exercise_id,
      sort_order,
      metric_type,
      instructions,
      notes,
      prescribed_sets,
      prescribed_reps,
      prescribed_time_seconds,
      prescribed_score,
      prescribed_exit_velocity,
      prescribed_yards,
      exercise:exercises (
        id,
        name,
        description,
        default_metric_type
      )
    `
    )
    .eq('workout_id', workout.id)
    .order('sort_order', { ascending: true });

  if (exercisesError) {
    console.error('WorkoutLevelPage exercises error:', exercisesError);
  }

  const safeExercises: ExerciseRow[] = (exercises ?? []).map((item: any) => ({
  id: item.id,
  exercise_id: item.exercise_id,
  sort_order: item.sort_order,
  metric_type: item.metric_type,
  instructions: item.instructions,
  notes: item.notes,
  prescribed_sets: item.prescribed_sets,
  prescribed_reps: item.prescribed_reps,
  prescribed_time_seconds: item.prescribed_time_seconds,
  prescribed_score: item.prescribed_score,
  prescribed_exit_velocity: item.prescribed_exit_velocity,
  prescribed_yards: item.prescribed_yards,
  exercise: Array.isArray(item.exercise) ? item.exercise[0] ?? null : item.exercise,
}));
  const exerciseIds = safeExercises.map((item) => item.exercise_id).filter(Boolean);

  let safeContentPosts: ContentPost[] = [];

  if (exerciseIds.length > 0) {
    const { data: contentPosts, error: contentError } = await supabase
      .from('content_posts')
      .select(
        'id, title, description, content_type, external_url, file_url, exercise_id, status'
      )
      .in('exercise_id', exerciseIds);

    if (contentError) {
      console.error('WorkoutLevelPage content error:', contentError);
    }

    safeContentPosts = (contentPosts ?? []) as ContentPost[];
  }

  const contentByExerciseId = new Map<string, ContentPost[]>();

  for (const post of safeContentPosts) {
    if (!post.exercise_id) continue;
    const existing = contentByExerciseId.get(post.exercise_id) ?? [];
    existing.push(post);
    contentByExerciseId.set(post.exercise_id, existing);
  }

  let safeExerciseLogs: ExerciseLogRow[] = [];

  if (athleteId && exerciseIds.length > 0) {
    const { data: logs, error: logsError } = await supabase
      .from('exercise_logs')
      .select(
        'id, exercise_id, actual_reps, actual_time_seconds, actual_score, actual_exit_velocity, created_at'
      )
      .eq('athlete_id', athleteId)
      .in('exercise_id', exerciseIds)
      .order('created_at', { ascending: false });

    if (logsError) {
      console.error('WorkoutLevelPage exercise_logs error:', logsError);
    }

    safeExerciseLogs = (logs ?? []) as ExerciseLogRow[];
  }

  const logsByExerciseId = new Map<string, ExerciseLogRow[]>();

  for (const log of safeExerciseLogs) {
    const existing = logsByExerciseId.get(log.exercise_id) ?? [];
    existing.push(log);
    logsByExerciseId.set(log.exercise_id, existing);
  }

  const formattedExercises = safeExercises.map((item) => {
    const linkedContent = contentByExerciseId.get(item.exercise_id) ?? [];
    const logs = logsByExerciseId.get(item.exercise_id) ?? [];

    const lastLog = logs[0] ?? null;

    const bestReps = logs.reduce<number | null>(
      (best, log) =>
        log.actual_reps == null ? best : best == null ? log.actual_reps : Math.max(best, log.actual_reps),
      null
    );

    const bestTimeSeconds = logs.reduce<number | null>(
      (best, log) =>
        log.actual_time_seconds == null
          ? best
          : best == null
          ? log.actual_time_seconds
          : Math.max(best, log.actual_time_seconds),
      null
    );

    const bestScore = logs.reduce<number | null>(
      (best, log) =>
        log.actual_score == null ? best : best == null ? log.actual_score : Math.max(best, log.actual_score),
      null
    );

    const bestExitVelocity = logs.reduce<number | null>(
      (best, log) =>
        log.actual_exit_velocity == null
          ? best
          : best == null
          ? log.actual_exit_velocity
          : Math.max(best, log.actual_exit_velocity),
      null
    );

    return {
      id: item.id,
      workoutExerciseId: item.id,
      exerciseId: item.exercise_id,
      name: item.exercise?.name ?? 'Exercise',
      description: item.exercise?.description ?? null,
      instructions: item.instructions ?? null,
      metricType: item.metric_type ?? item.exercise?.default_metric_type ?? 'reps',
      prescribedSets: item.prescribed_sets,
      prescribedReps: item.prescribed_reps,
      prescribedTimeSeconds: item.prescribed_time_seconds,
      prescribedScore: item.prescribed_score,
      prescribedExitVelocity: item.prescribed_exit_velocity,
      prescribedYards: item.prescribed_yards,
      lastResult: {
        reps: lastLog?.actual_reps ?? null,
        timeSeconds: lastLog?.actual_time_seconds ?? null,
        score: lastLog?.actual_score ?? null,
        exitVelocity: lastLog?.actual_exit_velocity ?? null,
      },
      bestResult: {
        reps: bestReps,
        timeSeconds: bestTimeSeconds,
        score: bestScore,
        exitVelocity: bestExitVelocity,
      },
      content: linkedContent.map((post) => ({
        title: post.title,
        url: post.external_url || post.file_url,
      })),
    };
  });

  return (
    <WorkoutSessionPage
      workoutId={workout.id}
      elementSlug={elementSlug}
      levelSlug={levelSlug}
      exercises={formattedExercises}
      title={workout.title}
    />
  );
}