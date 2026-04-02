import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect('/dashboard');
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-between px-6 py-8">
        <div>
          <div className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Miracle Network
          </div>

          <div className="mt-16">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-lime-400">
              Today’s Session
            </p>

            <h1 className="mt-4 text-5xl font-extrabold leading-tight">
              Start training right away.
            </h1>

            <p className="mt-5 max-w-sm text-base leading-7 text-zinc-400">
              Jump into the 108 Athlete Challenge and begin today’s guided
              session with zero confusion and zero wasted motion.
            </p>
          </div>
        </div>

        <div className="space-y-4 pb-4">
          <Link
            href="/login"
            className="flex w-full items-center justify-center rounded-2xl bg-lime-400 px-5 py-4 text-base font-bold text-black transition hover:opacity-90"
          >
            Start Today’s Session
          </Link>

          <Link
            href="/login"
            className="flex w-full items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-950 px-5 py-4 text-sm font-semibold text-zinc-300 transition hover:border-zinc-700 hover:bg-zinc-900"
          >
            I already have an account
          </Link>
        </div>
      </div>
    </main>
  );
}