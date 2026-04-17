import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { buildRecommendationState } from '@/core/protected/recommendation/buildRecommendationState';

type WorkoutRow = {
  id: string;
  title: string | null;
  description: string | null;
  day_order: number | null;
  training_program_id: string | null;
  difficulty_level: number | null;
};

type TrainingProgramRow = {
  id: string;
  title: string | null;
  description: string | null;
  created_at: string | null;
  app_lane: 'train' | 'compete' | 'workout' | null;
  is_active: boolean | null;
  sort_order: number | null;
};

const PHASES = [
  {
    key: 'foundational',
    label: 'Foundational',
    athleteLabel: 'Build your base and learn the movement system.',
  },
  {
    key: 'engine_build',
    label: 'Engine Build',
    athleteLabel: 'Build force, speed, and rotational power.',
  },
  {
    key: 'ball_strike',
    label: 'Ball Strike',
    athleteLabel: 'Improve contact quality and strike control.',
  },
  {
    key: 'adaptability',
    label: 'Adaptability',
    athleteLabel: 'Improve adjustability in game-like situations.',
  },
] as const;

function getPhaseByIndex(index: number) {
  const bucket = Math.floor(index / 24);
  return PHASES[Math.min(bucket, PHASES.length - 1)];
}

function getSessionPurpose(title: string | null, phaseLabel: string) {
  const normalizedTitle = (title ?? '').trim().toLowerCase();

  if (normalizedTitle.includes('intro')) return 'Start clean and build rhythm.';
  if (normalizedTitle.includes('checkpoint')) {
    return 'Measure progress and lock in movement.';
  }
  if (normalizedTitle.includes('reassess')) {
    return 'Recheck where you are and prepare for what is next.';
  }

  if (phaseLabel === 'Foundational') {
    return 'Build base movement patterns and system language.';
  }

  if (phaseLabel === 'Engine Build') {
    return 'Increase force output and rotational intent.';
  }

  if (phaseLabel === 'Ball Strike') {
    return 'Improve contact quality and strike consistency.';
  }

  if (phaseLabel === 'Adaptability') {
    return 'Improve adjustability under variability and pressure.';
  }

  return 'Keep progressing one session at a time.';
}

function getSessionChipState({
  sessionId,
  currentSessionId,
  completed,
}: {
  sessionId: string;
  currentSessionId: string;
  completed: boolean;
}) {
  if (completed) return 'completed';
  if (sessionId === currentSessionId) return 'current';
  return 'upcoming';
}

export const dynamic = 'force-dynamic';

export default async function TrainingPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isGuest = !user;

  let athlete:
    | {
        id: string;
        first_name: string | null;
        last_name: string | null;
      }
    | null = null;

  if (user) {
    const { data } = await supabase
      .from('athletes')
      .select('id, first_name, last_name')
      .eq('user_id', user.id)
      .maybeSingle();

    athlete = data;
  }

  const athleteName = athlete
    ? `${athlete.first_name ?? ''} ${athlete.last_name ?? ''}`.trim() || 'Athlete'
    : 'Guest Athlete';

  const { data: trainProgramsData, error: trainProgramsError } = await supabase
    .from('training_programs')
    .select('id, title, description, created_at, app_lane, is_active, sort_order')
    .eq('app_lane', 'train')
    .eq('is_active', true)
    .order('sort_order', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true });

  if (trainProgramsError) {
    console.error('Error loading train programs:', trainProgramsError);
  }

  const trainPrograms = (trainProgramsData ?? []) as TrainingProgramRow[];
  const trainProgramIds = trainPrograms.map((program) => program.id);

  if (!trainProgramIds.length) {
    return (
      <main className="mx-auto max-w-5xl space-y-6 bg-black px-6 py-8 text-white">
        <section className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
          <Link
            href="/dashboard"
            className="inline-block text-sm font-semibold text-zinc-300 no-underline"
          >
            ← Back
          </Link>

          <h1 className="mt-4 text-3xl font-extrabold text-white">
            No Train path available
          </h1>
          <p className="mt-3 text-zinc-400">
            No active Train programs are currently tagged for the Train lane.
          </p>
        </section>
      </main>
    );
  }

  const { data: workoutsData, error: workoutsError } = await supabase
    .from('workouts')
    .select(
      'id, title, description, day_order, training_program_id, difficulty_level'
    )
    .in('training_program_id', trainProgramIds)
    .order('training_program_id', { ascending: true })
    .order('day_order', { ascending: true });

  if (workoutsError) {
    console.error('Error loading train workouts:', workoutsError);
  }

  const workouts = (workoutsData ?? []) as WorkoutRow[];

  if (!workouts.length) {
    return (
      <main className="mx-auto max-w-5xl space-y-6 bg-black px-6 py-8 text-white">
        <section className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
          <Link
            href="/dashboard"
            className="inline-block text-sm font-semibold text-zinc-300 no-underline"
          >
            ← Back
          </Link>

          <h1 className="mt-4 text-3xl font-extrabold text-white">
            No Train sessions available
          </h1>
          <p className="mt-3 text-zinc-400">
            Your Train programs are active, but no workouts are attached yet.
          </p>
        </section>
      </main>
    );
  }

  let completedWorkoutIds: string[] = [];

  if (athlete?.id) {
    const { data: completedWorkoutLogs } = await supabase
      .from('workout_logs')
      .select('workout_id, completed_at')
      .eq('athlete_id', athlete.id)
      .not('completed_at', 'is', null);

    completedWorkoutIds =
      completedWorkoutLogs?.map((log) => log.workout_id).filter(Boolean) ?? [];
  }

  const sortedTrainWorkouts = [...workouts].sort((a, b) => {
    const programA =
      trainPrograms.find((program) => program.id === a.training_program_id) ?? null;
    const programB =
      trainPrograms.find((program) => program.id === b.training_program_id) ?? null;

    const sortA = programA?.sort_order ?? Number.MAX_SAFE_INTEGER;
    const sortB = programB?.sort_order ?? Number.MAX_SAFE_INTEGER;

    if (sortA !== sortB) return sortA - sortB;

    const dayA = a.day_order ?? Number.MAX_SAFE_INTEGER;
    const dayB = b.day_order ?? Number.MAX_SAFE_INTEGER;

    return dayA - dayB;
  });

  const trainSessions = sortedTrainWorkouts.map((workout, index) => {
    const phase = getPhaseByIndex(index);

    return {
      id: workout.id,
      title: workout.title,
      description: workout.description,
      session_order: index + 1,
      phase_key: phase.key,
      phase_label: phase.label,
      phase_athlete_label: phase.athleteLabel,
      training_program_id: workout.training_program_id,
      estimated_minutes: null,
      completed: completedWorkoutIds.includes(workout.id),
      purpose: getSessionPurpose(workout.title, phase.label),
    };
  });

  const recommendation = buildRecommendationState({
    completedLogs: completedWorkoutIds.map((workoutId) => ({
      workout_id: workoutId,
      completed_at: new Date().toISOString(),
    })),
    trainSessions,
    challengeWorkouts: [],
    currentPathType: 'train',
  });

  const currentSession =
    trainSessions.find(
      (session) => session.id === recommendation.nextBestSession.nextSession.workoutId
    ) ?? trainSessions[0];

  const currentSessionHref = `/dashboard/training/${currentSession.id}/run`;

  const activePhaseSessions = trainSessions.filter(
    (session) => session.phase_key === currentSession.phase_key
  );

  const completedInPhase = activePhaseSessions.filter((session) => session.completed).length;
  const totalInPhase = activePhaseSessions.length;
  const phaseProgressPercent =
    totalInPhase > 0 ? Math.round((completedInPhase / totalInPhase) * 100) : 0;

  const previousSessions = trainSessions
    .filter((session) => session.session_order < currentSession.session_order)
    .slice(-2);

  const upcomingSessions = trainSessions
    .filter((session) => session.session_order > currentSession.session_order)
    .slice(0, 2);

  const primaryCtaLabel =
    recommendation.nextBestSession.recommendationType === 'start_train_path'
      ? 'Start Session'
      : recommendation.nextBestSession.recommendationType === 'resume_train_session'
        ? 'Resume Session'
        : 'Continue Session';

  return (
    <main className="mx-auto max-w-5xl space-y-6 bg-black px-6 py-8 text-white">
      <section className="rounded-[28px] border border-lime-400/40 bg-[radial-gradient(circle_at_top,_rgba(132,204,22,0.18),_rgba(0,0,0,0.96)_60%)] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-lime-400">
          Active Train Path
        </p>

        <h1 className="mt-2 text-3xl font-extrabold text-white sm:text-5xl">
          {currentSession.title ?? 'Current Session'}
        </h1>

        <p className="mt-3 text-lg text-zinc-300">
          {currentSession.phase_label} • Session {currentSession.session_order}
        </p>

        <p className="mt-2 max-w-2xl text-sm text-zinc-400 sm:text-base">
          {currentSession.purpose}
        </p>

        <div className="mt-6">
          <Link
            href={currentSessionHref}
            className="inline-block rounded-2xl bg-lime-400 px-6 py-4 text-lg font-bold text-black no-underline transition hover:bg-lime-300"
          >
            {primaryCtaLabel}
          </Link>
        </div>
      </section>

      <section className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/dashboard"
              className="inline-block text-sm font-semibold text-zinc-300 no-underline"
            >
              ← Back
            </Link>

            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
              Current Phase
            </p>

            <h2 className="mt-2 text-2xl font-bold text-white">
              {currentSession.phase_label}
            </h2>

            <p className="mt-2 text-sm text-zinc-400">
              {currentSession.phase_athlete_label}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 text-xs font-semibold text-zinc-300">
              Athlete: {athleteName}
            </span>
            <span className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 text-xs font-semibold text-zinc-300">
              Session {currentSession.session_order}
            </span>
            <span className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 text-xs font-semibold text-zinc-300">
              Phase Progress: {completedInPhase}/{totalInPhase}
            </span>
            {isGuest ? (
              <span className="rounded-full border border-lime-400/30 bg-lime-400/10 px-3 py-1 text-xs font-semibold text-lime-300">
                Guest Mode
              </span>
            ) : null}
          </div>
        </div>

        <div className="mt-5">
          <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-900">
            <div
              className="h-full rounded-full bg-lime-400 transition-all"
              style={{ width: `${phaseProgressPercent}%` }}
            />
          </div>
          <p className="mt-2 text-xs uppercase tracking-[0.14em] text-zinc-500">
            {phaseProgressPercent}% through {currentSession.phase_label}
          </p>
        </div>
      </section>

      <section className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
            Session Progression
          </p>
          <h3 className="mt-2 text-2xl font-bold text-white">
            Stay in sequence
          </h3>
          <p className="mt-2 text-sm text-zinc-400">
            One next session. Everything else stays visually clear and light.
          </p>
        </div>

        <div className="overflow-x-auto pb-2">
          <div className="flex min-w-max gap-3">
            {activePhaseSessions.map((session) => {
              const state = getSessionChipState({
                sessionId: session.id,
                currentSessionId: currentSession.id,
                completed: session.completed,
              });

              return (
                <div
                  key={session.id}
                  className={`min-w-[144px] rounded-[24px] border px-4 py-4 ${
                    state === 'current'
                      ? 'border-lime-400/80 bg-[radial-gradient(circle_at_top,_rgba(132,204,22,0.18),_rgba(0,0,0,0.96)_70%)] shadow-[0_0_0_1px_rgba(132,204,22,0.12)]'
                      : state === 'completed'
                        ? 'border-white/10 bg-white/[0.02]'
                        : 'border-zinc-800 bg-zinc-950'
                  }`}
                >
                  <p
                    className={`text-[11px] font-bold uppercase tracking-[0.18em] ${
                      state === 'current'
                        ? 'text-lime-400'
                        : state === 'completed'
                          ? 'text-blue-400'
                          : 'text-zinc-500'
                    }`}
                  >
                    S{session.session_order}
                  </p>

                  <div className="mt-4 flex items-center justify-center">
                    {state === 'completed' ? (
                      <div className="flex h-9 w-9 items-center justify-center rounded-full border border-blue-400/30 bg-blue-500/10 text-lg font-bold text-blue-300">
                        ✓
                      </div>
                    ) : state === 'current' ? (
                      <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-lime-400 text-lg font-bold text-lime-400">
                        ○
                      </div>
                    ) : (
                      <div className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-700 text-lg font-bold text-zinc-600">
                        ○
                      </div>
                    )}
                  </div>

                  <p className="mt-4 text-center text-sm font-semibold text-white">
                    {session.title ?? `Session ${session.session_order}`}
                  </p>

                  <p className="mt-1 text-center text-xs text-zinc-500">
                    {state === 'completed'
                      ? 'Completed'
                      : state === 'current'
                        ? 'Current'
                        : 'Upcoming'}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <section className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
            Recent Sessions
          </p>
          <h3 className="mt-2 text-xl font-bold text-white">What you’ve built</h3>

          <div className="mt-4 space-y-3">
            {previousSessions.length > 0 ? (
              previousSessions.map((session) => (
                <div
                  key={session.id}
                  className="rounded-2xl border border-white/5 bg-white/[0.02] p-4"
                >
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-400">
                    Session {session.session_order}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-white">
                    {session.title ?? 'Completed Session'}
                  </p>
                  <p className="mt-1 text-sm text-zinc-400">{session.phase_label}</p>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 text-sm text-zinc-400">
                No completed Train sessions yet.
              </div>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
            Coming Up
          </p>
          <h3 className="mt-2 text-xl font-bold text-white">Stay light</h3>

          <div className="mt-4 space-y-3">
            {upcomingSessions.length > 0 ? (
              upcomingSessions.map((session) => (
                <div
                  key={session.id}
                  className="rounded-2xl border border-white/5 bg-white/[0.02] p-4"
                >
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">
                    Session {session.session_order}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-white">
                    {session.title ?? 'Upcoming Session'}
                  </p>
                  <p className="mt-1 text-sm text-zinc-400">{session.phase_label}</p>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 text-sm text-zinc-400">
                You are at the end of the current visible sequence.
              </div>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}