'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Trophy, Dumbbell, User, PlaySquare } from 'lucide-react';

type Props = {
  homeHref: string;
  challengeHref: string;
  trainingHref: string;
  contentHref: string;
  profileHref: string;
};

export default function DashboardBottomNav({
  homeHref,
  challengeHref,
  trainingHref,
  contentHref,
  profileHref,
}: Props) {
  const pathname = usePathname();

  const isHomeActive = pathname === '/' || pathname === '/dashboard';
  const isChallengeActive = pathname.startsWith('/dashboard/compete');
  const isTrainingActive = pathname.startsWith('/dashboard/training');
  const isContentActive = pathname.startsWith('/dashboard/content');
  const isProfileActive =
    pathname.startsWith('/dashboard/profile') || pathname.startsWith('/profile');

  return (
    <div
      style={{
        maxWidth: 620,
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        alignItems: 'center',
      }}
    >
      <NavItem
        href={homeHref}
        active={isHomeActive}
        icon={isHomeActive ? <HomeSolid /> : <Home size={24} strokeWidth={2} />}
      />

      <NavItem
        href={challengeHref}
        active={isChallengeActive}
        icon={
          isChallengeActive ? <TrophySolid /> : <Trophy size={24} strokeWidth={2} />
        }
      />

      <NavItem
        href={trainingHref}
        active={isTrainingActive}
        icon={
          isTrainingActive ? (
            <DumbbellSolid />
          ) : (
            <Dumbbell size={24} strokeWidth={2} />
          )
        }
      />

      <NavItem
        href={contentHref}
        active={isContentActive}
        icon={
          isContentActive ? (
            <PlaySquareSolid />
          ) : (
            <PlaySquare size={24} strokeWidth={2} />
          )
        }
      />

      <NavItem
        href={profileHref}
        active={isProfileActive}
        icon={isProfileActive ? <UserSolid /> : <User size={24} strokeWidth={2} />}
      />
    </div>
  );
}

function NavItem({
  href,
  active,
  icon,
}: {
  href: string;
  active: boolean;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 56,
        color: active ? '#ffffff' : 'rgba(255,255,255,0.38)',
        transform: active ? 'scale(1.05)' : 'scale(1)',
        transition: 'all 140ms ease',
      }}
    >
      {icon}
    </Link>
  );
}

function HomeSolid() {
  return (
    <svg width="24" height="24" fill="white" viewBox="0 0 24 24">
      <path d="M12 3l9 8h-3v9h-5v-6H11v6H6v-9H3z" />
    </svg>
  );
}

function UserSolid() {
  return (
    <svg width="24" height="24" fill="white" viewBox="0 0 24 24">
      <path d="M12 12a5 5 0 100-10 5 5 0 000 10zm0 2c-4 0-8 2-8 5v3h16v-3c0-3-4-5-8-5z" />
    </svg>
  );
}

function TrophySolid() {
  return (
    <svg width="24" height="24" fill="white" viewBox="0 0 24 24">
      <path d="M18 2H6v2H4v3a5 5 0 004 4.9V14H7v2h10v-2h-1v-2.1A5 5 0 0020 7V4h-2V2zM6 7V6h2v4.9A3 3 0 016 7zm12 0a3 3 0 01-2 2.9V6h2v1z" />
    </svg>
  );
}

function DumbbellSolid() {
  return (
    <svg width="24" height="24" fill="white" viewBox="0 0 24 24">
      <path d="M4 10h2v4H4v-4zm3-2h2v8H7V8zm3 1h4v6h-4V9zm5-1h2v8h-2V8zm3 2h2v4h-2v-4z" />
    </svg>
  );
}

function PlaySquareSolid() {
  return (
    <svg width="24" height="24" fill="white" viewBox="0 0 24 24">
      <path d="M6 4h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2zm4 4.5v7l6-3.5-6-3.5z" />
    </svg>
  );
}