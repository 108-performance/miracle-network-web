import Link from 'next/link';

const levels = Array.from({ length: 10 }, (_, index) => ({
  title: `Level ${index + 1}`,
  href: `/dashboard/workout/efficiency/level-${index + 1}`,
}));

export default function EfficiencyPage() {
  return (
    <main className="min-h-screen bg-black px-6 py-8 text-white">
      <div className="mx-auto max-w-6xl">
        <p className="mb-2 text-sm uppercase tracking-[0.2em] text-zinc-400">
          Workout / Efficiency
        </p>
        <h1 className="text-4xl font-bold">Efficiency</h1>
        <p className="mt-3 max-w-2xl text-zinc-300">
          Work through the efficiency progression and improve sequencing,
          rhythm, and clean output.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {levels.map((level) => (
            <Link
              key={level.title}
              href={level.href}
              className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5 text-center transition hover:border-zinc-600 hover:bg-zinc-900"
            >
              <h2 className="text-xl font-semibold">{level.title}</h2>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}