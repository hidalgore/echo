/**
 * ECHO Onboarding — Access Guards
 * ═══════════════════════════════
 * Guest-vs-account gating (spec §9.8). Guests can browse; account-required
 * actions surface a gate rather than blocking app entry.
 */
import type { AccountState } from './onboardingTypes';

export type GatedAction =
  | 'purchase'
  | 'save_event'
  | 'add_wallet_pass'
  | 'join_circle'
  | 'claim_invite'
  | 'age_verification'
  | 'host_application';

export type BrowseAction = 'browse_events' | 'view_event_detail' | 'see_recommendations';

const ACCOUNT_REQUIRED: GatedAction[] = [
  'purchase',
  'save_event',
  'add_wallet_pass',
  'join_circle',
  'claim_invite',
  'age_verification',
  'host_application',
];

export function isAuthedState(account: AccountState): boolean {
  return (
    account === 'account_created' ||
    account === 'email_verified' ||
    account === 'oauth_connected' ||
    account === 'returning_authenticated'
  );
}

/** Whether a guest can perform an action without first creating an account. */
export function canGuestPerform(account: AccountState, action: GatedAction | BrowseAction): boolean {
  if (isAuthedState(account)) return true;
  return !ACCOUNT_REQUIRED.includes(action as GatedAction);
}
