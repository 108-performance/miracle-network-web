'use server';

import { revalidatePath } from 'next/cache';
import { buildRecommendationState } from '@/core/protected/recommendation/buildRecommendationState';
import type { CompletedLogRow } from '@/core/protected/recommendation/types';
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

type TrainingProgramRow = {
  id: string;
  title: string | null;
  app_lane: 'train' | 'compete' | 'workout' | null;
  is_active: boolean | null;
  sort_order: number | null;
};

type WorkoutWithProgramRow = {
  id: string;
  title: string | null;
  day_order: number | null;
  training_program_id: string | null;
  training_programs:
    | {
        id: string;
        title: string | null;
        app_lane: 'train' | 'compete' | 'workout' | null;
        sort_order: number | null;
      }
    | {
        id: string;
        title: string | null;
        app_lane: 'train' | 'compete' | 'workout' | null;
        sort_order: number | null;
      }[]
    | null;
};

const PHASES = [
  { key: 'foundational', label: 'Foundational' },
  { key: 'engine_build', label: 'Engine Build' },
  { key: 'ball_strike', label: 'Ball Strike' },
  { key: 'adaptability', label: 'Adaptability' },
] as const;

function toNumberOrNull(value?: string) {
  if (!value || value.trim() === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function buildSessionCompleteRedirectUrl(workoutLogId: string) {
  return `/dashboard/session-complete?workoutLogId=${encodeURIComponent(workoutLogId)}`;
}

function getLinkedProgram(
  trainingPrograms:
    | WorkoutWithProgramRow['training_programs']
    | undefined
    | null
): TrainingProgramRow | null {
  if (!trainingPrograms) return null;
  if (Array.isArray(trainingPrograms)) return (trainingPrograms[0] as TrainingProgramRow) ?? null;
  return trainingPrograms as TrainingProgramRow;
}

function getPhaseByIndex(index: number) {
  const bucket = Math.floor(index / 24);
  return PHASES[Math.min(bucket, PHASES.length - 1)];
}

export async function saveWorkoutSessionAction(
  input: SaveWorkoutSessionInput
) {
  const supabase = await createClient();

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

  let appUser: { id: string } | null = null;

  const { data: existingUserById, error: existingUserByIdError } = await supabase
    .from('users')
    .select('id')
    .eq('id', authUser.id)
    .maybeSingle();

  if (existingUserByIdError) {
    console.error('users lookup by id error:', existingUserByIdError);
    throw new Error('Failed to load user record.');
  }

  if (existingUserById) {
    appUser = existingUserById;
  } else {
    const { data: existingUserByEmail, error: existingUserByEmailError } =
      await supabase
        .from('users')
        .select('id')
        .eq('email', authUser.email ?? '')
        .maybeSingle();

    if (existingUserByEmailError) {
      console.error('users lookup by email error:', existingUserByEmailError);
      throw new Error('Failed to load user record.');
    }

    if (existingUserByEmail) {
      appUser = existingUserByEmail;
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
  }

  let athlete: { id: string } | null = null;

  const { data: existingAthlete, error: existingAthleteError } = await supabase
    .from('athletes')
    .select('id')
    .eq('user_id', appUser.id)
    .maybeSingle();

  if (existingAthleteError) {
    console.error('athlete lookup error:', existingAthleteError);
    throw new Error('Failed to load athlete profile.');
  }

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

  const { data: currentWorkout, error: currentWorkoutError } = await supabase
    .from('workouts')
    .select('id, title, day_order, training_program_id')
    .eq('id', input.workoutId)
    .maybeSingle();

  if (currentWorkoutError || !currentWorkout) {
    console.error('current workout lookup error:', currentWorkoutError);
    throw new Error('Failed to load current workout.');
  }

  const completedAt = new Date().toISOString();

  const { data: workoutLog, error: workoutLogError } = await supabase
    .from('workout_logs')
    .insert({
      athlete_id: athlete.id,
      workout_id: input.workoutId,
      completed_at: completedAt,
    })
    .select('id')
    .single();

  if (workoutLogError || !workoutLog) {
    console.error('workout_logs error:', workoutLogError);
    throw new Error('Failed to save workout completion.');
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
      console.error('exercise_logs error:', exerciseLogsError);
      throw new Error('Failed to save exercise logs.');
    }
  }

  const { data: completedWorkoutLogs, error: completedWorkoutLogsError } =
    await supabase
      .from('workout_logs')
      .select('completed_at, workout_id')
      .eq('athlete_id', athlete.id)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false });

  if (completedWorkoutLogsError) {
    console.error('completed workout logs error:', completedWorkoutLogsError);
    throw new Error('Failed to load completed workout history.');
  }

  const { data: competePrograms, error: competeProgramsError } = await supabase
    .from('training_programs')
    .select('id, title, app_lane, sort_order')
    .eq('app_lane', 'compete')
    .eq('is_active', true)
    .order('sort_order', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true });

  if (competeProgramsError) {
    console.error('compete programs error:', competeProgramsError);
    throw new Error('Failed to load compete programs.');
  }

  const competeProgramIds = (competePrograms ?? []).map((program) => program.id);

  let challengeWorkouts: {
    id: string;
    title: string | null;
    day_order: number | null;
    training_program_id?: string | null;
  }[] = [];

  if (competeProgramIds.length > 0) {
    const { data: competeWorkouts, error: competeWorkoutsError } = await supabase
      .from('workouts')
      .select('id, title, day_order, training_program_id')
      .in('training_program_id', competeProgramIds)
      .order('training_program_id', { ascending: true })
      .order('day_order', { ascending: true });

    if (competeWorkoutsError) {
      console.error('compete workouts error:', competeWorkoutsError);
      throw new Error('Failed to load compete workouts.');
    }

    challengeWorkouts = competeWorkouts ?? [];
  }

  const { data: trainPrograms, error: trainProgramsError } = await supabase
    .from('training_programs')
    .select('id, title, app_lane, sort_order')
    .eq('app_lane', 'train')
    .eq('is_active', true)
    .order('sort_order', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true });

  if (trainProgramsError) {
    console.error('train programs error:', trainProgramsError);
    throw new Error('Failed to load train programs.');
  }

  const trainProgramIds = (trainPrograms ?? []).map((program) => program.id);

  let trainSessions: {
    id: string;
    title: string | null;
    session_order: number;
    phase_key: 'foundational' | 'engine_build' | 'ball_strike' | 'adaptability';
    phase_label: string;
    training_program_id: string | null;
    estimated_minutes: number | null;
  }[] = [];

  if (trainProgramIds.length > 0) {
    const { data: trainWorkouts, error: trainWorkoutsError } = await supabase
      .from('workouts')
      .select(
        `
        id,
        title,
        day_order,
        training_program_id,
        training_programs:training_program_id (
          id,
          title,
          app_lane,
          sort_order
        )
      `
      )
      .in('training_program_id', trainProgramIds)
      .order('training_program_id', { ascending: true })
      .order('day_order', { ascending: true });

    if (trainWorkoutsError) {
      console.error('train workouts error:', trainWorkoutsError);
      throw new Error('Failed to load train workouts.');
    }

    const sortedTrainWorkouts = ((trainWorkouts ?? []) as WorkoutWithProgramRow[]).sort(
      (a, b) => {
        const programA = getLinkedProgram(a.training_programs);
        const programB = getLinkedProgram(b.training_programs);

        const sortA = programA?.sort_order ?? Number.MAX_SAFE_INTEGER;
        const sortB = programB?.sort_order ?? Number.MAX_SAFE_INTEGER;

        if (sortA !== sortB) return sortA - sortB;

        const dayA = a.day_order ?? Number.MAX_SAFE_INTEGER;
        const dayB = b.day_order ?? Number.MAX_SAFE_INTEGER;

        return dayA - dayB;
      }
    );

    trainSessions = sortedTrainWorkouts.map((workout, index) => {
      const phase = getPhaseByIndex(index);

      return {
        id: workout.id,
        title: workout.title,
        session_order: index + 1,
        phase_key: phase.key,
        phase_label: phase.label,
        training_program_id: workout.training_program_id,
        estimated_minutes: null,
      };
    });
  }

  const completedLogs = (completedWorkoutLogs ?? []) as CompletedLogRow[];

  const currentProgram = (trainPrograms ?? [])
    .concat(competePrograms ?? [])
    .find((program) => program.id === currentWorkout.training_program_id);

  const currentPathType =
    currentProgram?.app_lane === 'train'
      ? 'train'
      : currentProgram?.app_lane === 'compete'
        ? 'challenge'
        : 'workout';

  const recommendation = buildRecommendationState({
    completedLogs,
    trainSessions,
    challengeWorkouts,
    currentWorkoutId: currentWorkout.id,
    currentWorkoutTitle: currentWorkout.title ?? input.workoutTitle,
    currentWorkoutDayOrder: currentWorkout.day_order ?? null,
    currentPathType,
  });

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/train');
  revalidatePath('/dashboard/training');
  revalidatePath('/dashboard/compete');
  revalidatePath('/dashboard/workout');
  revalidatePath(`/dashboard/workout/${input.elementSlug}/${input.levelSlug}`);
  revalidatePath(`/dashboard/training/${input.workoutId}/run`);
  revalidatePath('/dashboard/session-complete');

  return {
    success: true,
    savedExerciseLogs: rowsToInsert.length,
    workoutTitle: input.workoutTitle,
    workoutLogId: workoutLog.id,
    recommendation,
    redirectUrl: buildSessionCompleteRedirectUrl(workoutLog.id),
  };
}