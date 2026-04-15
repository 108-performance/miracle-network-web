import Link from 'next/link';

const items = [
  {
    title: 'Skill',
    href: '/dashboard/content/education/skill',
    description: 'Skill development and teaching content.',
  },
  {
    title: 'In Game',
    href: '/dashboard/content/education/in-game',
    description: 'Examples and teaching from game environments.',
  },
  {
    title: 'Team',
    href: '/dashboard/content/education/team',
    description: 'Team play, communication, and system learning.',
  },
  {
    title: 'Mental Skills',
    href: '/dashboard/content/education/mental-skills',
    description: 'Confidence, focus, and mental performance.',
  },
];

export default function EducationPage() {
  return (
    <main className="mx-auto max-w-5xl text-white">
      <section className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
          Education
        </p>
        <h1 className="mt-3 text-4xl font-extrabold">Learn</h1>
        <p className="mt-3 max-w-2xl text-zinc-400">
          Explore teaching content organized around how athletes learn and apply skill.
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