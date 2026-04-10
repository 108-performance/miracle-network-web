'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import QuickActionIntroPlayer from './QuickActionIntroPlayer';

type TileVariant = 'train' | 'compete' | 'improve' | 'workout';
type TileLabel = 'Train' | 'Compete' | 'Improve' | 'Workout';
type SystemKey = 'train' | 'compete' | 'improve' | 'workout';

type QuickIntroRow = {
  title: string | null;
  external_url: string | null;
  system_key: string | null;
  audience?: string | null;
};

type QuickIntroConfig = {
  title: string;
  embedUrl: string;
};

type QuickActionTileItem = {
  href: string;
  label: TileLabel;
  subtext: string;
  variant: TileVariant;
  systemKey: SystemKey;
};

function isValidEmbedUrl(url: string | null | undefined) {
  if (!url) return false;

  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function TileIcon({ variant }: { variant: TileVariant }) {
  const className = 'h-5 w-5';

  if (variant === 'train') {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={className}>
        <path
          d="M3 10h3l2-2 8 8-2 2v3"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M14 5l5 5"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (variant === 'compete') {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={className}>
        <path
          d="M12 4l2.2 4.5 5 .7-3.6 3.5.9 5-4.5-2.4-4.5 2.4.9-5-3.6-3.5 5-.7L12 4Z"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (variant === 'improve') {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={className}>
        <path
          d="M14 5a4 4 0 0 0 5 5l-9 9a2.2 2.2 0 0 1-3.1-3.1l9-9Z"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M12 4l7 4v8l-7 4-7-4V8l7-4Z"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinejoin="round"
      />
      <path
        d="M12 8v8M8.5 10l7 4"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
    </svg>
  );
}

function QuickActionTile({
  href,
  label,
  subtext,
  variant,
  onClick,
}: {
  href: string;
  label: TileLabel;
  subtext: string;
  variant: TileVariant;
  onClick: (event: React.MouseEvent<HTMLAnchorElement>) => void;
}) {
  const styles = {
    train: {
      border: 'border-lime-400/15',
      iconBg: 'bg-lime-400/10',
      iconColor: 'text-lime-400',
    },
    compete: {
      border: 'border-fuchsia-400/15',
      iconBg: 'bg-fuchsia-400/10',
      iconColor: 'text-fuchsia-400',
    },
    improve: {
      border: 'border-amber-400/15',
      iconBg: 'bg-amber-400/10',
      iconColor: 'text-amber-400',
    },
    workout: {
      border: 'border-sky-400/15',
      iconBg: 'bg-sky-400/10',
      iconColor: 'text-sky-400',
    },
  }[variant];

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`group rounded-[28px] border ${styles.border} bg-zinc-950/85 p-5 transition duration-200 hover:border-zinc-700`}
    >
      <div
        className={`mb-5 inline-flex h-11 w-11 items-center justify-center rounded-2xl ${styles.iconBg} ${styles.iconColor}`}
      >
        <TileIcon variant={variant} />
      </div>

      <h3 className="text-lg font-semibold text-white">{label}</h3>
      <p className="mt-1 text-sm text-zinc-400">{subtext}</p>
    </Link>
  );
}

export default function QuickActionsClient({
  intros,
}: {
  intros: QuickIntroRow[];
}) {
  const [activeIntro, setActiveIntro] = useState<{
    title: string;
    embedUrl: string;
    destinationHref: string;
  } | null>(null);

  const quickActionTiles = useMemo<QuickActionTileItem[]>(
    () => [
      {
        href: '/dashboard/train',
        label: 'Train',
        subtext: 'Continue a workout',
        variant: 'train',
        systemKey: 'train',
      },
      {
        href: '/dashboard/compete',
        label: 'Compete',
        subtext: 'Join a challenge',
        variant: 'compete',
        systemKey: 'compete',
      },
      {
        href: '/dashboard/improve',
        label: 'Improve',
        subtext: 'Targeted drills',
        variant: 'improve',
        systemKey: 'improve',
      },
      {
        href: '/dashboard/workout',
        label: 'Workout',
        subtext: 'Train specific skills',
        variant: 'workout',
        systemKey: 'workout',
      },
    ],
    []
  );

  const introMap = useMemo(() => {
    const map: Record<SystemKey, QuickIntroConfig | null> = {
      train: null,
      compete: null,
      improve: null,
      workout: null,
    };

    intros?.forEach((item) => {
      if (!item?.system_key || !isValidEmbedUrl(item.external_url)) return;
      if (
        item.system_key !== 'train' &&
        item.system_key !== 'compete' &&
        item.system_key !== 'improve' &&
        item.system_key !== 'workout'
      ) {
        return;
      }

      map[item.system_key] = {
        title: item.title?.trim() || 'Quick Action Intro',
        embedUrl: item.external_url!,
      };
    });

    return map;
  }, [intros]);

  const handleTileClick =
    (tile: QuickActionTileItem) =>
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      const intro = introMap[tile.systemKey];

      if (!intro) {
        return;
      }

      event.preventDefault();

      setActiveIntro({
        title: intro.title,
        embedUrl: intro.embedUrl,
        destinationHref: tile.href,
      });
    };

  if (activeIntro) {
    return (
      <QuickActionIntroPlayer
        title={activeIntro.title}
        embedUrl={activeIntro.embedUrl}
        destinationHref={activeIntro.destinationHref}
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {quickActionTiles.map((tile) => (
        <QuickActionTile
          key={tile.systemKey}
          href={tile.href}
          label={tile.label}
          subtext={tile.subtext}
          variant={tile.variant}
          onClick={handleTileClick(tile)}
        />
      ))}
    </div>
  );
}