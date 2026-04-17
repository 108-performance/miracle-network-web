import { createClient } from '@/lib/supabase/server';

type CompletedLogRow = {
  completed_at: string;
  workout_id: string | null;
};

type ChallengeWorkoutRow = {
  id: string;
  title: string | null;
  day_order: number | null;
  training_program_id: string | null;
};

type TrainSessionRow = {
  id: string;
  title: string | null;
  session_order: number;
  phase_key: 'foundational' | 'engine_build' | 'ball_strike' | 'adaptability';
  phase_label: string;
  training_program_id: string | null;
  estimated_minutes: number | null;
};

type ExerciseLogRow = {
  athlete_id?: string;
  exercise_id?: string | null;
  exercise_name?: string | null;
  actual_reps?: number | null;
  actual_time_seconds?: number | null;
  actual_score?: number | null;
  actual_exit_velocity?: number | null;
  completed: boolean | null;
  created_at: string;
};

type ExerciseVariantRow = {
  id: string;
  movement_id: string | null;
  name: string | null;
};

type MovementRow = {
  id: string;
  name: string | null;
};

type ProgramRow = {
  id: string;
  title: string | null;
  app_lane: 'train' | 'compete' | 'workout' | null;
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

function getLinkedProgram(
  trainingPrograms:
    | WorkoutWithProgramRow['training_programs']
    | undefined
    | null
): ProgramRow | null {
  if (!trainingPrograms) return null;
  if (Array.isArray(trainingPrograms)) return (trainingPrograms[0] as ProgramRow) ?? null;
  return trainingPrograms as ProgramRow;
}

function getPhaseByIndex(index: number) {
  const bucket = Math.floor(index / 24);
  return PHASES[Math.min(bucket, PHASES.length - 1)];
}

export async function getDashboardData(userId: string) {
  const supabase = await createClient();

  const { data: athlete } = await supabase
    .from('athletes')
    .select('id, first_name, last_name')
    .eq('user_id', userId)
    .maybeSingle();

  const athleteId = athlete?.id ?? '00000000-0000-0000-0000-000000000000';

  const athleteName = athlete
    ? `${athlete.first_name ?? ''} ${athlete.last_name ?? ''}`.trim()
    : 'Athlete';

  const { data: latestScore, error: latestScoreError } = await supabase
    .from('challenge_scores')
    .select('score, level, recorded_at')
    .eq('athlete_id', athleteId)
    .order('recorded_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestScoreError) {
    console.error('DASHBOARD latestScoreError', latestScoreError);
  }

  const { data: completedLogs, error: completedLogsError } = await supabase
    .from('workout_logs')
    .select('completed_at, workout_id')
    .eq('athlete_id', athleteId)
    .not('completed_at', 'is', null)
    .order('completed_at', { ascending: false });

  if (completedLogsError) {
    console.error('DASHBOARD completedLogsError', completedLogsError);
  }

  const { data: competePrograms, error: competeProgramsError } = await supabase
    .from('training_programs')
    .select('id, title, app_lane, sort_order')
    .eq('app_lane', 'compete')
    .eq('is_active', true)
    .order('sort_order', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true });

  if (competeProgramsError) {
    console.error('DASHBOARD competeProgramsError', competeProgramsError);
  }

  const competeProgramIds = (competePrograms ?? []).map((program) => program.id);

  let challengeWorkouts: ChallengeWorkoutRow[] = [];

  if (competeProgramIds.length > 0) {
    const { data: competeWorkouts, error: competeWorkoutsError } = await supabase
      .from('workouts')
      .select('id, title, day_order, training_program_id')
      .in('training_program_id', competeProgramIds)
      .order('training_program_id', { ascending: true })
      .order('day_order', { ascending: true });

    if (competeWorkoutsError) {
      console.error('DASHBOARD competeWorkoutsError', competeWorkoutsError);
    }

    challengeWorkouts = (competeWorkouts ?? []) as ChallengeWorkoutRow[];
  }

  const { data: trainPrograms, error: trainProgramsError } = await supabase
    .from('training_programs')
    .select('id, title, app_lane, sort_order')
    .eq('app_lane', 'train')
    .eq('is_active', true)
    .order('sort_order', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true });

  if (trainProgramsError) {
    console.error('DASHBOARD trainProgramsError', trainProgramsError);
  }

  const trainProgramIds = (trainPrograms ?? []).map((program) => program.id);

  let trainSessions: TrainSessionRow[] = [];

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
      console.error('DASHBOARD trainWorkoutsError', trainWorkoutsError);
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

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  const { data: weeklyExerciseLogs, error: weeklyExerciseLogsError } =
    await supabase
      .from('exercise_logs')
      .select(
        `
        athlete_id,
        exercise_id,
        actual_reps,
        actual_time_seconds,
        actual_score,
        actual_exit_velocity,
        completed,
        created_at,
        exercises:exercise_id (
          id,
          name
        )
      `
      )
      .eq('athlete_id', athleteId)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false });

  if (weeklyExerciseLogsError) {
    console.error('DASHBOARD weeklyExerciseLogsError', weeklyExerciseLogsError);
  }

  const { data: exerciseVariants, error: exerciseVariantsError } = await supabase
    .from('exercise_variants')
    .select('id, movement_id, name');

  if (exerciseVariantsError) {
    console.error('DASHBOARD exerciseVariantsError', exerciseVariantsError);
  }

  const { data: movements, error: movementsError } = await supabase
    .from('movements')
    .select('id, name');

  if (movementsError) {
    console.error('DASHBOARD movementsError', movementsError);
  }

  const { data: quickIntros, error: quickIntrosError } = await supabase
    .from('content_posts')
    .select('title, external_url, system_key, audience')
    .eq('intel_type', 'quick_action_intro')
    .eq('status', 'published')
    .in('audience', ['athletes', 'both']);

  if (quickIntrosError) {
    console.error('DASHBOARD quickIntrosError', quickIntrosError);
  }

  const { data: supportContentCandidates, error: supportContentError } = await supabase
    .from('content_posts')
    .select(
      `
      id,
      title,
      description,
      short_text,
      content_type,
      intel_type,
      system_key,
      training_program_id,
      workout_id,
      external_url,
      file_url,
      is_primary
    `
    )
    .eq('status', 'published')
    .in('audience', ['athletes', 'both'])
    .not('external_url', 'is', null);

  if (supportContentError) {
    console.error('DASHBOARD supportContentError', supportContentError);
  }

  const normalizedCompletedLogs = (completedLogs ?? []) as CompletedLogRow[];
  const exerciseVariantRows = (exerciseVariants ?? []) as ExerciseVariantRow[];
  const movementRows = (movements ?? []) as MovementRow[];

  const weeklyExerciseLogRows: ExerciseLogRow[] = (weeklyExerciseLogs ?? []).map(
    (row: any) => ({
      athlete_id: row.athlete_id,
      exercise_id: row.exercise_id,
      exercise_name: Array.isArray(row.exercises)
        ? row.exercises[0]?.name ?? null
        : row.exercises?.name ?? null,
      actual_reps: row.actual_reps,
      actual_time_seconds: row.actual_time_seconds,
      actual_score: row.actual_score,
      actual_exit_velocity: row.actual_exit_velocity,
      completed: row.completed,
      created_at: row.created_at,
    })
  );

  let latestWorkoutTitle = 'Train Session';

  const latestWorkoutLog =
    normalizedCompletedLogs.length > 0
      ? {
          completed_at: normalizedCompletedLogs[0].completed_at,
          workout_id: normalizedCompletedLogs[0].workout_id,
        }
      : null;

  if (latestWorkoutLog?.workout_id) {
    const matchingTrainWorkout = trainSessions.find(
      (workout) => workout.id === latestWorkoutLog.workout_id
    );

    if (matchingTrainWorkout?.title) {
      latestWorkoutTitle = matchingTrainWorkout.title;
    } else {
      const matchingChallengeWorkout = challengeWorkouts.find(
        (workout) => workout.id === latestWorkoutLog.workout_id
      );

      if (matchingChallengeWorkout?.title) {
        latestWorkoutTitle = matchingChallengeWorkout.title;
      } else {
        const { data: workoutRow, error: workoutTitleError } = await supabase
          .from('workouts')
          .select('id, title')
          .eq('id', latestWorkoutLog.workout_id)
          .maybeSingle();

        if (workoutTitleError) {
          console.error('DASHBOARD workoutTitleError', workoutTitleError);
        }

        if (workoutRow?.title) {
          latestWorkoutTitle = workoutRow.title;
        }
      }
    }
  }

  return {
    athleteName,
    latestScore: latestScore?.score ?? null,
    completedLogs: normalizedCompletedLogs,
    trainSessions,
    challengeWorkouts,
    weeklyExerciseLogs: weeklyExerciseLogRows,
    exerciseVariants: exerciseVariantRows,
    movements: movementRows,
    quickIntros: quickIntros ?? [],
    supportContentCandidates: supportContentCandidates ?? [],
    latestWorkoutTitle,
  };
}