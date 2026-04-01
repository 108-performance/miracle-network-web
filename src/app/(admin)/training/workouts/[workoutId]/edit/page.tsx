import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import {
  addWorkoutExercise,
  deleteWorkoutExercise,
  updateWorkout,
  updateWorkoutExercise,
} from '../../actions';

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

  const { data: exercises, error: exercisesError } = await supabase
    .from('exercises')
    .select('id, name, category, default_metric_type')
    .order('name', { ascending: true });

  if (exercisesError) {
    console.error(exercisesError);
  }

  const { data: workoutExercises, error: workoutExercisesError } =
    await supabase
      .from('workout_exercises')
      .select(
        `
          id,
          workout_id,
          exercise_id,
          sort_order,
          prescribed_sets,
          prescribed_reps,
          prescribed_time_seconds,
          prescribed_score,
          prescribed_exit_velocity,
          metric_type,
          instructions,
          exercises (
            id,
            name,
            category,
            default_metric_type
          )
        `
      )
      .eq('workout_id', workoutId)
      .order('sort_order', { ascending: true });

  if (workoutExercisesError) {
    console.error(workoutExercisesError);
  }

  return (
    <div className="max-w-4xl p-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Edit Workout</h1>

        {workout.training_program_id ? (
          <Link
            href={`/training/programs/${workout.training_program_id}`}
            className="rounded border px-4 py-2 text-sm"
          >
            Back to Program
          </Link>
        ) : (
          <Link
            href="/training/workouts"
            className="rounded border px-4 py-2 text-sm"
          >
            Back to Workouts
          </Link>
        )}
      </div>

      <form action={updateWorkout} className="space-y-4 rounded border p-4">
        <input type="hidden" name="id" value={workout.id} />

        <div>
          <label className="mb-1 block text-sm font-medium">Title</label>
          <input
            name="title"
            defaultValue={workout.title ?? ''}
            className="w-full rounded border p-2"
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Description</label>
          <textarea
            name="description"
            defaultValue={workout.description ?? ''}
            className="w-full rounded border p-2"
            rows={4}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            Difficulty Level
          </label>
          <input
            name="difficulty_level"
            type="number"
            defaultValue={workout.difficulty_level ?? ''}
            className="w-full rounded border p-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Program</label>
          <select
            name="training_program_id"
            defaultValue={workout.training_program_id ?? ''}
            className="w-full rounded border p-2"
          >
            <option value="">No program</option>
            {programs?.map((program: any) => (
              <option key={program.id} value={program.id}>
                {program.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Day Order</label>
          <input
            name="day_order"
            type="number"
            defaultValue={workout.day_order ?? ''}
            className="w-full rounded border p-2"
          />
        </div>

        <button
          type="submit"
          className="rounded bg-black px-4 py-2 text-white"
        >
          Save Workout Details
        </button>
      </form>

      <div className="my-8 border-t" />

      <section className="space-y-6">
        <div>
          <h2 className="text-xl font-bold">Workout Exercises</h2>
          <p className="mt-1 text-sm text-gray-500">
            Attach exercises to this workout and set the prescription for each
            one.
          </p>
        </div>

        <form action={addWorkoutExercise} className="rounded border p-4">
          <input type="hidden" name="workout_id" value={workout.id} />

          <div className="grid gap-4 md:grid-cols-3">
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">Exercise</label>
              <select
                name="exercise_id"
                className="w-full rounded border p-2"
                required
              >
                <option value="">Select exercise</option>
                {exercises?.map((exercise: any) => (
                  <option key={exercise.id} value={exercise.id}>
                    {exercise.name}
                    {exercise.category ? ` (${exercise.category})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Sort Order
              </label>
              <input
                name="sort_order"
                type="number"
                defaultValue={
                  workoutExercises && workoutExercises.length > 0
                    ? (workoutExercises[workoutExercises.length - 1].sort_order ??
                        workoutExercises.length) + 1
                    : 1
                }
                className="w-full rounded border p-2"
              />
            </div>
          </div>

          <div className="mt-4 max-w-xs">
            <label className="mb-1 block text-sm font-medium">Metric Type</label>
            <select
              name="metric_type"
              defaultValue="reps"
              className="w-full rounded border p-2"
            >
              <option value="reps">Reps</option>
              <option value="time">Time</option>
              <option value="score">Score</option>
              <option value="exit_velocity">Exit Velocity</option>
              <option value="mixed">Mixed</option>
            </select>
          </div>

          <button
            type="submit"
            className="mt-4 rounded bg-black px-4 py-2 text-white"
          >
            Add Exercise
          </button>
        </form>

        <div className="space-y-4">
          {workoutExercises && workoutExercises.length > 0 ? (
            workoutExercises.map((item: any) => (
              <div key={item.id} className="rounded border p-4">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold">
                      {item.exercises?.name ?? 'Unnamed Exercise'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {item.exercises?.category || 'No category'}
                    </p>
                  </div>

                  <form action={deleteWorkoutExercise}>
                    <input type="hidden" name="id" value={item.id} />
                    <input
                      type="hidden"
                      name="workout_id"
                      value={workout.id}
                    />
                    <button
                      type="submit"
                      className="rounded border px-3 py-2 text-sm"
                    >
                      Remove
                    </button>
                  </form>
                </div>

                <form action={updateWorkoutExercise} className="space-y-4">
                  <input type="hidden" name="id" value={item.id} />
                  <input type="hidden" name="workout_id" value={workout.id} />

                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <label className="mb-1 block text-sm font-medium">
                        Sort Order
                      </label>
                      <input
                        name="sort_order"
                        type="number"
                        defaultValue={item.sort_order ?? ''}
                        className="w-full rounded border p-2"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium">
                        Sets
                      </label>
                      <input
                        name="sets"
                        type="number"
                        defaultValue={item.prescribed_sets ?? ''}
                        className="w-full rounded border p-2"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium">
                        Reps
                      </label>
                      <input
                        name="reps"
                        type="number"
                        defaultValue={item.prescribed_reps ?? ''}
                        className="w-full rounded border p-2"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium">
                        Time (seconds)
                      </label>
                      <input
                        name="time"
                        type="number"
                        defaultValue={item.prescribed_time_seconds ?? ''}
                        className="w-full rounded border p-2"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium">
                        Score
                      </label>
                      <input
                        name="score"
                        type="number"
                        defaultValue={item.prescribed_score ?? ''}
                        className="w-full rounded border p-2"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium">
                        Exit Velocity
                      </label>
                      <input
                        name="exit_velocity"
                        type="number"
                        step="any"
                        defaultValue={item.prescribed_exit_velocity ?? ''}
                        className="w-full rounded border p-2"
                      />
                    </div>
                  </div>

                  <div className="max-w-xs">
                    <label className="mb-1 block text-sm font-medium">
                      Metric Type
                    </label>
                    <select
                      name="metric_type"
                      defaultValue={item.metric_type ?? 'reps'}
                      className="w-full rounded border p-2"
                    >
                      <option value="reps">Reps</option>
                      <option value="time">Time</option>
                      <option value="score">Score</option>
                      <option value="exit_velocity">Exit Velocity</option>
                      <option value="mixed">Mixed</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Instructions
                    </label>
                    <textarea
                      name="instructions"
                      defaultValue={item.instructions ?? ''}
                      rows={3}
                      className="w-full rounded border p-2"
                      placeholder="Optional athlete coaching notes"
                    />
                  </div>

                  <button
                    type="submit"
                    className="rounded bg-black px-4 py-2 text-white"
                  >
                    Save Exercise Prescription
                  </button>
                </form>
              </div>
            ))
          ) : (
            <div className="rounded border border-dashed p-4 text-sm text-gray-500">
              No exercises attached yet.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}