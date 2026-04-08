import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

import ProgressionCarousel, {
  type ProgressionDay,
} from '@/components/challenge/ProgressionCarousel';

type WorkoutRow = {
  id: string;
  title: string | null;
  description: string | null;
  training_program_id: string | null;
  day_order: number | null;
};

type CompletedWorkoutLogRow = {
  workout_id: string | null;
};

const ACTIVE_PROGRAM_ID = 'ad7376ba-9746-4c1b-b11d-d7ba245add79';
const TOTAL_DAYS = 7;

function getAthleteFromWorkoutTitle(title: string | null): string {
  if (!title) return 'Jordan';

  const match = title.match(/Train Like\s+(.+)$/i);
  if (!match?.[1]) return 'Jordan';

  return match[1].trim();
}

function getChallengeSubtitle(athleteName: string): string {
  const normalized = athleteName.toLowerCase();

  if (normalized.includes('jordan')) return 'Pure Power and Control';
  if (normalized.includes('aleena')) return 'Become a ballstriker';
  if (normalized.includes('kk')) return 'Move fast with intent';

  return 'Elite Athlete Training';
}

function getNextWorkout(
  workouts: WorkoutRow[],
  completedWorkoutIds: string[]
): WorkoutRow | null {
  if (!workouts.length) return null;

  const completedSet = new Set(completedWorkoutIds);

  const firstIncomplete = workouts.find(
    (workout) => !completedSet.has(workout.id)
  );

  if (firstIncomplete) return firstIncomplete;

  return workouts[0];
}

function getDayLabel(title: string | null, dayNumber: number) {
  if (!title) return `Day ${dayNumber}`;
  return `Day ${dayNumber}`;
}

export default async function AthleteChallengePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isGuest = !user;

  let athleteId: string | null = null;

  if (user) {
    const { data: athlete } = await supabase
      .from('athletes')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    athleteId = athlete?.id ?? null;
  }

  const { data: activeProgram } = await supabase
    .from('training_programs')
    .select('id, title, description')
    .eq('id', ACTIVE_PROGRAM_ID)
    .maybeSingle();

  let orderedWorkouts: WorkoutRow[] = [];

  if (activeProgram?.id) {
    const { data: workoutsData } = await supabase
      .from('workouts')
      .select('id, title, description, training_program_id, day_order')
      .eq('training_program_id', activeProgram.id)
      .order('day_order', { ascending: true });

    orderedWorkouts = (workoutsData ?? []) as WorkoutRow[];
  }

  let workoutLogCount = 0;
  let completedWorkoutIds: string[] = [];

  if (athleteId) {
    const { count } = await supabase
      .from('workout_logs')
      .select('*', { count: 'exact', head: true })
      .eq('athlete_id', athleteId)
      .not('completed_at', 'is', null);

    workoutLogCount = count ?? 0;

    const { data } = await supabase
      .from('workout_logs')
      .select('workout_id')
      .eq('athlete_id', athleteId)
      .not('completed_at', 'is', null);

    completedWorkoutIds =
      ((data ?? []) as CompletedWorkoutLogRow[])
        .map((log) => log.workout_id)
        .filter((id): id is string => Boolean(id)) ?? [];
  }

  const completedSet = new Set(completedWorkoutIds);
  const programWorkouts = orderedWorkouts.slice(0, TOTAL_DAYS);
  const nextWorkout = getNextWorkout(programWorkouts, completedWorkoutIds);

  const activeWorkout = nextWorkout ?? programWorkouts[0] ?? null;
  const activeDay = activeWorkout?.day_order ?? 1;
  const todayRoute = activeWorkout
    ? `/dashboard/training/${activeWorkout.id}/run`
    : '/dashboard/training';

  const challengeAccentName = getAthleteFromWorkoutTitle(activeWorkout?.title);
  const challengeSubtitle = getChallengeSubtitle(challengeAccentName);

  const carouselDays: ProgressionDay[] =
    programWorkouts.length > 0
      ? programWorkouts.map((workout, index) => {
          const dayNumber = workout.day_order ?? index + 1;
          const isCompleted = completedSet.has(workout.id);
          const previousWorkout = index > 0 ? programWorkouts[index - 1] : null;
          const previousCompleted = previousWorkout
            ? completedSet.has(previousWorkout.id)
            : true;
          const isUnlocked = isGuest
            ? index === 0
            : index === 0 || previousCompleted || isCompleted;

          return {
            day: dayNumber,
            label: getDayLabel(workout.title, dayNumber),
            status: isCompleted
              ? 'completed'
              : workout.id === activeWorkout?.id
                ? 'active'
                : isUnlocked
                  ? 'active'
                  : 'locked',
            href: isUnlocked ? `/dashboard/training/${workout.id}` : undefined,
          };
        })
      : Array.from({ length: TOTAL_DAYS }).map((_, index) => ({
          day: index + 1,
          label: `Day ${index + 1}`,
          status: index === 0 ? 'active' : 'locked',
          href: index === 0 ? '/dashboard/training' : undefined,
        }));

  return (
    <main className="mx-auto min-h-screen max-w-4xl bg-black px-6 py-8 text-white">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-500">
          Compete
        </p>
        <h1 className="mt-2 text-4xl font-extrabold sm:text-5xl">
          108 Athlete Challenge
        </h1>
        <p className="mt-3 text-sm text-zinc-400">
          {isGuest
            ? 'Start your first session now. Save your progress after you finish.'
            : 'Continue your challenge and keep building momentum.'}
        </p>
      </div>

      <section className="mb-6 overflow-hidden rounded-[28px] border border-zinc-800 bg-zinc-950">
        <div className="h-40 bg-[radial-gradient(circle_at_top_left,_rgba(132,204,22,0.22),_rgba(24,24,27,0.85)_40%,_rgba(0,0,0,1)_100%)]" />
        <div className="-mt-10 px-6 pb-6">
          <div className="inline-flex rounded-2xl border border-lime-400/30 bg-black/80 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-lime-400 backdrop-blur">
            {isGuest ? 'Start Here' : 'Today'}
          </div>

          <div className="mt-4">
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
              Day {activeDay}
            </h2>
            <p className="mt-2 text-lg text-zinc-200">{challengeSubtitle}</p>
            <p className="mt-3 max-w-2xl text-sm text-zinc-400 sm:text-base">
              {activeWorkout?.description ??
                'Start today’s guided challenge session and keep your momentum rolling.'}
            </p>
          </div>
        </div>
      </section>

      <section className="mb-6 rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
        <ProgressionCarousel days={carouselDays} />
      </section>

      <section className="mb-8 flex items-center justify-between gap-4 rounded-3xl border border-zinc-800 bg-zinc-950 px-5 py-5">
        <div>
          <h3 className="text-3xl font-extrabold text-white">
            Day {activeDay} of {TOTAL_DAYS}
          </h3>
          <p className="mt-2 text-sm text-zinc-400">
            {isGuest
              ? 'First session unlocked'
              : `${workoutLogCount} completed • stay on track`}
          </p>
        </div>

        <div className="rounded-full border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-200">
          {isGuest ? 'Guest Mode' : 'On Track'}
        </div>
      </section>

      <section className="mb-8">
        <Link
          href={`/dashboard/training/${activeWorkout.id}/run`}
          className="block w-full rounded-[28px] bg-lime-400 px-6 py-5 text-center text-2xl font-extrabold text-black no-underline transition-all duration-150 hover:bg-lime-300 active:scale-[0.97] active:bg-lime-500"
        >
          Start Challenge Session
        </Link>
      </section>

      <section className="mt-2">
        <Link
          href="/dashboard/compete"
          className="group relative flex h-[140px] w-full flex-col justify-between overflow-hidden rounded-3xl border border-fuchsia-400/20 bg-zinc-950/90 p-5 text-left no-underline shadow-[0_0_24px_rgba(217,70,239,0.08)] transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-white/[0.03] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

          <div className="relative z-10">
            <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-fuchsia-400/10 text-fuchsia-400">
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                <path
                  d="M12 4l2.2 4.5 5 .7-3.6 3.5.9 5-4.5-2.4-4.5 2.4.9-5-3.6-3.5 5-.7L12 4Z"
                  stroke="currentColor"
                  strokeWidth="1.9"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
              Compete
            </p>
            <h3 className="mt-2 text-2xl font-bold text-white">
              Back to Hub
            </h3>
          </div>

          <div className="relative z-10">
            <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-zinc-500">
              Return to challenge hub
            </span>
          </div>
        </Link>
      </section>
    </main>
  );
}