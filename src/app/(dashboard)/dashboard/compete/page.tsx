import Link from 'next/link';

const competeOptions = [
  {
    title: '108 Athlete Challenge',
    description:
      'Complete the full athlete challenge program through the compete system.',
    href: '/dashboard/compete/108-athlete-challenge',
    label: 'Live Now',
  },
  {
    title: 'Beat My Score',
    description: 'Repeat sessions and try to outperform your previous marks.',
    href: '/dashboard/compete/beat-my-score',
    label: 'Coming Next',
  },
  {
    title: 'Pro Challenge',
    description:
      'Train against challenge structures inspired by pro players.',
    href: '/dashboard/compete/pro-challenge',
    label: 'Future Layer',
  },
];

export default function CompetePage() {
  return (
    <main className="min-h-screen bg-black px-6 py-8 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <p className="mb-2 text-sm uppercase tracking-[0.2em] text-zinc-400">
            Compete
          </p>
          <h1 className="text-4xl font-bold">Test Your Performance</h1>
          <p className="mt-3 max-w-2xl text-base text-zinc-300">
            Use challenges, scores, and pressure-based training to validate
            progress.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {competeOptions.map((option) => (
            <Link
              key={option.title}
              href={option.href}
              className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6 transition hover:border-zinc-600 hover:bg-zinc-900"
            >
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                {option.label}
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