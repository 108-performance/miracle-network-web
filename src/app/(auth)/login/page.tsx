'use client';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const nextPath = useMemo(() => {
    const next = searchParams.get('next');

    if (!next) return '/dashboard';
    if (!next.startsWith('/')) return '/dashboard';

    return next;
  }, [searchParams]);

  const handleLogin = async () => {
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    router.push(nextPath);
    router.refresh();
  };

  const handleSignup = async () => {
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    router.push(nextPath);
    router.refresh();
  };

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-between px-6 py-8">
        <div>
          <div className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Miracle Network
          </div>

          <div className="mt-16">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-lime-400">
              Save Progress
            </p>

            <h1 className="mt-4 text-4xl font-extrabold leading-tight">
              Create your account and keep building.
            </h1>

            <p className="mt-5 max-w-sm text-base leading-7 text-zinc-400">
              Save your first session, track your progress, and continue the
              challenge.
            </p>
          </div>

          <div className="mt-10 space-y-4">
            <input
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-4 text-white outline-none placeholder:text-zinc-500"
            />

            <input
              placeholder="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-4 text-white outline-none placeholder:text-zinc-500"
            />
          </div>
        </div>

        <div className="space-y-4 pb-4">
          <button
            onClick={handleLogin}
            disabled={loading}
            className="flex w-full items-center justify-center rounded-2xl bg-lime-400 px-5 py-4 text-base font-bold text-black transition hover:opacity-90 disabled:opacity-60"
          >
            {loading ? 'Loading...' : 'Login'}
          </button>

          <button
            onClick={handleSignup}
            disabled={loading}
            className="flex w-full items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-950 px-5 py-4 text-sm font-semibold text-zinc-300 transition hover:border-zinc-700 hover:bg-zinc-900 disabled:opacity-60"
          >
            {loading ? 'Loading...' : 'Sign Up'}
          </button>
        </div>
      </div>
    </main>
  );
}