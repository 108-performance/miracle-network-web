import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import WorkoutExecutionForm from '@/components/training/WorkoutExecutionForm';

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

function getAthleteFromWorkoutTitle(title: string | null): string {
  if (!title) return 'Athlete';
  const match = title.match(/Train Like\s+(.+)$/i);
  return match?.[1]?.trim() || 'Athlete';
}

function getWorkoutSubtitle(title: string | null): string {
  const athlete = getAthleteFromWorkoutTitle(title).toLowerCase();

  if (athlete.includes('jordan')) return 'Pure Power and Control';
  if (athlete.includes('aleena')) return 'Become a Ballstriker';
  if (athlete.includes('kk')) return 'Move Fast with Intent';
  if ((title ?? '').toLowerCase().includes('final')) return 'Challenge Day';

  return 'Elite Athlete Session';
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

function ContentCard({
  content,
  compact = false,
}: {
  content: ContentPost;
  compact?: boolean;
}) {
  const isVisual =
    content.content_type === 'image' || content.content_type === 'gif';
  const isPdf = content.content_type === 'pdf';
  const isVideo = content.content_type === 'video';

  return (
    <div
      className={`rounded-2xl border border-zinc-800 bg-zinc-950 ${
        compact ? 'p-3' : 'p-4'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
            {content.content_type}
          </p>
          <h3 className={`${compact ? 'mt-1 text-base' : 'mt-2 text-lg'} font-semibold text-white`}>
            {content.title ?? 'Untitled Content'}
          </h3>
          {content.description ? (
            <p className="mt-2 text-sm text-zinc-300">{content.description}</p>
          ) : null}
        </div>
      </div>

      {isVisual && content.file_url ? (
        <div className="mt-4 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
          <img
            src={content.file_url}
            alt={content.title ?? 'Content'}
            className="h-auto w-full object-cover"
          />
        </div>
      ) : null}

      {isVideo && content.external_url ? (
        <div className="mt-4">
          <a
            href={content.external_url}
            target="_blank"
            rel="noreferrer"
            className="inline-block rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black no-underline"
          >
            Watch Video
          </a>
        </div>
      ) : null}

      {isPdf && content.file_url ? (
        <div className="mt-4">
          <a
            href={content.file_url}
            target="_blank"
            rel="noreferrer"
            className="inline-block rounded-xl border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-200 no-underline"
          >
            Open PDF
          </a>
        </div>
      ) : null}

      {!content.file_url && !content.external_url ? (
        <p className="mt-4 text-sm text-zinc-500">No media attached yet.</p>
      ) : null}
    </div>
  );
}

function ExercisePreviewCard({
  item,
  exerciseContent,
}: {
  item: WorkoutExercise;
  exerciseContent: ContentPost[];
}) {
  const exercise = getExerciseRecord(item.exercise);

  if (!exercise) return null;

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
      <h3 className="text-lg font-semibold text-white">{exercise.name}</h3>
      <p className="mt-2 text-sm font-medium text-zinc-400">
        {formatPrescription(item)}
      </p>
      {item.notes ? (
        <p className="mt-3 text-sm text-zinc-300">{item.notes}</p>
      ) : null}

      {exerciseContent.length > 0 ? (
        <div className="mt-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-lime-400">
            Drill Demo
          </p>
          {exerciseContent.map((content) => (
            <ContentCard key={content.id} content={content} compact />
          ))}
        </div>
      ) : null}
    </div>
  );
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

  if (!user) {
    redirect('/login');
  }

  const { data: athlete } = await supabase
    .from('athletes')
    .select('id, first_name, last_name')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!athlete) {
    return (
      <main className="mx-auto max-w-4xl space-y-6 bg-black px-6 py-8 text-white">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
          <h1 className="text-2xl font-bold text-white">
            Athlete profile missing
          </h1>
          <p className="mt-3 text-zinc-400">
            This user is signed in, but no athlete profile is linked yet.
          </p>
          <Link
            href="/dashboard/training"
            className="mt-5 inline-block text-sm font-semibold text-zinc-300 no-underline"
          >
            ← Back to Training
          </Link>
        </div>
      </main>
    );
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

  const { data: programWorkoutsData } = await supabase
    .from('workouts')
    .select('id, title, day_order')
    .eq('training_program_id', workout.training_program_id)
    .order('day_order', { ascending: true });

  const programWorkouts = programWorkoutsData ?? [];

  const { data: completedWorkoutLogs } = await supabase
    .from('workout_logs')
    .select('workout_id, completed_at')
    .eq('athlete_id', athlete.id)
    .not('completed_at', 'is', null);

  const completedWorkoutIds =
    completedWorkoutLogs?.map((log) => log.workout_id) ?? [];

  const currentIndex = programWorkouts.findIndex((w) => w.id === workout.id);
  const previousWorkout =
    currentIndex > 0 ? programWorkouts[currentIndex - 1] : null;

  const isUnlocked =
    currentIndex <= 0 ||
    (previousWorkout ? completedWorkoutIds.includes(previousWorkout.id) : true);

  const nextWorkout =
    currentIndex >= 0 && currentIndex < programWorkouts.length - 1
      ? programWorkouts[currentIndex + 1]
      : null;

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

  const { data: contentPostsData, error: contentError } = await supabase
    .from('content_posts')
    .select(
      'id, title, description, content_type, status, audience, training_program_id, workout_id, exercise_id, external_url, file_url, created_at'
    )
    .eq('status', 'published')
    .in('audience', ['athletes', 'both'])
    .or(
      [
        `workout_id.eq.${workout.id}`,
        workout.training_program_id
          ? `training_program_id.eq.${workout.training_program_id}`
          : null,
        exerciseIds.length > 0 ? `exercise_id.in.(${exerciseIds.join(',')})` : null,
      ]
        .filter(Boolean)
        .join(',')
    )
    .order('created_at', { ascending: false });

  if (contentError) {
    console.error('Error loading content posts:', contentError);
  }

  const contentPosts = (contentPostsData ?? []) as ContentPost[];

  const workoutLevelContent = contentPosts.filter(
    (content) => content.workout_id === workout.id
  );

  const exerciseContentById = exerciseIds.reduce<Record<string, ContentPost[]>>(
    (acc, exerciseId) => {
      acc[exerciseId] = contentPosts.filter(
        (content) => content.exercise_id === exerciseId
      );
      return acc;
    },
    {}
  );

  const programLevelContent = contentPosts.filter(
    (content) =>
      content.training_program_id === workout.training_program_id &&
      !content.workout_id &&
      !content.exercise_id
  );

  let progressionByExerciseId: Record<string, ExerciseProgression> = {};

  if (exerciseIds.length > 0) {
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

  const buildExercises = workoutExercises.filter((item) => item.sort_order <= 2);
  const applyExercises = workoutExercises.filter(
    (item) => item.sort_order > 2 && item.sort_order <= 4
  );
  const challengeExercise =
    workoutExercises.find((item) => item.sort_order === 5) ?? null;

  const athleteName =
    `${athlete.first_name ?? ''} ${athlete.last_name ?? ''}`.trim() || 'Athlete';

  const workoutAthlete = getAthleteFromWorkoutTitle(workout.title);
  const workoutSubtitle = getWorkoutSubtitle(workout.title);
  const dayLabel = workout.day_order ? `Day ${workout.day_order}` : 'Session';

  const totalExercises = workoutExercises.length;
  const requiredExercises = workoutExercises.filter(
    (item) => item.is_required
  ).length;

  const isCompleted =
    workoutExercises.length > 0 &&
    workoutExercises.every((ex) => {
      const progression = progressionByExerciseId[ex.exercise_id];
      return progression?.last?.completed === true;
    });

  if (!isUnlocked) {
    return (
      <main className="mx-auto max-w-4xl space-y-8 bg-black px-6 py-8 text-white">
        <section className="rounded-[28px] border border-zinc-800 bg-zinc-950 p-8 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
            Session Locked
          </p>

          <h1 className="mt-3 text-3xl font-extrabold text-white sm:text-4xl">
            Complete the previous day first
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-zinc-400">
            This session unlocks after you finish the day before it. Stay in
            sequence and keep stacking wins.
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/dashboard"
              className="inline-block rounded-xl bg-white px-6 py-3 font-semibold text-black no-underline"
            >
              Back to Dashboard
            </Link>

            <Link
              href="/dashboard/training"
              className="inline-block rounded-xl border border-zinc-700 px-6 py-3 font-semibold text-zinc-200 no-underline"
            >
              View Training
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl space-y-8 bg-black px-6 py-8 text-white">
      <section className="rounded-[28px] border border-red-500/40 bg-[radial-gradient(circle_at_top,_rgba(220,38,38,0.18),_rgba(0,0,0,0.96)_60%)] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
        <Link
          href="/dashboard/training"
          className="mb-5 inline-block text-sm font-semibold text-zinc-300 no-underline"
        >
          ← Back to Training
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-lime-400">
              {dayLabel}
            </p>

            <h1 className="mt-2 text-3xl font-extrabold text-white sm:text-5xl">
              {workout.title ?? 'Untitled Workout'}
            </h1>

            <p className="mt-3 text-lg font-semibold text-red-400">
              {workoutSubtitle}
            </p>

            <p className="mt-3 max-w-2xl text-sm text-zinc-300 sm:text-lg">
              {workout.description ??
                'Complete today’s session and build momentum.'}
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 text-xs font-semibold text-zinc-300">
                Athlete: {athleteName}
              </span>
              <span className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 text-xs font-semibold text-zinc-300">
                Session: {totalExercises} drills
              </span>
              <span className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 text-xs font-semibold text-zinc-300">
                Required: {requiredExercises}
              </span>
            </div>
          </div>

          <div className="hidden text-7xl font-black text-red-500/10 sm:block">
            {workoutAthlete.charAt(0).toUpperCase()}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
          Athlete Intel
        </p>

        <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
          <div className="mb-4 flex h-48 items-center justify-center rounded-xl bg-zinc-800">
            <span className="text-sm font-medium text-zinc-500">
              Video coming soon
            </span>
          </div>

          <h2 className="text-xl font-bold text-white">Watch This First</h2>
          <p className="mt-2 text-sm text-zinc-300">
            {workout.description ?? 'Start here and lock in the focus for today.'}
          </p>
        </div>
      </section>

      {workoutLevelContent.length > 0 ? (
        <section className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
              Workout Content
            </p>
            <h2 className="mt-2 text-2xl font-bold text-white">
              Today’s session guidance
            </h2>
            <p className="mt-2 text-sm text-zinc-400">
              Review the session-specific coaching before you begin.
            </p>
          </div>

          <div className="grid gap-4">
            {workoutLevelContent.map((content) => (
              <ContentCard key={content.id} content={content} />
            ))}
          </div>
        </section>
      ) : null}

      <section id="session-flow" className="space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
            Build
          </p>
          <h2 className="mt-2 text-2xl font-bold text-white">
            Build the movement pattern
          </h2>
        </div>

        <div className="space-y-3">
          {buildExercises.map((item) => (
            <ExercisePreviewCard
              key={item.id}
              item={item}
              exerciseContent={exerciseContentById[item.exercise_id] ?? []}
            />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
            Apply
          </p>
          <h2 className="mt-2 text-2xl font-bold text-white">
            Transfer it into the swing
          </h2>
        </div>

        <div className="space-y-3">
          {applyExercises.map((item) => (
            <ExercisePreviewCard
              key={item.id}
              item={item}
              exerciseContent={exerciseContentById[item.exercise_id] ?? []}
            />
          ))}
        </div>
      </section>

      {programLevelContent.length > 0 ? (
        <section className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
              Program Concepts
            </p>
            <h2 className="mt-2 text-2xl font-bold text-white">
              Broader teaching context
            </h2>
            <p className="mt-2 text-sm text-zinc-400">
              These concepts support the larger program and movement intent.
            </p>
          </div>

          <div className="grid gap-4">
            {programLevelContent.map((content) => (
              <ContentCard key={content.id} content={content} />
            ))}
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

          {!isCompleted ? (
            <>
              <div className="rounded-3xl border border-lime-400/50 bg-zinc-950 p-6 shadow-[0_0_0_1px_rgba(132,204,22,0.12)]">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                  Score Challenge
                </p>

                <h3 className="mt-2 text-3xl font-extrabold text-white">
                  {getExerciseRecord(challengeExercise.exercise)?.name?.replace(
                    'CHALLENGE: ',
                    ''
                  ) ?? 'Challenge'}
                </h3>

                <p className="mt-3 text-lg font-semibold text-lime-400">
                  Pro Score:{' '}
                  {challengeExercise.prescribed_score ?? 'Set your mark'}
                </p>

                {challengeExercise.notes ? (
                  <p className="mt-3 text-sm text-zinc-300">
                    {challengeExercise.notes}
                  </p>
                ) : null}
              </div>

              <Link
                href="#session-execution"
                className="block w-full rounded-2xl bg-lime-400 px-6 py-4 text-center text-lg font-bold text-black no-underline transition hover:bg-lime-300"
              >
                Start Session
              </Link>
            </>
          ) : (
            <div className="rounded-3xl border border-lime-400 bg-black p-8 text-center">
              <h2 className="text-3xl font-extrabold text-white">
                Day Complete
              </h2>

              <p className="mt-3 text-zinc-300">
                Built like {workoutAthlete}.
              </p>

              <p className="mt-6 text-lg font-semibold text-lime-400">
                Pro Score: {challengeExercise.prescribed_score ?? '--'}
              </p>

              {nextWorkout ? (
                <p className="mt-4 text-zinc-300">
                  Tomorrow:{' '}
                  <span className="font-semibold text-white">
                    {nextWorkout.title}
                  </span>
                </p>
              ) : (
                <p className="mt-4 text-zinc-300">
                  You finished the full challenge.
                </p>
              )}

              <div className="mt-6">
                <Link
                  href="/dashboard"
                  className="inline-block rounded-xl bg-white px-6 py-3 font-semibold text-black no-underline"
                >
                  Back to Dashboard
                </Link>
              </div>
            </div>
          )}
        </section>
      ) : null}

      {!isCompleted ? (
        <section
          id="session-execution"
          className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6"
        >
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
              Session Execution
            </p>
            <h2 className="mt-3 text-2xl font-bold text-white">
              Log Your Session
            </h2>
            <p className="mt-2 text-sm text-zinc-400">
              Enter your results drill by drill, mark them complete, and finish
              the challenge to lock in the day.
            </p>
          </div>

          <WorkoutExecutionForm
            athleteId={athlete.id}
            workoutId={workout.id}
            workoutExercises={workoutExercises}
            progressionByExerciseId={progressionByExerciseId}
          />
        </section>
      ) : null}

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
            Session Focus
          </p>
          <h2 className="mt-3 text-xl font-bold text-white">
            Move with intent
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            Start with clean patterns, then build toward the finish line.
          </p>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
            Progression
          </p>
          <h2 className="mt-3 text-xl font-bold text-white">
            Build momentum
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            Today is about stacking one clean session at a time.
          </p>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
            Completion
          </p>
          <h2 className="mt-3 text-xl font-bold text-white">
            Finish the day
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            Lock in the challenge and complete the full flow before you leave.
          </p>
        </div>
      </section>
    </main>
  );
}