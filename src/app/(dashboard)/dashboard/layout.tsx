import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import SignOutButton from '@/components/SignOutButton';
import DashboardBottomNav from '@/components/navigation/DashboardBottomNav';

type DashboardLayoutProps = {
  children: React.ReactNode;
};

const CHALLENGE_PROGRAM_ID = 'ad7376ba-9746-4c1b-b11d-d7ba245add79';

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const supabase = await createClient();

  let user = null;

  try {
    const { data, error } = await supabase.auth.getUser();

    if (!error) {
      user = data.user;
    }
  } catch {
    user = null;
  }

  let challengeProgram: { id: string } | null = null;

  try {
    const { data } = await supabase
      .from('training_programs')
      .select('id')
      .eq('id', CHALLENGE_PROGRAM_ID)
      .maybeSingle();

    challengeProgram = data ?? null;
  } catch {
    challengeProgram = null;
  }

  let firstWorkoutId: string | null = null;

  if (challengeProgram?.id) {
    try {
      const { data: firstWorkout } = await supabase
        .from('workouts')
        .select('id')
        .eq('training_program_id', challengeProgram.id)
        .order('day_order', { ascending: true })
        .limit(1)
        .maybeSingle();

      firstWorkoutId = firstWorkout?.id ?? null;
    } catch {
      firstWorkoutId = null;
    }
  }

  const homeHref = '/';
  const challengeHref = '/dashboard/compete/108-athlete-challenge';
  const trainingHref = firstWorkoutId
    ? `/dashboard/training/${firstWorkoutId}`
    : '/dashboard/training';
  const profileHref = user ? '/dashboard/profile' : '/login';

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff' }}>
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '14px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(10,10,10,0.92)',
          backdropFilter: 'blur(12px)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}
      >
        <div
          style={{
            fontWeight: 800,
            fontSize: 14,
            letterSpacing: 1.4,
          }}
        >
          MIRACLE
        </div>

        {user ? (
          <SignOutButton />
        ) : (
          <Link
            href="/login"
            style={{
              color: 'rgba(255,255,255,0.86)',
              textDecoration: 'none',
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            Login
          </Link>
        )}
      </header>

      <main
        style={{
          padding: 16,
          paddingBottom: 104,
        }}
      >
        {children}
      </main>

      <nav
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 60,
          borderTop: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(10,10,10,0.96)',
          backdropFilter: 'blur(16px)',
          padding: '8px 12px calc(8px + env(safe-area-inset-bottom))',
        }}
      >
        <DashboardBottomNav
          homeHref={homeHref}
          challengeHref={challengeHref}
          trainingHref={trainingHref}
          profileHref={profileHref}
        />
      </nav>
    </div>
  );
}