import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

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

  const athleteId = athlete?.id ?? '00000000-0000-0000-0000-000000000000';

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
            Today’s session is ready. Stay consistent and build momentum.
          </p>
        </div>

        <div className="rounded-full border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm text-zinc-300">
          🔥 {workoutLogCount ?? 0} day streak
        </div>
      </div>

      <section className="mb-8 rounded-[28px] border border-zinc-800 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.06),_rgba(0,0,0,0.96)_60%)] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-400">
          Athlete Hub
        </p>

        <h2 className="mt-2 text-3xl font-extrabold text-white sm:text-4xl">
          Train. Build. Compete. Improve.
        </h2>

        <p className="mt-3 max-w-2xl text-base text-zinc-300 sm:text-lg">
          Choose the right path for today and keep progressing.
        </p>
      </section>

      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-2">
          <a
            href="/dashboard/compete"
            className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 transition hover:border-lime-400"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
              Compete
            </p>
            <h3 className="mt-2 text-2xl font-bold text-white">
              Take the Challenge
            </h3>
            <p className="mt-2 text-sm text-zinc-400">
              Test your skills and track your performance day by day.
            </p>
          </a>

          <a
            href="/dashboard/workout"
            className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 transition hover:border-lime-400"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
              Workout
            </p>
            <h3 className="mt-2 text-2xl font-bold text-white">
              Train Specific Skills
            </h3>
            <p className="mt-2 text-sm text-zinc-400">
              Focus on power, speed, control, and movement efficiency.
            </p>
          </a>

          <a
            href="/dashboard/improve"
            className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 transition hover:border-lime-400"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
              Improve
            </p>
            <h3 className="mt-2 text-2xl font-bold text-white">
              Improve Your Swing
            </h3>
            <p className="mt-2 text-sm text-zinc-400">
              Identify issues and get targeted drills to improve fast.
            </p>
          </a>

          <a
            href="/dashboard/train"
            className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 transition hover:border-lime-400"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
              Train
            </p>
            <h3 className="mt-2 text-2xl font-bold text-white">
              Follow Your Program
            </h3>
            <p className="mt-2 text-sm text-zinc-400">
              Step-by-step development. Stay on track and build consistency.
            </p>
          </a>
        </section>

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
              Athlete Progress
            </h2>
            <div className="mt-4 grid gap-2 text-sm text-zinc-400">
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