'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createProgram(formData: FormData) {
  const supabase = await createClient();

  const title = String(formData.get('title') || '').trim();
  const description = String(formData.get('description') || '').trim();

  if (!title) {
    throw new Error('Title is required');
  }

  const { error } = await supabase.from('training_programs').insert({
    title,
    description: description || null,
  });

  if (error) {
    console.error('createProgram insert error:', error);
    throw new Error(error.message || 'Failed to create program');
  }

  revalidatePath('/training/programs');
  revalidatePath('/dashboard/training');

  redirect('/training/programs');
}

export async function updateProgram(formData: FormData) {
  const supabase = await createClient();

  const id = String(formData.get('id') || '').trim();
  const title = String(formData.get('title') || '').trim();
  const description = String(formData.get('description') || '').trim();

  if (!id) {
    throw new Error('Program id is required');
  }

  if (!title) {
    throw new Error('Title is required');
  }

  const { error } = await supabase
    .from('training_programs')
    .update({
      title,
      description: description || null,
    })
    .eq('id', id);

  if (error) {
    console.error('updateProgram error:', error);
    throw new Error(error.message);
  }

  revalidatePath('/training/programs');
  revalidatePath('/dashboard/training');

  redirect('/training/programs');
}