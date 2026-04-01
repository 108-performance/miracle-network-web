import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { updateContentPost } from '../../actions';

type EditContentPageProps = {
  params: Promise<{
    contentId: string;
  }>;
};

export default async function EditContentPage({
  params,
}: EditContentPageProps) {
  const { contentId } = await params;
  const supabase = await createClient();

  const { data: content, error: contentError } = await supabase
    .from('content_posts')
    .select('*')
    .eq('id', contentId)
    .maybeSingle();

  if (contentError) {
    console.error(contentError);
  }

  if (!content) {
    notFound();
  }

  const { data: programs } = await supabase
    .from('training_programs')
    .select('id, title')
    .order('created_at', { ascending: false });

  const { data: workouts } = await supabase
    .from('workouts')
    .select('id, title, training_program_id, day_order')
    .order('created_at', { ascending: false });

  const { data: exercises } = await supabase
    .from('exercises')
    .select('id, name')
    .order('name', { ascending: true });

  return (
    <div className="max-w-2xl p-6">
      <h1 className="mb-6 text-2xl font-bold">Edit Content</h1>

      <form action={updateContentPost} className="space-y-4">
        <input type="hidden" name="id" value={content.id} />
        <input type="hidden" name="existing_file_url" value={content.file_url ?? ''} />

        <input
          name="title"
          defaultValue={content.title ?? ''}
          placeholder="Content Title"
          className="w-full rounded border p-2"
          required
        />

        <textarea
          name="description"
          defaultValue={content.description ?? ''}
          placeholder="Description"
          className="w-full rounded border p-2"
          rows={4}
        />

        <select
          name="content_type"
          className="w-full rounded border p-2"
          defaultValue={content.content_type ?? 'video'}
        >
          <option value="video">Video</option>
          <option value="gif">GIF</option>
          <option value="image">Image</option>
          <option value="pdf">PDF</option>
        </select>

        <select
          name="status"
          className="w-full rounded border p-2"
          defaultValue={content.status ?? 'draft'}
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>

        <select
          name="audience"
          className="w-full rounded border p-2"
          defaultValue={content.audience ?? 'both'}
        >
          <option value="athletes">Athletes</option>
          <option value="coaches">Coaches</option>
          <option value="both">Both</option>
        </select>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Training Program</label>
          <select
            name="training_program_id"
            className="w-full rounded border p-2"
            defaultValue={content.training_program_id ?? ''}
          >
            <option value="">No program selected</option>
            {programs?.map((program: any) => (
              <option key={program.id} value={program.id}>
                {program.title}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Workout</label>
          <select
            name="workout_id"
            className="w-full rounded border p-2"
            defaultValue={content.workout_id ?? ''}
          >
            <option value="">No workout selected</option>
            {workouts?.map((workout: any) => (
              <option key={workout.id} value={workout.id}>
                {workout.day_order ? `Day ${workout.day_order} • ` : ''}
                {workout.title}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Exercise</label>
          <select
            name="exercise_id"
            className="w-full rounded border p-2"
            defaultValue={content.exercise_id ?? ''}
          >
            <option value="">No exercise selected</option>
            {exercises?.map((exercise: any) => (
              <option key={exercise.id} value={exercise.id}>
                {exercise.name}
              </option>
            ))}
          </select>
        </div>

        <input
          name="external_url"
          defaultValue={content.external_url ?? ''}
          placeholder="External Video URL"
          className="w-full rounded border p-2"
        />

        {content.file_url ? (
          <div className="rounded border bg-zinc-50 p-3 text-sm text-zinc-700">
            Current file attached
          </div>
        ) : null}

        <div className="space-y-2">
          <label className="block text-sm font-medium">
            Replace Image / PDF
          </label>
          <input
            name="file"
            type="file"
            accept="image/*,.pdf"
            className="w-full rounded border p-2"
          />
        </div>

        <button
          type="submit"
          className="rounded bg-black px-4 py-2 text-white"
        >
          Save Changes
        </button>
      </form>
    </div>
  );
}