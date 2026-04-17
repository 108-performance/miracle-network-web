'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

function normalizeLane(value: FormDataEntryValue | null) {
  const lane = String(value ?? '').trim().toLowerCase();

  if (lane === 'train' || lane === 'compete' || lane === 'workout') {
    return lane;
  }

  return null;
}

function normalizeSortOrder(value: FormDataEntryValue | null) {
  const raw = String(value ?? '').trim();

  if (!raw) return null;

  const parsed = Number(raw);

  if (!Number.isFinite(parsed)) {
    throw new Error('Sort order must be a valid number');
  }

  return parsed;
}

function normalizeBoolean(value: FormDataEntryValue | null) {
  return String(value ?? '').trim() === 'true';
}

export async function createProgram(formData: FormData) {
  const supabase = await createClient();

  const title = String(formData.get('title') || '').trim();
  const description = String(formData.get('description') || '').trim();
  const appLane = normalizeLane(formData.get('app_lane'));
  const isActive = normalizeBoolean(formData.get('is_active'));
  const sortOrder = normalizeSortOrder(formData.get('sort_order'));

  if (!title) {
    throw new Error('Title is required');
  }

  if (!appLane) {
    throw new Error('App lane is required');
  }

  const { error } = await supabase.from('training_programs').insert({
    title,
    description: description || null,
    app_lane: appLane,
    is_active: isActive,
    sort_order: sortOrder,
  });

  if (error) {
    console.error('createProgram insert error:', error);
    throw new Error(error.message || 'Failed to create program');
  }

  revalidatePath('/training/programs');
  revalidatePath('/dashboard/training');
  revalidatePath('/dashboard/train');
  revalidatePath('/dashboard/compete');
  revalidatePath('/dashboard/workout');

  redirect('/training/programs');
}

export async function updateProgram(formData: FormData) {
  const supabase = await createClient();

  const id = String(formData.get('id') || '').trim();
  const title = String(formData.get('title') || '').trim();
  const description = String(formData.get('description') || '').trim();
  const appLane = normalizeLane(formData.get('app_lane'));
  const isActive = normalizeBoolean(formData.get('is_active'));
  const sortOrder = normalizeSortOrder(formData.get('sort_order'));

  if (!id) {
    throw new Error('Program id is required');
  }

  if (!title) {
    throw new Error('Title is required');
  }

  if (!appLane) {
    throw new Error('App lane is required');
  }

  const { error } = await supabase
    .from('training_programs')
    .update({
      title,
      description: description || null,
      app_lane: appLane,
      is_active: isActive,
      sort_order: sortOrder,
    })
    .eq('id', id);

  if (error) {
    console.error('updateProgram error:', error);
    throw new Error(error.message);
  }

  revalidatePath('/training/programs');
  revalidatePath('/dashboard/training');
  revalidatePath('/dashboard/train');
  revalidatePath('/dashboard/compete');
  revalidatePath('/dashboard/workout');

  redirect('/training/programs');
}