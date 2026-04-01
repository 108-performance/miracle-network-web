import Link from 'next/link';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

type SearchParams = Promise<{
  q?: string;
}>;

type PageProps = {
  searchParams: SearchParams;
};

type ExerciseRecord = {
  id: string;
  name: string | null;
  category: string | null;
  description: string | null;
  default_metric_type: string | null;
};

type ContentPostRecord = {
  id: string;
  title: string | null;
  description: string | null;
  content_type: string | null;
  status: string | null;
  audience: string | null;
  external_url: string | null;
  file_url: string | null;
  exercise_id: string | null;
  created_at: string | null;
};

export default async function ExerciseLibraryPage({ searchParams }: PageProps) {
  const { q = '' } = await searchParams;
  const query = q.trim();

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  async function deleteExerciseAction(formData: FormData) {
    'use server';

    const exerciseId = String(formData.get('exerciseId') ?? '').trim();

    if (!exerciseId) {
      throw new Error('Missing exerciseId for delete.');
    }

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect('/login');
    }

    const { error } = await supabase.from('exercises').delete().eq('id', exerciseId);

    if (error) {
      throw new Error(`Unable to delete exercise: ${error.message}`);
    }

    revalidatePath('/training/exercises');
  }

  async function createExerciseContentAction(formData: FormData) {
    'use server';

    const exerciseId = String(formData.get('exerciseId') ?? '').trim();
    const title = String(formData.get('title') ?? '').trim();
    const description = String(formData.get('description') ?? '').trim();
    const contentType = String(formData.get('content_type') ?? 'video').trim() || 'video';
    const status = String(formData.get('status') ?? 'published').trim() || 'published';
    const audience = String(formData.get('audience') ?? 'athletes').trim() || 'athletes';
    const externalUrl = String(formData.get('external_url') ?? '').trim();
    const fileUrl = String(formData.get('file_url') ?? '').trim();

    if (!exerciseId) {
      throw new Error('Missing exerciseId for content creation.');
    }

    if (!title) {
      throw new Error('Content title is required.');
    }

    if (!externalUrl && !fileUrl) {
      throw new Error('Add either an external URL or a file URL.');
    }

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect('/login');
    }

    const { error } = await supabase.from('content_posts').insert({
      title,
      description: description || null,
      content_type: contentType,
      status,
      audience,
      external_url: externalUrl || null,
      file_url: fileUrl || null,
      exercise_id: exerciseId,
      workout_id: null,
      training_program_id: null,
      is_primary: true,
      sort_order: 0,
    });

    if (error) {
      throw new Error(`Unable to create content: ${error.message}`);
    }

    revalidatePath('/training/exercises');
  }

  async function deleteExerciseContentAction(formData: FormData) {
    'use server';

    const contentId = String(formData.get('contentId') ?? '').trim();

    if (!contentId) {
      throw new Error('Missing contentId for delete.');
    }

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect('/login');
    }

    const { data, error } = await supabase
      .from('content_posts')
      .delete()
      .eq('id', contentId)
      .select('id');

    if (error) {
      console.error('deleteExerciseContentAction error:', error);
      throw new Error(`Unable to delete content: ${error.message}`);
    }

    if (!data || data.length === 0) {
      throw new Error('Delete ran, but no content row was removed.');
    }

    revalidatePath('/training/exercises');
  }

  let exercisesQuery = supabase.from('exercises').select('*').order('name', { ascending: true });

  if (query.length > 0) {
    exercisesQuery = exercisesQuery.or(`name.ilike.%${query}%,category.ilike.%${query}%`);
  }

  const { data: exercises, error } = await exercisesQuery;

  if (error) {
    throw new Error(`Unable to load exercises: ${error.message}`);
  }

  const typedExercises: ExerciseRecord[] = exercises ?? [];
  const exerciseIds = typedExercises.map((exercise) => exercise.id).filter(Boolean);

  let contentByExerciseId = new Map<string, ContentPostRecord[]>();

  if (exerciseIds.length > 0) {
    const { data: contentPosts, error: contentError } = await supabase
      .from('content_posts')
      .select(
        'id, title, description, content_type, status, audience, external_url, file_url, exercise_id, created_at'
      )
      .in('exercise_id', exerciseIds)
      .order('created_at', { ascending: false });

    if (contentError) {
      throw new Error(`Unable to load exercise content: ${contentError.message}`);
    }

    contentByExerciseId = (contentPosts ?? []).reduce((map, item) => {
      if (!item.exercise_id) return map;
      const current = map.get(item.exercise_id) ?? [];
      current.push(item as ContentPostRecord);
      map.set(item.exercise_id, current);
      return map;
    }, new Map<string, ContentPostRecord[]>());
  }

  return (
    <main className="min-h-screen bg-neutral-50">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-8 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Exercise Library
              </div>
              <h1 className="mt-1 text-3xl font-bold tracking-tight text-neutral-950">
                Manage Exercises
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-neutral-600">
                Create, review, search, edit, and remove exercises that power your workouts and
                programs. You can also attach reusable exercise demo content directly here.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/training/exercises/new"
                className="rounded-xl bg-neutral-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800"
              >
                Create New Exercise
              </Link>
            </div>
          </div>

          <form className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Search
              </label>
              <input
                type="text"
                name="q"
                defaultValue={query}
                placeholder="Search by exercise name or category"
                className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-neutral-500"
              />
            </div>

            <button
              type="submit"
              className="rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100"
            >
              Search
            </button>

            <Link
              href="/training/exercises"
              className="rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100"
            >
              Clear
            </Link>
          </form>
        </div>

        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
          <div className="border-b border-neutral-200 bg-neutral-50 px-6 py-4">
            <div className="text-sm font-semibold text-neutral-800">
              {typedExercises.length} exercises found
            </div>
          </div>

          {typedExercises.length > 0 ? (
            <div className="divide-y divide-neutral-200">
              {typedExercises.map((exercise) => {
                const attachedContent = contentByExerciseId.get(exercise.id) ?? [];

                return (
                  <div key={exercise.id} className="px-6 py-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <h2 className="text-lg font-semibold text-neutral-950">
                          {exercise.name || 'Untitled Exercise'}
                        </h2>

                        <div className="mt-2 flex flex-wrap gap-2">
                          <span className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-medium text-neutral-700">
                            Category: {exercise.category || '—'}
                          </span>
                          <span className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-medium text-neutral-700">
                            Metric: {exercise.default_metric_type || '—'}
                          </span>
                          <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                            Content Attached: {attachedContent.length}
                          </span>
                        </div>

                        <p className="mt-3 max-w-3xl text-sm leading-6 text-neutral-600">
                          {exercise.description?.trim() || 'No description yet.'}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/training/exercises/${exercise.id}/edit`}
                          className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100"
                        >
                          Edit
                        </Link>

                        <form action={deleteExerciseAction}>
                          <input type="hidden" name="exerciseId" value={exercise.id} />
                          <button
                            type="submit"
                            className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100"
                          >
                            Delete
                          </button>
                        </form>
                      </div>
                    </div>

                    <details className="mt-5 rounded-2xl border border-neutral-200 bg-neutral-50">
                      <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-neutral-800">
                        Manage Exercise Content
                      </summary>

                      <div className="border-t border-neutral-200 px-4 py-4">
                        <div className="grid gap-6 lg:grid-cols-2">
                          <div>
                            <h3 className="text-sm font-semibold text-neutral-900">
                              Add Content
                            </h3>
                            <p className="mt-1 text-xs leading-5 text-neutral-600">
                              Attach reusable exercise-specific content like demo videos or drill
                              explanations.
                            </p>

                            <form action={createExerciseContentAction} className="mt-4 space-y-3">
                              <input type="hidden" name="exerciseId" value={exercise.id} />

                              <div>
                                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-neutral-500">
                                  Title
                                </label>
                                <input
                                  type="text"
                                  name="title"
                                  defaultValue={`${exercise.name || 'Exercise'} - Demo`}
                                  className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-neutral-500"
                                  required
                                />
                              </div>

                              <div>
                                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-neutral-500">
                                  Description
                                </label>
                                <textarea
                                  name="description"
                                  rows={3}
                                  placeholder="Optional short explanation or notes"
                                  className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-neutral-500"
                                />
                              </div>

                              <div className="grid gap-3 sm:grid-cols-3">
                                <div>
                                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-neutral-500">
                                    Content Type
                                  </label>
                                  <select
                                    name="content_type"
                                    defaultValue="video"
                                    className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-neutral-500"
                                  >
                                    <option value="video">video</option>
                                    <option value="image">image</option>
                                    <option value="gif">gif</option>
                                    <option value="pdf">pdf</option>
                                  </select>
                                </div>

                                <div>
                                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-neutral-500">
                                    Status
                                  </label>
                                  <select
                                    name="status"
                                    defaultValue="published"
                                    className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-neutral-500"
                                  >
                                    <option value="published">published</option>
                                    <option value="draft">draft</option>
                                  </select>
                                </div>

                                <div>
                                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-neutral-500">
                                    Audience
                                  </label>
                                  <select
                                    name="audience"
                                    defaultValue="athletes"
                                    className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-neutral-500"
                                  >
                                    <option value="athletes">athletes</option>
                                    <option value="coaches">coaches</option>
                                    <option value="both">both</option>
                                  </select>
                                </div>
                              </div>

                              <div>
                                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-neutral-500">
                                  External URL
                                </label>
                                <input
                                  type="url"
                                  name="external_url"
                                  placeholder="https://..."
                                  className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-neutral-500"
                                />
                              </div>

                              <div>
                                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-neutral-500">
                                  File URL
                                </label>
                                <input
                                  type="url"
                                  name="file_url"
                                  placeholder="https://..."
                                  className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-neutral-500"
                                />
                              </div>

                              <button
                                type="submit"
                                className="rounded-xl bg-neutral-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-neutral-800"
                              >
                                Save Exercise Content
                              </button>
                            </form>
                          </div>

                          <div>
                            <h3 className="text-sm font-semibold text-neutral-900">
                              Attached Content
                            </h3>
                            <p className="mt-1 text-xs leading-5 text-neutral-600">
                              Existing content already linked to this exercise.
                            </p>

                            {attachedContent.length > 0 ? (
                              <div className="mt-4 space-y-3">
                                {attachedContent.map((item) => (
                                  <div
                                    key={item.id}
                                    className="rounded-2xl border border-neutral-200 bg-white p-4"
                                  >
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                      <div className="min-w-0 flex-1">
                                        <div className="text-sm font-semibold text-neutral-900">
                                          {item.title || 'Untitled Content'}
                                        </div>

                                        <div className="mt-2 flex flex-wrap gap-2">
                                          <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-[11px] font-medium text-neutral-700">
                                            Type: {item.content_type || '—'}
                                          </span>
                                          <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-[11px] font-medium text-neutral-700">
                                            Status: {item.status || '—'}
                                          </span>
                                          <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-[11px] font-medium text-neutral-700">
                                            Audience: {item.audience || '—'}
                                          </span>
                                        </div>

                                        {item.description?.trim() ? (
                                          <p className="mt-3 text-sm leading-6 text-neutral-600">
                                            {item.description}
                                          </p>
                                        ) : null}

                                        <div className="mt-3 flex flex-wrap gap-3 text-sm">
                                          {item.external_url ? (
                                            <a
                                              href={item.external_url}
                                              target="_blank"
                                              rel="noreferrer"
                                              className="font-medium text-blue-700 hover:text-blue-800"
                                            >
                                              Open External URL
                                            </a>
                                          ) : null}

                                          {item.file_url ? (
                                            <a
                                              href={item.file_url}
                                              target="_blank"
                                              rel="noreferrer"
                                              className="font-medium text-blue-700 hover:text-blue-800"
                                            >
                                              Open File URL
                                            </a>
                                          ) : null}
                                        </div>
                                      </div>

                                      <form action={deleteExerciseContentAction}>
                                        <input type="hidden" name="contentId" value={item.id} />
                                        <button
                                          type="submit"
                                          className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100"
                                        >
                                          Delete Content
                                        </button>
                                      </form>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="mt-4 rounded-2xl border border-dashed border-neutral-300 bg-white px-4 py-6 text-sm text-neutral-600">
                                No content attached yet for this exercise.
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </details>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="px-6 py-10">
              <h2 className="text-xl font-semibold text-neutral-950">No exercises found</h2>
              <p className="mt-2 text-sm leading-6 text-neutral-600">
                Create your first exercise or adjust your search.
              </p>

              <div className="mt-5">
                <Link
                  href="/training/exercises/new"
                  className="rounded-xl bg-neutral-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800"
                >
                  Create New Exercise
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}