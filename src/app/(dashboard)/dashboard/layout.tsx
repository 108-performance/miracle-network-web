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

  if (!user) {
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
            <BottomNavItem
              href="/"
              label="Home"
              icon={
                <NavIcon>
                  <path
                    d="M3 10.5L12 3l9 7.5"
                    stroke="currentColor"
                    strokeWidth="1.9"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                  <path
                    d="M5.5 9.5V20h13V9.5"
                    stroke="currentColor"
                    strokeWidth="1.9"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                </NavIcon>
              }
            />

            <BottomNavItem
              href={guestChallengeHref}
              label="Challenge"
              icon={
                <NavIcon>
                  <path
                    d="M12 4l2.2 4.5 5 .7-3.6 3.5.9 5-4.5-2.4-4.5 2.4.9-5-3.6-3.5 5-.7L12 4Z"
                    stroke="currentColor"
                    strokeWidth="1.9"
                    strokeLinejoin="round"
                    fill="none"
                  />
                </NavIcon>
              }
            />

            <BottomNavItem
              href={guestTrainingHref}
              label="Train"
              icon={
                <NavIcon>
                  <path
                    d="M4 12h16"
                    stroke="currentColor"
                    strokeWidth="1.9"
                    strokeLinecap="round"
                  />
                  <path
                    d="M8 8l-4 4 4 4"
                    stroke="currentColor"
                    strokeWidth="1.9"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                  <path
                    d="M16 8l4 4-4 4"
                    stroke="currentColor"
                    strokeWidth="1.9"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                </NavIcon>
              }
            />

            <BottomNavItem
              href="/login"
              label="Profile"
              icon={
                <NavIcon>
                  <circle
                    cx="12"
                    cy="8"
                    r="3.2"
                    stroke="currentColor"
                    strokeWidth="1.9"
                    fill="none"
                  />
                  <path
                    d="M5.5 19c1.5-3 4-4.5 6.5-4.5s5 1.5 6.5 4.5"
                    stroke="currentColor"
                    strokeWidth="1.9"
                    strokeLinecap="round"
                    fill="none"
                  />
                </NavIcon>
              }
            />
          </div>
        </nav>
      </div>
    );
  }

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

        <div style={{ display: 'flex', alignItems: 'center' }}>
          <SignOutButton />
        </div>
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
          <BottomNavItem
            href="/dashboard"
            label="Home"
            icon={
              <NavIcon>
                <path
                  d="M3 10.5L12 3l9 7.5"
                  stroke="currentColor"
                  strokeWidth="1.9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
                <path
                  d="M5.5 9.5V20h13V9.5"
                  stroke="currentColor"
                  strokeWidth="1.9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </NavIcon>
            }
          />

          <BottomNavItem
            href="/dashboard/content"
            label="Content"
            icon={
              <NavIcon>
                <rect
                  x="4"
                  y="5"
                  width="16"
                  height="14"
                  rx="3"
                  stroke="currentColor"
                  strokeWidth="1.9"
                  fill="none"
                />
                <path
                  d="M8 10h8M8 14h5"
                  stroke="currentColor"
                  strokeWidth="1.9"
                  strokeLinecap="round"
                />
              </NavIcon>
            }
          />

          <BottomNavItem
            href="/dashboard/messages"
            label="Messages"
            icon={
              <NavIcon>
                <path
                  d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7A2.5 2.5 0 0 1 17.5 16H10l-4.5 4V16H6.5A2.5 2.5 0 0 1 4 13.5v-7Z"
                  stroke="currentColor"
                  strokeWidth="1.9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </NavIcon>
            }
          />

          <BottomNavItem
            href="/dashboard/profile"
            label="Profile"
            icon={
              <NavIcon>
                <circle
                  cx="12"
                  cy="8"
                  r="3.2"
                  stroke="currentColor"
                  strokeWidth="1.9"
                  fill="none"
                />
                <path
                  d="M5.5 19c1.5-3 4-4.5 6.5-4.5s5 1.5 6.5 4.5"
                  stroke="currentColor"
                  strokeWidth="1.9"
                  strokeLinecap="round"
                  fill="none"
                />
              </NavIcon>
            }
          />
        </div>
      </nav>
    </div>
  );
}

function BottomNavItem({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
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
      <div
        style={{
          width: 24,
          height: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon}
      </div>
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

function NavIcon({ children }: { children: React.ReactNode }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      style={{ display: 'block', color: 'currentColor' }}
    >
      {children}
    </svg>
  );
}