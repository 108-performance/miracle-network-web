import Link from 'next/link';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { deleteWorkout } from '../../workouts/actions';

type PageProps = {
  params: Promise<{
    programId: string;
  }>;
};

function getOrderValue(item: any) {
  return (
    item.day_order ??
    item.sort_order ??
    item.order_index ??
    item.position ??
    item.order ??
    9999
  );
}

function sortByKnownOrder<T extends Record<string, any>>(items: T[]) {
  return [...items].sort((a, b) => getOrderValue(a) - getOrderValue(b));
}

function toNullableInt(value: FormDataEntryValue | null) {
  const stringValue = String(value ?? '').trim();

  if (!stringValue) {
    return null;
  }

  const parsed = Number(stringValue);

  if (Number.isNaN(parsed)) {
    return null;
  }

  return Math.round(parsed);
}

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

async function loadProgramWorkouts(supabase: any, programId: string) {
  let response = await supabase
    .from('workouts')
    .select('*')
    .eq('training_program_id', programId);

  if (
    response.error &&
    response.error.message?.includes(
      'workouts.training_program_id does not exist'
    )
  ) {
    response = await supabase
      .from('workouts')
      .select('*')
      .eq('program_id', programId);
  }

  if (response.error) {
    throw new Error(`Unable to load workouts: ${response.error.message}`);
  }

  return sortByKnownOrder(response.data ?? []);
}

async function loadWorkoutExercises(supabase: any, workoutIds: string[]) {
  if (workoutIds.length === 0) {
    return [];
  }

  const response = await supabase
    .from('workout_exercises')
    .select('*')
    .in('workout_id', workoutIds);

  if (response.error) {
    throw new Error(
      `Unable to load workout exercises: ${response.error.message}`
    );
  }

  return response.data ?? [];
}

async function loadWorkoutTemplates(supabase: any) {
  const response = await supabase
    .from('workout_templates')
    .select('*')
    .order('created_at', { ascending: false });

  if (response.error) {
    throw new Error(
      `Unable to load workout templates: ${response.error.message}`
    );
  }

  return response.data ?? [];
}

async function loadExerciseLibrary(supabase: any) {
  const response = await supabase
    .from('exercises')
    .select('*')
    .order('name', { ascending: true });

  if (response.error) {
    throw new Error(
      `Unable to load exercise library: ${response.error.message}`
    );
  }

  return response.data ?? [];
}

async function loadRecentWorkoutExercises(supabase: any) {
  const response = await supabase
    .from('workout_exercises')
    .select('exercise_id, created_at')
    .order('created_at', { ascending: false })
    .limit(100);

  if (response.error) {
    throw new Error(
      `Unable to load recent workout exercises: ${response.error.message}`
    );
  }

  return response.data ?? [];
}

function buildWorkoutCopyPayload(sourceWorkout: any, nextDayOrder: number) {
  const payload: Record<string, any> = {};

  for (const [key, value] of Object.entries(sourceWorkout)) {
    if (key === 'id' || key === 'created_at' || key === 'updated_at') {
      continue;
    }

    payload[key] = value;
  }

  payload.title = sourceWorkout.title
    ? `${sourceWorkout.title} (Copy)`
    : 'Workout Copy';
  payload.day_order = nextDayOrder;

  return payload;
}

function buildWorkoutExerciseCopyPayload(sourceRow: any, newWorkoutId: string) {
  const payload: Record<string, any> = {};

  for (const [key, value] of Object.entries(sourceRow)) {
    if (key === 'id' || key === 'created_at' || key === 'updated_at') {
      continue;
    }

    payload[key] = value;
  }

  payload.workout_id = newWorkoutId;

  return payload;
}

function buildTemplateExercisePayload(sourceRow: any, templateId: string) {
  return {
    workout_template_id: templateId,
    exercise_id: sourceRow.exercise_id,
    sort_order: sourceRow.sort_order ?? null,
    prescribed_sets: sourceRow.prescribed_sets ?? null,
    prescribed_reps: sourceRow.prescribed_reps ?? null,
    prescribed_time_seconds: sourceRow.prescribed_time_seconds ?? null,
    prescribed_score: sourceRow.prescribed_score ?? null,
    prescribed_exit_velocity: sourceRow.prescribed_exit_velocity ?? null,
    prescribed_yards: sourceRow.prescribed_yards ?? null,
    metric_type: sourceRow.metric_type ?? null,
    instructions: sourceRow.instructions ?? null,
    is_required: sourceRow.is_required ?? null,
  };
}

function buildTemplateRows(templateType: string, existingMaxDay: number) {
  if (templateType === '7_day_challenge') {
    return Array.from({ length: 7 }, (_, index) => ({
      title: `Day ${existingMaxDay + index + 1}`,
      description: null,
      day_order: existingMaxDay + index + 1,
      difficulty_level: 1,
    }));
  }

  if (templateType === '4_week_program') {
    return Array.from({ length: 28 }, (_, index) => ({
      title: `Day ${existingMaxDay + index + 1}`,
      description: null,
      day_order: existingMaxDay + index + 1,
      difficulty_level: 1,
    }));
  }

  if (templateType === '3_day_program') {
    return Array.from({ length: 3 }, (_, index) => ({
      title: `Day ${existingMaxDay + index + 1}`,
      description: null,
      day_order: existingMaxDay + index + 1,
      difficulty_level: 1,
    }));
  }

  return [];
}

export default async function AdminProgramDetailPage({ params }: PageProps) {
  const { programId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  async function generateTemplateAction(formData: FormData) {
    'use server';

    const currentProgramId = String(formData.get('programId') ?? '');
    const templateType = String(formData.get('templateType') ?? '');

    if (!currentProgramId || !templateType) {
      throw new Error(
        'Missing programId or templateType for structure generation.'
      );
    }

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect('/login');
    }

    const { data: existingWorkouts, error: existingWorkoutsError } =
      await supabase
        .from('workouts')
        .select('*')
        .eq('training_program_id', currentProgramId);

    if (existingWorkoutsError) {
      throw new Error(
        `Unable to load existing workouts: ${existingWorkoutsError.message}`
      );
    }

    const existingMaxDay = (existingWorkouts ?? []).reduce(
      (max: number, workout: any) => {
        const current = Number(workout.day_order ?? 0);
        return current > max ? current : max;
      },
      0
    );

    const templateRows = buildTemplateRows(templateType, existingMaxDay);

    if (templateRows.length === 0) {
      throw new Error('No template rows were created.');
    }

    const insertPayload = templateRows.map((row) => ({
      training_program_id: currentProgramId,
      title: row.title,
      description: row.description,
      day_order: row.day_order,
      difficulty_level: row.difficulty_level,
    }));

    const { error: insertError } = await supabase
      .from('workouts')
      .insert(insertPayload);

    if (insertError) {
      throw new Error(
        `Unable to generate program structure: ${insertError.message}`
      );
    }

    revalidatePath(`/training/programs/${currentProgramId}`);
  }

  async function insertFromTemplateAction(formData: FormData) {
    'use server';

    const currentProgramId = String(formData.get('programId') ?? '');
    const templateId = String(formData.get('templateId') ?? '');

    if (!currentProgramId || !templateId) {
      throw new Error('Missing programId or templateId for template insert.');
    }

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect('/login');
    }

    const { data: template, error: templateError } = await supabase
      .from('workout_templates')
      .select('*')
      .eq('id', templateId)
      .maybeSingle();

    if (templateError) {
      throw new Error(
        `Unable to load workout template: ${templateError.message}`
      );
    }

    if (!template) {
      throw new Error('Workout template not found.');
    }

    const { data: existingWorkouts, error: existingWorkoutsError } =
      await supabase
        .from('workouts')
        .select('id, day_order')
        .eq('training_program_id', currentProgramId);

    if (existingWorkoutsError) {
      throw new Error(
        `Unable to load program workouts for template insert: ${existingWorkoutsError.message}`
      );
    }

    const nextDayOrder =
      (existingWorkouts ?? []).reduce((max: number, workout: any) => {
        const current = Number(workout.day_order ?? 0);
        return current > max ? current : max;
      }, 0) + 1;

    const { data: insertedWorkout, error: insertWorkoutError } = await supabase
      .from('workouts')
      .insert({
        training_program_id: currentProgramId,
        title: template.title ?? 'Untitled Template Workout',
        description: template.description ?? null,
        difficulty_level: template.difficulty_level ?? null,
        day_order: nextDayOrder,
      })
      .select()
      .single();

    if (insertWorkoutError) {
      throw new Error(
        `Unable to insert workout from template: ${insertWorkoutError.message}`
      );
    }

    const { data: templateExercises, error: templateExercisesError } =
      await supabase
        .from('workout_template_exercises')
        .select('*')
        .eq('workout_template_id', templateId);

    if (templateExercisesError) {
      throw new Error(
        `Unable to load template exercises: ${templateExercisesError.message}`
      );
    }

    if ((templateExercises ?? []).length > 0) {
      const insertExercisePayload = templateExercises.map((row: any) => ({
        workout_id: insertedWorkout.id,
        exercise_id: row.exercise_id,
        sort_order: row.sort_order ?? null,
        prescribed_sets: row.prescribed_sets ?? null,
        prescribed_reps: row.prescribed_reps ?? null,
        prescribed_time_seconds: row.prescribed_time_seconds ?? null,
        prescribed_score: row.prescribed_score ?? null,
        prescribed_exit_velocity: row.prescribed_exit_velocity ?? null,
        prescribed_yards: row.prescribed_yards ?? null,
        metric_type: row.metric_type ?? null,
        instructions: row.instructions ?? null,
        is_required: row.is_required ?? null,
      }));

      const { error: insertExercisesError } = await supabase
        .from('workout_exercises')
        .insert(insertExercisePayload);

      if (insertExercisesError) {
        throw new Error(
          `Unable to insert template exercises into workout: ${insertExercisesError.message}`
        );
      }
    }

    revalidatePath(`/training/programs/${currentProgramId}`);
  }

  async function duplicateWorkoutAction(formData: FormData) {
    'use server';

    const workoutId = String(formData.get('workoutId') ?? '');
    const currentProgramId = String(formData.get('programId') ?? '');

    if (!workoutId || !currentProgramId) {
      throw new Error('Missing workoutId or programId for duplication.');
    }

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect('/login');
    }

    const { data: sourceWorkout, error: sourceWorkoutError } = await supabase
      .from('workouts')
      .select('*')
      .eq('id', workoutId)
      .maybeSingle();

    if (sourceWorkoutError) {
      throw new Error(
        `Unable to load source workout: ${sourceWorkoutError.message}`
      );
    }

    if (!sourceWorkout) {
      throw new Error('Source workout not found.');
    }

    const { data: programWorkouts, error: programWorkoutsError } = await supabase
      .from('workouts')
      .select('id, day_order')
      .eq('training_program_id', currentProgramId);

    if (programWorkoutsError) {
      throw new Error(
        `Unable to load program workouts: ${programWorkoutsError.message}`
      );
    }

    const nextDayOrder =
      (programWorkouts ?? []).reduce((max: number, workout: any) => {
        const current = Number(workout.day_order ?? 0);
        return current > max ? current : max;
      }, 0) + 1;

    const newWorkoutPayload = buildWorkoutCopyPayload(
      sourceWorkout,
      nextDayOrder
    );

    const { data: insertedWorkout, error: insertWorkoutError } = await supabase
      .from('workouts')
      .insert(newWorkoutPayload)
      .select()
      .single();

    if (insertWorkoutError) {
      throw new Error(
        `Unable to duplicate workout: ${insertWorkoutError.message}`
      );
    }

    const {
      data: sourceWorkoutExercises,
      error: sourceWorkoutExercisesError,
    } = await supabase
      .from('workout_exercises')
      .select('*')
      .eq('workout_id', workoutId);

    if (sourceWorkoutExercisesError) {
      throw new Error(
        `Unable to load workout exercises for duplication: ${sourceWorkoutExercisesError.message}`
      );
    }

    if ((sourceWorkoutExercises ?? []).length > 0) {
      const copiedExerciseRows = sourceWorkoutExercises.map((row: any) =>
        buildWorkoutExerciseCopyPayload(row, insertedWorkout.id)
      );

      const { error: insertWorkoutExercisesError } = await supabase
        .from('workout_exercises')
        .insert(copiedExerciseRows);

      if (insertWorkoutExercisesError) {
        throw new Error(
          `Unable to duplicate workout exercises: ${insertWorkoutExercisesError.message}`
        );
      }
    }

    revalidatePath(`/training/programs/${currentProgramId}`);
  }

  async function addExerciseToWorkoutAction(formData: FormData) {
    'use server';

    const workoutId = String(formData.get('workoutId') ?? '');
    const currentProgramId = String(formData.get('programId') ?? '');
    const exerciseId = String(formData.get('exerciseId') ?? '');

    if (!workoutId || !currentProgramId || !exerciseId) {
      throw new Error(
        'Missing workoutId, programId, or exerciseId for exercise add.'
      );
    }

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect('/login');
    }

    const { data: exercise, error: exerciseError } = await supabase
      .from('exercises')
      .select('*')
      .eq('id', exerciseId)
      .maybeSingle();

    if (exerciseError) {
      throw new Error(
        `Unable to load selected exercise: ${exerciseError.message}`
      );
    }

    if (!exercise) {
      throw new Error('Selected exercise was not found.');
    }

    const {
      data: currentWorkoutExercises,
      error: currentWorkoutExercisesError,
    } = await supabase
      .from('workout_exercises')
      .select('id, sort_order')
      .eq('workout_id', workoutId);

    if (currentWorkoutExercisesError) {
      throw new Error(
        `Unable to load current workout exercises: ${currentWorkoutExercisesError.message}`
      );
    }

    const nextSortOrder =
      (currentWorkoutExercises ?? []).reduce((max: number, row: any) => {
        const current = Number(row.sort_order ?? 0);
        return current > max ? current : max;
      }, 0) + 1;

    const defaultMetricType =
      exercise.default_metric_type &&
      String(exercise.default_metric_type).length > 0
        ? exercise.default_metric_type
        : 'reps';

    const { error: insertError } = await supabase
      .from('workout_exercises')
      .insert({
        workout_id: workoutId,
        exercise_id: exerciseId,
        sort_order: nextSortOrder,
        metric_type: defaultMetricType,
        is_required: true,
      });

    if (insertError) {
      throw new Error(
        `Unable to add exercise to workout: ${insertError.message}`
      );
    }

    revalidatePath(`/training/programs/${currentProgramId}`);
  }

  async function addRecentExerciseToWorkoutAction(formData: FormData) {
    'use server';

    const workoutId = String(formData.get('workoutId') ?? '');
    const currentProgramId = String(formData.get('programId') ?? '');
    const exerciseId = String(formData.get('exerciseId') ?? '');

    if (!workoutId || !currentProgramId || !exerciseId) {
      throw new Error(
        'Missing workoutId, programId, or exerciseId for recent exercise add.'
      );
    }

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect('/login');
    }

    const { data: exercise, error: exerciseError } = await supabase
      .from('exercises')
      .select('*')
      .eq('id', exerciseId)
      .maybeSingle();

    if (exerciseError) {
      throw new Error(
        `Unable to load recent exercise: ${exerciseError.message}`
      );
    }

    if (!exercise) {
      throw new Error('Recent exercise was not found.');
    }

    const {
      data: currentWorkoutExercises,
      error: currentWorkoutExercisesError,
    } = await supabase
      .from('workout_exercises')
      .select('id, sort_order')
      .eq('workout_id', workoutId);

    if (currentWorkoutExercisesError) {
      throw new Error(
        `Unable to load current workout exercises: ${currentWorkoutExercisesError.message}`
      );
    }

    const nextSortOrder =
      (currentWorkoutExercises ?? []).reduce((max: number, row: any) => {
        const current = Number(row.sort_order ?? 0);
        return current > max ? current : max;
      }, 0) + 1;

    const defaultMetricType =
      exercise.default_metric_type &&
      String(exercise.default_metric_type).length > 0
        ? exercise.default_metric_type
        : 'reps';

    const { error: insertError } = await supabase
      .from('workout_exercises')
      .insert({
        workout_id: workoutId,
        exercise_id: exerciseId,
        sort_order: nextSortOrder,
        metric_type: defaultMetricType,
        is_required: true,
      });

    if (insertError) {
      throw new Error(
        `Unable to add recent exercise to workout: ${insertError.message}`
      );
    }

    revalidatePath(`/training/programs/${currentProgramId}`);
  }

  async function removeExerciseFromWorkoutAction(formData: FormData) {
    'use server';

    const workoutExerciseId = String(formData.get('workoutExerciseId') ?? '');
    const currentProgramId = String(formData.get('programId') ?? '');

    if (!workoutExerciseId || !currentProgramId) {
      throw new Error(
        'Missing workoutExerciseId or programId for exercise removal.'
      );
    }

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect('/login');
    }

    const { error } = await supabase
      .from('workout_exercises')
      .delete()
      .eq('id', workoutExerciseId);

    if (error) {
      throw new Error(
        `Unable to remove exercise from workout: ${error.message}`
      );
    }

    revalidatePath(`/training/programs/${currentProgramId}`);
  }

  async function reorderExerciseInWorkoutAction(formData: FormData) {
    'use server';

    const workoutExerciseId = String(formData.get('workoutExerciseId') ?? '');
    const workoutId = String(formData.get('workoutId') ?? '');
    const currentProgramId = String(formData.get('programId') ?? '');
    const direction = String(formData.get('direction') ?? '');

    if (!workoutExerciseId || !workoutId || !currentProgramId || !direction) {
      throw new Error(
        'Missing workoutExerciseId, workoutId, programId, or direction for exercise reorder.'
      );
    }

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect('/login');
    }

    const { data: workoutExerciseRows, error: workoutExerciseRowsError } =
      await supabase
        .from('workout_exercises')
        .select('*')
        .eq('workout_id', workoutId);

    if (workoutExerciseRowsError) {
      throw new Error(
        `Unable to load workout exercises for reorder: ${workoutExerciseRowsError.message}`
      );
    }

    const orderedRows = [...(workoutExerciseRows ?? [])].sort(
      (a: any, b: any) => {
        const aOrder = Number(a.sort_order ?? 9999);
        const bOrder = Number(b.sort_order ?? 9999);
        return aOrder - bOrder;
      }
    );

    const currentIndex = orderedRows.findIndex(
      (row: any) => row.id === workoutExerciseId
    );

    if (currentIndex === -1) {
      throw new Error(
        'Workout exercise row was not found in the ordered exercise list.'
      );
    }

    const targetIndex =
      direction === 'up'
        ? currentIndex - 1
        : direction === 'down'
          ? currentIndex + 1
          : -1;

    if (targetIndex < 0 || targetIndex >= orderedRows.length) {
      revalidatePath(`/training/programs/${currentProgramId}`);
      return;
    }

    const currentRow = orderedRows[currentIndex];
    const targetRow = orderedRows[targetIndex];
    const currentOrder = Number(currentRow.sort_order ?? 0);
    const targetOrder = Number(targetRow.sort_order ?? 0);

    const tempOrder = -1;

    const { error: tempUpdateError } = await supabase
      .from('workout_exercises')
      .update({ sort_order: tempOrder })
      .eq('id', currentRow.id);

    if (tempUpdateError) {
      throw new Error(
        `Unable to stage current exercise order swap: ${tempUpdateError.message}`
      );
    }

    const { error: updateTargetError } = await supabase
      .from('workout_exercises')
      .update({ sort_order: currentOrder })
      .eq('id', targetRow.id);

    if (updateTargetError) {
      throw new Error(
        `Unable to update target exercise order: ${updateTargetError.message}`
      );
    }

    const { error: updateCurrentError } = await supabase
      .from('workout_exercises')
      .update({ sort_order: targetOrder })
      .eq('id', currentRow.id);

    if (updateCurrentError) {
      throw new Error(
        `Unable to finalize current exercise order: ${updateCurrentError.message}`
      );
    }

    revalidatePath(`/training/programs/${currentProgramId}`);
  }

  async function updateExercisePrescriptionAction(formData: FormData) {
    'use server';

    const workoutExerciseId = String(formData.get('workoutExerciseId') ?? '');
    const currentProgramId = String(formData.get('programId') ?? '');

    if (!workoutExerciseId || !currentProgramId) {
      throw new Error(
        'Missing workoutExerciseId or programId for prescription update.'
      );
    }

    const prescribedSets = toNullableInt(formData.get('prescribed_sets'));
    const prescribedReps = toNullableInt(formData.get('prescribed_reps'));
    const prescribedTimeSeconds = toNullableInt(
      formData.get('prescribed_time_seconds')
    );
    const prescribedScore = toNullableNumber(formData.get('prescribed_score'));
    const prescribedExitVelocity = toNullableNumber(
      formData.get('prescribed_exit_velocity')
    );
    const prescribedYards = toNullableInt(formData.get('prescribed_yards'));
    const metricType =
      String(formData.get('metric_type') ?? '').trim() || 'reps';
    const instructions = String(formData.get('instructions') ?? '').trim();
    const isRequired = String(formData.get('is_required') ?? '') === 'on';

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect('/login');
    }

    const { error } = await supabase
      .from('workout_exercises')
      .update({
        prescribed_sets: prescribedSets,
        prescribed_reps: prescribedReps,
        prescribed_time_seconds: prescribedTimeSeconds,
        prescribed_score: prescribedScore,
        prescribed_exit_velocity: prescribedExitVelocity,
        prescribed_yards: prescribedYards,
        metric_type: metricType,
        instructions: instructions.length > 0 ? instructions : null,
        is_required: isRequired,
      })
      .eq('id', workoutExerciseId);

    if (error) {
      throw new Error(
        `Unable to update exercise prescription: ${error.message}`
      );
    }

    revalidatePath(`/training/programs/${currentProgramId}`);
  }

  async function updateWorkoutMetaAction(formData: FormData) {
    'use server';

    const workoutId = String(formData.get('workoutId') ?? '');
    const currentProgramId = String(formData.get('programId') ?? '');
    const title = String(formData.get('title') ?? '').trim();
    const description = String(formData.get('description') ?? '').trim();

    if (!workoutId || !currentProgramId) {
      throw new Error('Missing workoutId or programId for workout update.');
    }

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect('/login');
    }

    const { error } = await supabase
      .from('workouts')
      .update({
        title: title.length > 0 ? title : null,
        description: description.length > 0 ? description : null,
      })
      .eq('id', workoutId);

    if (error) {
      throw new Error(`Unable to update workout: ${error.message}`);
    }

    revalidatePath(`/training/programs/${currentProgramId}`);
  }

  async function reorderWorkoutAction(formData: FormData) {
    'use server';

    const workoutId = String(formData.get('workoutId') ?? '');
    const currentProgramId = String(formData.get('programId') ?? '');
    const direction = String(formData.get('direction') ?? '');

    if (!workoutId || !currentProgramId || !direction) {
      throw new Error('Missing workoutId, programId, or direction for reorder.');
    }

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect('/login');
    }

    const { data: currentWorkout, error: currentWorkoutError } = await supabase
      .from('workouts')
      .select('*')
      .eq('id', workoutId)
      .maybeSingle();

    if (currentWorkoutError) {
      throw new Error(
        `Unable to load current workout: ${currentWorkoutError.message}`
      );
    }

    if (!currentWorkout) {
      throw new Error('Workout to reorder was not found.');
    }

    const { data: programWorkouts, error: programWorkoutsError } = await supabase
      .from('workouts')
      .select('*')
      .eq('training_program_id', currentProgramId);

    if (programWorkoutsError) {
      throw new Error(
        `Unable to load workouts for reorder: ${programWorkoutsError.message}`
      );
    }

    const orderedWorkouts = sortByKnownOrder(programWorkouts ?? []);
    const currentIndex = orderedWorkouts.findIndex(
      (workout: any) => workout.id === workoutId
    );

    if (currentIndex === -1) {
      throw new Error('Workout was not found in the ordered program list.');
    }

    const targetIndex =
      direction === 'up'
        ? currentIndex - 1
        : direction === 'down'
          ? currentIndex + 1
          : -1;

    if (targetIndex < 0 || targetIndex >= orderedWorkouts.length) {
      revalidatePath(`/training/programs/${currentProgramId}`);
      return;
    }

    const currentOrder = Number(currentWorkout.day_order ?? 0);
    const targetWorkout = orderedWorkouts[targetIndex];
    const targetOrder = Number(targetWorkout.day_order ?? 0);

    const { error: updateCurrentError } = await supabase
      .from('workouts')
      .update({ day_order: targetOrder })
      .eq('id', currentWorkout.id);

    if (updateCurrentError) {
      throw new Error(
        `Unable to update current workout order: ${updateCurrentError.message}`
      );
    }

    const { error: updateTargetError } = await supabase
      .from('workouts')
      .update({ day_order: currentOrder })
      .eq('id', targetWorkout.id);

    if (updateTargetError) {
      throw new Error(
        `Unable to update target workout order: ${updateTargetError.message}`
      );
    }

    revalidatePath(`/training/programs/${currentProgramId}`);
  }

  async function saveWorkoutAsTemplateAction(formData: FormData) {
    'use server';

    const workoutId = String(formData.get('workoutId') ?? '');
    const currentProgramId = String(formData.get('programId') ?? '');

    if (!workoutId || !currentProgramId) {
      throw new Error('Missing workoutId or programId for template save.');
    }

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect('/login');
    }

    const { data: sourceWorkout, error: sourceWorkoutError } = await supabase
      .from('workouts')
      .select('*')
      .eq('id', workoutId)
      .maybeSingle();

    if (sourceWorkoutError) {
      throw new Error(
        `Unable to load source workout for template save: ${sourceWorkoutError.message}`
      );
    }

    if (!sourceWorkout) {
      throw new Error('Workout to save as template was not found.');
    }

    const { data: insertedTemplate, error: insertTemplateError } = await supabase
      .from('workout_templates')
      .insert({
        title: sourceWorkout.title ?? 'Untitled Template',
        description: sourceWorkout.description ?? null,
        difficulty_level: sourceWorkout.difficulty_level ?? null,
        source_workout_id: sourceWorkout.id,
      })
      .select()
      .single();

    if (insertTemplateError) {
      throw new Error(
        `Unable to save workout template: ${insertTemplateError.message}`
      );
    }

    const {
      data: sourceWorkoutExercises,
      error: sourceWorkoutExercisesError,
    } = await supabase
      .from('workout_exercises')
      .select('*')
      .eq('workout_id', workoutId);

    if (sourceWorkoutExercisesError) {
      throw new Error(
        `Unable to load workout exercises for template save: ${sourceWorkoutExercisesError.message}`
      );
    }

    if ((sourceWorkoutExercises ?? []).length > 0) {
      const templateExerciseRows = sourceWorkoutExercises.map((row: any) =>
        buildTemplateExercisePayload(row, insertedTemplate.id)
      );

      const { error: insertTemplateExercisesError } = await supabase
        .from('workout_template_exercises')
        .insert(templateExerciseRows);

      if (insertTemplateExercisesError) {
        throw new Error(
          `Unable to save workout template exercises: ${insertTemplateExercisesError.message}`
        );
      }
    }

    revalidatePath(`/training/programs/${currentProgramId}`);
  }

  const { data: program, error: programError } = await supabase
    .from('training_programs')
    .select('*')
    .eq('id', programId)
    .maybeSingle();

  if (programError) {
    throw new Error(`Program query failed: ${programError.message}`);
  }

  if (!program) {
    return (
      <main className="min-h-screen bg-neutral-50">
        <div className="mx-auto max-w-4xl px-6 py-10">
          <div className="rounded-2xl border border-red-200 bg-white p-8 shadow-sm">
            <div className="text-sm font-semibold uppercase tracking-wide text-red-700">
              Program not found
            </div>
            <h1 className="mt-2 text-2xl font-bold text-neutral-950">
              No program matched this route.
            </h1>
            <p className="mt-3 text-sm leading-6 text-neutral-600">
              The page loaded, but no row matched this program ID in
              training_programs.
            </p>
            <div className="mt-5 rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700">
              Route param received: <span className="font-mono">{programId}</span>
            </div>
            <div className="mt-4">
              <Link
                href="/training/programs"
                className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100"
              >
                Back to Programs
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const workouts = await loadProgramWorkouts(supabase, programId);
  const workoutIds = workouts.map((workout: any) => workout.id);
  const workoutExercises = await loadWorkoutExercises(supabase, workoutIds);
  const workoutTemplates = await loadWorkoutTemplates(supabase);
  const exerciseLibrary = await loadExerciseLibrary(supabase);
  const recentWorkoutExercises = await loadRecentWorkoutExercises(supabase);

  const exerciseCountByWorkout = new Map<string, number>();
  const exerciseLookupById = new Map<string, any>();
  const exerciseRowsByWorkout = new Map<string, any[]>();

  for (const exercise of exerciseLibrary) {
    exerciseLookupById.set(exercise.id, exercise);
  }

  for (const record of workoutExercises) {
    exerciseCountByWorkout.set(
      record.workout_id,
      (exerciseCountByWorkout.get(record.workout_id) ?? 0) + 1
    );

    const currentRows = exerciseRowsByWorkout.get(record.workout_id) ?? [];
    currentRows.push(record);
    exerciseRowsByWorkout.set(record.workout_id, currentRows);
  }

  for (const [mappedWorkoutId, rows] of exerciseRowsByWorkout.entries()) {
    exerciseRowsByWorkout.set(
      mappedWorkoutId,
      [...rows].sort((a, b) => {
        const aOrder = Number(a.sort_order ?? 9999);
        const bOrder = Number(b.sort_order ?? 9999);
        return aOrder - bOrder;
      })
    );
  }

  const recentExerciseIds: string[] = [];

  for (const row of recentWorkoutExercises) {
    if (!row.exercise_id) continue;
    if (recentExerciseIds.includes(row.exercise_id)) continue;

    recentExerciseIds.push(row.exercise_id);

    if (recentExerciseIds.length >= 8) break;
  }

  const recentExercises = recentExerciseIds
    .map((id) => exerciseLookupById.get(id))
    .filter(Boolean);

  const totalDays = workouts.length;
  const totalWorkouts = workouts.length;
  const totalExercises = workoutExercises.length;

  const totalEmptyWorkouts = workouts.filter((workout: any) => {
    return (exerciseCountByWorkout.get(workout.id) ?? 0) === 0;
  }).length;

  return (
    <main className="min-h-screen bg-neutral-50">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8 flex flex-col gap-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-neutral-200 bg-neutral-100 px-3 py-1 text-xs font-medium uppercase tracking-wide text-neutral-600">
                  Admin Program Structure
                </span>
              </div>

              <div>
                <h1 className="text-3xl font-bold tracking-tight text-neutral-950">
                  {program.title || 'Untitled Program'}
                </h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-neutral-600">
                  {program.description?.trim() || 'No program description yet.'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/training/programs"
                className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100"
              >
                Back to Programs
              </Link>
              <Link
                href={`/training/programs/${program.id}/edit`}
                className="rounded-xl bg-neutral-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800"
              >
                Edit Program
              </Link>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Days
              </div>
              <div className="mt-2 text-2xl font-bold text-neutral-950">
                {totalDays}
              </div>
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Workouts
              </div>
              <div className="mt-2 text-2xl font-bold text-neutral-950">
                {totalWorkouts}
              </div>
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Exercises
              </div>
              <div className="mt-2 text-2xl font-bold text-neutral-950">
                {totalExercises}
              </div>
            </div>

            <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-red-700">
                Empty Workouts
              </div>
              <div className="mt-2 text-2xl font-bold text-red-900">
                {totalEmptyWorkouts}
              </div>
            </div>
          </div>
        </div>

        <section className="mb-8 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Structure Generator
              </div>
              <h2 className="mt-1 text-xl font-bold text-neutral-950">
                Generate a program template
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-neutral-600">
                Use this to instantly create a blank program structure for common
                build types, then rename and edit each day inline.
              </p>

              <form
                action={generateTemplateAction}
                className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end"
              >
                <input type="hidden" name="programId" value={programId} />

                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    Template Type
                  </label>
                  <select
                    name="templateType"
                    className="min-w-[220px] rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition focus:border-neutral-500"
                    defaultValue="7_day_challenge"
                  >
                    <option value="7_day_challenge">
                      Blank 7-Day Challenge
                    </option>
                    <option value="4_week_program">Blank 4-Week Program</option>
                    <option value="3_day_program">Blank 3-Day Program</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="rounded-xl bg-neutral-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800"
                >
                  Generate Structure
                </button>
              </form>
            </div>

            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Template Inserter
              </div>
              <h2 className="mt-1 text-xl font-bold text-neutral-950">
                Insert from saved template
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-neutral-600">
                Choose any saved workout template and insert it into this program
                as the next day.
              </p>

              <form
                action={insertFromTemplateAction}
                className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end"
              >
                <input type="hidden" name="programId" value={programId} />

                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    Saved Template
                  </label>
                  <select
                    name="templateId"
                    className="min-w-[260px] rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition focus:border-neutral-500"
                    defaultValue=""
                  >
                    <option value="" disabled>
                      Select a saved template
                    </option>
                    {workoutTemplates.map((template: any) => (
                      <option key={template.id} value={template.id}>
                        {template.title || 'Untitled Template'}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  className="rounded-xl bg-neutral-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800"
                >
                  Insert Template
                </button>
              </form>
            </div>
          </div>
        </section>

        {workouts.length === 0 ? (
          <div className="rounded-2xl border border-red-200 bg-white p-8 shadow-sm">
            <div className="max-w-2xl">
              <div className="text-sm font-semibold uppercase tracking-wide text-red-700">
                No workouts found
              </div>
              <h2 className="mt-2 text-2xl font-bold text-neutral-950">
                This program does not have any day structure yet.
              </h2>
              <p className="mt-3 text-sm leading-6 text-neutral-600">
                Use the structure generator above or insert from a saved
                template. In your current schema, each workout acts as a day
                block using the
                <span className="mx-1 font-mono">day_order</span>
                field.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {workouts.map((workout: any, index: number) => {
              const exerciseCount = exerciseCountByWorkout.get(workout.id) ?? 0;
              const isEmpty = exerciseCount === 0;
              const dayLabel =
                getOrderValue(workout) === 9999 ? '—' : getOrderValue(workout);
              const isFirst = index === 0;
              const isLast = index === workouts.length - 1;
              const attachedExerciseRows =
                exerciseRowsByWorkout.get(workout.id) ?? [];

              return (
                <section
                  key={workout.id}
                  className={`overflow-hidden rounded-2xl border shadow-sm ${
                    isEmpty
                      ? 'border-red-200 bg-red-50'
                      : 'border-neutral-200 bg-white'
                  }`}
                >
                  <div className="border-b border-neutral-200 bg-neutral-50 px-6 py-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                          Day {dayLabel}
                        </div>
                        <h2 className="mt-1 text-xl font-bold text-neutral-950">
                          {workout.title || `Untitled Day ${dayLabel}`}
                        </h2>
                        <p className="mt-2 text-sm leading-6 text-neutral-600">
                          {workout.description?.trim() ||
                            'No workout description yet.'}
                        </p>

                        <div className="mt-4 flex flex-col gap-3">
                          {attachedExerciseRows.length > 0 ? (
                            attachedExerciseRows.map((row: any, rowIndex: number) => {
                              const exercise = exerciseLookupById.get(
                                row.exercise_id
                              );
                              const exerciseName =
                                exercise?.name ?? 'Unnamed Exercise';
                              const isExerciseFirst = rowIndex === 0;
                              const isExerciseLast =
                                rowIndex === attachedExerciseRows.length - 1;

                              return (
                                <div
                                  key={row.id}
                                  className="rounded-2xl border border-neutral-200 bg-white p-4"
                                >
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-600">
                                      #{row.sort_order ?? rowIndex + 1}
                                    </span>

                                    <span className="min-w-0 flex-1 text-sm font-medium text-neutral-800">
                                      {exerciseName}
                                    </span>

                                    <form action={reorderExerciseInWorkoutAction}>
                                      <input
                                        type="hidden"
                                        name="workoutExerciseId"
                                        value={row.id}
                                      />
                                      <input
                                        type="hidden"
                                        name="workoutId"
                                        value={workout.id}
                                      />
                                      <input
                                        type="hidden"
                                        name="programId"
                                        value={programId}
                                      />
                                      <input
                                        type="hidden"
                                        name="direction"
                                        value="up"
                                      />
                                      <button
                                        type="submit"
                                        disabled={isExerciseFirst}
                                        className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide transition ${
                                          isExerciseFirst
                                            ? 'cursor-not-allowed border-neutral-200 bg-neutral-100 text-neutral-400'
                                            : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-100'
                                        }`}
                                      >
                                        Up
                                      </button>
                                    </form>

                                    <form action={reorderExerciseInWorkoutAction}>
                                      <input
                                        type="hidden"
                                        name="workoutExerciseId"
                                        value={row.id}
                                      />
                                      <input
                                        type="hidden"
                                        name="workoutId"
                                        value={workout.id}
                                      />
                                      <input
                                        type="hidden"
                                        name="programId"
                                        value={programId}
                                      />
                                      <input
                                        type="hidden"
                                        name="direction"
                                        value="down"
                                      />
                                      <button
                                        type="submit"
                                        disabled={isExerciseLast}
                                        className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide transition ${
                                          isExerciseLast
                                            ? 'cursor-not-allowed border-neutral-200 bg-neutral-100 text-neutral-400'
                                            : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-100'
                                        }`}
                                      >
                                        Down
                                      </button>
                                    </form>

                                    <form action={removeExerciseFromWorkoutAction}>
                                      <input
                                        type="hidden"
                                        name="workoutExerciseId"
                                        value={row.id}
                                      />
                                      <input
                                        type="hidden"
                                        name="programId"
                                        value={programId}
                                      />
                                      <button
                                        type="submit"
                                        className="rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-700 transition hover:bg-red-100"
                                      >
                                        Remove
                                      </button>
                                    </form>
                                  </div>

                                  <form
                                    action={updateExercisePrescriptionAction}
                                    className="mt-4 space-y-4"
                                  >
                                    <input
                                      type="hidden"
                                      name="workoutExerciseId"
                                      value={row.id}
                                    />
                                    <input
                                      type="hidden"
                                      name="programId"
                                      value={programId}
                                    />

                                    <div className="grid gap-3 md:grid-cols-6">
                                      <div>
                                        <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
                                          Sets
                                        </label>
                                        <input
                                          type="number"
                                          name="prescribed_sets"
                                          defaultValue={row.prescribed_sets ?? ''}
                                          className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition focus:border-neutral-500"
                                        />
                                      </div>

                                      <div>
                                        <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
                                          Reps
                                        </label>
                                        <input
                                          type="number"
                                          name="prescribed_reps"
                                          defaultValue={row.prescribed_reps ?? ''}
                                          className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition focus:border-neutral-500"
                                        />
                                      </div>

                                      <div>
                                        <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
                                          Time Sec
                                        </label>
                                        <input
                                          type="number"
                                          name="prescribed_time_seconds"
                                          defaultValue={
                                            row.prescribed_time_seconds ?? ''
                                          }
                                          className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition focus:border-neutral-500"
                                        />
                                      </div>

                                      <div>
                                        <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
                                          Score
                                        </label>
                                        <input
                                          type="number"
                                          step="any"
                                          name="prescribed_score"
                                          defaultValue={row.prescribed_score ?? ''}
                                          className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition focus:border-neutral-500"
                                        />
                                      </div>

                                      <div>
                                        <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
                                          Exit Velo
                                        </label>
                                        <input
                                          type="number"
                                          step="any"
                                          name="prescribed_exit_velocity"
                                          defaultValue={
                                            row.prescribed_exit_velocity ?? ''
                                          }
                                          className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition focus:border-neutral-500"
                                        />
                                      </div>

                                      <div>
                                        <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
                                          Yards
                                        </label>
                                        <input
                                          type="number"
                                          name="prescribed_yards"
                                          defaultValue={row.prescribed_yards ?? ''}
                                          className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition focus:border-neutral-500"
                                        />
                                      </div>
                                    </div>

                                    <div className="grid gap-3 md:grid-cols-[1fr,220px,auto]">
                                      <div>
                                        <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
                                          Instructions
                                        </label>
                                        <input
                                          type="text"
                                          name="instructions"
                                          defaultValue={row.instructions ?? ''}
                                          placeholder="Add quick instructions or coaching cues"
                                          className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition focus:border-neutral-500"
                                        />
                                      </div>

                                      <div>
                                        <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
                                          Metric
                                        </label>
                                        <select
                                          name="metric_type"
                                          defaultValue={row.metric_type ?? 'reps'}
                                          className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition focus:border-neutral-500"
                                        >
                                          <option value="reps">Reps</option>
                                          <option value="time">Time</option>
                                          <option value="score">Score</option>
                                          <option value="exit_velocity">
                                            Exit Velocity
                                          </option>
                                          <option value="mixed">Mixed</option>
                                        </select>
                                      </div>

                                      <div className="flex items-end gap-3">
                                        <label className="flex items-center gap-2 rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-700">
                                          <input
                                            type="checkbox"
                                            name="is_required"
                                            defaultChecked={Boolean(
                                              row.is_required
                                            )}
                                          />
                                          Required
                                        </label>

                                        <button
                                          type="submit"
                                          className="rounded-xl bg-neutral-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800"
                                        >
                                          Save Prescription
                                        </button>
                                      </div>
                                    </div>
                                  </form>
                                </div>
                              );
                            })
                          ) : (
                            <span className="rounded-full border border-red-200 bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
                              No exercises attached yet
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                            isEmpty
                              ? 'border-red-200 bg-red-100 text-red-700'
                              : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {isEmpty ? 'No Exercises' : 'Built'}
                        </span>

                        <span className="rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-medium text-neutral-700">
                          {exerciseCount} exercises
                        </span>

                        <span className="rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-medium text-neutral-700">
                          Difficulty {workout.difficulty_level ?? '—'}
                        </span>

                        <form action={reorderWorkoutAction}>
                          <input
                            type="hidden"
                            name="workoutId"
                            value={workout.id}
                          />
                          <input
                            type="hidden"
                            name="programId"
                            value={programId}
                          />
                          <input
                            type="hidden"
                            name="direction"
                            value="up"
                          />
                          <button
                            type="submit"
                            disabled={isFirst}
                            className={`rounded-xl border px-3 py-2 text-xs font-medium transition ${
                              isFirst
                                ? 'cursor-not-allowed border-neutral-200 bg-neutral-100 text-neutral-400'
                                : 'border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100'
                            }`}
                          >
                            Move Up
                          </button>
                        </form>

                        <form action={reorderWorkoutAction}>
                          <input
                            type="hidden"
                            name="workoutId"
                            value={workout.id}
                          />
                          <input
                            type="hidden"
                            name="programId"
                            value={programId}
                          />
                          <input
                            type="hidden"
                            name="direction"
                            value="down"
                          />
                          <button
                            type="submit"
                            disabled={isLast}
                            className={`rounded-xl border px-3 py-2 text-xs font-medium transition ${
                              isLast
                                ? 'cursor-not-allowed border-neutral-200 bg-neutral-100 text-neutral-400'
                                : 'border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100'
                            }`}
                          >
                            Move Down
                          </button>
                        </form>

                        <form action={duplicateWorkoutAction}>
                          <input
                            type="hidden"
                            name="workoutId"
                            value={workout.id}
                          />
                          <input
                            type="hidden"
                            name="programId"
                            value={programId}
                          />
                          <button
                            type="submit"
                            className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs font-medium text-neutral-700 transition hover:bg-neutral-100"
                          >
                            Duplicate Day
                          </button>
                        </form>

                        <form action={deleteWorkout}>
                          <input
                            type="hidden"
                            name="workout_id"
                            value={workout.id}
                          />
                          <input
                            type="hidden"
                            name="program_id"
                            value={programId}
                          />
                          <button
                            type="submit"
                            className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 transition hover:bg-red-100"
                          >
                            Remove Workout
                          </button>
                        </form>

                        <form action={saveWorkoutAsTemplateAction}>
                          <input
                            type="hidden"
                            name="workoutId"
                            value={workout.id}
                          />
                          <input
                            type="hidden"
                            name="programId"
                            value={programId}
                          />
                          <button
                            type="submit"
                            className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs font-medium text-neutral-700 transition hover:bg-neutral-100"
                          >
                            Save as Template
                          </button>
                        </form>

                        <Link
                          href={`/training/workouts/${workout.id}/edit`}
                          className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs font-medium text-neutral-700 transition hover:bg-neutral-100"
                        >
                          Open Workout
                        </Link>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 px-6 py-5">
                    <form
                      action={updateWorkoutMetaAction}
                      className="grid gap-3 lg:grid-cols-[1.2fr,1.8fr,auto]"
                    >
                      <input
                        type="hidden"
                        name="workoutId"
                        value={workout.id}
                      />
                      <input
                        type="hidden"
                        name="programId"
                        value={programId}
                      />

                      <div>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-neutral-500">
                          Title
                        </label>
                        <input
                          type="text"
                          name="title"
                          defaultValue={workout.title ?? ''}
                          className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition focus:border-neutral-500"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-neutral-500">
                          Description
                        </label>
                        <input
                          type="text"
                          name="description"
                          defaultValue={workout.description ?? ''}
                          className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition focus:border-neutral-500"
                        />
                      </div>

                      <div className="flex items-end">
                        <button
                          type="submit"
                          className="w-full rounded-xl bg-neutral-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800"
                        >
                          Save Day Meta
                        </button>
                      </div>
                    </form>

                    <div className="grid gap-4 lg:grid-cols-2">
                      <form
                        action={addExerciseToWorkoutAction}
                        className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4"
                      >
                        <input
                          type="hidden"
                          name="workoutId"
                          value={workout.id}
                        />
                        <input
                          type="hidden"
                          name="programId"
                          value={programId}
                        />

                        <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                          Exercise Library
                        </div>
                        <h3 className="mt-1 text-lg font-bold text-neutral-950">
                          Add exercise to this day
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-neutral-600">
                          Select any exercise from the master library and attach
                          it to this workout.
                        </p>

                        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
                          <div className="min-w-0 flex-1">
                            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-neutral-500">
                              Exercise
                            </label>
                            <select
                              name="exerciseId"
                              className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition focus:border-neutral-500"
                              defaultValue=""
                            >
                              <option value="" disabled>
                                Select exercise
                              </option>
                              {exerciseLibrary.map((exercise: any) => (
                                <option key={exercise.id} value={exercise.id}>
                                  {exercise.name}
                                  {exercise.category
                                    ? ` (${exercise.category})`
                                    : ''}
                                </option>
                              ))}
                            </select>
                          </div>

                          <button
                            type="submit"
                            className="rounded-xl bg-neutral-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800"
                          >
                            Add Exercise
                          </button>
                        </div>
                      </form>

                      <form
                        action={addRecentExerciseToWorkoutAction}
                        className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4"
                      >
                        <input
                          type="hidden"
                          name="workoutId"
                          value={workout.id}
                        />
                        <input
                          type="hidden"
                          name="programId"
                          value={programId}
                        />

                        <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                          Recent Usage
                        </div>
                        <h3 className="mt-1 text-lg font-bold text-neutral-950">
                          Reuse a recent exercise
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-neutral-600">
                          Quickly insert from the most recently used exercises
                          across your program builds.
                        </p>

                        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
                          <div className="min-w-0 flex-1">
                            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-neutral-500">
                              Recent Exercise
                            </label>
                            <select
                              name="exerciseId"
                              className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition focus:border-neutral-500"
                              defaultValue=""
                            >
                              <option value="" disabled>
                                Select recent exercise
                              </option>
                              {recentExercises.map((exercise: any) => (
                                <option key={exercise.id} value={exercise.id}>
                                  {exercise.name}
                                  {exercise.category
                                    ? ` (${exercise.category})`
                                    : ''}
                                </option>
                              ))}
                            </select>
                          </div>

                          <button
                            type="submit"
                            className="rounded-xl bg-neutral-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800"
                          >
                            Insert Recent
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}