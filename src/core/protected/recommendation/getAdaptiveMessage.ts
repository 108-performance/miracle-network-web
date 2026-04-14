import type {
  AdaptiveMessageResult,
  ContinuationStateResult,
  NextBestSessionResult,
} from './types';

export function getAdaptiveMessage({
  continuation,
  nextBestSession,
}: {
  continuation: ContinuationStateResult;
  nextBestSession: NextBestSessionResult;
}): AdaptiveMessageResult {
  if (nextBestSession.recommendationType === 'start_challenge') {
    return {
      headline: 'Start your first session.',
      subtext: 'Build momentum by starting the challenge.',
      supportLabel: 'Your first step is ready.',
    };
  }

  if (nextBestSession.recommendationType === 'continue_challenge') {
    if (continuation.state === 'paused') {
      return {
        headline: 'Let’s get back on track.',
        subtext: 'Your next challenge session is ready.',
        supportLabel: 'Pick up where you left off.',
      };
    }

    return {
      headline: 'Keep your momentum going.',
      subtext: 'Your next challenge session is ready.',
      supportLabel:
        nextBestSession.nextSession.dayOrder != null
          ? `Next up: Day ${nextBestSession.nextSession.dayOrder}`
          : 'Your next step is ready.',
    };
  }

  if (continuation.state === 'new') {
    return {
      headline: 'Start your first session.',
      subtext: 'Your dashboard will guide what comes next after you train.',
      supportLabel: 'No sessions completed yet.',
    };
  }

  if (continuation.state === 'paused') {
    return {
      headline: 'Let’s get moving again.',
      subtext: 'Return to the dashboard and restart momentum.',
      supportLabel: 'A quick session today gets you back in rhythm.',
    };
  }

  return {
    headline: 'Keep building.',
    subtext: 'Return to the dashboard and choose your next session.',
    supportLabel: 'Consistency compounds.',
  };
}