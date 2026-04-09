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

  // --------------------------
  // 1. Get auth user safely
  // --------------------------
  let authUser = null;

  try {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw new Error('User not authenticated');
    }
    authUser = data.user;
  } catch {
    throw new Error('You must be logged in to save a workout session.');
  }

  // --------------------------
  // 2. Ensure public.users row exists
  // --------------------------
  let appUser = null;

  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('id', authUser.id)
    .maybeSingle();

  if (existingUser) {
    appUser = existingUser;
  } else {
    const { data: createdUser, error: createUserError } = await supabase
      .from('users')
      .insert({
        id: authUser.id,
        email: authUser.email,
      })
      .select('id')
      .single();

    if (createUserError || !createdUser) {
      console.error('users create error:', createUserError);
      throw new Error('Failed to create user record.');
    }

    appUser = createdUser;
  }

  // --------------------------
  // 3. Ensure athlete exists
  // --------------------------
  let athlete = null;

  const { data: existingAthlete } = await supabase
    .from('athletes')
    .select('id')
    .eq('user_id', appUser.id)
    .maybeSingle();

  if (existingAthlete) {
    athlete = existingAthlete;
  } else {
    const { data: createdAthlete, error: athleteError } = await supabase
      .from('athletes')
      .insert({
        user_id: appUser.id,
      })
      .select('id')
      .single();

    if (athleteError || !createdAthlete) {
      console.error('athlete create error:', athleteError);
      throw new Error('Failed to create athlete profile.');
    }

    athlete = createdAthlete;
  }

  // --------------------------
  // 4. Create workout log
  // --------------------------
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
    console.error('workout_logs error:', workoutLogError);
    throw new Error('Failed to save workout completion.');
  }

  // --------------------------
  // 5. Create exercise logs
  // --------------------------
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
      console.error('exercise_logs error:', exerciseLogsError);
      throw new Error('Failed to save exercise logs.');
    }
  }

  // --------------------------
  // 6. Revalidate
  // --------------------------
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/workout');
  revalidatePath(`/dashboard/workout/${input.elementSlug}/${input.levelSlug}`);

  return {
    success: true,
    savedExerciseLogs: rowsToInsert.length,
    workoutTitle: input.workoutTitle,
  };
}