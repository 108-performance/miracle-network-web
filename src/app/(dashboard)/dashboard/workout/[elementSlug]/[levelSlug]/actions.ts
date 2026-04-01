'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

type ExerciseLogInput = {
  workoutExerciseId: string;
  exerciseId: string;
  metricType: string | null;
  reps?: string;
  timeSeconds?: string;
  score?: string;
  exitVelocity?: string;
};

type SaveWorkoutSessionInput = {
  workoutId: string;
  workoutTitle: string;
  elementSlug: string;
  levelSlug: string;
  exercises: ExerciseLogInput[];
};

function toNumberOrNull(value?: string) {
  if (!value || value.trim() === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function saveWorkoutSessionAction(
  input: SaveWorkoutSessionInput
) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('You must be logged in to save a workout session.');
  }

  const { data: athlete, error: athleteError } = await supabase
    .from('athletes')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (athleteError || !athlete) {
    throw new Error('Athlete profile not found for the current user.');
  }

  // 1. Create workout log first
  const { data: workoutLog, error: workoutLogError } = await supabase
    .from('workout_logs')
    .insert({
      athlete_id: athlete.id,
      workout_id: input.workoutId,
      completed_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (workoutLogError || !workoutLog) {
    console.error('saveWorkoutSessionAction workout_logs error:', workoutLogError);
    throw new Error(
      workoutLogError?.message || 'Failed to save workout completion.'
    );
  }

  // 2. Create exercise logs that point to workout_log_id
  const rowsToInsert = input.exercises
    .map((item) => {
      const actual_reps = toNumberOrNull(item.reps);
      const actual_time_seconds = toNumberOrNull(item.timeSeconds);
      const actual_score = toNumberOrNull(item.score);
      const actual_exit_velocity = toNumberOrNull(item.exitVelocity);

      const hasAnyValue =
        actual_reps !== null ||
        actual_time_seconds !== null ||
        actual_score !== null ||
        actual_exit_velocity !== null;

      if (!hasAnyValue) return null;

      return {
        athlete_id: athlete.id,
        workout_log_id: workoutLog.id,
        workout_exercise_id: item.workoutExerciseId,
        exercise_id: item.exerciseId,
        actual_reps,
        actual_time_seconds,
        actual_score,
        actual_exit_velocity,
      };
    })
    .filter(Boolean);

  if (rowsToInsert.length > 0) {
    const { error: exerciseLogsError } = await supabase
      .from('exercise_logs')
      .insert(rowsToInsert);

    if (exerciseLogsError) {
      console.error(
        'saveWorkoutSessionAction exercise_logs error:',
        exerciseLogsError
      );
      throw new Error(
        exerciseLogsError.message || 'Failed to save exercise logs.'
      );
    }
  }

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/workout');
  revalidatePath(`/dashboard/workout/${input.elementSlug}/${input.levelSlug}`);

  return {
    success: true,
    savedExerciseLogs: rowsToInsert.length,
    workoutTitle: input.workoutTitle,
  };
}