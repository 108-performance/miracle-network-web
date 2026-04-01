import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import SignOutButton from '../../../components/SignOutButton';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
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
          background: '#0a0a0a',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 14, letterSpacing: 1 }}>
          MIRACLE
        </div>

        <nav
          style={{
            display: 'flex',
            gap: 12,
            alignItems: 'center',
            overflowX: 'auto',
          }}
        >
          <NavLink href="/dashboard" label="Home" />
          <NavLink href="/dashboard/train" label="Train" />
          <NavLink href="/dashboard/compete" label="Compete" />
          <NavLink href="/dashboard/improve" label="Improve" />
          <NavLink href="/dashboard/workout" label="Workout" />
          <SignOutButton />
        </nav>
      </header>

      <main style={{ padding: 16 }}>{children}</main>
    </div>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      style={{
        padding: '6px 10px',
        borderRadius: 999,
        fontSize: 13,
        color: 'rgba(255,255,255,0.7)',
        whiteSpace: 'nowrap',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      {label}
    </Link>
  );
}