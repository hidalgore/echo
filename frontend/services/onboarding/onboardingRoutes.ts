/**
 * ECHO Onboarding — Routes + Initial Route Resolver
 * ═════════════════════════════════════════════════
 * Route concept constants and the launch-source resolver (spec §6.1).
 * Phase 1: organic/unknown -> welcome and resume -> resume are LIVE.
 * Non-organic destinations (invite/circle/host/access) are typed and route to
 * the access-demo entry as a Phase-1 placeholder; Phase 2 wires real claim
 * screens. (Decision 4A.)
 */
import type { EchoOnboardingState } from './onboardingTypes';

export const ONBOARDING_ROUTES = {
  index: '/onboarding',
  welcome: '/onboarding/welcome',
  choosePath: '/onboarding/choose-path',
  discover: '/onboarding/discover',
  accessDemo: '/onboarding/access-demo',
  trust: '/onboarding/trust',
  eventEnergy: '/onboarding/event-energy',
  account: '/onboarding/account',
  permissions: '/onboarding/permissions',
  echoPass: '/onboarding/echo-pass',
  circle: '/onboarding/circle',
  complete: '/onboarding/complete',
  resume: '/onboarding/resume',
} as const;

/**
 * Ordered standard attendee flow. Re-sequenced to the 5-beat onboarding
 * reference: Welcome -> Pass -> Circle -> Personalize -> (account, permissions)
 * -> You're Ready. choose-path / discover / access-demo / standalone trust are
 * retired from the flow (files retained, unrouted, for reversibility).
 */
export const STANDARD_ATTENDEE_FLOW: string[] = [
  ONBOARDING_ROUTES.welcome,
  ONBOARDING_ROUTES.echoPass,
  ONBOARDING_ROUTES.circle,
  ONBOARDING_ROUTES.eventEnergy,
  ONBOARDING_ROUTES.account,
  ONBOARDING_ROUTES.permissions,
  ONBOARDING_ROUTES.complete,
];

export function nextRoute(current: string): string | null {
  const idx = STANDARD_ATTENDEE_FLOW.indexOf(current);
  if (idx === -1 || idx === STANDARD_ATTENDEE_FLOW.length - 1) return null;
  return STANDARD_ATTENDEE_FLOW[idx + 1];
}

export function progressForRoute(current: string): { step: number; total: number } {
  const total = STANDARD_ATTENDEE_FLOW.length;
  const idx = STANDARD_ATTENDEE_FLOW.indexOf(current);
  return { step: idx === -1 ? 0 : idx + 1, total };
}

/**
 * Resolve the entry route after splash, based on launch source + progress.
 * Mirrors spec §6.1. Returns app-router paths.
 */
export function resolveInitialOnboardingRoute(state: EchoOnboardingState): string {
  if (state.progress === 'completed') return '/(tabs)';
  if (state.progress === 'resume_available') return ONBOARDING_ROUTES.resume;

  switch (state.launchSource) {
    case 'event_invite_link':
    case 'echo_circle_invite':
    case 'ticket_purchase_return':
    case 'wallet_pass_link':
    case 'host_referral':
    case 'qr_scan':
    case 'nfc_tap':
    case 'web_checkout_redirect':
      // Phase 1: classified but routed through the standard narrative from the
      // top. Phase 2 repoints these to dedicated claim/host screens.
      return ONBOARDING_ROUTES.welcome;

    case 'organic_app_store':
    case 'unknown':
    default:
      return ONBOARDING_ROUTES.welcome;
  }
}
