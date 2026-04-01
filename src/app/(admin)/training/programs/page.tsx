import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export default async function ProgramsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  async function deleteProgramAction(formData: FormData) {
    'use server';

    const programId = String(formData.get('programId') ?? '').trim();

    if (!programId) {
      throw new Error('Missing programId for delete.');
    }

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect('/login');
    }

    const { data: workouts, error: workoutsError } = await supabase
      .from('workouts')
      .select('id')
      .eq('training_program_id', programId);

    if (workoutsError) {
      throw new Error(`Unable to load program workouts: ${workoutsError.message}`);
    }

    const workoutIds = (workouts ?? []).map((workout) => workout.id);

    const { error: programContentError } = await supabase
      .from('content_posts')
      .delete()
      .eq('training_program_id', programId);

    if (programContentError) {
      throw new Error(`Unable to delete program content: ${programContentError.message}`);
    }

    if (workoutIds.length > 0) {
      const { error: workoutContentError } = await supabase
        .from('content_posts')
        .delete()
        .in('workout_id', workoutIds);

      if (workoutContentError) {
        throw new Error(`Unable to delete workout content: ${workoutContentError.message}`);
      }

      const { error: workoutExercisesError } = await supabase
        .from('workout_exercises')
        .delete()
        .in('workout_id', workoutIds);

      if (workoutExercisesError) {
        throw new Error(
          `Unable to delete workout exercises: ${workoutExercisesError.message}`
        );
      }

      const { error: workoutsDeleteError } = await supabase
        .from('workouts')
        .delete()
        .in('id', workoutIds);

      if (workoutsDeleteError) {
        throw new Error(`Unable to delete workouts: ${workoutsDeleteError.message}`);
      }
    }

    const { data: deletedProgram, error: programDeleteError } = await supabase
      .from('training_programs')
      .delete()
      .eq('id', programId)
      .select('id');

    if (programDeleteError) {
      throw new Error(`Unable to delete program: ${programDeleteError.message}`);
    }

    if (!deletedProgram || deletedProgram.length === 0) {
      throw new Error('Delete ran, but no program row was removed.');
    }

    revalidatePath('/training/programs');
    revalidatePath('/dashboard/training');
  }

  const { data: programs, error } = await supabase
    .from('training_programs')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error(error);
    return <div>Error loading programs</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Training Programs</h1>
        <Link
          href="/training/programs/new"
          className="rounded bg-black px-4 py-2 text-white"
        >
          Create Program
        </Link>
      </div>

      <div className="space-y-3">
        {programs && programs.length > 0 ? (
          programs.map((program: any) => (
            <div
              key={program.id}
              className="flex items-start justify-between gap-4 rounded border p-4"
            >
              <Link
                href={`/training/programs/${program.id}/edit`}
                className="block flex-1 no-underline hover:bg-zinc-50"
              >
                <div>
                  <p className="font-semibold text-black">{program.title}</p>
                  <p className="text-sm text-gray-500">
                    {program.description || 'No description'}
                  </p>
                </div>
              </Link>

              <form action={deleteProgramAction}>
                <input type="hidden" name="programId" value={program.id} />
                <button
                  type="submit"
                  className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100"
                >
                  Delete Program
                </button>
              </form>
            </div>
          ))
        ) : (
          <div className="text-gray-500">No programs yet</div>
        )}
      </div>
    </div>
  );
}