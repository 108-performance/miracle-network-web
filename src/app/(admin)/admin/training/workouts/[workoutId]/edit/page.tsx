import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { updateWorkout } from '../../actions';

type EditWorkoutPageProps = {
  params: Promise<{
    workoutId: string;
  }>;
};

export default async function EditWorkoutPage({
  params,
}: EditWorkoutPageProps) {
  const { workoutId } = await params;
  const supabase = await createClient();

  const { data: workout, error: workoutError } = await supabase
    .from('workouts')
    .select('*')
    .eq('id', workoutId)
    .maybeSingle();

  if (workoutError) {
    console.error(workoutError);
  }

  if (!workout) {
    notFound();
  }

  const { data: programs, error: programsError } = await supabase
    .from('training_programs')
    .select('id, title')
    .order('created_at', { ascending: false });

  if (programsError) {
    console.error(programsError);
  }

  return (
    <div className="p-6 max-w-xl">
      <h1 className="text-2xl font-bold mb-6">Edit Workout</h1>

      <form action={updateWorkout} className="space-y-4">
        <input type="hidden" name="id" value={workout.id} />

        <input
          name="title"
          defaultValue={workout.title ?? ''}
          className="w-full border p-2 rounded"
          required
        />

        <textarea
          name="description"
          defaultValue={workout.description ?? ''}
          className="w-full border p-2 rounded"
          rows={4}
        />

        <input
          name="difficulty_level"
          type="number"
          defaultValue={workout.difficulty_level ?? ''}
          className="w-full border p-2 rounded"
        />

        <select
          name="training_program_id"
          defaultValue={workout.training_program_id ?? ''}
          className="w-full border p-2 rounded"
        >
          <option value="">No program</option>
          {programs?.map((program: any) => (
            <option key={program.id} value={program.id}>
              {program.title}
            </option>
          ))}
        </select>

        <input
          name="day_order"
          type="number"
          defaultValue={workout.day_order ?? ''}
          className="w-full border p-2 rounded"
        />

        <button
          type="submit"
          className="bg-black text-white px-4 py-2 rounded"
        >
          Save Changes
        </button>
      </form>
    </div>
  );
}