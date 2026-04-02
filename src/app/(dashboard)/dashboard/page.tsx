import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

type LatestWorkoutLog = {
  id: string;
  completed_at: string | null;
  workout_id: string | null;
};

type CompletedLogRow = {
  completed_at: string;
  workout_id: string | null;
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

function getBehaviorState(daysAgo: number | null, streakCount: number) {
  if (daysAgo === null) {
    return {
      headline: 'Start your first session',
      subtext: 'Jump into the 108 Athlete Challenge and build momentum.',
      ctaLabel: 'Start your first session',
      statusLabel: 'No sessions completed yet',
    };
  }

  if (daysAgo === 0) {
    return {
      headline: 'Nice work. You got better today.',
      subtext:
        streakCount > 1
          ? `You’re on a ${streakCount} day streak. Come back tomorrow to keep it alive.`
          : 'Come back tomorrow to keep your streak alive.',
      ctaLabel: 'View your latest session',
      statusLabel: 'Session completed today',
    };
  }

  if (daysAgo === 1) {
    return {
      headline: 'You trained yesterday. Stay on it.',
      subtext:
        streakCount > 1
          ? `Keep your ${streakCount} day streak alive today.`
          : 'Build your streak today.',
      ctaLabel: 'Build your streak today.',
      statusLabel: 'Last session yesterday',
    };
  }

  if (daysAgo <= 3) {
    return {
      headline: 'Your next session is ready.',
      subtext: 'Get back in rhythm today.',
      ctaLabel: 'Get back in rhythm today.',
      statusLabel: `Last session ${daysAgo} days ago`,
    };
  }

  return {
    headline: 'Let’s get back to work.',
    subtext: 'A quick session today restarts momentum.',
    ctaLabel: 'Restart momentum today.',
    statusLabel: `Last session ${daysAgo} days ago`,
  };
}

function getStreakLabel(streakCount: number, daysAgo: number | null) {
  if (streakCount > 1) return `🔥 ${streakCount} day streak`;
  if (streakCount === 1 && daysAgo === 0) return '🔥 1 day streak';
  if (daysAgo === 1) return 'Train today to keep it going';
  return 'Start your streak';
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

function ActionTile({
  href,
  label,
  subtext,
  detail,
  variant,
  primary = false,
  badge,
}: {
  href: string;
  label: 'Train' | 'Compete' | 'Improve' | 'Workout';
  subtext: string;
  detail: string;
  variant: TileVariant;
  primary?: boolean;
  badge?: React.ReactNode;
}) {
  const styles = {
    train: {
      border: 'border-lime-400/30',
      iconBg: 'bg-lime-400/10',
      iconColor: 'text-lime-400',
      glow: 'shadow-[0_0_32px_rgba(132,204,22,0.10)]',
    },
    compete: {
      border: 'border-fuchsia-400/20',
      iconBg: 'bg-fuchsia-400/10',
      iconColor: 'text-fuchsia-400',
      glow: 'shadow-[0_0_24px_rgba(217,70,239,0.08)]',
    },
    improve: {
      border: 'border-amber-400/20',
      iconBg: 'bg-amber-400/10',
      iconColor: 'text-amber-400',
      glow: 'shadow-[0_0_24px_rgba(251,191,36,0.08)]',
    },
    workout: {
      border: 'border-sky-400/20',
      iconBg: 'bg-sky-400/10',
      iconColor: 'text-sky-400',
      glow: 'shadow-[0_0_24px_rgba(56,189,248,0.08)]',
    },
  }[variant];

  return (
    <Link
      href={href}
      className={`group relative flex h-[160px] flex-col justify-between overflow-hidden rounded-2xl border p-5 text-left transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${
        primary
          ? `${styles.border} bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900 ${styles.glow}`
          : `${styles.border} bg-zinc-950/90 ${styles.glow}`
      }`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-white/[0.03] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="relative z-10">
        <div className="mb-3 flex items-center justify-between">
          <div
            className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${styles.iconBg} ${styles.iconColor}`}
          >
            <TileIcon variant={variant} />
          </div>
          {badge}
        </div>

        <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-white">
          {label}
        </h3>

        <p className="mt-1 text-xs text-zinc-400">{subtext}</p>
      </div>

      <div className="relative z-10">
        <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-zinc-500">
          {detail}
        </span>
      </div>
    </Link>
  );
}

function StatTile({
  eyebrow,
  title,
  lines,
}: {
  eyebrow: string;
  title: string;
  lines: Array<{ label: string; value: string }>;
}) {
  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-xl font-bold text-white">{title}</h2>
      <div className="mt-4 grid gap-2 text-sm text-zinc-400">
        {lines.map((line) => (
          <p key={line.label}>
            <span className="font-semibold text-zinc-200">{line.label}:</span>{' '}
            {line.value}
          </p>
        ))}
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
    redirect('/login');
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

  const normalizedCompletedLogs = (completedLogs ?? []) as CompletedLogRow[];
  const workoutLogCount = normalizedCompletedLogs.length;
  const streakCount = calculateStreak(normalizedCompletedLogs);

  const latestWorkoutLog: LatestWorkoutLog | null =
    normalizedCompletedLogs.length > 0
      ? {
          id: 'latest',
          completed_at: normalizedCompletedLogs[0].completed_at,
          workout_id: normalizedCompletedLogs[0].workout_id,
        }
      : null;

  let latestWorkoutTitle = '108 Athlete Challenge Session';

  if (latestWorkoutLog?.workout_id) {
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

  const daysAgo = getDaysAgoFromNow(latestWorkoutLog?.completed_at ?? null);
  const behaviorState = getBehaviorState(daysAgo, streakCount);
  const lastWorkoutLabel = getRelativeDayLabel(daysAgo);
  const streakLabel = getStreakLabel(streakCount, daysAgo);

  const todayCtaHref = latestWorkoutLog?.workout_id
    ? `/dashboard/training/${latestWorkoutLog.workout_id}`
    : '/dashboard/compete/108-athlete-challenge';

  const momentumTitle =
    streakCount > 1 ? `${streakCount} day streak` : 'Keep Building Momentum';

  const momentumMessage =
    streakCount > 1
      ? 'You’re building consistency.'
      : daysAgo === 1
        ? 'Build your streak today.'
        : 'Get back in rhythm.';

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
            {behaviorState.statusLabel}
          </p>
        </div>

        <div className="rounded-full border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm text-zinc-300">
          {streakLabel}
        </div>
      </div>

      <section className="mb-8 rounded-[28px] border border-zinc-800 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_rgba(0,0,0,0.96)_60%)] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] sm:p-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-400">
              Today’s Focus
            </p>

            <h2 className="mt-3 text-3xl font-extrabold text-white sm:text-4xl">
              {behaviorState.headline}
            </h2>
          </div>

          <Link
            href={todayCtaHref}
            className="inline-flex items-center justify-center rounded-2xl bg-lime-400 px-5 py-3 text-sm font-bold text-black transition hover:opacity-90"
          >
            {behaviorState.subtext}
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <ActionTile
            href="/dashboard/train"
            label="Train"
            subtext="Continue Challenge"
            detail={lastWorkoutLabel}
            variant="train"
            primary
            badge={
              <div className="flex items-center gap-1.5 rounded-full bg-lime-400/15 px-2 py-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-lime-400 animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-lime-400">
                  Ready
                </span>
              </div>
            }
          />

          <ActionTile
            href="/dashboard/compete"
            label="Compete"
            subtext="Beat your score"
            detail="108 Athlete Challenge"
            variant="compete"
          />

          <ActionTile
            href="/dashboard/improve"
            label="Improve"
            subtext="Correct mistakes"
            detail="Targeted drills"
            variant="improve"
          />

          <ActionTile
            href="/dashboard/workout"
            label="Workout"
            subtext="Train specific skills"
            detail="Power · Speed · Control"
            variant="workout"
          />
        </div>
      </section>

      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-2">
          <StatTile
            eyebrow="Last Session"
            title={latestWorkoutTitle}
            lines={[
              { label: 'Status', value: lastWorkoutLabel },
              {
                label: 'Next Step',
                value: 'Return to the 108 Athlete Challenge',
              },
            ]}
          />

          <StatTile
            eyebrow="Momentum"
            title={momentumTitle}
            lines={[
              {
                label: 'Streak',
                value:
                  streakCount > 0
                    ? `${streakCount} day${streakCount === 1 ? '' : 's'}`
                    : 'No active streak',
              },
              {
                label: 'Latest Score',
                value: String(latestScore?.score ?? 'No scores yet'),
              },
              {
                label: 'Challenge Level',
                value: String(latestScore?.level ?? 'No level yet'),
              },
              {
                label: 'Focus',
                value: momentumMessage,
              },
            ]}
          />
        </section>
      </div>
    </main>
  );
}