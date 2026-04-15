import Link from 'next/link';

const items = [
  {
    title: 'Latest',
    href: '/dashboard/content/athlete-specific/latest',
    description: 'Newest athlete-facing content surfaced first.',
  },
  {
    title: 'Athlete List',
    href: '/dashboard/content/athlete-specific/athletes',
    description: 'Athlete-based browsing shell for future expansion.',
  },
];

export default function AthleteSpecificPage() {
  return (
    <main className="mx-auto max-w-5xl text-white">
      <section className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
          Athlete Specific
        </p>
        <h1 className="mt-3 text-4xl font-extrabold">Athlete Content</h1>
        <p className="mt-3 max-w-2xl text-zinc-400">
          Explore athlete-driven content and the latest featured media.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5 transition hover:bg-white/[0.06]"
          >
            <p className="text-2xl font-bold text-white">{item.title}</p>
            <p className="mt-2 text-sm text-zinc-400">{item.description}</p>
          </Link>
        ))}
      </section>
    </main>
  );
}