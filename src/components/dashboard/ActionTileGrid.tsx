import Link from 'next/link';

type TileVariant = 'train' | 'build' | 'fix' | 'compete';

type ActionTileProps = {
  label: string;
  subtext: string;
  detail: string;
  href: string;
  variant: TileVariant;
  primary?: boolean;
  statusBadge?: React.ReactNode;
};

const variantStyles: Record<
  TileVariant,
  {
    border: string;
    iconBg: string;
    iconColor: string;
    glow: string;
  }
> = {
  train: {
    border: 'border-lime-400/20',
    iconBg: 'bg-lime-400/10',
    iconColor: 'text-lime-400',
    glow: 'shadow-[0_0_24px_rgba(132,204,22,0.08)]',
  },
  build: {
    border: 'border-sky-400/20',
    iconBg: 'bg-sky-400/10',
    iconColor: 'text-sky-400',
    glow: 'shadow-[0_0_24px_rgba(56,189,248,0.08)]',
  },
  fix: {
    border: 'border-amber-400/20',
    iconBg: 'bg-amber-400/10',
    iconColor: 'text-amber-400',
    glow: 'shadow-[0_0_24px_rgba(251,191,36,0.08)]',
  },
  compete: {
    border: 'border-fuchsia-400/20',
    iconBg: 'bg-fuchsia-400/10',
    iconColor: 'text-fuchsia-400',
    glow: 'shadow-[0_0_24px_rgba(217,70,239,0.08)]',
  },
};

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

  if (variant === 'build') {
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

  if (variant === 'fix') {
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
        d="M12 4l2.2 4.5 5 .7-3.6 3.5.9 5-4.5-2.4-4.5 2.4.9-5-3.6-3.5 5-.7L12 4Z"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ActionTile({
  label,
  subtext,
  detail,
  href,
  variant,
  primary,
  statusBadge,
}: ActionTileProps) {
  const styles = variantStyles[variant];

  return (
    <Link
      href={href}
      className={`group relative flex h-[150px] flex-col justify-between overflow-hidden rounded-2xl border p-4 text-left transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${
        primary
          ? 'border-lime-400/30 bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900 shadow-[0_0_32px_rgba(132,204,22,0.10)]'
          : `bg-zinc-950/90 backdrop-blur-sm ${styles.border} ${styles.glow}`
      }`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-white/[0.03] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="relative z-10">
        <div className="mb-3 flex items-center justify-between">
          <div
            className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${styles.iconBg} ${styles.iconColor}`}
          >
            <TileIcon variant={variant} />
          </div>
          {statusBadge}
        </div>

        <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-white">
          {label}
        </h3>
        <p className="mt-1 text-xs text-zinc-400">{subtext}</p>
      </div>

      <div className="relative z-10">
        <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-zinc-500">
          {detail}
        </span>
      </div>
    </Link>
  );
}

export default function ActionTileGrid() {
  return (
    <section>
      <div className="grid grid-cols-2 gap-4">
        <ActionTile
          label="Train"
          subtext="Start Today's Session"
          detail="Challenge Ready"
          href="/dashboard/compete/108-athlete-challenge"
          variant="train"
          primary
          statusBadge={
            <div className="flex items-center gap-1.5 rounded-full bg-lime-400/15 px-2 py-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-lime-400 animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-lime-400">
                Ready
              </span>
            </div>
          }
        />

        <ActionTile
          label="Build"
          subtext="Train Skills"
          detail="Movement Progress"
          href="/dashboard/train"
          variant="build"
        />

        <ActionTile
          label="Fix"
          subtext="Correct Mistakes"
          detail="Coming Soon"
          href="/dashboard/improve"
          variant="fix"
        />

        <ActionTile
          label="Compete"
          subtext="Beat Your Score"
          detail="108 Challenge"
          href="/dashboard/compete"
          variant="compete"
        />
      </div>
    </section>
  );
}