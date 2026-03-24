type Props = {
  title: string;
  subtitle: string;
  dayLabel: string;
};

export default function TrainingHero({ title, subtitle, dayLabel }: Props) {
  return (
    <section className="rounded-[28px] border border-red-500/50 bg-[radial-gradient(circle_at_top,_rgba(220,38,38,0.2),_rgba(0,0,0,0.96)_60%)] p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-lime-400">
            {dayLabel}
          </p>

          <h1 className="mt-2 text-4xl font-extrabold text-white">
            {title}
          </h1>

          <p className="mt-2 text-lg text-zinc-400">{subtitle}</p>
        </div>

        <div className="text-6xl font-black text-red-500/20">J</div>
      </div>
    </section>
  );
}