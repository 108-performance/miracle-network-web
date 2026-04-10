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
    <div className="max-w-2xl p-6">
      <h1 className="mb-2 text-2xl font-bold">Upload Content</h1>

      <div className="mb-6 rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700">
        <p className="font-medium text-zinc-900">Athlete Intel rule</p>
        <p className="mt-1">
          Session Intro = shown before a workout begins.
        </p>
        <p className="mt-1">
          Quick Action Intro = shown after dashboard tile tap and before entering
          the selected system.
        </p>
        <p className="mt-1">
          For workout-level Athlete Intel, choose a workout and leave exercise blank.
        </p>
      </div>

      <form action={createContentPost} className="space-y-4">
        <input
          name="title"
          placeholder="Content Title"
          className="w-full rounded border p-2"
          required
        />

        <textarea
          name="description"
          placeholder="Description"
          className="w-full rounded border p-2"
          rows={4}
        />

        <textarea
          name="short_text"
          placeholder="Short text (optional)"
          className="w-full rounded border p-2"
          rows={3}
        />

        <select
          name="content_type"
          className="w-full rounded border p-2"
          defaultValue="video"
        >
          <option value="video">Video</option>
          <option value="gif">GIF</option>
          <option value="image">Image</option>
          <option value="pdf">PDF</option>
        </select>

        <select
          name="status"
          className="w-full rounded border p-2"
          defaultValue="draft"
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>

        <select
          name="audience"
          className="w-full rounded border p-2"
          defaultValue="athletes"
        >
          <option value="athletes">Athletes</option>
          <option value="coaches">Coaches</option>
          <option value="both">Both</option>
        </select>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Intel Type</label>
          <select
            name="intel_type"
            className="w-full rounded border p-2"
            defaultValue=""
          >
            <option value="">No intel type</option>
            <option value="session_intro">Session Intro</option>
            <option value="quick_action_intro">Quick Action Intro</option>
            <option value="movement_principle">Movement Principle</option>
            <option value="skill_principle">Skill Principle</option>
          </select>
          <p className="text-xs text-zinc-500">
            Session Intro = before workout. Quick Action Intro = before dashboard entry.
          </p>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">System Target</label>
          <select
            name="system_key"
            className="w-full rounded border p-2"
            defaultValue=""
          >
            <option value="">No system target</option>
            <option value="train">Train</option>
            <option value="compete">Compete</option>
            <option value="workout">Workout</option>
            <option value="improve">Improve</option>
          </select>
          <p className="text-xs text-zinc-500">
            Only used when intel type = Quick Action Intro.
          </p>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Training Program</label>
          <select
            name="training_program_id"
            className="w-full rounded border p-2"
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
            className="w-full rounded border p-2"
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
          <p className="text-xs text-zinc-500">
            Choose a workout for workout-level Athlete Intel.
          </p>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Exercise</label>
          <select
            name="exercise_id"
            className="w-full rounded border p-2"
            defaultValue=""
          >
            <option value="">No exercise selected</option>
            {exercises?.map((exercise: any) => (
              <option key={exercise.id} value={exercise.id}>
                {exercise.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-zinc-500">
            Leave blank for workout-level Athlete Intel.
          </p>
        </div>

        <input
          name="external_url"
          placeholder="External Video URL (Vimeo embed-safe URL preferred)"
          className="w-full rounded border p-2"
        />

        <div className="flex items-center gap-2 rounded border p-3">
          <input
            id="is_primary"
            name="is_primary"
            type="checkbox"
            value="true"
            className="h-4 w-4"
          />
          <label htmlFor="is_primary" className="text-sm">
            Mark as primary content
          </label>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Upload Image / PDF</label>
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
          Save Content
        </button>
      </form>
    </div>
  );
}