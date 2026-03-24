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
    <div style={{ minHeight: '100vh', background: '#f7f7f7' }}>
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 24px',
          borderBottom: '1px solid #ddd',
          background: '#fff',
        }}
      >
        <div style={{ fontWeight: 700 }}>Miracle Network</div>

        <nav style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/dashboard/training">Training</Link>
          <Link href="/dashboard/teams">Teams</Link>
          <Link href="/dashboard/progress">Progress</Link>
          <SignOutButton />
        </nav>
      </header>

      <main style={{ padding: 24 }}>{children}</main>
    </div>
  );
}