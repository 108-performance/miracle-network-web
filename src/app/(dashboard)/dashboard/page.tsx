import QuickActionsClient from '@/components/dashboard/QuickActionsClient';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { buildRecommendationState } from '@/core/protected/recommendation/buildRecommendationState';
import type { RecommendationState } from '@/core/protected/recommendation/types';
import { getDashboardRingState } from '@/core/display/dashboard/getDashboardRingState';
import { getDashboardData } from '@/lib/data/dashboard/getDashboardData';

export const dynamic = 'force-dynamic';

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

        <svg
          viewBox="0 0 170 170"
          className="absolute inset-0 h-full w-full -rotate-90"
        >
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

        <svg
          viewBox="0 0 170 170"
          className="absolute inset-0 h-full w-full -rotate-90"
        >
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

        <svg
          viewBox="0 0 170 170"
          className="absolute inset-0 h-full w-full -rotate-90"
        >
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

function getLastWorkoutLabel(daysSinceLastSession: number | null) {
  if (daysSinceLastSession === null) return 'No session logged yet';
  if (daysSinceLastSession === 0) return 'Completed today';
  if (daysSinceLastSession === 1) return 'Completed yesterday';
  return `Completed ${daysSinceLastSession} days ago`;
}

function getStreakBadgeLabel(
  streakCount: number,
  daysSinceLastSession: number | null
) {
  if (streakCount > 1) return `🔥 ${streakCount} day streak`;
  if (streakCount === 1 && daysSinceLastSession === 0) return '🔥 1 day streak';
  if (daysSinceLastSession === 1) return 'Train today';
  return 'Start your streak';
}

function getContinuationTitle(state: 'new' | 'active' | 'paused') {
  if (state === 'active') return 'You’re in rhythm.';
  if (state === 'paused') return 'Let’s build momentum again.';
  return 'Start your momentum.';
}

function getContinuationBody({
  state,
  streakCount,
  sessionsThisWeek,
  daysSinceLastSession,
}: {
  state: 'new' | 'active' | 'paused';
  streakCount: number;
  sessionsThisWeek: number;
  daysSinceLastSession: number | null;
}) {
  if (state === 'new') {
    return 'Your dashboard will get smarter after your first completed session.';
  }

  if (state === 'paused') {
    return daysSinceLastSession !== null
      ? `It has been ${daysSinceLastSession} days since your last session. A quick session today gets you moving again.`
      : 'A quick session today gets you moving again.';
  }

  if (streakCount >= 3) {
    return `${streakCount} day streak. ${sessionsThisWeek} sessions logged this week.`;
  }

  if (streakCount === 2) {
    return `2 day streak. One more day makes this feel real. ${sessionsThisWeek} sessions this week.`;
  }

  return `${sessionsThisWeek} session${sessionsThisWeek === 1 ? '' : 's'} logged this week. Keep it moving today.`;
}

function getDashboardPrimaryCta(recommendation: RecommendationState) {
  const primary = recommendation.nextBestSession.primaryCta;
  const nextSession = recommendation.nextBestSession.nextSession;

  if (
    primary.href === '/dashboard/compete/108-athlete-challenge' &&
    nextSession.workoutId
  ) {
    return {
      label:
        recommendation.context.completedChallengeCount > 0
          ? 'Continue Session'
          : 'Start Session',
      href: nextSession.href,
    };
  }

  return primary;
}

function getDashboardSecondaryCta(recommendation: RecommendationState) {
  const secondary = recommendation.nextBestSession.secondaryCta;

  if (secondary.href === '/dashboard') {
    return {
      label: 'View Challenge',
      href: '/dashboard/compete/108-athlete-challenge',
    };
  }

  return secondary;
}

function getHeroSupportLabel(recommendation: RecommendationState) {
  const { messaging, nextBestSession, continuation, context } = recommendation;

  if (messaging.supportLabel?.trim()) {
    return messaging.supportLabel;
  }

  if (nextBestSession.nextSession.dayOrder != null) {
    return `Next up: Day ${nextBestSession.nextSession.dayOrder}`;
  }

  if (continuation.hasCompletedAnySession) {
    return `${context.completedChallengeCount} / ${context.totalChallengeCount} challenge sessions completed`;
  }

  return 'No completed sessions yet';
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

  const dashboardData = await getDashboardData(user.id);

  const recommendation = buildRecommendationState({
    completedLogs: dashboardData.completedLogs,
    challengeWorkouts: dashboardData.challengeWorkouts,
    currentWorkoutId: null,
    currentPathType: 'unknown',
  });

  const primaryCta = getDashboardPrimaryCta(recommendation);
  const secondaryCta = getDashboardSecondaryCta(recommendation);

  const rings = getDashboardRingState({
    weeklyExerciseLogs: dashboardData.weeklyExerciseLogs,
    exerciseVariants: dashboardData.exerciseVariants,
    movements: dashboardData.movements,
  });

  const streakBadgeLabel = getStreakBadgeLabel(
    recommendation.continuation.streakCount,
    recommendation.continuation.daysSinceLastSession
  );

  const lastWorkoutLabel = getLastWorkoutLabel(
    recommendation.continuation.daysSinceLastSession
  );

  const latestScoreLabel = dashboardData.latestScore ?? 'No score yet';

  const lastSessionReflection =
    recommendation.continuation.state === 'new'
      ? 'Start your first session to begin tracking progress.'
      : recommendation.continuation.daysSinceLastSession === 0
        ? 'You completed this session today.'
        : recommendation.continuation.daysSinceLastSession === 1
          ? 'You trained yesterday. Stay consistent.'
          : 'Pick this back up today.';

  return (
    <main className="mx-auto min-h-screen max-w-6xl bg-black px-6 py-8 text-white">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Miracle Network
          </div>
          <h1 className="mt-2 text-4xl font-extrabold tracking-tight sm:text-6xl">
            Welcome back, {dashboardData.athleteName}
          </h1>
          <p className="mt-3 max-w-2xl text-base text-zinc-400 sm:text-lg">
            {recommendation.continuation.daysSinceLastSession === 0
              ? "Let's keep your momentum going."
              : lastWorkoutLabel}
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
              {recommendation.messaging.headline}
            </h2>

            <p className="mt-4 max-w-2xl text-base text-zinc-300 sm:text-lg">
              {recommendation.messaging.subtext}
            </p>

            <div className="mt-5 space-y-2">
              <p className="text-sm font-medium text-white">
                {recommendation.nextBestSession.nextSession.title}
              </p>
              <p className="text-sm text-zinc-400">
                {getHeroSupportLabel(recommendation)}
              </p>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={primaryCta.href}
                className="inline-flex items-center justify-center rounded-2xl bg-lime-400 px-5 py-3 text-sm font-bold text-black transition hover:opacity-90"
              >
                {primaryCta.label}
              </Link>

              <Link
                href={secondaryCta.href}
                className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-semibold text-zinc-200 transition hover:bg-white/[0.05]"
              >
                {secondaryCta.label}
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
          title={getContinuationTitle(recommendation.continuation.state)}
          body={getContinuationBody({
            state: recommendation.continuation.state,
            streakCount: recommendation.continuation.streakCount,
            sessionsThisWeek: recommendation.continuation.sessionsThisWeek,
            daysSinceLastSession: recommendation.continuation.daysSinceLastSession,
          })}
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
          title={dashboardData.latestWorkoutTitle}
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

        <QuickActionsClient intros={dashboardData.quickIntros} />
      </section>
    </main>
  );
}