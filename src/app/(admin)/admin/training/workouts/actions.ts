'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function createWorkout(formData: FormData) {
  const supabase = await createClient();

  const title = String(formData.get('title') || '').trim();
  const description = String(formData.get('description') || '').trim();

  const difficulty_level = Number(formData.get('difficulty_level')) || null;
  const training_program_id =
    String(formData.get('training_program_id') || '') || null;
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

  redirect('/admin/training/workouts');
}