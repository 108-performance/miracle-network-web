import Link from 'next/link';
import { notFound } from 'next/navigation';
import { buildRecommendationState } from '@/core/protected/recommendation/buildRecommendationState';
import type { CompletedLogRow } from '@/core/protected/recommendation/types';
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

  if (today !== null && best !== null && today === best && today > 0) {
    return 'You matched your best performance';
  }

  if (today !== null && last !== null && today > last) {
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

  const { data: competePrograms, error: competeProgramsError } = await supabase
    .from('training_programs')
    .select('id, title, app_lane, sort_order')
    .eq('app_lane', 'compete')
    .eq('is_active', true)
    .order('sort_order', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true });

  if (competeProgramsError) {
    notFound();
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
      notFound();
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
    notFound();
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
      notFound();
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

    trainSessions = sortedTrainWorkouts.map((workoutRow, index) => {
      const phase = getPhaseByIndex(index);

      return {
        id: workoutRow.id,
        title: workoutRow.title,
        session_order: index + 1,
        phase_key: phase.key,
        phase_label: phase.label,
        training_program_id: workoutRow.training_program_id,
        estimated_minutes: null,
      };
    });
  }

  const completedLogs = (completedWorkoutLogs ?? []) as CompletedLogRow[];

  const currentProgram = (trainPrograms ?? [])
    .concat(competePrograms ?? [])
    .find((program) => program.id === workout.training_program_id);

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
    currentWorkoutId: workout.id,
    currentWorkoutTitle: workout.title ?? 'Workout',
    currentWorkoutDayOrder: workout.day_order ?? null,
    currentPathType,
  });

  const {
    data: currentSessionExerciseLogs,
    error: currentSessionExerciseLogsError,
  } = await supabase
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
      const { data: workoutExercise, error: workoutExerciseError } =
        await supabase
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
          ...previousRows.map((row) => extractMetricValue(row, metricType)),
        ].filter((value): value is number => value != null);

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

  const isTrainCompletion = currentPathType === 'train';
  const isCompeteCompletion = currentPathType === 'challenge';

  const headline = isTrainCompletion
    ? 'Nice work. Your path keeps moving.'
    : isCompeteCompletion
      ? 'Nice work. Challenge complete.'
      : recommendation.messaging.headline || 'Session complete.';

  const supportLabel = isTrainCompletion
    ? recommendation.nextBestSession.nextSession.phaseLabel
      ? `${recommendation.nextBestSession.nextSession.phaseLabel} is ready next.`
      : 'Your next Train session is ready.'
    : isCompeteCompletion
      ? 'Head back to Compete when you are ready for the next challenge.'
      : recommendation.messaging.supportLabel || '';

  const nextUpHeadline = isCompeteCompletion
    ? 'Back to 108 Athlete Challenge'
    : recommendation.nextBestSession.nextSession.title || '';

  const nextUpSubtext = isCompeteCompletion
    ? 'Stay inside the Compete lane and keep your momentum rolling.'
    : recommendation.messaging.subtext || '';

  const primaryLabel = isTrainCompletion
    ? 'Continue Train'
    : isCompeteCompletion
      ? 'Back to Compete'
      : recommendation.nextBestSession.primaryCta.label || 'Continue';

  const primaryHref = isTrainCompletion &&
    recommendation.nextBestSession.nextSession.workoutId
      ? `/dashboard/training/${recommendation.nextBestSession.nextSession.workoutId}/run`
      : isCompeteCompletion
        ? '/dashboard/compete/108-athlete-challenge'
        : recommendation.nextBestSession.primaryCta.href || '/dashboard';

  const secondaryLabel = isTrainCompletion
    ? 'Back to Dashboard'
    : isCompeteCompletion
      ? 'Back to Dashboard'
      : recommendation.nextBestSession.secondaryCta.label || '';

  const secondaryHref = isTrainCompletion || isCompeteCompletion
    ? '/dashboard'
    : recommendation.nextBestSession.secondaryCta.href || '';

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

          <p className="mt-3 text-sm text-white/65">{title}</p>

          {supportLabel ? (
            <p className="mt-2 text-sm text-white/55">{supportLabel}</p>
          ) : null}
        </div>

        <section className="mb-4 grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-wide text-white/45">
              Today
            </p>
            <p className="mt-2 text-2xl font-semibold">
              {displayValue(summary.today)}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-wide text-white/45">
              Best
            </p>
            <p className="mt-2 text-2xl font-semibold">
              {displayValue(summary.best)}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-wide text-white/45">
              Last
            </p>
            <p className="mt-2 text-2xl font-semibold">
              {displayValue(summary.last)}
            </p>
          </div>
        </section>

        <section className="mb-4 rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs uppercase tracking-wide text-white/45">
            Progress
          </p>
          <p className="mt-2 text-lg font-medium">{progressMessage}</p>
        </section>

        <section className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs uppercase tracking-wide text-white/45">
            Momentum
          </p>
          <p className="mt-2 text-lg font-medium">{momentumHeadline}</p>
          <p className="mt-1 text-sm text-white/65">{momentumSubtext}</p>
        </section>

        {nextUpHeadline || nextUpSubtext ? (
          <section className="mb-8 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs uppercase tracking-wide text-white/45">
              Next Up
            </p>
            {nextUpHeadline ? (
              <p className="mt-2 text-base text-white/85">{nextUpHeadline}</p>
            ) : null}
            {nextUpSubtext ? (
              <p className="mt-1 text-sm text-white/60">{nextUpSubtext}</p>
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