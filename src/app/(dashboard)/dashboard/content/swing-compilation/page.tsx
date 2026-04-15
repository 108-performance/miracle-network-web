import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

const SYSTEM_KEYS = {
  setups: 'discover:swing-compilation:setups',
  finishes: 'discover:swing-compilation:finishes',
  types: 'discover:swing-compilation:types',
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

export default async function SwingCompilationPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from('content_posts')
    .select('id, system_key')
    .eq('status', 'published')
    .in('audience', ['athletes', 'both'])
    .in('system_key', [
      SYSTEM_KEYS.setups,
      SYSTEM_KEYS.finishes,
      SYSTEM_KEYS.types,
    ]);

  const items = (data || []) as ContentPost[];

  const setupsCount = items.filter((item) => item.system_key === SYSTEM_KEYS.setups).length;
  const finishesCount = items.filter((item) => item.system_key === SYSTEM_KEYS.finishes).length;
  const typesCount = items.filter((item) => item.system_key === SYSTEM_KEYS.types).length;

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
        <SectionCard
          title="Setups"
          href="/dashboard/content/swing-compilation/setups"
          description="Setup examples and stance-related references."
          count={setupsCount}
        />
        <SectionCard
          title="Finishes"
          href="/dashboard/content/swing-compilation/finishes"
          description="Finish patterns and end-position examples."
          count={finishesCount}
        />
        <SectionCard
          title="Types"
          href="/dashboard/content/swing-compilation/types"
          description="Different swing types and pattern groupings."
          count={typesCount}
        />
      </section>
    </main>
  );
}