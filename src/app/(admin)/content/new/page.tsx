import { createClient } from '@/lib/supabase/server';
import { createContentPost } from '../actions';

const INTEL_TYPE_OPTIONS = [
  { value: '', label: 'No intel type' },
  { value: 'quick_action_intro', label: 'Quick Action Intro' },
  { value: 'session_support', label: 'Session Support' },
  { value: 'post_session_support', label: 'Post-Session Support' },
  { value: 'methodology_support', label: 'Methodology Support' },
  { value: 'exercise_demo', label: 'Exercise Demo' },
  { value: 'session_intro', label: 'Session Intro (legacy)' },
  { value: 'movement_principle', label: 'Movement Principle (legacy)' },
  { value: 'skill_principle', label: 'Skill Principle (legacy)' },
];

const SYSTEM_KEY_OPTIONS = [
  { value: '', label: 'No system key' },
  { value: 'train', label: 'train (quick action only)' },
  { value: 'compete', label: 'compete (quick action only)' },
  { value: 'workout', label: 'workout (quick action only)' },
  { value: 'improve', label: 'improve (quick action only)' },
  { value: 'challenge_start', label: 'challenge_start' },
  { value: 'challenge_continue', label: 'challenge_continue' },
  { value: 'resume_training', label: 'resume_training' },
  { value: 'pre_session', label: 'pre_session' },
  { value: 'execution', label: 'execution' },
  { value: 'focus', label: 'focus' },
  { value: 'post_session', label: 'post_session' },
  { value: 'recovery', label: 'recovery' },
  { value: 'reflection', label: 'reflection' },
  { value: 'reset', label: 'reset' },
  { value: 'restart', label: 'restart' },
  { value: 'mindset', label: 'mindset' },
  { value: 'methodology', label: 'methodology' },
  { value: 'habit_loop', label: 'habit_loop' },
  { value: 'onboarding', label: 'onboarding' },
  { value: 'methodology_intro', label: 'methodology_intro' },
];

function GuidanceCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700">
      <p className="font-medium text-zinc-900">{title}</p>
      <div className="mt-2 space-y-1">{children}</div>
    </div>
  );
}

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
    <div className="max-w-3xl p-6">
      <h1 className="mb-2 text-2xl font-bold">Upload Content</h1>

      <div className="mb-6 grid gap-4">
        <GuidanceCard title="Content tagging rule">
          <p>Use the narrowest correct scope.</p>
          <p>Exercise-only content → choose exercise.</p>
          <p>Session/workout support → choose workout.</p>
          <p>Program-wide support → choose training program.</p>
          <p>General behavior moment → use system key.</p>
        </GuidanceCard>

        <GuidanceCard title="Recommended intel types">
          <p>Quick Action Intro → shown after dashboard tile tap.</p>
          <p>Session Support → shown before or during a session.</p>
          <p>Post-Session Support → shown after a completed session.</p>
          <p>Methodology Support → reinforces the 108 lens.</p>
          <p>Exercise Demo → specific drill/demo content only.</p>
        </GuidanceCard>

        <GuidanceCard title="Recommended system keys">
          <p>Before session → pre_session, execution, focus.</p>
          <p>After session → post_session, recovery, reflection.</p>
          <p>Habit/behavior → mindset, reset, restart, habit_loop.</p>
          <p>Methodology → methodology, methodology_intro.</p>
          <p>Challenge flow → challenge_start, challenge_continue.</p>
        </GuidanceCard>
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
          placeholder="Short text shown in recommendation cards (recommended)"
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
            {INTEL_TYPE_OPTIONS.map((option) => (
              <option key={option.value || 'blank'} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-zinc-500">
            Choose the delivery lane for this content.
          </p>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">System Key</label>
          <select
            name="system_key"
            className="w-full rounded border p-2"
            defaultValue=""
          >
            {SYSTEM_KEY_OPTIONS.map((option) => (
              <option key={option.value || 'blank'} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-zinc-500">
            Use this for the behavior moment you want the content to support.
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
          <p className="text-xs text-zinc-500">
            Use this when content applies to the full training path.
          </p>
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
            Use this for session-level support or post-session support.
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
            Only use exercise when this content is a drill/demo for one movement.
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
            Mark as primary content for this scope
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
          <p className="text-xs text-zinc-500">
            File uploads can now support recommendation surfaces too.
          </p>
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