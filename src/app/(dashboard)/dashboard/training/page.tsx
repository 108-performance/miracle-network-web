import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

type WorkoutRow = {
  id: string;
  title: string | null;
  description: string | null;
  day_order: number | null;
  training_program_id: string | null;
  difficulty_level: number | null;
};

type TrainingProgramRow = {
  id: string;
  title: string | null;
  description: string | null;
  created_at: string | null;
};

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

export default async function TrainingPage() {
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
      <main className="mx-auto max-w-5xl space-y-6 bg-black px-6 py-8 text-white">
        <section className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
          <h1 className="text-3xl font-extrabold text-white">
            Athlete profile missing
          </h1>
          <p className="mt-3 text-zinc-400">
            This user is signed in, but no athlete profile is linked yet.
          </p>
          <Link
            href="/dashboard"
            className="mt-5 inline-block text-sm font-semibold text-zinc-300 no-underline"
          >
            ← Back to Dashboard
          </Link>
        </section>
      </main>
    );
  }

  const athleteName =
    `${athlete.first_name ?? ''} ${athlete.last_name ?? ''}`.trim() || 'Athlete';

  const { data: programsData, error: programsError } = await supabase
    .from('training_programs')
    .select('id, title, description, created_at')
    .order('created_at', { ascending: false });

  if (programsError) {
    console.error('Error loading training programs:', programsError);
  }

  const programs = (programsData ?? []) as TrainingProgramRow[];

  let activeProgram: TrainingProgramRow | null = null;
  let workouts: WorkoutRow[] = [];

  for (const program of programs) {
    const { data: workoutsData, error: workoutsError } = await supabase
      .from('workouts')
      .select(
        'id, title, description, day_order, training_program_id, difficulty_level'
      )
      .eq('training_program_id', program.id)
      .order('day_order', { ascending: true });

    if (workoutsError) {
      console.error(
        'Error loading workouts for program:',
        program.id,
        workoutsError
      );
      continue;
    }

    const programWorkouts = (workoutsData ?? []) as WorkoutRow[];

    if (programWorkouts.length > 0) {
      activeProgram = program;
      workouts = programWorkouts;
      break;
    }
  }

  if (!activeProgram?.id) {
    return (
      <main className="mx-auto max-w-5xl space-y-6 bg-black px-6 py-8 text-white">
        <section className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
          <Link
            href="/dashboard"
            className="inline-block text-sm font-semibold text-zinc-300 no-underline"
          >
            ← Back to Dashboard
          </Link>

          <h1 className="mt-4 text-3xl font-extrabold text-white">
            No training program available
          </h1>
          <p className="mt-3 text-zinc-400">
            No training program with workouts has been published in admin yet.
          </p>
        </section>
      </main>
    );
  }

  const { data: completedWorkoutLogs } = await supabase
    .from('workout_logs')
    .select('workout_id, completed_at')
    .eq('athlete_id', athlete.id)
    .not('completed_at', 'is', null);

  const completedWorkoutIds =
    completedWorkoutLogs?.map((log) => log.workout_id) ?? [];

  const workoutCards = workouts.map((workout, index) => {
    const previousWorkout = index > 0 ? workouts[index - 1] : null;
    const completed = completedWorkoutIds.includes(workout.id);
    const unlocked =
      index === 0 ||
      (previousWorkout
        ? completedWorkoutIds.includes(previousWorkout.id)
        : true);

    const current = unlocked && !completed;

    return {
      ...workout,
      completed,
      unlocked,
      current,
      athleteAccent: getAthleteFromWorkoutTitle(workout.title),
      subtitle: getWorkoutSubtitle(workout.title),
    };
  });

  const currentWorkout =
    workoutCards.find((workout) => workout.current) ?? workoutCards[0] ?? null;

  return (
    <main className="mx-auto max-w-5xl space-y-6 bg-black px-6 py-8 text-white">
      {currentWorkout ? (
        <section className="rounded-[28px] border border-lime-400/40 bg-[radial-gradient(circle_at_top,_rgba(132,204,22,0.18),_rgba(0,0,0,0.96)_60%)] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-lime-400">
            Continue Training
          </p>

          <h1 className="mt-2 text-3xl font-extrabold text-white sm:text-5xl">
            Day {currentWorkout.day_order ?? 1} —{' '}
            {currentWorkout.title ?? 'Training Session'}
          </h1>

          <p className="mt-3 text-lg text-zinc-300">
            {currentWorkout.subtitle}
          </p>

          <p className="mt-2 max-w-2xl text-sm text-zinc-400 sm:text-base">
            {currentWorkout.description ??
              'Continue your progression and stay in sequence.'}
          </p>

          <Link
            href={`/dashboard/training/${currentWorkout.id}`}
            className="mt-6 inline-block rounded-2xl bg-lime-400 px-6 py-4 text-lg font-bold text-black no-underline transition hover:bg-lime-300"
          >
            Continue Session
          </Link>
        </section>
      ) : null}

      <section className="mt-2 rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/dashboard"
              className="inline-block text-sm font-semibold text-zinc-300 no-underline"
            >
              ← Back to Dashboard
            </Link>

            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
              Active Program
            </p>

            <h2 className="mt-2 text-2xl font-bold text-white">
              {activeProgram.title ?? 'Training Program'}
            </h2>

            <p className="mt-2 text-sm text-zinc-400">
              {activeProgram.description ??
                'Move day by day, stay in sequence, and keep progressing.'}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 text-xs font-semibold text-zinc-300">
              Athlete: {athleteName}
            </span>
            <span className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 text-xs font-semibold text-zinc-300">
              Program: {workouts.length} days
            </span>
            {currentWorkout ? (
              <span className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 text-xs font-semibold text-zinc-300">
                Current: {currentWorkout.title ?? 'Day 1'}
              </span>
            ) : null}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
            Program Progression
          </p>
          <h2 className="mt-2 text-2xl font-bold text-white">
            Stay in sequence
          </h2>
        </div>

        <div className="grid gap-4">
          {workoutCards.map((workout) => {
            const dayLabel = workout.day_order
              ? `Day ${workout.day_order}`
              : 'Session';

            const cardContent = (
              <div
                className={`rounded-3xl border p-5 transition ${
                  workout.current
                    ? 'scale-[1.01] border-lime-400/80 bg-zinc-950 shadow-[0_0_0_1px_rgba(132,204,22,0.12)]'
                    : workout.completed
                      ? 'border-blue-500/30 bg-zinc-950'
                      : workout.unlocked
                        ? 'border-zinc-700 bg-zinc-950'
                        : 'border-zinc-800 bg-zinc-950/70 opacity-70'
                }`}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p
                      className={`text-xs font-bold uppercase tracking-[0.18em] ${
                        workout.current
                          ? 'text-lime-400'
                          : workout.completed
                            ? 'text-blue-400'
                            : 'text-zinc-500'
                      }`}
                    >
                      {dayLabel}
                    </p>

                    <h3 className="mt-2 text-2xl font-extrabold text-white">
                      {workout.title ?? `Day ${workout.day_order ?? ''}`}
                    </h3>

                    <p className="mt-2 text-sm font-semibold text-red-400">
                      {workout.subtitle}
                    </p>

                    <p className="mt-3 max-w-2xl text-sm text-zinc-400">
                      {workout.description ??
                        'Complete the current day to keep the challenge moving.'}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
                    {workout.completed ? (
                      <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-300">
                        Completed
                      </span>
                    ) : workout.current ? (
                      <span className="rounded-full border border-lime-400/40 bg-lime-400/10 px-3 py-1 text-xs font-semibold text-lime-300">
                        Current
                      </span>
                    ) : workout.unlocked ? (
                      <span className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 text-xs font-semibold text-zinc-300">
                        Ready
                      </span>
                    ) : (
                      <span className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 text-xs font-semibold text-zinc-500">
                        Locked
                      </span>
                    )}

                    <span className="text-sm text-zinc-500">
                      {workout.completed
                        ? 'Review session'
                        : workout.unlocked
                          ? 'Start when ready'
                          : 'Complete the previous day'}
                    </span>
                  </div>
                </div>
              </div>
            );

            if (workout.unlocked || workout.completed) {
              return (
                <Link
                  key={workout.id}
                  href={`/dashboard/training/${workout.id}`}
                  className="block no-underline"
                >
                  {cardContent}
                </Link>
              );
            }

            return <div key={workout.id}>{cardContent}</div>;
          })}
        </div>
      </section>
    </main>
  );
}