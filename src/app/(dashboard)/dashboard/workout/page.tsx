import Link from 'next/link';

const workoutOptions = [
  {
    title: 'Force',
    description: 'Build the ability to create and transfer force.',
    href: '/dashboard/workout/force',
  },
  {
    title: 'Direction',
    description: 'Train direction, intent, and movement delivery.',
    href: '/dashboard/workout/direction',
  },
  {
    title: 'Efficiency',
    description: 'Improve sequencing, rhythm, and clean movement output.',
    href: '/dashboard/workout/efficiency',
  },
  {
    title: 'Deceleration',
    description: 'Develop the ability to slow, control, and stabilize.',
    href: '/dashboard/workout/deceleration',
  },
];

export default function WorkoutPage() {
  return (
    <main className="min-h-screen bg-black px-6 py-8 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <p className="mb-2 text-sm uppercase tracking-[0.2em] text-zinc-400">
            Workout
          </p>
          <h1 className="text-4xl font-bold">Train Specific Qualities</h1>
          <p className="mt-3 max-w-2xl text-base text-zinc-300">
            Choose a development quality and work through its progression path.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {workoutOptions.map((option) => (
            <Link
              key={option.title}
              href={option.href}
              className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6 transition hover:border-zinc-600 hover:bg-zinc-900"
            >
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                Workout Path
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