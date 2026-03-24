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
      <div className="mb-6 flex justify-between">
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
          <Link
            key={workout.id}
            href={`/admin/training/workouts/${workout.id}/edit`}
            className="block border p-4 rounded hover:bg-zinc-50 no-underline"
          >
            <div className="flex justify-between">
              <div>
                <p className="font-semibold text-black">
                  {workout.title}
                </p>
                <p className="text-sm text-gray-500">
                  {workout.description || 'No description'}
                </p>
              </div>

              <div className="text-sm">
                Difficulty: {workout.difficulty_level}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}