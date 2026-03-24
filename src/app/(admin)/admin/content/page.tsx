import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function ContentPage() {
  const supabase = await createClient();

  const { data: contentPosts, error } = await supabase
    .from('content_posts')
    .select('id, title, description, content_type, status, audience, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error(error);
    return <div>Error loading content</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Content</h1>

        <Link
          href="/admin/content/new"
          className="rounded bg-black px-4 py-2 text-white"
        >
          Upload Content
        </Link>
      </div>

      <div className="space-y-3">
        {contentPosts && contentPosts.length > 0 ? (
          contentPosts.map((post: any) => (
            <Link
              key={post.id}
              href={`/admin/content/${post.id}/edit`}
              className="block rounded border p-4 no-underline hover:bg-zinc-50"
            >
              <div className="flex justify-between gap-4">
                <div>
                  <p className="font-semibold text-black">{post.title}</p>
                  <p className="text-sm text-gray-500">
                    {post.description || 'No description'}
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    {post.content_type} • {post.audience}
                  </p>
                </div>

                <div className="text-sm text-gray-600">{post.status}</div>
              </div>
            </Link>
          ))
        ) : (
          <div className="text-gray-500">No content yet</div>
        )}
      </div>
    </div>
  );
}