'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Trophy, Dumbbell, User } from 'lucide-react';

type Props = {
  homeHref: string;
  challengeHref: string;
  trainingHref: string;
  profileHref: string;
};

export default function DashboardBottomNav({
  homeHref,
  challengeHref,
  trainingHref,
  profileHref,
}: Props) {
  const pathname = usePathname();

  const isHomeActive =
    pathname === homeHref || pathname === '/dashboard';

  const isChallengeActive =
    pathname.startsWith('/dashboard/compete');

  const isTrainingActive =
    pathname.startsWith('/dashboard/training');

  const isProfileActive =
    pathname.startsWith('/dashboard/profile') ||
    pathname.startsWith('/profile');

  return (
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
      <NavItem
        href={homeHref}
        label="Home"
        active={isHomeActive}
        icon={<Home size={24} strokeWidth={isHomeActive ? 2.6 : 2.1} />}
      />

      <NavItem
        href={challengeHref}
        label="Challenge"
        active={isChallengeActive}
        icon={<Trophy size={24} strokeWidth={isChallengeActive ? 2.6 : 2.1} />}
      />

      <NavItem
        href={trainingHref}
        label="Train"
        active={isTrainingActive}
        icon={<Dumbbell size={24} strokeWidth={isTrainingActive ? 2.6 : 2.1} />}
      />

      <NavItem
        href={profileHref}
        label="Profile"
        active={isProfileActive}
        icon={<User size={24} strokeWidth={isProfileActive ? 2.6 : 2.1} />}
      />
    </div>
  );
}

function NavItem({
  href,
  label,
  active,
  icon,
}: {
  href: string;
  label: string;
  active: boolean;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      aria-current={active ? 'page' : undefined}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 56,
        textDecoration: 'none',
        borderRadius: 16,
        color: active ? '#ffffff' : 'rgba(255,255,255,0.34)',
        transform: active ? 'scale(1.1)' : 'scale(1)',
        transition: 'all 160ms ease',
      }}
    >
      <span
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: active ? 1 : 0.72,
          filter: active ? 'drop-shadow(0 0 8px rgba(255,255,255,0.14))' : 'none',
        }}
      >
        {icon}
      </span>
    </Link>
  );
}