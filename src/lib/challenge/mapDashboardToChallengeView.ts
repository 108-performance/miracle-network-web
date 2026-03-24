import { ChallengeCardProps, ChallengeDayItem } from '@/components/challenge/types';

type ExistingDashboardInput = {
  streakCount: number;
  activeDay: number;
  totalDays: number;
  todayRoute: string;
  challengeTitle?: string;
  challengeAccentName?: string;
  challengeSubtitle?: string;
  challengeBadge?: string;
  days: Array<{
    dayNumber: number;
    title: string;
    subtitle?: string;
    completed: boolean;
    unlocked: boolean;
    href?: string;
  }>;
};

export function mapDashboardToChallengeView(
  input: ExistingDashboardInput
): ChallengeCardProps & { weeklyDays: ChallengeDayItem[] } {
  const mappedDays: ChallengeDayItem[] = input.days.map((day) => ({
    dayNumber: day.dayNumber,
    title: day.title,
    subtitle: day.subtitle,
    href: day.href,
    state: day.completed ? 'complete' : day.unlocked ? 'active' : 'locked',
  }));

  return {
    badge: input.challengeBadge ?? '7-Day Challenge',
    title: 'Train Like',
    accentName: input.challengeAccentName ?? 'Jordan',
    subtitle: input.challengeSubtitle ?? 'Pure Power and Control',
    helperText:
      input.activeDay < input.totalDays
        ? `Ready for Day ${input.activeDay}. Keep your streak alive and move toward Day ${input.activeDay + 1}.`
        : 'Final day. Finish strong.',
    activeDay: input.activeDay,
    totalDays: input.totalDays,
    streakCount: input.streakCount,
    days: mappedDays,
    ctaLabel: "Start Today's Session",
    ctaHref: input.todayRoute,
    weeklyDays: mappedDays,
  };
}