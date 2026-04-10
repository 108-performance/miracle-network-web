import QuickActionsClient from '@/components/dashboard/QuickActionsClient';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getDashboardState } from '@/core/protected/dashboard/getDashboardState';

export const dynamic = 'force-dynamic';

const CHALLENGE_PROGRAM_ID = 'ad7376ba-9746-4c1b-b11d-d7ba245add79';

type LatestWorkoutLog = {
  id: string;
  completed_at: string | null;
  workout_id: string | null;
};

type CompletedLogRow = {
  completed_at: string;
  workout_id: string | null;
};

type ChallengeWorkoutRow = {
  id: string;
  title: string | null;
  day_order: number | null;
};

type ExerciseLogRow = {
  athlete_id?: string;
  actual_reps?: number | null;
  actual_time_seconds?: number | null;
  actual_score?: number | null;
  actual_exit_velocity?: number | null;
  completed: boolean | null;
  created_at: string;
};

function InfoCard({
  eyebrow,
  title,
  body,
  footer,
  accent = 'neutral',
}: {
  eyebrow: string;
  title: string;
  body: string;
  footer?: React.ReactNode;
  accent?: 'neutral' | 'purple' | 'blue';
}) {
  const accentStyles =
    accent === 'purple'
      ? 'border-fuchsia-400/15'
      : accent === 'blue'
        ? 'border-sky-400/15'
        : 'border-zinc-800';

  return (
    <section
      className={`rounded-[28px] border ${accentStyles} bg-zinc-950/90 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]`}
    >
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
        {eyebrow}
      </p>
      <h3 className="mt-3 text-2xl font-bold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-zinc-400">{body}</p>
      {footer ? <div className="mt-5">{footer}</div> : null}
    </section>
  );
}

function WeeklyProgressRing({
  current,
  goal,
  percent,
}: {
  current: number;
  goal: number;
  percent: number;
}) {
  const safePercent = Math.max(0, Math.min(percent, 100));
  const radius = 72;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - safePercent / 100);

  return (
    <div className="relative ml-auto h-[220px] w-[220px] sm:h-[260px] sm:w-[260px]">
      <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,_rgba(132,204,22,0.22),_rgba(132,204,22,0.06)_35%,_rgba(0,0,0,0)_72%)] blur-[4px]" />

      <svg
        viewBox="0 0 220 220"
        className="absolute inset-0 h-full w-full -rotate-90"
      >
        <circle
          cx="110"
          cy="110"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="14"
        />
        <circle
          cx="110"
          cy="110"
          r={radius}
          fill="none"
          stroke="rgb(163 230 53)"
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{
            filter: 'drop-shadow(0 0 10px rgba(163,230,53,0.45))',
            transition: 'stroke-dashoffset 500ms ease',
          }}
        />
      </svg>

      <div className="absolute inset-[30px] flex flex-col items-center justify-center rounded-full border border-white/10 bg-black/75 backdrop-blur-md text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-500">
          Weekly Goal
        </p>

        <p className="mt-2 text-5xl font-extrabold leading-none text-white">
          {safePercent}%
        </p>

        <p className="mt-2 text-sm font-medium text-zinc-300">
          {current} / {goal}
        </p>

        <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-500">
          weekly units
        </p>
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="mx-auto min-h-screen max-w-6xl bg-black px-6 py-8 text-white">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Miracle Network
            </div>
            <h1 className="mt-2 text-4xl font-extrabold sm:text-5xl">
              Welcome
            </h1>
            <p className="mt-3 max-w-2xl text-base text-zinc-400 sm:text-lg">
              Start your first session and save your progress after you finish.
            </p>
          </div>

          <div className="rounded-full border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm text-zinc-300">
            Guest Mode
          </div>
        </div>

        <section className="mb-6 overflow-hidden rounded-[32px] border border-lime-400/20 bg-[radial-gradient(circle_at_top_right,_rgba(132,204,22,0.18),_rgba(0,0,0,0.96)_55%)] p-5 sm:p-7">
          <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div>
              <p className="inline-flex rounded-full bg-lime-400/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-lime-400">
                Today’s Focus
              </p>

              <h2 className="mt-5 max-w-2xl text-3xl font-extrabold leading-tight text-white sm:text-5xl">
                Start your week strong.
              </h2>

              <p className="mt-3 max-w-2xl text-base text-zinc-300 sm:text-lg">
                Your weekly training goal starts with the first work you log.
              </p>

              <div className="mt-6">
                <Link
                  href="/dashboard/compete/108-athlete-challenge"
                  className="inline-flex items-center justify-center rounded-2xl bg-lime-400 px-6 py-3 text-sm font-bold text-black shadow-[0_0_20px_rgba(132,204,22,0.25)] transition hover:opacity-90"
                >
                  Continue Training
                </Link>
              </div>
            </div>

            <WeeklyProgressRing current={0} goal={1000} percent={0} />
          </div>
        </section>

        <div className="grid gap-4 md:grid-cols-2">
          <InfoCard
            eyebrow="Momentum"
            title="Build momentum"
            body="Your dashboard gets smarter after your first completed session."
            accent="purple"
          />

          <InfoCard
            eyebrow="Last Session"
            title="No session yet"
            body="Complete your first workout and this space will reflect your progress."
            accent="blue"
          />
        </div>
      </main>
    );
  }

  const { data: athlete } = await supabase
    .from('athletes')
    .select('id, first_name, last_name')
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

  const { data: completedLogs, error: completedLogsError } = await supabase
    .from('workout_logs')
    .select('completed_at, workout_id')
    .eq('athlete_id', athleteId)
    .not('completed_at', 'is', null)
    .order('completed_at', { ascending: false });

  if (completedLogsError) {
    console.error('DASHBOARD completedLogsError', completedLogsError);
  }

  const { data: challengeWorkouts, error: challengeWorkoutsError } =
    await supabase
      .from('workouts')
      .select('id, title, day_order')
      .eq('training_program_id', CHALLENGE_PROGRAM_ID)
      .order('day_order', { ascending: true });

  if (challengeWorkoutsError) {
    console.error('DASHBOARD challengeWorkoutsError', challengeWorkoutsError);
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  const { data: weeklyExerciseLogs, error: weeklyExerciseLogsError } =
    await supabase
      .from('exercise_logs')
      .select(
        'athlete_id, actual_reps, actual_time_seconds, actual_score, actual_exit_velocity, completed, created_at'
      )
      .eq('athlete_id', athleteId)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false });

  if (weeklyExerciseLogsError) {
    console.error('DASHBOARD weeklyExerciseLogsError', weeklyExerciseLogsError);
  }

  const { data: quickIntros, error: quickIntrosError } = await supabase
    .from('content_posts')
    .select('title, external_url, system_key, audience')
    .eq('intel_type', 'quick_action_intro')
    .eq('status', 'published')
    .in('audience', ['athletes', 'both']);

  if (quickIntrosError) {
    console.error('DASHBOARD quickIntrosError', quickIntrosError);
  }

  const normalizedCompletedLogs = (completedLogs ?? []) as CompletedLogRow[];
  const challengeWorkoutRows = (challengeWorkouts ?? []) as ChallengeWorkoutRow[];
  const weeklyExerciseLogRows = (weeklyExerciseLogs ?? []) as ExerciseLogRow[];

  console.log('DASHBOARD athleteId', athleteId);
  console.log('DASHBOARD weeklyExerciseLogRows', weeklyExerciseLogRows);

  let latestWorkoutTitle = '108 Athlete Challenge Session';

  const latestWorkoutLog: LatestWorkoutLog | null =
    normalizedCompletedLogs.length > 0
      ? {
          id: 'latest',
          completed_at: normalizedCompletedLogs[0].completed_at,
          workout_id: normalizedCompletedLogs[0].workout_id,
        }
      : null;

  if (latestWorkoutLog?.workout_id) {
    const matchingChallengeWorkout = challengeWorkoutRows.find(
      (workout) => workout.id === latestWorkoutLog.workout_id
    );

    if (matchingChallengeWorkout?.title) {
      latestWorkoutTitle = matchingChallengeWorkout.title;
    } else {
      const { data: workoutRow, error: workoutTitleError } = await supabase
        .from('workouts')
        .select('id, title')
        .eq('id', latestWorkoutLog.workout_id)
        .maybeSingle();

      if (workoutTitleError) {
        console.error('DASHBOARD workoutTitleError', workoutTitleError);
      }

      if (workoutRow?.title) {
        latestWorkoutTitle = workoutRow.title;
      }
    }
  }

  const dashboardState = getDashboardState({
    completedLogs: normalizedCompletedLogs,
    challengeWorkouts: challengeWorkoutRows,
    latestWorkoutTitle,
    latestScore: latestScore?.score ?? null,
    weeklyExerciseLogs: weeklyExerciseLogRows,
  });

  console.log('DASHBOARD heroState', dashboardState.heroState);

  const {
    daysAgo,
    streakCount,
    lastWorkoutLabel,
    streakBadgeLabel,
    heroState,
    momentumTitle,
    momentumLine,
    lastSessionReflection,
    latestScoreLabel,
  } = dashboardState;

  return (
    <main className="mx-auto min-h-screen max-w-6xl bg-black px-6 py-8 text-white">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Miracle Network
          </div>
          <h1 className="mt-2 text-4xl font-extrabold tracking-tight sm:text-6xl">
            Welcome back, {athleteName}
          </h1>
          <p className="mt-3 max-w-2xl text-base text-zinc-400 sm:text-lg">
            {daysAgo === 0 ? "Let's keep your momentum going." : lastWorkoutLabel}
          </p>
        </div>

        <div className="rounded-full border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm text-zinc-300">
          {streakBadgeLabel}
        </div>
      </div>

      <section className="relative mb-6 overflow-hidden rounded-[32px] border border-lime-400/20 bg-[radial-gradient(circle_at_top_right,_rgba(132,204,22,0.20),_rgba(0,0,0,0.96)_54%)] p-5 sm:p-7">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,transparent_40%,rgba(132,204,22,0.05)_70%,transparent_100%)]" />
        <div className="relative grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div>
            <p className="inline-flex rounded-full bg-lime-400/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-lime-400">
              Today’s Focus
            </p>

            <h2 className="mt-5 max-w-2xl text-3xl font-extrabold leading-tight text-white sm:text-5xl">
              {heroState.headline}
            </h2>

            <p className="mt-4 max-w-2xl text-base text-zinc-300 sm:text-lg">
              {heroState.subtext}
            </p>

            <div className="mt-5 space-y-2">
              <p className="text-sm font-medium text-white">
                {heroState.progressLabel}
              </p>
              <p className="text-sm text-zinc-400">{heroState.supportLabel}</p>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={heroState.ctaHref}
                className="inline-flex items-center justify-center rounded-2xl bg-lime-400 px-5 py-3 text-sm font-bold text-black transition hover:opacity-90"
              >
                {heroState.ctaLabel}
              </Link>

              <Link
                href="/dashboard/compete/108-athlete-challenge"
                className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-semibold text-zinc-200 transition hover:bg-white/[0.05]"
              >
                View Challenge
              </Link>
            </div>
          </div>

          <WeeklyProgressRing
            current={heroState.progressCurrent}
            goal={heroState.progressGoal}
            percent={heroState.progressPercent}
          />
        </div>
      </section>

      <section className="mb-6 grid gap-4 md:grid-cols-2">
        <InfoCard
          eyebrow="Your Momentum"
          title={momentumTitle}
          body={momentumLine}
          accent="purple"
          footer={
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
              <p className="text-4xl font-bold text-white">
                {streakCount}
                <span className="ml-2 text-lg text-zinc-400">day</span>
              </p>
              <p className="mt-1 text-xs uppercase tracking-[0.14em] text-zinc-500">
                Day Streak
              </p>
            </div>
          }
        />

        <InfoCard
          eyebrow="Last Session"
          title={latestWorkoutTitle}
          body={lastSessionReflection}
          accent="blue"
          footer={
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">
                    Status
                  </p>
                  <p className="mt-1 text-sm font-medium text-white">
                    {lastWorkoutLabel}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">
                    Latest Score
                  </p>
                  <p className="mt-1 text-sm font-medium text-white">
                    {latestScoreLabel}
                  </p>
                </div>
              </div>
            </div>
          }
        />
      </section>

      <section>
        <div className="mb-4">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
            Quick Actions
          </p>
          <p className="mt-1 text-sm text-zinc-500">
            Jump into what matters most.
          </p>
        </div>

        <QuickActionsClient intros={quickIntros || []} />
      </section>
    </main>
  );
}