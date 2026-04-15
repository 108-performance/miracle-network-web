import Link from 'next/link';
import { notFound } from 'next/navigation';
import { buildRecommendationState } from '@/core/protected/recommendation/buildRecommendationState';
import type {
  ChallengeWorkoutRow,
  CompletedLogRow,
  ContinuationPathType,
} from '@/core/protected/recommendation/types';
import { createClient } from '@/lib/supabase/server';

type SearchParams = {
  workoutLogId?: string;
};

type SessionMetricSummary = {
  today: number | null;
  best: number | null;
  last: number | null;
  change: number | null;
};

const CHALLENGE_PROGRAM_ID = 'ad7376ba-9746-4c1b-b11d-d7ba245add79';

function displayValue(value: number | null | undefined, fallback = '--') {
  if (value == null || Number.isNaN(value)) {
    return fallback;
  }

  return String(value);
}

function getProgressMessage(
  change: number | null,
  today: number | null,
  last: number | null,
  best: number | null
) {
  if (change !== null && change > 0) {
    return `Up ${change} from last session`;
  }

  if (
    today !== null &&
    best !== null &&
    today === best &&
    today > 0
  ) {
    return 'You matched your best performance';
  }

  if (
    today !== null &&
    last !== null &&
    today > last
  ) {
    return 'Trending up from your last session';
  }

  if (today !== null) {
    return 'You showed up and put in work today';
  }

  return 'Session complete';
}

function getMomentumHeadline(streak: number, week: number) {
  if (streak > 1) {
    return `${streak} days in a row`;
  }

  if (week > 1) {
    return `${week} sessions this week`;
  }

  if (streak === 1) {
    return 'You trained again today';
  }

  return 'First session complete';
}

function getMomentumSubtext(streak: number, week: number) {
  if (streak > 1 && week > 1) {
    return `${week} sessions this week`;
  }

  if (streak > 1) {
    return 'Momentum is building';
  }

  if (week > 1) {
    return 'Good week. Keep it going.';
  }

  if (streak === 1) {
    return 'Come back tomorrow to keep the streak alive';
  }

  return 'Come back tomorrow and build momentum';
}

function extractMetricValue(
  row: {
    actual_reps: number | null;
    actual_time_seconds: number | null;
    actual_score: number | null;
    actual_exit_velocity: number | null;
  },
  metricType?: string | null
) {
  if (metricType === 'time') return row.actual_time_seconds ?? null;
  if (metricType === 'score') return row.actual_score ?? null;
  if (metricType === 'exit_velocity') return row.actual_exit_velocity ?? null;
  if (metricType === 'mixed') {
    return (
      row.actual_score ??
      row.actual_exit_velocity ??
      row.actual_reps ??
      row.actual_time_seconds ??
      null
    );
  }

  return row.actual_reps ?? null;
}

export default async function SessionCompletePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const workoutLogId = params.workoutLogId;

  if (!workoutLogId) {
    notFound();
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    notFound();
  }

  const { data: athlete, error: athleteError } = await supabase
    .from('athletes')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (athleteError || !athlete) {
    notFound();
  }

  const { data: workoutLog, error: workoutLogError } = await supabase
    .from('workout_logs')
    .select('id, athlete_id, workout_id, completed_at')
    .eq('id', workoutLogId)
    .eq('athlete_id', athlete.id)
    .maybeSingle();

  if (workoutLogError || !workoutLog) {
    notFound();
  }

  const { data: workout, error: workoutError } = await supabase
    .from('workouts')
    .select('id, title, day_order, training_program_id')
    .eq('id', workoutLog.workout_id)
    .maybeSingle();

  if (workoutError || !workout) {
    notFound();
  }

  const { data: completedWorkoutLogs, error: completedWorkoutLogsError } =
    await supabase
      .from('workout_logs')
      .select('completed_at, workout_id')
      .eq('athlete_id', athlete.id)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false });

  if (completedWorkoutLogsError) {
    notFound();
  }

  const { data: challengeWorkoutRows, error: challengeWorkoutRowsError } =
    await supabase
      .from('workouts')
      .select('id, title, day_order')
      .eq('training_program_id', CHALLENGE_PROGRAM_ID)
      .order('day_order', { ascending: true });

  if (challengeWorkoutRowsError) {
    notFound();
  }

  const completedLogs = (completedWorkoutLogs ?? []) as CompletedLogRow[];
  const challengeWorkouts = (challengeWorkoutRows ?? []) as ChallengeWorkoutRow[];

  const currentPathType: ContinuationPathType =
    workout.training_program_id === CHALLENGE_PROGRAM_ID
      ? 'challenge'
      : 'workout';

  const recommendation = buildRecommendationState({
    completedLogs,
    challengeWorkouts,
    currentWorkoutId: workout.id,
    currentWorkoutTitle: workout.title ?? 'Workout',
    currentWorkoutDayOrder: workout.day_order ?? null,
    currentPathType,
  });

  const { data: currentSessionExerciseLogs, error: currentSessionExerciseLogsError } =
    await supabase
      .from('exercise_logs')
      .select(
        'exercise_id, actual_reps, actual_time_seconds, actual_score, actual_exit_velocity'
      )
      .eq('athlete_id', athlete.id)
      .eq('workout_log_id', workoutLog.id);

  if (currentSessionExerciseLogsError) {
    notFound();
  }

  const currentRows = currentSessionExerciseLogs ?? [];

  let summary: SessionMetricSummary = {
    today: null,
    best: null,
    last: null,
    change: null,
  };

  if (currentRows.length > 0) {
    const anchorRow = currentRows.find(
      (row) =>
        row.actual_reps != null ||
        row.actual_time_seconds != null ||
        row.actual_score != null ||
        row.actual_exit_velocity != null
    );

    if (anchorRow) {
      const { data: workoutExercise, error: workoutExerciseError } = await supabase
        .from('workout_exercises')
        .select('exercise_id, metric_type')
        .eq('workout_id', workout.id)
        .eq('exercise_id', anchorRow.exercise_id)
        .maybeSingle();

      if (!workoutExerciseError && workoutExercise) {
        const metricType = workoutExercise.metric_type ?? 'reps';
        const todayValue = extractMetricValue(anchorRow, metricType);

        const { data: previousLogs } = await supabase
          .from('exercise_logs')
          .select(
            'actual_reps, actual_time_seconds, actual_score, actual_exit_velocity, created_at, workout_log_id'
          )
          .eq('athlete_id', athlete.id)
          .eq('exercise_id', anchorRow.exercise_id)
          .neq('workout_log_id', workoutLog.id)
          .order('created_at', { ascending: false });

        const previousRows = previousLogs ?? [];

        const lastComparable = previousRows.find((row) => {
          const value = extractMetricValue(row, metricType);
          return value != null;
        });

        const comparableValues = [
          todayValue,
          ...previousRows
            .map((row) => extractMetricValue(row, metricType))
            .filter((value): value is number => value != null),
        ];

        const bestValue =
          comparableValues.length > 0
            ? metricType === 'time'
              ? Math.min(...comparableValues)
              : Math.max(...comparableValues)
            : null;

        const lastValue =
          lastComparable != null
            ? extractMetricValue(lastComparable, metricType)
            : null;

        const changeValue =
          todayValue != null && lastValue != null
            ? todayValue - lastValue
            : null;

        summary = {
          today: todayValue,
          best: bestValue,
          last: lastValue,
          change: changeValue,
        };
      }
    }
  }

  const title = workout.title || 'Workout Session';
  const progressMessage = getProgressMessage(
    summary.change,
    summary.today,
    summary.last,
    summary.best
  );
  const momentumHeadline = getMomentumHeadline(
    recommendation.continuation.streakCount,
    recommendation.continuation.sessionsThisWeek
  );
  const momentumSubtext = getMomentumSubtext(
    recommendation.continuation.streakCount,
    recommendation.continuation.sessionsThisWeek
  );

  const headline = recommendation.messaging.headline || 'Session complete.';
  const supportLabel = recommendation.messaging.supportLabel || '';
  const nextUpHeadline = recommendation.nextBestSession.nextSession.title || '';
  const nextUpSubtext = recommendation.messaging.subtext || '';
  const primaryLabel =
    recommendation.nextBestSession.primaryCta.label || 'Continue';
  const primaryHref =
    recommendation.nextBestSession.primaryCta.href || '/dashboard';
  const secondaryLabel =
    recommendation.nextBestSession.secondaryCta.label || '';
  const secondaryHref =
    recommendation.nextBestSession.secondaryCta.href || '';

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 pb-10 pt-8">
        <div className="mb-8">
          <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full border border-white/15 bg-white/10 text-2xl">
            ✓
          </div>

          <p className="mb-2 text-sm uppercase tracking-[0.2em] text-white/50">
            Session Complete
          </p>

          <h1 className="text-3xl font-semibold leading-tight">
            {headline}
          </h1>

          <p className="mt-3 text-sm text-white/65">
            {title}
          </p>

          {supportLabel ? (
            <p className="mt-2 text-sm text-white/55">
              {supportLabel}
            </p>
          ) : null}
        </div>

        <section className="mb-4 grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-wide text-white/45">Today</p>
            <p className="mt-2 text-2xl font-semibold">{displayValue(summary.today)}</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-wide text-white/45">Best</p>
            <p className="mt-2 text-2xl font-semibold">{displayValue(summary.best)}</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-wide text-white/45">Last</p>
            <p className="mt-2 text-2xl font-semibold">{displayValue(summary.last)}</p>
          </div>
        </section>

        <section className="mb-4 rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs uppercase tracking-wide text-white/45">
            Progress
          </p>
          <p className="mt-2 text-lg font-medium">
            {progressMessage}
          </p>
        </section>

        <section className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs uppercase tracking-wide text-white/45">
            Momentum
          </p>
          <p className="mt-2 text-lg font-medium">
            {momentumHeadline}
          </p>
          <p className="mt-1 text-sm text-white/65">
            {momentumSubtext}
          </p>
        </section>

        {(nextUpHeadline || nextUpSubtext) ? (
          <section className="mb-8 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs uppercase tracking-wide text-white/45">
              Next Up
            </p>
            {nextUpHeadline ? (
              <p className="mt-2 text-base text-white/85">
                {nextUpHeadline}
              </p>
            ) : null}
            {nextUpSubtext ? (
              <p className="mt-1 text-sm text-white/60">
                {nextUpSubtext}
              </p>
            ) : null}
          </section>
        ) : null}

        <div className="mt-auto flex flex-col gap-3">
          <Link
            href={primaryHref}
            className="flex h-14 items-center justify-center rounded-2xl bg-white px-5 text-base font-semibold text-black transition hover:opacity-90"
          >
            {primaryLabel}
          </Link>

          {secondaryLabel && secondaryHref ? (
            <Link
              href={secondaryHref}
              className="flex h-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-5 text-base font-medium text-white transition hover:bg-white/10"
            >
              {secondaryLabel}
            </Link>
          ) : null}
        </div>
      </div>
    </main>
  );
}