'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createWorkout(formData: FormData) {
  const supabase = await createClient();

  const title = String(formData.get('title') || '').trim();
  const description = String(formData.get('description') || '').trim();
  const difficulty_level = Number(formData.get('difficulty_level')) || null;
  const training_program_id =
    String(formData.get('training_program_id') || '').trim() || null;
  const day_order = Number(formData.get('day_order')) || null;

  if (!title) {
    throw new Error('Title is required');
  }

  const { error } = await supabase.from('workouts').insert({
    title,
    description: description || null,
    difficulty_level,
    training_program_id,
    day_order,
  });

  if (error) {
    console.error('createWorkout error:', error);
    throw new Error(error.message);
  }

  revalidatePath('/admin/training/workouts');
  revalidatePath('/dashboard/training');

  redirect('/admin/training/workouts');
}

export async function updateWorkout(formData: FormData) {
  const supabase = await createClient();

  const id = String(formData.get('id') || '').trim();
  const title = String(formData.get('title') || '').trim();
  const description = String(formData.get('description') || '').trim();
  const difficulty_level = Number(formData.get('difficulty_level')) || null;
  const training_program_id =
    String(formData.get('training_program_id') || '').trim() || null;
  const day_order = Number(formData.get('day_order')) || null;

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

  revalidatePath('/admin/training/workouts');
  revalidatePath('/dashboard/training');

  redirect('/admin/training/workouts');
}