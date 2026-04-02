import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import SignOutButton from '@/components/SignOutButton';

type DashboardLayoutProps = {
  children: React.ReactNode;
};

const CHALLENGE_PROGRAM_ID = 'ad7376ba-9746-4c1b-b11d-d7ba245add79';

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 🔥 IMPORTANT: NO redirect('/login') anywhere

  const { data: challengeProgram } = await supabase
    .from('training_programs')
    .select('id')
    .eq('id', CHALLENGE_PROGRAM_ID)
    .maybeSingle();

  let firstWorkoutId: string | null = null;

  if (challengeProgram?.id) {
    const { data: firstWorkout } = await supabase
      .from('workouts')
      .select('id')
      .eq('training_program_id', challengeProgram.id)
      .order('day_order', { ascending: true })
      .limit(1)
      .maybeSingle();

    firstWorkoutId = firstWorkout?.id ?? null;
  }

  const guestChallengeHref = '/dashboard/compete/108-athlete-challenge';
  const guestTrainingHref = firstWorkoutId
    ? `/dashboard/training/${firstWorkoutId}`
    : '/dashboard/training';

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
          paddingBottom: 96,
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
          padding: '10px 12px calc(10px + env(safe-area-inset-bottom))',
        }}
      >
        <div
          style={{
            maxWidth: 520,
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <BottomNavItem href="/" label="Home" />

          <BottomNavItem
            href={guestChallengeHref}
            label="Challenge"
          />

          <BottomNavItem
            href={guestTrainingHref}
            label="Train"
          />

          <BottomNavItem
            href={user ? '/dashboard/profile' : '/login'}
            label="Profile"
          />
        </div>
      </nav>
    </div>
  );
}

function BottomNavItem({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        minHeight: 56,
        color: 'rgba(255,255,255,0.86)',
        textDecoration: 'none',
        borderRadius: 16,
      }}
    >
      <span
        style={{
          fontSize: 11,
          lineHeight: 1,
          color: 'rgba(255,255,255,0.62)',
        }}
      >
        {label}
      </span>
    </Link>
  );
}