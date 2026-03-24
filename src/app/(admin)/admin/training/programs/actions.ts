'use server';

import { createClient } from '@/lib/supabase/server';
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

  redirect('/admin/training/programs');
}