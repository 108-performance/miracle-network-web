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
  exercise_id?: string | null;
  exercise_name?: string | null;
  actual_reps?: number | null;
  actual_time_seconds?: number | null;
  actual_score?: number | null;
  actual_exit_velocity?: number | null;
  completed: boolean | null;
  created_at: string;
};

type ExerciseVariantRow = {
  id: string;
  movement_id: string | null;
  name: string | null;
};

type MovementRow = {
  id: string;
  name: string | null;
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

function TripleProgressRings({
  anchored,
  dynamic,
  gameSkill,
}: {
  anchored: { current: number; goal: number; percent: number; label: string };
  dynamic: { current: number; goal: number; percent: number; label: string };
  gameSkill: { current: number; goal: number; percent: number; label: string };
}) {
  const totalCurrent = anchored.current + dynamic.current + gameSkill.current;
  const totalGoal = anchored.goal + dynamic.goal + gameSkill.goal;

  const createRing = (
    size: number,
    stroke: number,
    percent: number,
    trackOpacity: string
  ) => {
    const radius = (size - stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    const dashOffset =
      circumference * (1 - Math.max(0, Math.min(percent, 100)) / 100);

    return { radius, circumference, dashOffset, stroke, trackOpacity };
  };

  const outer = createRing(168, 16, anchored.percent, '0.12');
  const middle = createRing(128, 14, dynamic.percent, '0.10');
  const inner = createRing(88, 12, gameSkill.percent, '0.08');

  return (
    <div className="mx-auto flex w-full max-w-[330px] items-center justify-center gap-5">
      <div className="relative h-[168px] w-[168px] shrink-0">
        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,_rgba(255,255,255,0.06),_rgba(0,0,0,0)_70%)] blur-[4px]" />

        <svg viewBox="0 0 170 170" className="absolute inset-0 h-full w-full -rotate-90">
          <circle
            cx="85"
            cy="85"
            r={outer.radius}
            fill="none"
            stroke={`rgba(255,255,255,${outer.trackOpacity})`}
            strokeWidth={outer.stroke}
          />
          <circle
            cx="85"
            cy="85"
            r={outer.radius}
            fill="none"
            stroke="#A3E635"
            strokeWidth={outer.stroke}
            strokeLinecap="round"
            strokeDasharray={outer.circumference}
            strokeDashoffset={outer.dashOffset}
            style={{
              filter: 'drop-shadow(0 0 10px rgba(163,230,53,0.38))',
              transition: 'stroke-dashoffset 500ms ease',
            }}
          />
        </svg>

        <svg viewBox="0 0 170 170" className="absolute inset-0 h-full w-full -rotate-90">
          <circle
            cx="85"
            cy="85"
            r={middle.radius}
            fill="none"
            stroke={`rgba(255,255,255,${middle.trackOpacity})`}
            strokeWidth={middle.stroke}
          />
          <circle
            cx="85"
            cy="85"
            r={middle.radius}
            fill="none"
            stroke="#3B82F6"
            strokeWidth={middle.stroke}
            strokeLinecap="round"
            strokeDasharray={middle.circumference}
            strokeDashoffset={middle.dashOffset}
            style={{
              filter: 'drop-shadow(0 0 8px rgba(59,130,246,0.30))',
              transition: 'stroke-dashoffset 500ms ease',
            }}
          />
        </svg>

        <svg viewBox="0 0 170 170" className="absolute inset-0 h-full w-full -rotate-90">
          <circle
            cx="85"
            cy="85"
            r={inner.radius}
            fill="none"
            stroke={`rgba(255,255,255,${inner.trackOpacity})`}
            strokeWidth={inner.stroke}
          />
          <circle
            cx="85"
            cy="85"
            r={inner.radius}
            fill="none"
            stroke="#EC4899"
            strokeWidth={inner.stroke}
            strokeLinecap="round"
            strokeDasharray={inner.circumference}
            strokeDashoffset={inner.dashOffset}
            style={{
              filter: 'drop-shadow(0 0 6px rgba(236,72,153,0.26))',
              transition: 'stroke-dashoffset 500ms ease',
            }}
          />
        </svg>
      </div>

      <div className="w-full max-w-[128px] space-y-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-500">
            Close Rings
          </p>
          <p className="mt-2 text-2xl font-extrabold text-white">
            {totalCurrent} / {totalGoal}
          </p>
          <p className="text-sm text-zinc-400">weekly target</p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 rounded-xl border border-white/6 bg-white/[0.03] px-3 py-2">
            <span className="h-2.5 w-2.5 rounded-full bg-lime-400" />
            <p className="text-sm font-semibold text-white">Anchored</p>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-white/6 bg-white/[0.03] px-3 py-2">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
            <p className="text-sm font-semibold text-white">Dynamic</p>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-white/6 bg-white/[0.03] px-3 py-2">
            <span className="h-2.5 w-2.5 rounded-full bg-pink-500" />
            <p className="text-sm font-semibold text-white">Game / Skill</p>
          </div>
        </div>
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
          <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div>
              <p className="inline-flex rounded-full bg-lime-400/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-lime-400">
                Today’s Focus
              </p>

              <h2 className="mt-5 max-w-2xl text-3xl font-extrabold leading-tight text-white sm:text-5xl">
                Start closing your rings.
              </h2>

              <p className="mt-3 max-w-2xl text-base text-zinc-300 sm:text-lg">
                Build anchored, dynamic, and game skill work this week.
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

            <TripleProgressRings
              anchored={{ label: 'Anchored', current: 0, goal: 300, percent: 0 }}
              dynamic={{ label: 'Dynamic', current: 0, goal: 300, percent: 0 }}
              gameSkill={{ label: 'Game / Skill', current: 0, goal: 300, percent: 0 }}
            />
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
        `
        athlete_id,
        exercise_id,
        actual_reps,
        actual_time_seconds,
        actual_score,
        actual_exit_velocity,
        completed,
        created_at,
        exercises:exercise_id (
          id,
          name
        )
      `
      )
      .eq('athlete_id', athleteId)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false });

  if (weeklyExerciseLogsError) {
    console.error('DASHBOARD weeklyExerciseLogsError', weeklyExerciseLogsError);
  }

  const { data: exerciseVariants, error: exerciseVariantsError } = await supabase
    .from('exercise_variants')
    .select('id, movement_id, name');

  if (exerciseVariantsError) {
    console.error('DASHBOARD exerciseVariantsError', exerciseVariantsError);
  }

  const { data: movements, error: movementsError } = await supabase
    .from('movements')
    .select('id, name');

  if (movementsError) {
    console.error('DASHBOARD movementsError', movementsError);
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
  const exerciseVariantRows = (exerciseVariants ?? []) as ExerciseVariantRow[];
  const movementRows = (movements ?? []) as MovementRow[];

  const weeklyExerciseLogRows: ExerciseLogRow[] = (weeklyExerciseLogs ?? []).map((row: any) => ({
    athlete_id: row.athlete_id,
    exercise_id: row.exercise_id,
    exercise_name: Array.isArray(row.exercises)
      ? row.exercises[0]?.name ?? null
      : row.exercises?.name ?? null,
    actual_reps: row.actual_reps,
    actual_time_seconds: row.actual_time_seconds,
    actual_score: row.actual_score,
    actual_exit_velocity: row.actual_exit_velocity,
    completed: row.completed,
    created_at: row.created_at,
  }));

  console.log('DASHBOARD athleteId', athleteId);
  console.log('DASHBOARD weeklyExerciseLogRows', weeklyExerciseLogRows);
  console.log('DASHBOARD exerciseVariantRows', exerciseVariantRows);
  console.log('DASHBOARD movementRows', movementRows);

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
    exerciseVariants: exerciseVariantRows,
    movements: movementRows,
  });

  console.log('DASHBOARD heroState', dashboardState.heroState);
  console.log('DASHBOARD rings', dashboardState.rings);

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
    rings,
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

        <div className="relative grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
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
              <p className="text-sm font-medium text-white">{heroState.progressLabel}</p>
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

          <TripleProgressRings
            anchored={rings.anchored}
            dynamic={rings.dynamic}
            gameSkill={rings.gameSkill}
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
            <div className="grid grid-cols-3 gap-3 rounded-2xl border border-white/5 bg-white/[0.02] p-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-500">
                  Anchored
                </p>
                <p className="mt-1 text-lg font-bold text-white">
                  {rings.anchored.percent}%
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-500">
                  Dynamic
                </p>
                <p className="mt-1 text-lg font-bold text-white">
                  {rings.dynamic.percent}%
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-500">
                  Game
                </p>
                <p className="mt-1 text-lg font-bold text-white">
                  {rings.gameSkill.percent}%
                </p>
              </div>
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
          <p className="mt-1 text-sm text-zinc-500">Jump into what matters most.</p>
        </div>

        <QuickActionsClient intros={quickIntros || []} />
      </section>
    </main>
  );
}