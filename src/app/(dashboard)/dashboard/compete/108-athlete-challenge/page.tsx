import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

import ChallengeCard from '@/components/challenge/ChallengeCard';
import WeeklyList from '@/components/challenge/WeeklyList';
import { mapDashboardToChallengeView } from '@/lib/challenge/mapDashboardToChallengeView';

type WorkoutRow = {
  id: string;
  title: string | null;
  description: string | null;
  training_program_id: string | null;
  day_order: number | null;
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

export default async function AthleteChallengePage() {
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

  const athleteId = athlete?.id ?? '00000000-0000-0000-0000-000000000000';

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

  const { count: workoutLogCount } = await supabase
    .from('workout_logs')
    .select('*', { count: 'exact', head: true })
    .eq('athlete_id', athleteId);

  const { data: completedWorkoutLogs } = await supabase
    .from('workout_logs')
    .select('workout_id')
    .eq('athlete_id', athleteId);

  const completedWorkoutIds =
    completedWorkoutLogs?.map((log) => log.workout_id) ?? [];

  const completedSet = new Set(completedWorkoutIds);
  const programWorkouts = orderedWorkouts.slice(0, TOTAL_DAYS);
  const nextWorkout = getNextWorkout(programWorkouts, completedWorkoutIds);

  const weeklyDays =
    programWorkouts.length > 0
      ? programWorkouts.map((workout, index) => {
          const dayNumber = workout.day_order ?? index + 1;
          const isCompleted = completedSet.has(workout.id);
          const previousWorkout = index > 0 ? programWorkouts[index - 1] : null;
          const previousCompleted = previousWorkout
            ? completedSet.has(previousWorkout.id)
            : true;
          const isUnlocked = index === 0 || previousCompleted || isCompleted;

          return {
            dayNumber,
            title: workout.title ?? `Day ${dayNumber}`,
            subtitle: isCompleted
              ? 'Completed'
              : isUnlocked
                ? 'Ready to train'
                : 'Locked',
            completed: isCompleted,
            unlocked: isUnlocked,
            href: `/dashboard/training/${workout.id}`,
          };
        })
      : Array.from({ length: TOTAL_DAYS }).map((_, index) => ({
          dayNumber: index + 1,
          title: `Day ${index + 1}`,
          subtitle: index === 0 ? 'Ready to train' : 'Locked',
          completed: false,
          unlocked: index === 0,
          href: undefined as string | undefined,
        }));

  const activeWorkout = nextWorkout ?? programWorkouts[0] ?? null;
  const activeDay = activeWorkout?.day_order ?? 1;

  const todayRoute = activeWorkout
    ? `/dashboard/training/${activeWorkout.id}`
    : '/dashboard/training';

  const challengeAccentName = getAthleteFromWorkoutTitle(activeWorkout?.title);
  const challengeSubtitle = getChallengeSubtitle(challengeAccentName);

  const dashboardView = mapDashboardToChallengeView({
    streakCount: workoutLogCount ?? 0,
    activeDay,
    totalDays: TOTAL_DAYS,
    todayRoute,
    challengeAccentName,
    challengeSubtitle,
    days: weeklyDays,
  });

  return (
    <main className="mx-auto min-h-screen max-w-4xl bg-black px-6 py-8 text-white">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-500">
          Compete
        </p>
        <h1 className="mt-2 text-4xl font-extrabold sm:text-5xl">
          108 Athlete Challenge
        </h1>
        <p className="mt-3 max-w-2xl text-base text-zinc-400 sm:text-lg">
          Progress through the live challenge program and validate your
          performance day by day.
        </p>
      </div>

      <section className="mb-6 rounded-[28px] border border-lime-400/40 bg-[radial-gradient(circle_at_top,_rgba(132,204,22,0.18),_rgba(0,0,0,0.96)_60%)] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-lime-400">
          Today’s Challenge Session
        </p>

        <h2 className="mt-2 text-3xl font-extrabold text-white sm:text-4xl">
          Day {activeDay} — {activeWorkout?.title ?? 'Training Session'}
        </h2>

        <p className="mt-3 text-base text-zinc-300 sm:text-lg">
          {challengeSubtitle}
        </p>

        <p className="mt-2 max-w-2xl text-sm text-zinc-400 sm:text-base">
          {activeWorkout?.description ??
            'Start today’s guided challenge session and keep your momentum rolling.'}
        </p>

        <a
          href={todayRoute}
          className="mt-6 inline-block rounded-2xl bg-lime-400 px-6 py-4 text-lg font-bold text-black no-underline transition hover:bg-lime-300"
        >
          Start Challenge Session
        </a>
      </section>

      <div className="space-y-6">
        <ChallengeCard {...dashboardView} />
        <WeeklyList days={dashboardView.weeklyDays} />

        <section className="grid gap-4 md:grid-cols-2">
          <a
            href="/dashboard/compete"
            className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 transition hover:border-zinc-600"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
              Back
            </p>
            <h3 className="mt-2 text-2xl font-bold text-white">
              Return to Compete
            </h3>
            <p className="mt-2 text-sm text-zinc-400">
              Go back to the compete hub and explore other challenge systems.
            </p>
          </a>

          <a
            href="/dashboard"
            className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 transition hover:border-zinc-600"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
              Dashboard
            </p>
            <h3 className="mt-2 text-2xl font-bold text-white">
              Return Home
            </h3>
            <p className="mt-2 text-sm text-zinc-400">
              Go back to the main athlete dashboard.
            </p>
          </a>
        </section>
      </div>
    </main>
  );
}