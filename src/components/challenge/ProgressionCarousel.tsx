import Link from 'next/link';

type DayStatus = 'completed' | 'active' | 'locked';

export interface ProgressionDay {
  day: number;
  label: string;
  status: DayStatus;
  href?: string;
}

interface ProgressionCarouselProps {
  days: ProgressionDay[];
}

export default function ProgressionCarousel({
  days,
}: ProgressionCarouselProps) {
  return (
    <div className="relative">
      <div className="flex gap-3 overflow-x-auto pb-2 pt-1 px-[2px] snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {days.map((d) => {
          const isActive = d.status === 'active';
          const isCompleted = d.status === 'completed';
          const isLocked = d.status === 'locked';

          const baseClasses =
            'snap-start flex min-w-[82px] flex-shrink-0 flex-col items-center justify-center rounded-2xl px-4 py-3 transition-all duration-200';

          const stateClasses = isActive
            ? 'bg-gradient-to-b from-lime-400/20 to-black border border-lime-400/40 shadow-[0_0_20px_rgba(132,204,22,0.15)] scale-[1.05]'
            : isCompleted
            ? 'bg-zinc-900 border border-zinc-700'
            : 'bg-zinc-950 border border-zinc-800 opacity-50';

          const content = (
            <>
              {/* Day Label */}
              <span
                className={`text-[10px] font-bold uppercase tracking-[0.2em] ${
                  isActive
                    ? 'text-lime-400'
                    : isCompleted
                    ? 'text-zinc-400'
                    : 'text-zinc-500'
                }`}
              >
                D{d.day}
              </span>

              {/* Indicator */}
              <div className="mt-2 mb-1 flex items-center justify-center">
                {isCompleted ? (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-lime-400/15 text-[11px] font-bold text-lime-400">
                    ✓
                  </div>
                ) : isActive ? (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-lime-400">
                    <div className="h-2 w-2 rounded-full bg-lime-400 animate-pulse" />
                  </div>
                ) : (
                  <div className="h-5 w-5 rounded-full border-2 border-zinc-600" />
                )}
              </div>

              {/* Label */}
              <span
                className={`text-[10px] font-medium text-center leading-tight ${
                  isActive
                    ? 'text-white'
                    : isCompleted
                    ? 'text-zinc-400'
                    : 'text-zinc-500'
                }`}
              >
                {d.label}
              </span>
            </>
          );

          if (isLocked || !d.href) {
            return (
              <div key={d.day} className={`${baseClasses} ${stateClasses}`}>
                {content}
              </div>
            );
          }

          return (
            <Link
              key={d.day}
              href={d.href}
              className={`${baseClasses} ${stateClasses} hover:scale-[1.06]`}
            >
              {content}
            </Link>
          );
        })}
      </div>

      {/* subtle edge fade (premium touch) */}
      <div className="pointer-events-none absolute left-0 top-0 h-full w-6 bg-gradient-to-r from-black to-transparent" />
      <div className="pointer-events-none absolute right-0 top-0 h-full w-6 bg-gradient-to-l from-black to-transparent" />
    </div>
  );
}