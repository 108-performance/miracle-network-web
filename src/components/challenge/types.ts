export type ChallengeDayState = 'complete' | 'active' | 'locked';

export type ChallengeDayItem = {
  dayNumber: number;
  title: string;
  subtitle?: string;
  state: ChallengeDayState;
  href?: string;
};

export type ChallengeCardProps = {
  badge: string;
  title: string;
  accentName: string;
  subtitle: string;
  helperText?: string;
  activeDay: number;
  totalDays: number;
  streakCount: number;
  days: ChallengeDayItem[];
  ctaLabel: string;
  ctaHref: string;
};

export type DayProgressBarProps = {
  totalDays: number;
  activeDay: number;
  days: ChallengeDayItem[];
};

export type SessionCTAProps = {
  label: string;
  href: string;
  disabled?: boolean;
};

export type WeeklyListProps = {
  title?: string;
  days: ChallengeDayItem[];
};