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

  let user = null;

  try {
    const {
      data: { user: authUser },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !authUser) {
      throw new Error('You must be logged in to save a workout session.');
    }

    user = authUser;
  } catch {
    throw new Error('You must be logged in to save a workout session.');
  }

  let athlete: { id: string } | null = null;

  const { data: existingAthlete, error: athleteError } = await supabase
    .from('athletes')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (athleteError) {
    console.error('saveWorkoutSessionAction athletes lookup error:', athleteError);
    throw new Error(athleteError.message || 'Failed to load athlete profile.');
  }

  athlete = existingAthlete ?? null;

  if (!athlete) {
    const { data: createdAthlete, error: createAthleteError } = await supabase
      .from('athletes')
      .insert({
        user_id: user.id,
      })
      .select('id')
      .single();

    if (createAthleteError || !createdAthlete) {
      console.error(
        'saveWorkoutSessionAction athletes create error:',
        createAthleteError
      );
      throw new Error(
        createAthleteError?.message || 'Failed to create athlete profile.'
      );
    }

    athlete = createdAthlete;
  }

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