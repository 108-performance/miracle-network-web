import DayProgressBar from './DayProgressBar';
import SessionCTA from './SessionCTA';
import { ChallengeCardProps } from './types';

export default function ChallengeCard({
  badge,
  title,
  accentName,
  subtitle,
  helperText,
  activeDay,
  totalDays,
  streakCount,
  days,
  ctaLabel,
  ctaHref,
}: ChallengeCardProps) {
  return (
    <section className="rounded-[28px] border border-red-500/60 bg-[radial-gradient(circle_at_top,_rgba(220,38,38,0.18),_rgba(0,0,0,0.96)_60%)] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <div className="mb-4 inline-flex rounded-full bg-lime-400 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.14em] text-black">
            {badge}
          </div>

          <h1 className="text-4xl font-extrabold leading-none text-white sm:text-5xl">
            {title}
            <br />
            <span className="text-red-400">{accentName}</span>
          </h1>

          <p className="mt-3 text-xl font-semibold text-red-400 sm:text-2xl">
            {subtitle}
          </p>

          {helperText ? (
            <p className="mt-2 text-sm text-zinc-300 sm:text-lg">
              {helperText}
            </p>
          ) : null}
        </div>

        <div className="text-right text-sm text-zinc-400 sm:text-lg">
          Day {activeDay} of {totalDays}
        </div>
      </div>

      <div className="mb-5">
        <DayProgressBar totalDays={totalDays} activeDay={activeDay} days={days} />
      </div>

      <div className="mb-6 text-center text-sm text-zinc-400 sm:text-lg">
        {streakCount}-day streak — keep it alive
      </div>

      <SessionCTA label={ctaLabel} href={ctaHref} />
    </section>
  );
}