import Link from 'next/link';

type SearchParams = {
  title?: string;
  source?: string;
  today?: string;
  best?: string;
  last?: string;
  change?: string;
  streak?: string;
  week?: string;
  next?: string;
  nextLabel?: string;
  nextSubtext?: string;
  primaryLabel?: string;
};

function toNumber(value?: string) {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function getHeadline(change?: string, today?: string, best?: string, last?: string) {
  const changeNumber = toNumber(change);
  const todayNumber = toNumber(today);
  const bestNumber = toNumber(best);
  const lastNumber = toNumber(last);

  if (changeNumber !== null && changeNumber > 0) {
    return 'Nice work. You got better today.';
  }

  if (
    todayNumber !== null &&
    bestNumber !== null &&
    todayNumber === bestNumber &&
    todayNumber > 0
  ) {
    return 'You matched your best today.';
  }

  if (
    todayNumber !== null &&
    lastNumber !== null &&
    todayNumber > lastNumber
  ) {
    return 'You improved from your last session.';
  }

  if (todayNumber !== null) {
    return 'Work logged. Keep building.';
  }

  return 'Session complete.';
}

function getProgressMessage(
  change?: string,
  today?: string,
  last?: string,
  best?: string
) {
  const changeNumber = toNumber(change);
  const todayNumber = toNumber(today);
  const lastNumber = toNumber(last);
  const bestNumber = toNumber(best);

  if (changeNumber !== null && changeNumber > 0) {
    return `Up ${changeNumber} from last session`;
  }

  if (
    todayNumber !== null &&
    bestNumber !== null &&
    todayNumber === bestNumber &&
    todayNumber > 0
  ) {
    return 'You matched your best performance';
  }

  if (
    todayNumber !== null &&
    lastNumber !== null &&
    todayNumber > lastNumber
  ) {
    return 'Trending up from your last session';
  }

  if (todayNumber !== null) {
    return 'You showed up and put in work today';
  }

  return 'Session complete';
}

function getMomentumHeadline(streak?: string, week?: string) {
  const streakNumber = toNumber(streak);
  const weekNumber = toNumber(week);

  if (streakNumber !== null && streakNumber > 1) {
    return `${streakNumber} days in a row`;
  }

  if (weekNumber !== null && weekNumber > 1) {
    return `${weekNumber} sessions this week`;
  }

  if (streakNumber === 1) {
    return 'You trained again today';
  }

  return 'First session complete';
}

function getMomentumSubtext(streak?: string, week?: string) {
  const streakNumber = toNumber(streak);
  const weekNumber = toNumber(week);

  if (
    streakNumber !== null &&
    streakNumber > 1 &&
    weekNumber !== null &&
    weekNumber > 1
  ) {
    return `${weekNumber} sessions this week`;
  }

  if (streakNumber !== null && streakNumber > 1) {
    return 'Momentum is building';
  }

  if (weekNumber !== null && weekNumber > 1) {
    return 'Good week. Keep it going.';
  }

  if (streakNumber === 1) {
    return 'Come back tomorrow to keep the streak alive';
  }

  return 'Come back tomorrow and build momentum';
}

function getPrimaryLabel(source?: string, primaryLabel?: string) {
  if (primaryLabel) return primaryLabel;
  if (source === 'challenge') return 'Continue Challenge';
  return 'Back to Dashboard';
}

function getPrimaryHref(source?: string, next?: string) {
  if (source === 'challenge' && next) return next;
  return next || '/dashboard';
}

function getSecondaryLabel(source?: string) {
  if (source === 'challenge') return 'Back to Dashboard';
  return 'Browse Workouts';
}

function getSecondaryHref(source?: string) {
  if (source === 'challenge') return '/dashboard';
  return '/dashboard/workout';
}

function getNextUpHeadline(source?: string, nextLabel?: string) {
  if (nextLabel) return nextLabel;

  if (source === 'challenge') {
    return 'Your next challenge session is ready.';
  }

  return 'Choose your next workout and keep momentum going.';
}

function getNextUpSubtext(source?: string, nextSubtext?: string) {
  if (nextSubtext) return nextSubtext;

  if (source === 'challenge') {
    return 'Stay on track and continue your progression.';
  }

  return 'Stack another session and build consistency.';
}

function displayValue(value?: string, fallback = '--') {
  if (!value || value.trim() === '' || value === 'null') {
    return fallback;
  }
  return value;
}

export default async function SessionCompletePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  const title = params.title || 'Workout Session';
  const source = params.source || 'workout';
  const today = params.today;
  const best = params.best;
  const last = params.last;
  const change = params.change;
  const streak = params.streak;
  const week = params.week;
  const next = params.next;
  const nextLabel = params.nextLabel;
  const nextSubtext = params.nextSubtext;
  const primaryLabelParam = params.primaryLabel;

  const headline = getHeadline(change, today, best, last);
  const progressMessage = getProgressMessage(change, today, last, best);
  const momentumHeadline = getMomentumHeadline(streak, week);
  const momentumSubtext = getMomentumSubtext(streak, week);
  const nextUpHeadline = getNextUpHeadline(source, nextLabel);
  const nextUpSubtext = getNextUpSubtext(source, nextSubtext);

  const primaryLabel = getPrimaryLabel(source, primaryLabelParam);
  const primaryHref = getPrimaryHref(source, next);
  const secondaryLabel = getSecondaryLabel(source);
  const secondaryHref = getSecondaryHref(source);

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 pb-10 pt-8">
        <div className="mb-8">
          <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full border border-white/15 bg-white/10 text-2xl">
            ✓
          </div>

          <p className="mb-2 text-sm uppercase tracking-[0.2em] text-white/50">
            Session Complete
          </p>

          <h1 className="text-3xl font-semibold leading-tight">
            {headline}
          </h1>

          <p className="mt-3 text-sm text-white/65">
            {title}
          </p>
        </div>

        <section className="mb-4 grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-wide text-white/45">Today</p>
            <p className="mt-2 text-2xl font-semibold">{displayValue(today)}</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-wide text-white/45">Best</p>
            <p className="mt-2 text-2xl font-semibold">{displayValue(best)}</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-wide text-white/45">Last</p>
            <p className="mt-2 text-2xl font-semibold">{displayValue(last)}</p>
          </div>
        </section>

        <section className="mb-4 rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs uppercase tracking-wide text-white/45">
            Progress
          </p>
          <p className="mt-2 text-lg font-medium">
            {progressMessage}
          </p>
        </section>

        <section className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs uppercase tracking-wide text-white/45">
            Momentum
          </p>
          <p className="mt-2 text-lg font-medium">
            {momentumHeadline}
          </p>
          <p className="mt-1 text-sm text-white/65">
            {momentumSubtext}
          </p>
        </section>

        <section className="mb-8 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <p className="text-xs uppercase tracking-wide text-white/45">
            Next Up
          </p>
          <p className="mt-2 text-base text-white/85">
            {nextUpHeadline}
          </p>
          <p className="mt-1 text-sm text-white/60">
            {nextUpSubtext}
          </p>
        </section>

        <div className="mt-auto flex flex-col gap-3">
          <Link
            href={primaryHref}
            className="flex h-14 items-center justify-center rounded-2xl bg-white px-5 text-base font-semibold text-black transition hover:opacity-90"
          >
            {primaryLabel}
          </Link>

          <Link
            href={secondaryHref}
            className="flex h-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-5 text-base font-medium text-white transition hover:bg-white/10"
          >
            {secondaryLabel}
          </Link>
        </div>
      </div>
    </main>
  );
}