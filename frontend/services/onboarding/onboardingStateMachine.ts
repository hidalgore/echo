/**
 * ECHO Onboarding — State Machine Helpers
 * ═══════════════════════════════════════
 * Pure functions that advance derived state. Screen order is in
 * onboardingRoutes.ts; this module owns the non-positional transitions
 * (recommendation readiness, user path from launch source, etc.).
 */
import type {
  EchoOnboardingState,
  OnboardingLaunchSource,
  OnboardingUserPath,
  RecommendationReadinessState,
  EventEnergySelections,
} from './onboardingTypes';

export function userPathFromLaunchSource(source: OnboardingLaunchSource): OnboardingUserPath {
  switch (source) {
    case 'event_invite_link':
      return 'claim_invite';
    case 'echo_circle_invite':
      return 'join_circle';
    case 'ticket_purchase_return':
    case 'wallet_pass_link':
    case 'web_checkout_redirect':
      return 'claim_ticket';
    case 'host_referral':
      return 'host_events';
    case 'qr_scan':
    case 'nfc_tap':
      return 'claim_ticket';
    case 'organic_app_store':
    case 'unknown':
    default:
      return 'undecided';
  }
}

/**
 * Recommendation readiness from available signal (spec §23).
 * Onboarding can reach at most interest_based / location_only; behavior and
 * purchase readiness mature later in-app.
 */
export function deriveRecommendationReadiness(
  energy: EventEnergySelections,
  locationGranted: boolean
): RecommendationReadinessState {
  const hasInterests = energy.interests.length > 0;
  if (hasInterests) return 'interest_based';
  if (locationGranted || energy.city) return 'location_only';
  return 'no_signal';
}

/**
 * Decide whether progress should be flagged resumable on next launch.
 * In progress with a recorded step (and not completed) => resume_available.
 */
export function shouldOfferResume(state: EchoOnboardingState): boolean {
  return state.progress === 'in_progress' && !!state.lastCompletedStep;
}
