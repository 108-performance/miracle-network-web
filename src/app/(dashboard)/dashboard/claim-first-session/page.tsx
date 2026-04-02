import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

type ClaimFirstSessionPageProps = {
  searchParams: Promise<{
    workoutId?: string;
  }>;
};

type PendingSessionPayload = {
  workoutId: string;
  workoutTitle?: string;
  exercises: {
    workoutExerciseId: string;
    exerciseId: string;
    metricType: string | null;
    reps?: string;
    timeSeconds?: string;
    score?: string;
    exitVelocity?: string;
  }[];
};

export const dynamic = 'force-dynamic';

const PENDING_SESSION_COOKIE = 'mn_pending_session';

function toNumberOrNull(value?: string) {
  if (!value || value.trim() === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parsePendingSessionCookie(
  rawValue: string | undefined
): PendingSessionPayload | null {
  if (!rawValue) return null;

  try {
    const decoded = decodeURIComponent(rawValue);
    const parsed = JSON.parse(decoded) as PendingSessionPayload;

    if (!parsed?.workoutId || !Array.isArray(parsed.exercises)) {
      return null;
    }

    return parsed;
  } catch (error) {
    console.error('CLAIM FIRST SESSION cookie parse error', error);
    return null;
  }
}

export default async function ClaimFirstSessionPage({
  searchParams,
}: ClaimFirstSessionPageProps) {
  const resolvedSearchParams = await searchParams;
  const workoutId = resolvedSearchParams?.workoutId?.trim();

  if (!workoutId) {
    redirect('/dashboard');
  }

  const cookieStore = await cookies();
  const pendingCookie = cookieStore.get(PENDING_SESSION_COOKIE)?.value;
  const pendingSession = parsePendingSessionCookie(pendingCookie);

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(
      `/login?next=/dashboard/claim-first-session?workoutId=${encodeURIComponent(
        workoutId
      )}`
    );
  }

  let athleteId: string | null = null;

  const { data: existingAthlete } = await supabase
    .from('athletes')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (existingAthlete?.id) {
    athleteId = existingAthlete.id;
  } else {
    const { data: createdAthlete, error: athleteInsertError } = await supabase
      .from('athletes')
      .insert({
        user_id: user.id,
      })
      .select('id')
      .maybeSingle();

    if (athleteInsertError) {
      console.error('CLAIM FIRST SESSION athlete insert error', athleteInsertError);
      redirect('/dashboard');
    }

    athleteId = createdAthlete?.id ?? null;
  }

  if (!athleteId) {
    redirect('/dashboard');
  }

  const { data: existingWorkoutLog } = await supabase
    .from('workout_logs')
    .select('id')
    .eq('athlete_id', athleteId)
    .eq('workout_id', workoutId)
    .not('completed_at', 'is', null)
    .limit(1)
    .maybeSingle();

  let workoutLogId = existingWorkoutLog?.id ?? null;

  if (!workoutLogId) {
    const now = new Date().toISOString();

    const { data: insertedWorkoutLog, error: workoutLogInsertError } = await supabase
      .from('workout_logs')
      .insert({
        athlete_id: athleteId,
        workout_id: workoutId,
        completed_at: now,
      })
      .select('id')
      .maybeSingle();

    if (workoutLogInsertError) {
      console.error(
        'CLAIM FIRST SESSION workout log insert error',
        workoutLogInsertError
      );
      cookieStore.delete(PENDING_SESSION_COOKIE);
      redirect('/dashboard');
    }

    workoutLogId = insertedWorkoutLog?.id ?? null;
  }

  if (
    workoutLogId &&
    pendingSession &&
    pendingSession.workoutId === workoutId &&
    pendingSession.exercises.length > 0
  ) {
    const rowsToInsert = pendingSession.exercises
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
          athlete_id: athleteId,
          workout_log_id: workoutLogId,
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
        console.error(
          'CLAIM FIRST SESSION exercise logs insert error',
          exerciseLogsError
        );
      }
    }
  }

  cookieStore.delete(PENDING_SESSION_COOKIE);
  redirect('/dashboard');
}