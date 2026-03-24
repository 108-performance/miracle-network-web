import { createClient } from '@/lib/supabase/server';
import { createWorkout } from '../actions';

export default async function NewWorkoutPage() {
  const supabase = await createClient();

  const { data: programs, error } = await supabase
    .from('training_programs')
    .select('id, title')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error loading training programs:', error);
  }

  return (
    <div className="p-6 max-w-xl">
      <h1 className="text-2xl font-bold mb-6">Create Workout</h1>

      <form action={createWorkout} className="space-y-4">
        <input
          name="title"
          placeholder="Workout Title"
          className="w-full border p-2 rounded"
          required
        />

        <textarea
          name="description"
          placeholder="Description"
          className="w-full border p-2 rounded"
          rows={4}
        />

        <input
          name="difficulty_level"
          type="number"
          placeholder="Difficulty Level (1-5)"
          className="w-full border p-2 rounded"
        />

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

        <input
          name="day_order"
          type="number"
          placeholder="Day Order (optional if no program selected)"
          className="w-full border p-2 rounded"
        />

        <button
          type="submit"
          className="bg-black text-white px-4 py-2 rounded"
        >
          Create Workout
        </button>
      </form>
    </div>
  );
}