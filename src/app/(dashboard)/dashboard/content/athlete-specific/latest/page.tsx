import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

type ContentPost = {
  id: string;
  title: string;
  description: string | null;
  short_text: string | null;
  thumbnail_url: string | null;
  content_type: string | null;
  external_url: string | null;
  file_url: string | null;
  system_key: string | null;
  exercise_id: string | null;
  created_at: string | null;
};

function ContentCard({ item }: { item: ContentPost }) {
  const href = item.external_url || item.file_url || '#';
  const summary = item.short_text || item.description || 'Open content';

  return (
    <Link
      href={href}
      className="block overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.04] transition hover:bg-white/[0.06]"
    >
      <div className="aspect-[16/10] w-full bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))]">
        {item.thumbnail_url ? (
          <img
            src={item.thumbnail_url}
            alt={item.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-zinc-500">
            No thumbnail
          </div>
        )}
      </div>

      <div className="p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-lg font-bold text-white">{item.title}</p>
          <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-400">
            {item.content_type || 'content'}
          </span>
        </div>

        <p className="mt-2 text-sm text-zinc-400">{summary}</p>

        <div className="mt-3 flex flex-wrap gap-2">
          {item.system_key === 'discover' ? (
            <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-medium text-emerald-300">
              Watch
            </span>
          ) : null}

          {item.exercise_id ? (
            <span className="rounded-full border border-blue-400/20 bg-blue-400/10 px-2.5 py-1 text-[11px] font-medium text-blue-300">
              Exercise linked
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

export default async function LatestContentPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('content_posts')
    .select(
      'id, title, description, short_text, thumbnail_url, content_type, external_url, file_url, system_key, exercise_id, created_at'
    )
    .eq('status', 'published')
    .in('audience', ['athletes', 'both'])
    .order('created_at', { ascending: false })
    .limit(24);

  const items = ((data || []) as ContentPost[]).sort((a, b) => {
    const aDiscover = a.system_key === 'discover' ? 1 : 0;
    const bDiscover = b.system_key === 'discover' ? 1 : 0;

    if (aDiscover !== bDiscover) {
      return bDiscover - aDiscover;
    }

    const aDate = a.created_at ? new Date(a.created_at).getTime() : 0;
    const bDate = b.created_at ? new Date(b.created_at).getTime() : 0;

    return bDate - aDate;
  });

  return (
    <main className="mx-auto max-w-5xl text-white">
      <section className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
          Athlete Specific
        </p>
        <h1 className="mt-3 text-4xl font-extrabold">Latest</h1>
        <p className="mt-3 max-w-2xl text-zinc-400">
          The newest athlete-facing content inside the platform, with Watch content surfaced first.
        </p>
      </section>

      {error ? (
        <section className="rounded-[24px] border border-red-500/20 bg-red-500/10 p-6">
          <p className="text-lg font-semibold text-white">Unable to load content</p>
          <p className="mt-2 text-sm text-zinc-300">
            The page loaded, but the latest content query failed.
          </p>
        </section>
      ) : items.length === 0 ? (
        <section className="rounded-[24px] border border-white/10 bg-white/[0.04] p-6">
          <p className="text-lg font-semibold text-white">No published content yet</p>
          <p className="mt-2 text-sm text-zinc-400">
            Add published athlete-facing content in admin to populate this feed.
          </p>
        </section>
      ) : (
        <section className="grid gap-4 sm:grid-cols-2">
          {items.map((item) => (
            <ContentCard key={item.id} item={item} />
          ))}
        </section>
      )}
    </main>
  );
}