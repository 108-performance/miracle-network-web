'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createContentPost(formData: FormData) {
  const supabase = await createClient();

  const title = String(formData.get('title') || '').trim();
  const description = String(formData.get('description') || '').trim();
  const content_type = String(formData.get('content_type') || '').trim();
  const status = String(formData.get('status') || '').trim();
  const audience = String(formData.get('audience') || '').trim();
  const training_program_id =
    String(formData.get('training_program_id') || '').trim() || null;
  const workout_id = String(formData.get('workout_id') || '').trim() || null;
  const exercise_id = String(formData.get('exercise_id') || '').trim() || null;
  const external_url =
    String(formData.get('external_url') || '').trim() || null;

  const file = formData.get('file');

  if (!title) {
    throw new Error('Title is required');
  }

  let file_url: string | null = null;

  if (file instanceof File && file.size > 0) {
    const safeName = file.name.replace(/\s+/g, '-').toLowerCase();
    const filePath = `content/${Date.now()}-${safeName}`;

    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = new Uint8Array(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from('content-assets')
      .upload(filePath, fileBuffer, {
        contentType: file.type || undefined,
        upsert: false,
      });

    if (uploadError) {
      console.error('File upload error:', uploadError);
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    const { data: publicUrlData } = supabase.storage
      .from('content-assets')
      .getPublicUrl(filePath);

    file_url = publicUrlData.publicUrl;
  }

  const { error } = await supabase.from('content_posts').insert({
    title,
    description: description || null,
    content_type,
    status,
    audience,
    training_program_id,
    workout_id,
    exercise_id,
    external_url,
    file_url,
  });

  if (error) {
    console.error('createContentPost error:', error);
    throw new Error(error.message);
  }

  revalidatePath('/admin/content');
  revalidatePath('/dashboard/training');

  redirect('/admin/content');
}

export async function updateContentPost(formData: FormData) {
  const supabase = await createClient();

  const id = String(formData.get('id') || '').trim();
  const title = String(formData.get('title') || '').trim();
  const description = String(formData.get('description') || '').trim();
  const content_type = String(formData.get('content_type') || '').trim();
  const status = String(formData.get('status') || '').trim();
  const audience = String(formData.get('audience') || '').trim();
  const training_program_id =
    String(formData.get('training_program_id') || '').trim() || null;
  const workout_id = String(formData.get('workout_id') || '').trim() || null;
  const exercise_id = String(formData.get('exercise_id') || '').trim() || null;
  const external_url =
    String(formData.get('external_url') || '').trim() || null;
  const existing_file_url =
    String(formData.get('existing_file_url') || '').trim() || null;

  const file = formData.get('file');

  if (!id) {
    throw new Error('Content id is required');
  }

  if (!title) {
    throw new Error('Title is required');
  }

  let file_url: string | null = existing_file_url;

  if (file instanceof File && file.size > 0) {
    const safeName = file.name.replace(/\s+/g, '-').toLowerCase();
    const filePath = `content/${Date.now()}-${safeName}`;

    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = new Uint8Array(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from('content-assets')
      .upload(filePath, fileBuffer, {
        contentType: file.type || undefined,
        upsert: false,
      });

    if (uploadError) {
      console.error('File upload error:', uploadError);
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    const { data: publicUrlData } = supabase.storage
      .from('content-assets')
      .getPublicUrl(filePath);

    file_url = publicUrlData.publicUrl;
  }

  const { error } = await supabase
    .from('content_posts')
    .update({
      title,
      description: description || null,
      content_type,
      status,
      audience,
      training_program_id,
      workout_id,
      exercise_id,
      external_url,
      file_url,
    })
    .eq('id', id);

  if (error) {
    console.error('updateContentPost error:', error);
    throw new Error(error.message);
  }

  revalidatePath('/admin/content');
  revalidatePath('/dashboard/training');

  redirect('/admin/content');
}