import Link from 'next/link';
import { WeeklyListProps } from './types';

export default function WeeklyList({
  title = 'This Week',
  days,
}: WeeklyListProps) {
  return (
    <section className="space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-400">
        {title}
      </h2>

      <div className="space-y-3">
        {days.map((day) => {
          const rowClass =
            day.state === 'complete'
              ? 'border-lime-500/40 bg-lime-500/10'
              : day.state === 'active'
              ? 'border-red-500/60 bg-zinc-900'
              : 'border-zinc-800 bg-zinc-950 opacity-70';

          const label =
            day.state === 'active' ? "Today's Session" : `Day ${day.dayNumber}`;

          const content = (
            <div
              className={`flex items-center justify-between rounded-2xl border px-5 py-4 ${rowClass}`}
            >
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-full border border-zinc-700 text-sm font-semibold text-white">
                  {day.dayNumber}
                </div>

                <div>
                  <div className="text-xl font-semibold text-white">
                    {label}
                  </div>
                  <div className="text-sm text-sky-400">{day.title}</div>
                  {day.subtitle ? (
                    <div className="text-xs text-zinc-400">{day.subtitle}</div>
                  ) : null}
                </div>
              </div>

              <div className="text-zinc-500">
                {day.state === 'locked' ? '🔒' : '›'}
              </div>
            </div>
          );

          if (day.href && day.state !== 'locked') {
            return (
              <Link key={day.dayNumber} href={day.href}>
                {content}
              </Link>
            );
          }

          return <div key={day.dayNumber}>{content}</div>;
        })}
      </div>
    </section>
  );
}