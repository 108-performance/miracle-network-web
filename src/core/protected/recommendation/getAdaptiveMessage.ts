import type {
  AdaptiveMessageResult,
  ContinuationStateResult,
  NextBestSessionResult,
} from './types';

function getTrainSupportLabel(nextBestSession: NextBestSessionResult) {
  if (
    nextBestSession.nextSession.phaseLabel &&
    nextBestSession.nextSession.sessionOrder != null
  ) {
    return `${nextBestSession.nextSession.phaseLabel} • Session ${nextBestSession.nextSession.sessionOrder}`;
  }

  if (nextBestSession.nextSession.phaseLabel) {
    return `${nextBestSession.nextSession.phaseLabel} is ready next.`;
  }

  if (nextBestSession.nextSession.sessionOrder != null) {
    return `Next up: Session ${nextBestSession.nextSession.sessionOrder}`;
  }

  return 'Your next Train session is ready.';
}

export function getAdaptiveMessage({
  continuation,
  nextBestSession,
}: {
  continuation: ContinuationStateResult;
  nextBestSession: NextBestSessionResult;
}): AdaptiveMessageResult {
  const hasOptionalSecondSession = Boolean(
    nextBestSession.optionalSecondSession?.workoutId
  );

  if (nextBestSession.recommendationType === 'start_train_path') {
    return {
      headline: 'Start your first session.',
      subtext: 'Your Train path is ready.',
      supportLabel:
        nextBestSession.nextSession.phaseLabel != null
          ? `Start in ${nextBestSession.nextSession.phaseLabel}.`
          : 'Your first step is ready.',
    };
  }

  if (
    nextBestSession.recommendationType === 'continue_train_path' ||
    nextBestSession.recommendationType === 'resume_train_session'
  ) {
    if (continuation.state === 'paused') {
      return {
        headline: 'Let’s get back in rhythm.',
        subtext: hasOptionalSecondSession
          ? 'One session gets you moving again. If you want to keep rolling, another is there.'
          : 'One session gets you moving again. Your next Train session is ready.',
        supportLabel: getTrainSupportLabel(nextBestSession),
      };
    }

    return {
      headline: 'Keep your momentum going.',
      subtext: hasOptionalSecondSession
        ? 'One session is a strong day. If you have time, you can stack another.'
        : 'Your next Train session is ready.',
      supportLabel: getTrainSupportLabel(nextBestSession),
    };
  }

  if (nextBestSession.recommendationType === 'fallback_to_challenge') {
    return {
      headline: 'Your Train path is complete for now.',
      subtext: 'Challenge is available as your next lane.',
      supportLabel: 'Compete when you are ready.',
    };
  }

  if (continuation.state === 'new') {
    return {
      headline: 'Start your first session.',
      subtext: 'Train will guide what comes next after you begin.',
      supportLabel: 'No sessions completed yet.',
    };
  }

  if (continuation.state === 'paused') {
    return {
      headline: 'Let’s get moving again.',
      subtext: 'A quick session today gets you back in rhythm.',
      supportLabel: 'Your next Train session is waiting.',
    };
  }

  return {
    headline: 'Keep building.',
    subtext: 'Your path will keep moving one session at a time.',
    supportLabel: 'Consistency compounds.',
  };
}