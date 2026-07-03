/**
 * ECHO Onboarding — Analytics Wrapper
 * ═══════════════════════════════════
 * Thin wrapper over the existing logging service. Never logs sensitive age
 * verification details (spec §17).
 */
import { logEvent } from '../logging';
import type {
  OnboardingLaunchSource,
  OnboardingUserPath,
  MarketAvailabilityState,
  RecommendationReadinessState,
  FirstActionState,
  PermissionType,
} from './onboardingTypes';

export type OnboardingAnalyticsEvent =
  | 'onboarding_started'
  | 'onboarding_launch_source_detected'
  | 'onboarding_path_selected'
  | 'onboarding_screen_viewed'
  | 'onboarding_screen_completed'
  | 'onboarding_screen_skipped'
  | 'event_energy_selected'
  | 'city_selected'
  | 'guest_mode_selected'
  | 'account_created'
  | 'permission_explained'
  | 'permission_requested'
  | 'permission_granted'
  | 'permission_denied'
  | 'demo_pass_viewed'
  | 'demo_pass_interacted'
  | 'wallet_cta_tapped'
  | 'wallet_pass_added'
  | 'invite_detected'
  | 'invite_claim_started'
  | 'invite_claim_completed'
  | 'circle_invite_detected'
  | 'circle_claim_completed'
  | 'host_intent_selected'
  | 'onboarding_completed'
  | 'first_action_completed';

export type OnboardingAnalyticsPayload = {
  userPath?: OnboardingUserPath;
  launchSource?: OnboardingLaunchSource;
  screen?: string;
  timestamp?: string;
  isGuest?: boolean;
  marketAvailability?: MarketAvailabilityState;
  recommendationReadiness?: RecommendationReadinessState;
  firstAction?: FirstActionState;
  permissionType?: PermissionType;
  errorReason?: string;
};

export function trackOnboarding(
  event: OnboardingAnalyticsEvent,
  payload: OnboardingAnalyticsPayload = {}
): void {
  logEvent('onboarding', event, {
    timestamp: new Date().toISOString(),
    ...payload,
  });
}
