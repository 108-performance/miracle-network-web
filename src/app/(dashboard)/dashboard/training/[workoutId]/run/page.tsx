import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import WorkoutRunner from '@/components/execution/WorkoutRunner';

type ExerciseRecord = {
  id: string;
  name: string;
  category?: string | null;
  description: string | null;
  default_metric_type: string | null;
};

type WorkoutExercise = {
  id: string;
  workout_id: string;
  exercise_id: string;
  sort_order?: number;
  prescribed_sets: number | null;
  prescribed_reps: number | null;
  prescribed_time_seconds: number | null;
  prescribed_score: number | null;
  prescribed_exit_velocity: number | null;
  metric_type: 'reps' | 'time' | 'score' | 'exit_velocity' | 'mixed' | string;
  instructions: string | null;
  notes?: string | null;
  is_required?: boolean;
  exercise: ExerciseRecord | ExerciseRecord[] | null;
};

type ExerciseProgressionRow = {
  exercise_id: string;
  actual_sets: number | null;
  actual_reps: number | null;
  actual_time_seconds: number | null;
  actual_score: number | null;
  actual_exit_velocity: number | null;
  completed?: boolean;
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
  intel_type?: string | null;
  system_key?: string | null;
};

function normalizeMetricType(metricType?: string | null) {
  const normalized = (metricType ?? '').toLowerCase().trim();

  if (
    normalized === 'time' ||
    normalized === 'seconds' ||
    normalized === 'time_seconds' ||
    normalized === 'duration'
  ) {
    return 'time';
  }

  if (normalized === 'score' || normalized === 'points') {
    return 'score';
  }

  if (
    normalized === 'exit_velocity' ||
    normalized === 'exit velocity' ||
    normalized === 'exit-velocity' ||
    normalized === 'ev'
  ) {
    return 'exit_velocity';
  }

  if (normalized === 'mixed') {
    return 'mixed';
  }

  return 'reps';
}

function buildProgressionByExerciseId(
  rows: ExerciseProgressionRow[],
  metricTypeByExerciseId: Record<string, string>
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

    const metricType = normalizeMetricType(metricTypeByExerciseId[exerciseId]);

    const repsLogs = sorted.filter(
      (log) => log.actual_reps != null && log.actual_reps >= 0
    );
    const scoreLogs = sorted.filter(
      (log) => log.actual_score != null && log.actual_score >= 0
    );
    const evLogs = sorted.filter(
      (log) => log.actual_exit_velocity != null && log.actual_exit_velocity >= 0
    );
    const timeLogs = sorted.filter(
      (log) => log.actual_time_seconds != null && log.actual_time_seconds >= 0
    );

    const bestReps =
      repsLogs.length > 0
        ? Math.max(...repsLogs.map((log) => log.actual_reps as number))
        : null;

    const bestScore =
      scoreLogs.length > 0
        ? Math.max(...scoreLogs.map((log) => log.actual_score as number))
        : null;

    const bestExitVelocity =
      evLogs.length > 0
        ? Math.max(...evLogs.map((log) => log.actual_exit_velocity as number))
        : null;

    const bestTimeSeconds =
      timeLogs.length > 0
        ? Math.min(...timeLogs.map((log) => log.actual_time_seconds as number))
        : null;

    const best = {
      actual_score: bestScore,
      actual_exit_velocity: bestExitVelocity,
      actual_reps: bestReps,
      actual_time_seconds: bestTimeSeconds,
    };

    const lastValidLog =
      metricType === 'time'
        ? sorted.find(
            (log) =>
              log.actual_time_seconds != null && log.actual_time_seconds >= 0
          ) ?? null
        : metricType === 'score'
          ? sorted.find(
              (log) => log.actual_score != null && log.actual_score >= 0
            ) ?? null
          : metricType === 'exit_velocity'
            ? sorted.find(
                (log) =>
                  log.actual_exit_velocity != null &&
                  log.actual_exit_velocity >= 0
              ) ?? null
            : sorted.find(
                (log) => log.actual_reps != null && log.actual_reps >= 0
              ) ?? null;

    result[exerciseId] = {
      last: lastValidLog
        ? {
            actual_sets: lastValidLog.actual_sets ?? null,
            actual_reps: lastValidLog.actual_reps ?? null,
            actual_time_seconds: lastValidLog.actual_time_seconds ?? null,
            actual_score: lastValidLog.actual_score ?? null,
            actual_exit_velocity: lastValidLog.actual_exit_velocity ?? null,
            completed: lastValidLog.completed ?? true,
            created_at: lastValidLog.created_at,
          }
        : null,
      best,
      completionCount: sorted.filter((log) => log.completed ?? true).length,
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

function buildSessionSupportContent(
  contentPosts: ContentPost[],
  workoutId: string,
  trainingProgramId: string | null
) {
  const candidates = contentPosts.filter((content) => {
    const href = content.external_url || content.file_url;
    if (!href) return false;
    if (content.exercise_id) return false;
    if (content.intel_type === 'quick_action_intro') return false;
    return true;
  });

  const workoutMatch =
    candidates.find((content) => content.workout_id === workoutId) ?? null;

  if (workoutMatch) {
    return {
      title: workoutMatch.title ?? 'Support content',
      body:
        workoutMatch.short_text ??
        workoutMatch.description ??
        'Open this to support your session.',
      url: workoutMatch.external_url || workoutMatch.file_url,
      reasonLabel: 'Support for this session',
    };
  }

  const programMatch =
    candidates.find(
      (content) =>
        trainingProgramId && content.training_program_id === trainingProgramId
    ) ?? null;

  if (programMatch) {
    return {
      title: programMatch.title ?? 'Support content',
      body:
        programMatch.short_text ??
        programMatch.description ??
        'Open this to support your session.',
      url: programMatch.external_url || programMatch.file_url,
      reasonLabel: 'Built for your training path',
    };
  }

  const keyedMatch =
    candidates.find((content) =>
      ['pre_session', 'methodology', 'execution', 'focus'].includes(
        content.system_key ?? ''
      )
    ) ?? null;

  if (keyedMatch) {
    return {
      title: keyedMatch.title ?? 'Support content',
      body:
        keyedMatch.short_text ??
        keyedMatch.description ??
        'Open this to support your session.',
      url: keyedMatch.external_url || keyedMatch.file_url,
      reasonLabel: 'Support for this session',
    };
  }

  return null;
}

export default async function RunWorkoutPage({
  params,
}: {
  params: Promise<{ workoutId: string }>;
}) {
  const { workoutId } = await params;

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

  const metricTypeByExerciseId = workoutExercises.reduce<Record<string, string>>(
    (acc, item) => {
      const exercise = getExerciseRecord(item.exercise);
      acc[item.exercise_id] =
        item.metric_type ?? exercise?.default_metric_type ?? 'reps';
      return acc;
    },
    {}
  );

  const { data: contentPostsData } = await supabase
    .from('content_posts')
    .select(
      'id, title, description, content_type, status, audience, training_program_id, workout_id, exercise_id, external_url, file_url, short_text, is_primary, sort_order, thumbnail_url, created_at, intel_type, system_key'
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
    exerciseIds.reduce<Record<string, ContentPost | null>>((acc, exerciseId) => {
      const contentForExercise =
        contentPosts.find((content) => content.exercise_id === exerciseId) ??
        null;

      acc[exerciseId] = contentForExercise;
      return acc;
    }, {});

  const sessionSupportContent = buildSessionSupportContent(
    contentPosts,
    workout.id,
    workout.training_program_id ?? null
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
      (progressionRows ?? []) as ExerciseProgressionRow[],
      metricTypeByExerciseId
    );
  }

  const exercises = workoutExercises.map((item) => {
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
    <main className="min-h-screen bg-black px-6 py-6 text-white">
      <div className="mx-auto max-w-xl">
        <WorkoutRunner
          workoutId={workout.id}
          title={workout.title ?? 'Workout'}
          exercises={exercises}
          isGuest={isGuest}
          autoStart={true}
          sessionSupportContent={sessionSupportContent}
        />
      </div>
    </main>
  );
}