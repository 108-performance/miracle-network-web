import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function WorkoutsPage() {
  const supabase = await createClient();

  const { data: workouts, error } = await supabase
    .from('workouts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error(error);
    return <div>Error loading workouts</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Workouts</h1>

        <Link
          href="/admin/training/workouts/new"
          className="bg-black text-white px-4 py-2 rounded"
        >
          Create Workout
        </Link>
      </div>

      <div className="space-y-3">
        {workouts?.map((workout: any) => (
          <div
            key={workout.id}
            className="border p-4 rounded flex justify-between"
          >
            <div>
              <p className="font-semibold">{workout.title}</p>
              <p className="text-sm text-gray-500">
                {workout.description || 'No description'}
              </p>
            </div>

            <div className="text-sm">
              Difficulty: {workout.difficulty_level}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}