import { createClient } from '@/lib/supabase/server';

const CHALLENGE_PROGRAM_ID = 'ad7376ba-9746-4c1b-b11d-d7ba245add79';

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

  const { data: challengeWorkouts, error: challengeWorkoutsError } =
    await supabase
      .from('workouts')
      .select('id, title, day_order, training_program_id')
      .eq('training_program_id', CHALLENGE_PROGRAM_ID)
      .order('day_order', { ascending: true });

  if (challengeWorkoutsError) {
    console.error('DASHBOARD challengeWorkoutsError', challengeWorkoutsError);
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
  const challengeWorkoutRows = (challengeWorkouts ?? []) as ChallengeWorkoutRow[];
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

  let latestWorkoutTitle = '108 Athlete Challenge Session';

  const latestWorkoutLog =
    normalizedCompletedLogs.length > 0
      ? {
          completed_at: normalizedCompletedLogs[0].completed_at,
          workout_id: normalizedCompletedLogs[0].workout_id,
        }
      : null;

  if (latestWorkoutLog?.workout_id) {
    const matchingChallengeWorkout = challengeWorkoutRows.find(
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

  return {
    athleteName,
    latestScore: latestScore?.score ?? null,
    completedLogs: normalizedCompletedLogs,
    challengeWorkouts: challengeWorkoutRows,
    weeklyExerciseLogs: weeklyExerciseLogRows,
    exerciseVariants: exerciseVariantRows,
    movements: movementRows,
    quickIntros: quickIntros ?? [],
    supportContentCandidates: supportContentCandidates ?? [],
    latestWorkoutTitle,
  };
}