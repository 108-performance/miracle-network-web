export default function AthleteIntelCard() {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-lime-400">
        Athlete Intel
      </p>

      <div className="mt-4 flex h-40 items-center justify-center rounded-xl bg-black">
        <span className="text-zinc-500">Video Placeholder</span>
      </div>

      <p className="mt-4 text-sm text-zinc-400">
        Watch how elite athletes build this movement pattern before adding power.
      </p>
    </div>
  );
}