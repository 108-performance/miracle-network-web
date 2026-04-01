import Link from 'next/link';

const improveOptions = [
  {
    title: 'Pitch Type',
    description: 'Work on specific pitch types you struggle with.',
    href: '/dashboard/improve/pitch-type',
  },
  {
    title: 'Pitch Zone',
    description: 'Train solutions based on where the pitch is located.',
    href: '/dashboard/improve/pitch-zone',
  },
  {
    title: 'Ball Flight',
    description: 'Solve issues based on what the ball is doing off contact.',
    href: '/dashboard/improve/ball-flight',
  },
  {
    title: 'Swing Fault',
    description: 'Target specific mechanical faults inside the swing.',
    href: '/dashboard/improve/swing-fault',
  },
];

export default function ImprovePage() {
  return (
    <main className="min-h-screen bg-black px-6 py-8 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <p className="mb-2 text-sm uppercase tracking-[0.2em] text-zinc-400">
            Improve
          </p>
          <h1 className="text-4xl font-bold">Solve What Is Holding You Back</h1>
          <p className="mt-3 max-w-2xl text-base text-zinc-300">
            Enter through the problem you are experiencing, then follow the
            recommended correction path.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {improveOptions.map((option) => (
            <Link
              key={option.title}
              href={option.href}
              className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6 transition hover:border-zinc-600 hover:bg-zinc-900"
            >
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                Improve Path
              </p>
              <h2 className="mt-3 text-2xl font-semibold">{option.title}</h2>
              <p className="mt-3 text-sm leading-6 text-zinc-300">
                {option.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}