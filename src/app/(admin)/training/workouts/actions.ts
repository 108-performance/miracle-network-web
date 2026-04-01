'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

function toNullableNumber(value: FormDataEntryValue | null) {
  const stringValue = String(value ?? '').trim();

  if (!stringValue) {
    return null;
  }

  const parsed = Number(stringValue);

  if (Number.isNaN(parsed)) {
    return null;
  }

  return parsed;
}

function toNullableText(value: FormDataEntryValue | null) {
  const stringValue = String(value ?? '').trim();
  return stringValue || null;
}

export async function createWorkout(formData: FormData) {
  const supabase = await createClient();

  const title = String(formData.get('title') || '').trim();
  const description = String(formData.get('description') || '').trim();
  const difficulty_level = toNullableNumber(formData.get('difficulty_level'));
  const training_program_id =
    String(formData.get('training_program_id') || '').trim() || null;
  const day_order = toNullableNumber(formData.get('day_order'));

  if (!title) {
    throw new Error('Title is required');
  }

  const { data, error } = await supabase
    .from('workouts')
    .insert({
      title,
      description: description || null,
      difficulty_level,
      training_program_id,
      day_order,
    })
    .select('id')
    .single();

  if (error) {
    console.error('createWorkout error:', error);
    throw new Error(error.message);
  }

  revalidatePath('/training/workouts');
  revalidatePath('/training/programs');
  revalidatePath('/dashboard/training');

  if (data?.id) {
    redirect(`/training/workouts/${data.id}/edit`);
  }

  redirect('/training/workouts');
}

export async function updateWorkout(formData: FormData) {
  const supabase = await createClient();

  const id = String(formData.get('id') || '').trim();
  const title = String(formData.get('title') || '').trim();
  const description = String(formData.get('description') || '').trim();
  const difficulty_level = toNullableNumber(formData.get('difficulty_level'));
  const training_program_id =
    String(formData.get('training_program_id') || '').trim() || null;
  const day_order = toNullableNumber(formData.get('day_order'));

  if (!id) {
    throw new Error('Workout id is required');
  }

  if (!title) {
    throw new Error('Title is required');
  }

  const { error } = await supabase
    .from('workouts')
    .update({
      title,
      description: description || null,
      difficulty_level,
      training_program_id,
      day_order,
    })
    .eq('id', id);

  if (error) {
    console.error('updateWorkout error:', error);
    throw new Error(error.message);
  }

  revalidatePath('/training/workouts');
  revalidatePath(`/training/workouts/${id}/edit`);
  revalidatePath('/dashboard/training');

  redirect(`/training/workouts/${id}/edit`);
}

export async function addWorkoutExercise(formData: FormData) {
  const supabase = await createClient();

  const workout_id = String(formData.get('workout_id') || '').trim();
  const exercise_id = String(formData.get('exercise_id') || '').trim();
  const sort_order = toNullableNumber(formData.get('sort_order'));
  const metric_type = String(formData.get('metric_type') || 'reps').trim();

  if (!workout_id) {
    throw new Error('Workout id is required');
  }

  if (!exercise_id) {
    throw new Error('Exercise id is required');
  }

  const { error } = await supabase.from('workout_exercises').insert({
    workout_id,
    exercise_id,
    sort_order,
    metric_type: metric_type || 'reps',
  });

  if (error) {
    console.error('addWorkoutExercise error:', error);
    throw new Error(error.message || 'Failed to add workout exercise');
  }

  revalidatePath(`/training/workouts/${workout_id}/edit`);
  revalidatePath('/dashboard/training');

  redirect(`/training/workouts/${workout_id}/edit`);
}

export async function updateWorkoutExercise(formData: FormData) {
  const supabase = await createClient();

  const id = String(formData.get('id') || '').trim();
  const workout_id = String(formData.get('workout_id') || '').trim();

  if (!id) {
    throw new Error('Workout exercise id is required');
  }

  if (!workout_id) {
    throw new Error('Workout id is required');
  }

  const { error } = await supabase
    .from('workout_exercises')
    .update({
      sort_order: toNullableNumber(formData.get('sort_order')),
      prescribed_sets: toNullableNumber(formData.get('sets')),
      prescribed_reps: toNullableNumber(formData.get('reps')),
      prescribed_time_seconds: toNullableNumber(formData.get('time')),
      prescribed_score: toNullableNumber(formData.get('score')),
      prescribed_exit_velocity: toNullableNumber(
        formData.get('exit_velocity')
      ),
      metric_type: String(formData.get('metric_type') || 'reps').trim() || 'reps',
      instructions: toNullableText(formData.get('instructions')),
    })
    .eq('id', id);

  if (error) {
    console.error('updateWorkoutExercise error:', error);
    throw new Error(error.message || 'Failed to update workout exercise');
  }

  revalidatePath(`/training/workouts/${workout_id}/edit`);
  revalidatePath('/dashboard/training');

  redirect(`/training/workouts/${workout_id}/edit`);
}

export async function deleteWorkoutExercise(formData: FormData) {
  const supabase = await createClient();

  const id = String(formData.get('id') || '').trim();
  const workout_id = String(formData.get('workout_id') || '').trim();

  if (!id) {
    throw new Error('Workout exercise id is required');
  }

  if (!workout_id) {
    throw new Error('Workout id is required');
  }

  const { error } = await supabase
    .from('workout_exercises')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('deleteWorkoutExercise error:', error);
    throw new Error(error.message || 'Failed to delete workout exercise');
  }

  revalidatePath(`/training/workouts/${workout_id}/edit`);
  revalidatePath('/dashboard/training');

  redirect(`/training/workouts/${workout_id}/edit`);
}
export async function deleteWorkout(formData: FormData) {
  const supabase = await createClient();

  const workoutId = String(formData.get('workout_id') || '').trim();
  const programId = String(formData.get('program_id') || '').trim();

  if (!workoutId) {
    throw new Error('Workout id is required');
  }

  const { error: workoutExercisesError } = await supabase
    .from('workout_exercises')
    .delete()
    .eq('workout_id', workoutId);

  if (workoutExercisesError) {
    console.error(
      'deleteWorkout workout_exercises error:',
      workoutExercisesError
    );
    throw new Error(
      workoutExercisesError.message || 'Failed to delete workout exercises'
    );
  }

  const { error: challengeScoresError } = await supabase
    .from('challenge_scores')
    .delete()
    .eq('workout_id', workoutId);

  if (challengeScoresError) {
    console.error(
      'deleteWorkout challenge_scores error:',
      challengeScoresError
    );
  }

  const { error: workoutLogsError } = await supabase
    .from('workout_logs')
    .delete()
    .eq('workout_id', workoutId);

  if (workoutLogsError) {
    console.error('deleteWorkout workout_logs error:', workoutLogsError);
  }

  const { data: deletedWorkouts, error: workoutError } = await supabase
    .from('workouts')
    .delete()
    .eq('id', workoutId)
    .select('id');

  if (workoutError) {
    console.error('deleteWorkout workout error:', workoutError);
    throw new Error(workoutError.message || 'Failed to delete workout');
  }

  if (!deletedWorkouts || deletedWorkouts.length === 0) {
    throw new Error(
      'Workout row was not deleted. This is likely an RLS policy issue or another table is still referencing the workout.'
    );
  }

  revalidatePath('/training/workouts');
  revalidatePath('/training/programs');
  revalidatePath('/dashboard/training');

  if (programId) {
    revalidatePath(`/training/programs/${programId}`);
    revalidatePath(`/training/programs/${programId}/edit`);
    redirect(`/training/programs/${programId}`);
  }

  redirect('/training/programs');
}