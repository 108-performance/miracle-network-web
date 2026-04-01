import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

type PageProps = {
  params: Promise<{
    exerciseId: string;
  }>;
};

export default async function EditExercisePage({ params }: PageProps) {
  const { exerciseId } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  async function updateExerciseAction(formData: FormData) {
    'use server';

    const exerciseId = String(formData.get('exerciseId') ?? '');
    const name = String(formData.get('name') ?? '').trim();
    const category = String(formData.get('category') ?? '').trim();
    const description = String(formData.get('description') ?? '').trim();
    const defaultMetricType = String(formData.get('default_metric_type') ?? '').trim();

    if (!exerciseId || !name) {
      throw new Error('Exercise ID and name are required.');
    }

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect('/login');
    }

    const { error } = await supabase
      .from('exercises')
      .update({
        name,
        category: category.length > 0 ? category : null,
        description: description.length > 0 ? description : null,
        default_metric_type: defaultMetricType.length > 0 ? defaultMetricType : 'reps',
      })
      .eq('id', exerciseId);

    if (error) {
      throw new Error(`Unable to update exercise: ${error.message}`);
    }

    redirect('/training/exercises');
  }

  const { data: exercise, error } = await supabase
    .from('exercises')
    .select('*')
    .eq('id', exerciseId)
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to load exercise: ${error.message}`);
  }

  if (!exercise) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-neutral-50">
      <div className="mx-auto max-w-3xl px-6 py-8">
        <div className="mb-8 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Exercise Library
              </div>
              <h1 className="mt-1 text-3xl font-bold tracking-tight text-neutral-950">
                Edit Exercise
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600">
                Update this exercise so the library stays clean and consistent.
              </p>
            </div>

            <Link
              href="/training/exercises"
              className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100"
            >
              Back to Exercises
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <form action={updateExerciseAction} className="space-y-5">
            <input type="hidden" name="exerciseId" value={exercise.id} />

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Exercise Name
              </label>
              <input
                type="text"
                name="name"
                defaultValue={exercise.name ?? ''}
                className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-neutral-500"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Category
              </label>
              <input
                type="text"
                name="category"
                defaultValue={exercise.category ?? ''}
                className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-neutral-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Description
              </label>
              <textarea
                name="description"
                rows={5}
                defaultValue={exercise.description ?? ''}
                className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-neutral-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Default Metric Type
              </label>
              <select
                name="default_metric_type"
                defaultValue={exercise.default_metric_type ?? 'reps'}
                className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-neutral-500"
              >
                <option value="reps">Reps</option>
                <option value="time">Time</option>
                <option value="score">Score</option>
                <option value="exit_velocity">Exit Velocity</option>
                <option value="mixed">Mixed</option>
              </select>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="submit"
                className="rounded-xl bg-neutral-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-neutral-800"
              >
                Save Changes
              </button>

              <Link
                href="/training/exercises"
                className="rounded-xl border border-neutral-300 bg-white px-5 py-3 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}