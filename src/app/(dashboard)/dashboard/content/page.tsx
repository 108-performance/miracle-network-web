import Link from 'next/link';

function QuickButton({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-center rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-4 text-sm font-semibold text-white transition hover:bg-white/[0.07]"
    >
      {label}
    </Link>
  );
}

function BrowseCard({
  href,
  title,
  subtitle,
}: {
  href: string;
  title: string;
  subtitle: string;
}) {
  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-[24px] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-5 transition hover:bg-[linear-gradient(135deg,rgba(255,255,255,0.10),rgba(255,255,255,0.05))]"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.10),transparent_60%)] opacity-70" />
      <div className="relative">
        <p className="text-2xl font-bold text-white">{title}</p>
        <p className="mt-2 text-sm text-zinc-400">{subtitle}</p>
      </div>
    </Link>
  );
}

export default function ContentHomePage() {
  return (
    <main className="mx-auto min-h-screen max-w-6xl bg-black text-white">
      <section className="mb-8 pt-2">
        <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
          Discover
        </h1>
        <p className="mt-3 max-w-2xl text-base text-zinc-400">
          Watch swings, learn from content, and explore athlete-specific media.
        </p>
      </section>

      <section className="mb-6">
        <div className="flex items-center rounded-[24px] border border-white/8 bg-white/[0.04] px-5 py-4 text-zinc-500">
          <span className="text-base">Search content</span>
        </div>
      </section>

      <section className="mb-8 grid grid-cols-2 gap-3">
        <QuickButton href="/dashboard/content/education" label="Education" />
        <QuickButton href="/dashboard/content/swing-compilation" label="Swings" />
        <QuickButton href="/dashboard/content/athlete-specific" label="Athlete" />
        <QuickButton href="/dashboard/content/athlete-specific/latest" label="Latest" />
      </section>

      <section className="mb-4">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
          Browse
        </p>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <BrowseCard
          href="/dashboard/content/education/skill"
          title="Skill"
          subtitle="Instructional content focused on skill development."
        />
        <BrowseCard
          href="/dashboard/content/education/in-game"
          title="In Game"
          subtitle="Content built around performance in game settings."
        />
        <BrowseCard
          href="/dashboard/content/education/team"
          title="Team"
          subtitle="Team-based learning, communication, and system content."
        />
        <BrowseCard
          href="/dashboard/content/education/mental-skills"
          title="Mental Skills"
          subtitle="Mindset, focus, confidence, and competitive control."
        />
        <BrowseCard
          href="/dashboard/content/swing-compilation/setups"
          title="Setups"
          subtitle="Browse setup-focused swing examples and references."
        />
        <BrowseCard
          href="/dashboard/content/swing-compilation/finishes"
          title="Finishes"
          subtitle="Browse finish positions and end-pattern examples."
        />
        <BrowseCard
          href="/dashboard/content/swing-compilation/types"
          title="Types"
          subtitle="Explore different swing patterns and examples."
        />
        <BrowseCard
          href="/dashboard/content/day-in-the-life"
          title="Day in the Life"
          subtitle="A shell for athlete lifestyle and behind-the-scenes content."
        />
      </section>
    </main>
  );
}