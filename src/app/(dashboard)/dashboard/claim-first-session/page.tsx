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

function dedupeExerciseRows<
  T extends {
    workout_exercise_id: string;
  },
>(rows: T[]) {
  const seen = new Set<string>();
  const deduped: T[] = [];

  for (const row of rows) {
    if (seen.has(row.workout_exercise_id)) continue;
    seen.add(row.workout_exercise_id);
    deduped.push(row);
  }

  return deduped;
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

  let user = null;

  try {
    const {
      data: { user: authUser },
      error,
    } = await supabase.auth.getUser();

    if (!error) {
      user = authUser;
    }
  } catch {
    user = null;
  }

  if (!user) {
    redirect(
      `/login?next=/dashboard/claim-first-session?workoutId=${encodeURIComponent(
        workoutId
      )}`
    );
  }

  let appUser: { id: string } | null = null;

  const { data: existingUserById } = await supabase
    .from('users')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();

  if (existingUserById) {
    appUser = existingUserById;
  } else {
    const { data: existingUserByEmail } = await supabase
      .from('users')
      .select('id')
      .eq('email', user.email ?? '')
      .maybeSingle();

    if (existingUserByEmail) {
      appUser = existingUserByEmail;
    } else {
      const { data: createdUser, error: createUserError } = await supabase
        .from('users')
        .insert({
          id: user.id,
          email: user.email,
        })
        .select('id')
        .single();

      if (createUserError || !createdUser) {
        console.error('CLAIM FIRST SESSION users create error', createUserError);
        redirect('/dashboard');
      }

      appUser = createdUser;
    }
  }

  let athleteId: string | null = null;

  const { data: existingAthlete } = await supabase
    .from('athletes')
    .select('id')
    .eq('user_id', appUser.id)
    .maybeSingle();

  if (existingAthlete?.id) {
    athleteId = existingAthlete.id;
  } else {
    const { data: createdAthlete } = await supabase
      .from('athletes')
      .insert({
        user_id: appUser.id,
      })
      .select('id')
      .maybeSingle();

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
    const { data: insertedWorkoutLog } = await supabase
      .from('workout_logs')
      .insert({
        athlete_id: athleteId,
        workout_id: workoutId,
        completed_at: new Date().toISOString(),
      })
      .select('id')
      .maybeSingle();

    workoutLogId = insertedWorkoutLog?.id ?? null;
  }

  if (
    workoutLogId &&
    pendingSession &&
    pendingSession.workoutId === workoutId
  ) {
    const rawRows = pendingSession.exercises
      .map((item) => {
        const actual_reps = toNumberOrNull(item.reps);
        const actual_time_seconds = toNumberOrNull(item.timeSeconds);
        const actual_score = toNumberOrNull(item.score);
        const actual_exit_velocity = toNumberOrNull(item.exitVelocity);

        if (
          actual_reps === null &&
          actual_time_seconds === null &&
          actual_score === null &&
          actual_exit_velocity === null
        ) {
          return null;
        }

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
      .filter(Boolean) as any[];

    const rowsToInsert = dedupeExerciseRows(rawRows);

    if (rowsToInsert.length > 0) {
      await supabase.from('exercise_logs').upsert(rowsToInsert, {
        onConflict: 'workout_log_id,workout_exercise_id',
      });
    }
  }

  // ✅ CORRECT COOKIE CLEAR (via route handler)
  await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/clear-pending-session`, {
    method: 'POST',
    cache: 'no-store',
  });

  redirect('/dashboard');
}