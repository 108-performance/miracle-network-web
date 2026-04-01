import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function NewExercisePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  async function createExerciseAction(formData: FormData) {
    'use server';

    const name = String(formData.get('name') ?? '').trim();
    const category = String(formData.get('category') ?? '').trim();
    const description = String(formData.get('description') ?? '').trim();
    const defaultMetricType = String(formData.get('default_metric_type') ?? '').trim();

    if (!name) {
      throw new Error('Exercise name is required.');
    }

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect('/login');
    }

    const { error } = await supabase.from('exercises').insert({
      name,
      category: category.length > 0 ? category : null,
      description: description.length > 0 ? description : null,
      default_metric_type: defaultMetricType.length > 0 ? defaultMetricType : 'reps',
    });

    if (error) {
      throw new Error(`Unable to create exercise: ${error.message}`);
    }

    redirect('/training/exercises');
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
                Create New Exercise
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600">
                Add a new exercise to your library so it can be attached to workouts and used across programs.
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
          <form action={createExerciseAction} className="space-y-5">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Exercise Name
              </label>
              <input
                type="text"
                name="name"
                placeholder="Example: Med Ball Rotational Scoop Toss"
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
                placeholder="Example: Hitting, Pitching, Mobility, Strength"
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
                placeholder="What is this exercise for? How should the athlete perform it?"
                className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-neutral-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Default Metric Type
              </label>
              <select
                name="default_metric_type"
                defaultValue="reps"
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
                Create Exercise
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