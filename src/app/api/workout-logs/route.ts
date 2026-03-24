import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type ExercisePayload = {
  workoutExerciseId: string;
  exerciseId: string;
  completed: boolean;
  actualSets: number | null;
  actualReps: number | null;
  actualTimeSeconds: number | null;
  actualScore: number | null;
  actualExitVelocity: number | null;
  notes: string | null;
};

type MetricKey = 'reps' | 'time' | 'score' | 'exitVelocity' | null;

type ComparableExerciseLog = {
  id: string;
  created_at: string;
  actual_reps: number | null;
  actual_time_seconds: number | null;
  actual_score: number | null;
  actual_exit_velocity: number | null;
};

function getPrimaryMetric(payload: {
  actualReps: number | null;
  actualTimeSeconds: number | null;
  actualScore: number | null;
  actualExitVelocity: number | null;
}): { metric: MetricKey; value: number | null } {
  if (payload.actualReps != null) {
    return { metric: 'reps', value: payload.actualReps };
  }

  if (payload.actualTimeSeconds != null) {
    return { metric: 'time', value: payload.actualTimeSeconds };
  }

  if (payload.actualScore != null) {
    return { metric: 'score', value: payload.actualScore };
  }

  if (payload.actualExitVelocity != null) {
    return { metric: 'exitVelocity', value: payload.actualExitVelocity };
  }

  return { metric: null, value: null };
}

function getMetricValueFromLog(
  log: ComparableExerciseLog,
  metric: MetricKey
): number | null {
  if (!metric) return null;

  switch (metric) {
    case 'reps':
      return log.actual_reps;
    case 'time':
      return log.actual_time_seconds;
    case 'score':
      return log.actual_score;
    case 'exitVelocity':
      return log.actual_exit_velocity;
    default:
      return null;
  }
}

function getMetricLabel(metric: MetricKey): string | null {
  switch (metric) {
    case 'reps':
      return 'reps';
    case 'time':
      return 'time';
    case 'score':
      return 'score';
    case 'exitVelocity':
      return 'exitVelocity';
    default:
      return null;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      athleteId,
      workoutId,
      notes,
      exercises,
    }: {
      athleteId?: string;
      workoutId?: string;
      notes?: string | null;
      exercises?: ExercisePayload[];
    } = body;

    if (!athleteId || !workoutId) {
      return NextResponse.json(
        { error: 'Missing athleteId or workoutId' },
        { status: 400 }
      );
    }

    if (!Array.isArray(exercises) || exercises.length === 0) {
      return NextResponse.json(
        { error: 'At least one exercise entry is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data: workoutExerciseRows, error: workoutExercisesError } =
      await supabase
        .from('workout_exercises')
        .select('id, is_required, exercises(name)')
        .eq('workout_id', workoutId);

    if (workoutExercisesError || !workoutExerciseRows) {
      console.error(
        'Error loading workout exercises for completion logic:',
        workoutExercisesError
      );

      return NextResponse.json(
        {
          error:
            workoutExercisesError?.message ??
            'Failed to load workout exercises',
        },
        { status: 500 }
      );
    }

    const requiredWorkoutExerciseIds = workoutExerciseRows
      .filter((row) => row.is_required)
      .map((row) => row.id);

    const completedWorkoutExerciseIds = exercises
      .filter((exercise) => exercise.completed)
      .map((exercise) => exercise.workoutExerciseId);

    const allRequiredCompleted =
      requiredWorkoutExerciseIds.length > 0 &&
      requiredWorkoutExerciseIds.every((requiredId) =>
        completedWorkoutExerciseIds.includes(requiredId)
      );

    const workoutCompletedAt = allRequiredCompleted
      ? new Date().toISOString()
      : null;

    const summaryResultValue =
      exercises.find((exercise) => exercise.actualScore != null)?.actualScore ??
      exercises.find((exercise) => exercise.actualExitVelocity != null)
        ?.actualExitVelocity ??
      exercises.find((exercise) => exercise.actualReps != null)?.actualReps ??
      exercises.find((exercise) => exercise.actualTimeSeconds != null)
        ?.actualTimeSeconds ??
      null;

    const completedExercises = exercises.filter((exercise) => exercise.completed);

    const priorHistoryByExerciseId = new Map<string, ComparableExerciseLog[]>();

    for (const exercise of completedExercises) {
      const { data: priorLogs, error: priorLogsError } = await supabase
        .from('exercise_logs')
        .select(
          'id, created_at, actual_reps, actual_time_seconds, actual_score, actual_exit_velocity'
        )
        .eq('athlete_id', athleteId)
        .eq('exercise_id', exercise.exerciseId)
        .eq('completed', true)
        .order('created_at', { ascending: false });

      if (priorLogsError) {
        console.error(
          `Error loading prior exercise logs for exercise ${exercise.exerciseId}:`,
          priorLogsError
        );

        return NextResponse.json(
          {
            error:
              priorLogsError.message ??
              'Failed to load prior exercise performance history',
          },
          { status: 500 }
        );
      }

      priorHistoryByExerciseId.set(
        exercise.exerciseId,
        (priorLogs ?? []) as ComparableExerciseLog[]
      );
    }

    const { data: workoutLog, error: workoutLogError } = await supabase
      .from('workout_logs')
      .insert({
        athlete_id: athleteId,
        workout_id: workoutId,
        result_value: summaryResultValue,
        notes: notes ?? null,
        completed_at: workoutCompletedAt,
      })
      .select('id')
      .single();

    if (workoutLogError || !workoutLog) {
      console.error('Error inserting workout log:', workoutLogError);

      return NextResponse.json(
        { error: workoutLogError?.message ?? 'Failed to create workout log' },
        { status: 500 }
      );
    }

    const exerciseLogRows = exercises.map((exercise) => ({
      workout_log_id: workoutLog.id,
      workout_exercise_id: exercise.workoutExerciseId,
      exercise_id: exercise.exerciseId,
      athlete_id: athleteId,
      actual_sets: exercise.actualSets,
      actual_reps: exercise.actualReps,
      actual_time_seconds: exercise.actualTimeSeconds,
      actual_score: exercise.actualScore,
      actual_exit_velocity: exercise.actualExitVelocity,
      completed: exercise.completed,
      notes: exercise.notes ?? null,
    }));

    const { error: exerciseLogsError } = await supabase
      .from('exercise_logs')
      .insert(exerciseLogRows);

    if (exerciseLogsError) {
      console.error('Error inserting exercise logs:', exerciseLogsError);

      return NextResponse.json(
        { error: exerciseLogsError.message },
        { status: 500 }
      );
    }

    const exerciseNameByWorkoutExerciseId = new Map<string, string>();

    for (const row of workoutExerciseRows) {
      const exerciseName =
        Array.isArray(row.exercises) && row.exercises.length > 0
          ? row.exercises[0]?.name
          : (row.exercises as { name?: string } | null)?.name;

      exerciseNameByWorkoutExerciseId.set(row.id, exerciseName ?? 'Exercise');
    }

    const exerciseFeedback = completedExercises.map((exercise) => {
      const { metric, value: currentValue } = getPrimaryMetric({
        actualReps: exercise.actualReps,
        actualTimeSeconds: exercise.actualTimeSeconds,
        actualScore: exercise.actualScore,
        actualExitVelocity: exercise.actualExitVelocity,
      });

      const priorLogs = priorHistoryByExerciseId.get(exercise.exerciseId) ?? [];

      const comparableHistory = priorLogs
        .map((log) => getMetricValueFromLog(log, metric))
        .filter((value): value is number => value != null);

      const hasHistory = comparableHistory.length > 0;
      const lastValue = hasHistory ? comparableHistory[0] : null;
      const bestValue = hasHistory ? Math.max(...comparableHistory) : null;

      const firstEntry = !hasHistory;
      const delta =
        lastValue != null && currentValue != null ? currentValue - lastValue : null;
      const improved = delta != null && delta > 0;
      const isPR =
        hasHistory &&
        bestValue != null &&
        currentValue != null &&
        currentValue > bestValue;
      const matchedBest =
        hasHistory &&
        bestValue != null &&
        currentValue != null &&
        currentValue === bestValue;

      return {
        exerciseId: exercise.exerciseId,
        exerciseName:
          exerciseNameByWorkoutExerciseId.get(exercise.workoutExerciseId) ??
          'Exercise',
        metric: getMetricLabel(metric),
        current: currentValue,
        last: lastValue,
        delta,
        isPR,
        matchedBest,
        firstEntry,
        improved,
      };
    });

    const summary = {
      completedExercises: exerciseFeedback.length,
      prCount: exerciseFeedback.filter((item) => item.isPR).length,
      improvedCount: exerciseFeedback.filter((item) => item.improved).length,
    };

    return NextResponse.json({
      success: true,
      workoutLogId: workoutLog.id,
      workoutCompleted: allRequiredCompleted,
      summary,
      exerciseFeedback,
    });
  } catch (error) {
    console.error('Unexpected error saving workout execution:', error);

    return NextResponse.json(
      { error: 'Unexpected server error' },
      { status: 500 }
    );
  }
}