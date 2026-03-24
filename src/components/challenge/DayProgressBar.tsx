import { DayProgressBarProps } from './types';

export default function DayProgressBar({
  totalDays,
  activeDay,
  days,
}: DayProgressBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {Array.from({ length: totalDays }).map((_, index) => {
        const dayNumber = index + 1;
        const day = days.find((d) => d.dayNumber === dayNumber);
        const state = day?.state ?? 'locked';

        const base =
          'flex h-11 w-11 items-center justify-center rounded-full border text-sm font-semibold';
        const style =
          state === 'complete'
            ? 'border-lime-400 bg-lime-400/15 text-lime-300'
            : state === 'active'
            ? 'border-red-400 bg-red-400/10 text-red-300'
            : 'border-zinc-700 bg-zinc-900 text-zinc-500';

        return (
          <div key={dayNumber} className="flex flex-col items-center gap-1">
            <div className={`${base} ${style}`}>{dayNumber}</div>
            <span className="text-xs text-zinc-500">D{dayNumber}</span>
          </div>
        );
      })}
    </div>
  );
}