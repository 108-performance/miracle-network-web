import { createClient } from '@/lib/supabase/server';
import { createContentPost } from '../actions';

export default async function NewContentPage() {
  const supabase = await createClient();

  const { data: programs, error: programsError } = await supabase
    .from('training_programs')
    .select('id, title')
    .order('created_at', { ascending: false });

  if (programsError) {
    console.error('Error loading training programs:', programsError);
  }

  const { data: workouts, error: workoutsError } = await supabase
    .from('workouts')
    .select('id, title, training_program_id, day_order')
    .order('created_at', { ascending: false });

  if (workoutsError) {
    console.error('Error loading workouts:', workoutsError);
  }

  const { data: exercises, error: exercisesError } = await supabase
    .from('exercises')
    .select('id, name')
    .order('name', { ascending: true });

  if (exercisesError) {
    console.error('Error loading exercises:', exercisesError);
  }

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Upload Content</h1>

      <form action={createContentPost} className="space-y-4">
        <input
          name="title"
          placeholder="Content Title"
          className="w-full border p-2 rounded"
          required
        />

        <textarea
          name="description"
          placeholder="Description"
          className="w-full border p-2 rounded"
          rows={4}
        />

        <select
          name="content_type"
          className="w-full border p-2 rounded"
          defaultValue="video"
        >
          <option value="video">Video</option>
          <option value="gif">GIF</option>
          <option value="image">Image</option>
          <option value="pdf">PDF</option>
        </select>

        <select
          name="status"
          className="w-full border p-2 rounded"
          defaultValue="draft"
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>

        <select
          name="audience"
          className="w-full border p-2 rounded"
          defaultValue="both"
        >
          <option value="athletes">Athletes</option>
          <option value="coaches">Coaches</option>
          <option value="both">Both</option>
        </select>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Training Program</label>
          <select
            name="training_program_id"
            className="w-full border p-2 rounded"
            defaultValue=""
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
            className="w-full border p-2 rounded"
            defaultValue=""
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
            className="w-full border p-2 rounded"
            defaultValue=""
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
          placeholder="External Video URL (for video content)"
          className="w-full border p-2 rounded"
        />

        <div className="space-y-2">
          <label className="block text-sm font-medium">
            Upload Image / PDF
          </label>
          <input
            name="file"
            type="file"
            accept="image/*,.pdf"
            className="w-full border p-2 rounded"
          />
        </div>

        <button
          type="submit"
          className="bg-black text-white px-4 py-2 rounded"
        >
          Save Content
        </button>
      </form>
    </div>
  );
}