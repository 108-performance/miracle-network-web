import Link from 'next/link';

const systems = [
  {
    title: 'Foundation',
    description: 'Build core movement patterns and training base.',
    href: '/dashboard/train/foundation',
  },
  {
    title: 'Engine',
    description: 'Develop the body system that powers performance.',
    href: '/dashboard/train/engine',
  },
  {
    title: 'Ball Strike',
    description: 'Train the skill of delivering the barrel to the ball.',
    href: '/dashboard/train/ball-strike',
  },
  {
    title: 'Adapt',
    description: 'Improve adjustment ability under variable conditions.',
    href: '/dashboard/train/adapt',
  },
];

export default function TrainPage() {
  return (
    <main className="min-h-screen bg-black px-6 py-8 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <p className="mb-2 text-sm uppercase tracking-[0.2em] text-zinc-400">
            Train
          </p>
          <h1 className="text-4xl font-bold">Structured Training</h1>
          <p className="mt-3 max-w-2xl text-base text-zinc-300">
            Follow your guided training path through the core development
            systems.
          </p>
        </div>

        <div className="mb-8 rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
          <p className="mb-2 text-sm uppercase tracking-[0.2em] text-zinc-500">
            Primary Action
          </p>
          <h2 className="text-2xl font-semibold">Start Today’s Session</h2>
          <p className="mt-2 max-w-2xl text-zinc-300">
            Jump directly into the next assigned training session.
          </p>
          <Link
            href="/dashboard/train/foundation"
            className="mt-5 inline-flex rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:opacity-90"
          >
            Start Session
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {systems.map((system) => (
            <Link
              key={system.title}
              href={system.href}
              className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6 transition hover:border-zinc-600 hover:bg-zinc-900"
            >
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                System
              </p>
              <h3 className="mt-3 text-2xl font-semibold">{system.title}</h3>
              <p className="mt-3 text-sm leading-6 text-zinc-300">
                {system.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}