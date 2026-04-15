import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

const SYSTEM_KEYS = {
  skill: 'discover:education:skill',
  inGame: 'discover:education:in-game',
  team: 'discover:education:team',
  mentalSkills: 'discover:education:mental-skills',
};

type ContentPost = {
  id: string;
  system_key: string | null;
};

function SectionCard({
  title,
  href,
  description,
  count,
}: {
  title: string;
  href: string;
  description: string;
  count: number;
}) {
  return (
    <Link
      href={href}
      className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5 transition hover:bg-white/[0.06]"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-2xl font-bold text-white">{title}</p>
        <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-400">
          {count} items
        </span>
      </div>
      <p className="mt-2 text-sm text-zinc-400">{description}</p>
    </Link>
  );
}

export default async function EducationPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from('content_posts')
    .select('id, system_key')
    .eq('status', 'published')
    .in('audience', ['athletes', 'both'])
    .in('system_key', [
      SYSTEM_KEYS.skill,
      SYSTEM_KEYS.inGame,
      SYSTEM_KEYS.team,
      SYSTEM_KEYS.mentalSkills,
    ]);

  const items = (data || []) as ContentPost[];

  const skillCount = items.filter((item) => item.system_key === SYSTEM_KEYS.skill).length;
  const inGameCount = items.filter((item) => item.system_key === SYSTEM_KEYS.inGame).length;
  const teamCount = items.filter((item) => item.system_key === SYSTEM_KEYS.team).length;
  const mentalSkillsCount = items.filter(
    (item) => item.system_key === SYSTEM_KEYS.mentalSkills
  ).length;

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
        <SectionCard
          title="Skill"
          href="/dashboard/content/education/skill"
          description="Skill development and teaching content."
          count={skillCount}
        />
        <SectionCard
          title="In Game"
          href="/dashboard/content/education/in-game"
          description="Examples and teaching from game environments."
          count={inGameCount}
        />
        <SectionCard
          title="Team"
          href="/dashboard/content/education/team"
          description="Team play, communication, and system learning."
          count={teamCount}
        />
        <SectionCard
          title="Mental Skills"
          href="/dashboard/content/education/mental-skills"
          description="Confidence, focus, and mental performance."
          count={mentalSkillsCount}
        />
      </section>
    </main>
  );
}