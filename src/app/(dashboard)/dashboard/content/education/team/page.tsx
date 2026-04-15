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
};

const SYSTEM_KEY = 'discover:education:team';

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
            Team
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
      </div>
    </Link>
  );
}

export default async function TeamPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from('content_posts')
    .select(
      'id, title, description, short_text, thumbnail_url, content_type, external_url, file_url'
    )
    .eq('status', 'published')
    .in('audience', ['athletes', 'both'])
    .eq('system_key', SYSTEM_KEY)
    .order('created_at', { ascending: false });

  const items = (data || []) as ContentPost[];

  return (
    <main className="mx-auto max-w-5xl text-white">
      <section className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
          Education
        </p>
        <h1 className="mt-3 text-4xl font-extrabold">Team</h1>
        <p className="mt-3 max-w-2xl text-zinc-400">
          Team-based learning, communication, and system content.
        </p>
      </section>

      {items.length === 0 ? (
        <section className="rounded-[24px] border border-white/10 bg-white/[0.04] p-6">
          <p className="text-lg font-semibold text-white">No team content yet</p>
          <p className="mt-2 text-sm text-zinc-400">
            Add discover-routed content with the Team subcategory in admin.
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