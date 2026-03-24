type Drill = {
  title: string;
  detail: string;
};

type Props = {
  label: string;
  drills: Drill[];
};

export default function WorkoutBlockSection({ label, drills }: Props) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">
        {label}
      </p>

      {drills.map((drill, i) => (
        <div
          key={i}
          className="rounded-xl border border-zinc-800 bg-zinc-950 p-4"
        >
          <p className="font-semibold text-white">{drill.title}</p>
          <p className="text-sm text-zinc-400">{drill.detail}</p>
        </div>
      ))}
    </div>
  );
}