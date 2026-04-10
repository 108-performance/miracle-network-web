import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const PENDING_SESSION_COOKIE = 'mn_pending_session';

export async function POST() {
  const cookieStore = await cookies();

  cookieStore.set(PENDING_SESSION_COOKIE, '', {
    path: '/',
    maxAge: 0,
  });

  return NextResponse.json({ success: true });
}