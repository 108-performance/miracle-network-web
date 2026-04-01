import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

type Program = {
  id: string;
  title: string;
};

type Workout = {
  id: string;
  title: string;
  day_order: number | null;
  training_program_id: string | null;
};

export default async function ForcePage() {
  const supabase = await createClient();

  // 1. Get Force program
  const { data: programs } = await supabase
    .from('training_programs')
    .select('id, title')
    .eq('title', 'Force')
    .limit(1)
    .single();

  if (!programs) {
    return <div className="p-6 text-white">Force program not found</div>;
  }

  // 2. Get workouts for Force
  const { data: workouts } = await supabase
    .from('workouts')
    .select('id, title, day_order, training_program_id')
    .eq('training_program_id', programs.id)
    .order('day_order', { ascending: true });

  const safeWorkouts: Workout[] = workouts ?? [];

  return (
    <main className="min-h-screen bg-black px-6 py-8 text-white">
      <div className="mx-auto max-w-6xl">
        <p className="mb-2 text-sm uppercase tracking-[0.2em] text-zinc-400">
          Workout / Force
        </p>

        <h1 className="text-4xl font-bold">Force</h1>

        <p className="mt-3 max-w-2xl text-zinc-300">
          Work through the Force progression using real training sessions.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {safeWorkouts.map((workout) => {
            const level = workout.day_order ?? 0;

            return (
              <Link
                key={workout.id}
                href={`/dashboard/workout/force/level-${level}`}
                className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5 text-center transition hover:border-zinc-600 hover:bg-zinc-900"
              >
                <h2 className="text-xl font-semibold">
                  Level {level}
                </h2>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}