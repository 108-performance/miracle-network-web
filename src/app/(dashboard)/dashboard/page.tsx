import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const CHALLENGE_PROGRAM_ID = 'ad7376ba-9746-4c1b-b11d-d7ba245add79';
const DEFAULT_CHALLENGE_TOTAL = 8;

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

function getStartOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function getDaysAgoFromNow(dateString: string | null) {
  if (!dateString) return null;

  const now = new Date();
  const target = new Date(dateString);

  const nowStart = getStartOfDay(now);
  const targetStart = getStartOfDay(target);

  const diffMs = nowStart.getTime() - targetStart.getTime();
  return Math.floor(diffMs / 86400000);
}

function calculateStreak(logs: CompletedLogRow[]) {
  if (!logs || logs.length === 0) return 0;

  const uniqueDays = new Set(
    logs.map((log) => {
      const d = new Date(log.completed_at);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    })
  );

  const sortedDays = Array.from(uniqueDays).sort((a, b) => b - a);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let streak = 0;

  for (let i = 0; i < sortedDays.length; i++) {
    const expectedDay = new Date(today);
    expectedDay.setDate(today.getDate() - i);
    expectedDay.setHours(0, 0, 0, 0);

    if (sortedDays[i] === expectedDay.getTime()) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

function getRelativeDayLabel(daysAgo: number | null) {
  if (daysAgo === null) return 'No session logged yet';
  if (daysAgo === 0) return 'Completed today';
  if (daysAgo === 1) return 'Completed yesterday';
  return `Completed ${daysAgo} days ago`;
}

function getStreakBadgeLabel(streakCount: number, daysAgo: number | null) {
  if (streakCount > 1) return `🔥 ${streakCount} day streak`;
  if (streakCount === 1 && daysAgo === 0) return '🔥 1 day streak';
  if (daysAgo === 1) return 'Train today';
  return 'Start your streak';
}

function getMomentumTitle(streakCount: number) {
  if (streakCount >= 3) return 'You’re building real momentum.';
  if (streakCount === 2) return 'You’re building momentum.';
  return 'Build momentum today.';
}

function getMomentumLine(streakCount: number) {
  if (streakCount >= 3) return 'Consistency is starting to stack.';
  if (streakCount === 2) return 'One more day makes this feel real.';
  return 'A quick session today gets you moving again.';
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getChallengeHeroState({
  daysAgo,
  streakCount,
  completedCount,
  totalCount,
}: {
  daysAgo: number | null;
  streakCount: number;
  completedCount: number;
  totalCount: number;
}) {
  const safeTotal = totalCount > 0 ? totalCount : DEFAULT_CHALLENGE_TOTAL;
  const nextDay = clamp(completedCount + 1, 1, safeTotal);

  if (daysAgo === null) {
    return {
      headline: 'Start Day 1.',
      subtext: 'Begin your 108 Athlete Challenge.',
      ctaLabel: 'Start Challenge',
      ctaHref: '/dashboard/compete/108-athlete-challenge',
      ringLabelTop: `0 of ${safeTotal}`,
      ringLabelBottom: 'Days Complete',
    };
  }

  if (daysAgo === 0) {
    return {
      headline:
        completedCount >= safeTotal
          ? 'Challenge complete.'
          : `Day ${nextDay} is ready.`,
      subtext:
        completedCount >= safeTotal
          ? 'Great work. Reset and go again when you’re ready.'
          : streakCount > 1
            ? `${streakCount} day streak. Keep it rolling.`
            : 'You showed up today. Keep it going.',
      ctaLabel:
        completedCount >= safeTotal ? 'View Challenge' : 'Continue Challenge',
      ctaHref: '/dashboard/compete/108-athlete-challenge',
      ringLabelTop: `${completedCount} of ${safeTotal}`,
      ringLabelBottom: 'Days Complete',
    };
  }

  if (daysAgo === 1) {
    return {
      headline: `Day ${nextDay} is ready.`,
      subtext:
        streakCount > 1
          ? `${streakCount} day streak. Keep it alive today.`
          : 'You trained yesterday. Keep it moving today.',
      ctaLabel: 'Continue Challenge',
      ctaHref: '/dashboard/compete/108-athlete-challenge',
      ringLabelTop: `${completedCount} of ${safeTotal}`,
      ringLabelBottom: 'Days Complete',
    };
  }

  if (daysAgo <= 3) {
    return {
      headline: `Day ${nextDay} is ready.`,
      subtext: 'Continue your 108 Athlete Challenge.',
      ctaLabel: 'Continue Challenge',
      ctaHref: '/dashboard/compete/108-athlete-challenge',
      ringLabelTop: `${completedCount} of ${safeTotal}`,
      ringLabelBottom: 'Days Complete',
    };
  }

  return {
    headline: 'Start again today.',
    subtext: 'A quick session gets momentum moving again.',
    ctaLabel: 'Restart Momentum',
    ctaHref: '/dashboard/compete/108-athlete-challenge',
    ringLabelTop: `${completedCount} of ${safeTotal}`,
    ringLabelBottom: 'Days Complete',
  };
}

type TileVariant = 'train' | 'compete' | 'improve' | 'workout';

function TileIcon({ variant }: { variant: TileVariant }) {
  const className = 'h-5 w-5';

  if (variant === 'train') {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={className}>
        <path
          d="M3 10h3l2-2 8 8-2 2v3"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M14 5l5 5"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (variant === 'compete') {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={className}>
        <path
          d="M12 4l2.2 4.5 5 .7-3.6 3.5.9 5-4.5-2.4-4.5 2.4.9-5-3.6-3.5 5-.7L12 4Z"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (variant === 'improve') {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={className}>
        <path
          d="M14 5a4 4 0 0 0 5 5l-9 9a2.2 2.2 0 0 1-3.1-3.1l9-9Z"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M12 4l7 4v8l-7 4-7-4V8l7-4Z"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinejoin="round"
      />
      <path
        d="M12 8v8M8.5 10l7 4"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
    </svg>
  );
}

function QuickActionTile({
  href,
  label,
  subtext,
  variant,
}: {
  href: string;
  label: 'Train' | 'Compete' | 'Improve' | 'Workout';
  subtext: string;
  variant: TileVariant;
}) {
  const styles = {
    train: {
      border: 'border-lime-400/15',
      iconBg: 'bg-lime-400/10',
      iconColor: 'text-lime-400',
    },
    compete: {
      border: 'border-fuchsia-400/15',
      iconBg: 'bg-fuchsia-400/10',
      iconColor: 'text-fuchsia-400',
    },
    improve: {
      border: 'border-amber-400/15',
      iconBg: 'bg-amber-400/10',
      iconColor: 'text-amber-400',
    },
    workout: {
      border: 'border-sky-400/15',
      iconBg: 'bg-sky-400/10',
      iconColor: 'text-sky-400',
    },
  }[variant];

  return (
    <Link
      href={href}
      className={`group rounded-[28px] border ${styles.border} bg-zinc-950/85 p-5 transition duration-200 hover:border-zinc-700`}
    >
      <div
        className={`mb-5 inline-flex h-11 w-11 items-center justify-center rounded-2xl ${styles.iconBg} ${styles.iconColor}`}
      >
        <TileIcon variant={variant} />
      </div>

      <h3 className="text-lg font-semibold text-white">{label}</h3>
      <p className="mt-1 text-sm text-zinc-400">{subtext}</p>
    </Link>
  );
}

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

function HeroProgressRing({
  completed,
  total,
}: {
  completed: number;
  total: number;
}) {
  const safeTotal = total > 0 ? total : DEFAULT_CHALLENGE_TOTAL;
  const safeCompleted = clamp(completed, 0, safeTotal);
  const radius = 62;
  const circumference = 2 * Math.PI * radius;
  const progress = safeTotal > 0 ? safeCompleted / safeTotal : 0;
  const dashOffset = circumference * (1 - progress);

  return (
    <div className="relative ml-auto -mt-6 h-[160px] w-[160px] sm:-mt-40 sm:h-[200px] sm:w-[200px]">
      <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,_rgba(132,204,22,0.18),_rgba(0,0,0,0)_70%)] blur-[2px]" />
      <svg
        viewBox="0 0 160 160"
        className="absolute inset-0 h-full w-full -rotate-90"
      >
        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="10"
        />
        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          stroke="rgb(163 230 53)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
        />
      </svg>

      <div className="absolute inset-[22px] flex flex-col items-center justify-center rounded-full border border-white/10 bg-black/70 backdrop-blur-sm">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="mb-2 h-7 w-7 text-white/85"
        >
          <path
            d="M7 16.5c1.8.7 4.2.7 6 0 2.4-1 4-3.4 4-6.2 0-.6-.1-1.2-.3-1.8-.4.2-.8.3-1.3.3-2.2 0-4-1.8-4-4 0-.4.1-.9.2-1.3-.4-.1-.8-.1-1.2-.1-4.1 0-7.4 3.3-7.4 7.4 0 2.4 1.5 4.6 4 5.7Z"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M8.5 11.5 11 14l5-5"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        <p className="text-3xl font-bold text-white">
          {safeCompleted} of {safeTotal}
        </p>
        <p className="mt-1 text-center text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-400">
          Days Complete
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
          <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_240px]">
            <div>
              <p className="inline-flex rounded-full bg-lime-400/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-lime-400">
                Today’s Focus
              </p>

              <h2 className="mt-5 max-w-2xl text-3xl font-extrabold leading-tight text-white sm:text-5xl">
                Start Day 1.
              </h2>

              <p className="mt-3 max-w-2xl text-base text-zinc-300 sm:text-lg">
                Begin your 108 Athlete Challenge.
              </p>

              <div className="mt-6">
                <Link
                  href="/dashboard/compete/108-athlete-challenge"
                  className="inline-flex items-center justify-center rounded-2xl bg-lime-400 px-6 py-3 text-sm font-bold text-black shadow-[0_0_20px_rgba(132,204,22,0.25)] transition hover:opacity-90"
                >
                  Start Challenge
                </Link>
              </div>
            </div>

            <HeroProgressRing completed={0} total={DEFAULT_CHALLENGE_TOTAL} />
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

  const normalizedCompletedLogs = (completedLogs ?? []) as CompletedLogRow[];
  const streakCount = calculateStreak(normalizedCompletedLogs);

  const latestWorkoutLog: LatestWorkoutLog | null =
    normalizedCompletedLogs.length > 0
      ? {
          id: 'latest',
          completed_at: normalizedCompletedLogs[0].completed_at,
          workout_id: normalizedCompletedLogs[0].workout_id,
        }
      : null;

  const challengeWorkoutRows = (challengeWorkouts ?? []) as ChallengeWorkoutRow[];
  const challengeWorkoutIds = new Set(challengeWorkoutRows.map((row) => row.id));

  const completedChallengeWorkoutIds = new Set(
    normalizedCompletedLogs
      .map((log) => log.workout_id)
      .filter((id): id is string => Boolean(id && challengeWorkoutIds.has(id)))
  );

  const challengeCompletedCount = completedChallengeWorkoutIds.size;
  const challengeTotalCount =
    challengeWorkoutRows.length > 0
      ? challengeWorkoutRows.length
      : DEFAULT_CHALLENGE_TOTAL;

  let latestWorkoutTitle = '108 Athlete Challenge Session';

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

  const daysAgo = getDaysAgoFromNow(latestWorkoutLog?.completed_at ?? null);
  const lastWorkoutLabel = getRelativeDayLabel(daysAgo);
  const streakBadgeLabel = getStreakBadgeLabel(streakCount, daysAgo);

  const heroState = getChallengeHeroState({
    daysAgo,
    streakCount,
    completedCount: challengeCompletedCount,
    totalCount: challengeTotalCount,
  });

  const momentumTitle = getMomentumTitle(streakCount);
  const momentumLine = getMomentumLine(streakCount);

  const lastSessionReflection =
    daysAgo === 0
      ? 'You completed this session today.'
      : daysAgo === 1
        ? 'You trained yesterday. Stay consistent.'
        : daysAgo === null
          ? 'Start your first session to begin tracking progress.'
          : 'Pick this back up today.';

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
        <div className="pointer-events-none absolute right-[22%] top-1/2 hidden h-28 w-40 -translate-y-1/2 opacity-20 lg:block">
          <div className="absolute left-0 top-1/2 h-10 w-10 -translate-y-1/2 rotate-45 border-r border-t border-lime-400/30" />
          <div className="absolute left-10 top-1/2 h-10 w-10 -translate-y-1/2 rotate-45 border-r border-t border-lime-400/20" />
          <div className="absolute left-20 top-1/2 h-10 w-10 -translate-y-1/2 rotate-45 border-r border-t border-lime-400/10" />
        </div>

        <div className="relative grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_240px]">
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
                View Plan
              </Link>
            </div>
          </div>

          <HeroProgressRing
            completed={challengeCompletedCount}
            total={challengeTotalCount}
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
                    {latestScore?.score ?? 'No score yet'}
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

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <QuickActionTile
            href="/dashboard/train"
            label="Train"
            subtext="Continue a workout"
            variant="train"
          />

          <QuickActionTile
            href="/dashboard/compete"
            label="Compete"
            subtext="Join a challenge"
            variant="compete"
          />

          <QuickActionTile
            href="/dashboard/improve"
            label="Improve"
            subtext="Targeted drills"
            variant="improve"
          />

          <QuickActionTile
            href="/dashboard/workout"
            label="Workout"
            subtext="Train specific skills"
            variant="workout"
          />
        </div>
      </section>
    </main>
  );
}