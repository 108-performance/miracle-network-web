import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { deleteContentPost } from './actions';

export default async function ContentPage() {
  const supabase = await createClient();

  const { data: contentPosts, error } = await supabase
    .from('content_posts')
    .select(
      'id, title, description, content_type, status, audience, intel_type, created_at'
    )
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
          href="/content/new"
          className="rounded bg-black px-4 py-2 text-white"
        >
          Upload Content
        </Link>
      </div>

      <div className="space-y-3">
        {contentPosts && contentPosts.length > 0 ? (
          contentPosts.map((post: any) => (
            <div
              key={post.id}
              className="rounded border p-4 hover:bg-zinc-50"
            >
              <div className="flex items-start justify-between gap-4">
                <Link
                  href={`/content/${post.id}/edit`}
                  className="block flex-1 no-underline"
                >
                  <p className="font-semibold text-black">{post.title}</p>
                  <p className="text-sm text-gray-500">
                    {post.description || 'No description'}
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    {post.content_type} • {post.audience}
                    {post.intel_type ? ` • ${post.intel_type}` : ''}
                  </p>
                </Link>

                <div className="flex items-center gap-3">
                  <div className="text-sm text-gray-600">{post.status}</div>

                  <form action={deleteContentPost}>
                    <input type="hidden" name="id" value={post.id} />
                    <button
                      type="submit"
                      className="rounded border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-gray-500">No content yet</div>
        )}
      </div>
    </div>
  );
}