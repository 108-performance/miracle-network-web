import Link from 'next/link';

const items = [
  {
    title: 'Setups',
    href: '/dashboard/content/swing-compilation/setups',
    description: 'Setup examples and stance-related references.',
  },
  {
    title: 'Finishes',
    href: '/dashboard/content/swing-compilation/finishes',
    description: 'Finish patterns and end-position examples.',
  },
  {
    title: 'Types',
    href: '/dashboard/content/swing-compilation/types',
    description: 'Different swing types and pattern groupings.',
  },
];

export default function SwingCompilationPage() {
  return (
    <main className="mx-auto max-w-5xl text-white">
      <section className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
          Swing Compilation
        </p>
        <h1 className="mt-3 text-4xl font-extrabold">Watch Swings</h1>
        <p className="mt-3 max-w-2xl text-zinc-400">
          Browse swing examples organized by visual category.
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