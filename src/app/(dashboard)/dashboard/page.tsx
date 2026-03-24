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

const ACTIVE_PROGRAM_TITLE = 'Train Like the Pros — 7 Day Challenge';
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

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('users')
    .select('id, email, role, created_at')
    .eq('id', user.id)
    .maybeSingle();

  const { data: athlete } = await supabase
    .from('athletes')
    .select('id, first_name, last_name, graduation_year, position')
    .eq('user_id', user.id)
    .maybeSingle();

  const athleteId =
    athlete?.id ?? '00000000-0000-0000-0000-000000000000';

  const athleteName = athlete
    ? `${athlete.first_name ?? ''} ${athlete.last_name ?? ''}`.trim()
    : 'Athlete';

  const { data: latestScore } = await supabase
    .from('challenge_scores')
    .select('score, level, recorded_at')
    .eq('athlete_id', athleteId)
    .order('recorded_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: activeProgram } = await supabase
    .from('training_programs')
    .select('id, title, description')
    .eq('title', ACTIVE_PROGRAM_TITLE)
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

  const { data: latestWorkoutLog } = await supabase
    .from('workout_logs')
    .select('id, completed_at, workout_id')
    .eq('athlete_id', athleteId)
    .order('completed_at', { ascending: false })
    .limit(1)
    .maybeSingle();

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

  const programWorkouts = orderedWorkouts.slice(0, TOTAL_DAYS);

  const weeklyDays =
    programWorkouts.length > 0
      ? programWorkouts.map((workout, index) => {
          const dayNumber = workout.day_order ?? index + 1;
          const isCompleted = completedWorkoutIds.includes(workout.id);
          const previousWorkout = index > 0 ? programWorkouts[index - 1] : null;
          const previousCompleted = previousWorkout
            ? completedWorkoutIds.includes(previousWorkout.id)
            : true;
          const isUnlocked = index === 0 || previousCompleted;

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
            href: isUnlocked ? `/dashboard/training/${workout.id}` : undefined,
          };
        })
      : Array.from({ length: TOTAL_DAYS }).map((_, index) => ({
          dayNumber: index + 1,
          title: `Day ${index + 1}`,
          subtitle: index === 0 ? 'Ready to train' : 'Locked',
          completed: false,
          unlocked: index === 0,
          href: index === 0 ? '/dashboard/training' : undefined,
        }));

  const activeDayEntry =
    weeklyDays.find((day) => day.unlocked && !day.completed) ??
    weeklyDays[weeklyDays.length - 1];

  const activeDay = activeDayEntry?.dayNumber ?? 1;
  const todayRoute = activeDayEntry?.href ?? '/dashboard/training';

  const activeWorkout =
    programWorkouts.find(
      (workout) =>
        (workout.day_order ?? 0) === activeDay &&
        !completedWorkoutIds.includes(workout.id)
    ) ??
    programWorkouts.find(
      (workout) => (workout.day_order ?? 0) === activeDay
    ) ??
    programWorkouts[0] ??
    null;

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
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Miracle Network
          </div>
          <h1 className="mt-2 text-4xl font-extrabold sm:text-5xl">
            Welcome back, {athleteName}
          </h1>
          <p className="mt-3 max-w-2xl text-base text-zinc-400 sm:text-lg">
            Today’s challenge is ready. Keep stacking days and build momentum.
          </p>
        </div>

        <div className="rounded-full border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm text-zinc-300">
          🔥 {dashboardView.streakCount} day streak
        </div>
      </div>

      <div className="space-y-8">
        <ChallengeCard {...dashboardView} />

        <WeeklyList days={dashboardView.weeklyDays} />

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
              Profile
            </p>
            <h2 className="mt-3 text-xl font-bold text-white">{athleteName}</h2>
            <div className="mt-4 grid gap-2 text-sm text-zinc-400">
              <p>
                <span className="font-semibold text-zinc-200">Email:</span>{' '}
                {profile?.email ?? user.email}
              </p>
              <p>
                <span className="font-semibold text-zinc-200">Role:</span>{' '}
                {profile?.role ?? 'athlete'}
              </p>
              <p>
                <span className="font-semibold text-zinc-200">Position:</span>{' '}
                {athlete?.position ?? 'Not set'}
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
              Training Status
            </p>
            <h2 className="mt-3 text-xl font-bold text-white">
              Current Challenge
            </h2>
            <div className="mt-4 grid gap-2 text-sm text-zinc-400">
              <p>
                <span className="font-semibold text-zinc-200">
                  Active Program:
                </span>{' '}
                {activeProgram?.title ?? 'Not assigned yet'}
              </p>
              <p>
                <span className="font-semibold text-zinc-200">
                  Today’s Session:
                </span>{' '}
                {activeWorkout?.title ?? 'Not scheduled'}
              </p>
              <p>
                <span className="font-semibold text-zinc-200">
                  Graduation Year:
                </span>{' '}
                {athlete?.graduation_year ?? 'Not set'}
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
              Progress Snapshot
            </p>
            <h2 className="mt-3 text-xl font-bold text-white">
              Latest Performance
            </h2>
            <div className="mt-4 grid gap-2 text-sm text-zinc-400">
              <p>
                <span className="font-semibold text-zinc-200">
                  Latest Score:
                </span>{' '}
                {latestScore?.score ?? 'No scores yet'}
              </p>
              <p>
                <span className="font-semibold text-zinc-200">
                  Challenge Level:
                </span>{' '}
                {latestScore?.level ?? 'No level yet'}
              </p>
              <p>
                <span className="font-semibold text-zinc-200">
                  Workouts Completed:
                </span>{' '}
                {workoutLogCount ?? 0}
              </p>
              <p>
                <span className="font-semibold text-zinc-200">
                  Last Workout:
                </span>{' '}
                {latestWorkoutLog?.completed_at
                  ? new Date(latestWorkoutLog.completed_at).toLocaleDateString()
                  : 'No workout logged yet'}
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}