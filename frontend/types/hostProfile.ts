/**
 * Host Profile Types
 * ══════════════════
 * Progressive host activation + capability gating.
 * One account, two modes: ECHO (consumer) + HOST (organizer).
 */

// ─── Account-level ──────────────────────────────────────────────────────────

export type AccountStatus = 'active' | 'restricted' | 'suspended';

// ─── Mode system ────────────────────────────────────────────────────────────

export type AppMode = 'echo' | 'host';

// ─── Host access status (progressive) ───────────────────────────────────────

export type HostAccessStatus =
  | 'not_started'
  | 'in_progress'
  | 'action_required'
  | 'active'
  | 'restricted'
  | 'suspended';

// ─── Host type ──────────────────────────────────────────────────────────────

export type HostType =
  | 'individual'
  | 'business'
  | 'nonprofit'
  | 'venue'
  | 'promoter';

export const HOST_TYPE_LABELS: Record<HostType, string> = {
  individual: 'Individual',
  business: 'Business',
  nonprofit: 'Nonprofit',
  venue: 'Venue',
  promoter: 'Promoter',
};

// ─── Event types the host produces ──────────────────────────────────────────

export const EVENT_TYPE_OPTIONS = [
  'Music',
  'Nightlife',
  'Food & Drink',
  'Arts & Culture',
  'Sports',
  'Comedy',
  'Networking',
  'Wellness',
  'Community',
  'Other',
] as const;

export type EventTypeOption = (typeof EVENT_TYPE_OPTIONS)[number];

// ─── Host profile ───────────────────────────────────────────────────────────

export interface HostProfile {
  id: string;
  userId: string;
  hostAccessStatus: HostAccessStatus;
  displayName: string;
  legalName?: string;
  hostType: HostType | null;
  city: string;
  eventTypes: EventTypeOption[];
  termsAccepted: boolean;
  onboardingCompleted: boolean;
  activatedAt?: string;
}


export type EchoDiskStatus = 'empty' | 'registered' | 'verified' | 'needs_recheck' | 'not_detected' | 'serial_mismatch';

export interface EchoDiskSlot {
  slotId: 'primary' | 'backup';
  nickname: string;
  serialNumber: string;
  status: EchoDiskStatus;
  lastVerifiedAt?: string;
}

// ─── Host activation steps ──────────────────────────────────────────────────

export type HostActivationStep = 'intro' | 'basics' | 'verification' | 'terms';

export const ACTIVATION_STEP_ORDER: HostActivationStep[] = [
  'intro',
  'basics',
  'verification',
  'terms',
];

// ─── Payout profile ─────────────────────────────────────────────────────────

export type PayoutStatus =
  | 'not_started'
  | 'incomplete'
  | 'pending_verification'
  | 'connected'
  | 'restricted'
  | 'disabled';

export interface PayoutProfile {
  id: string;
  userId: string;
  provider: 'stripe' | 'none';
  payoutStatus: PayoutStatus;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  onboardingUrl?: string;
  updatedAt: string;
}

// ─── Risk profile ───────────────────────────────────────────────────────────

export type RiskStatus = 'clear' | 'soft_flag' | 'hard_block';

export interface RiskProfile {
  userId: string;
  riskStatus: RiskStatus;
  flags: string[];
  evaluatedAt: string;
}

// ─── Capability flags ───────────────────────────────────────────────────────

export interface HostCapabilities {
  canAccessHostMode: boolean;
  canCreateDraftEvents: boolean;
  canPublishFreeEvents: boolean;
  canPublishPaidEvents: boolean;
  canEditPublishedEvents: boolean;
  canUseDoorMode: boolean;
  canReceivePayouts: boolean;
  canViewHostAnalytics: boolean;
}

/**
 * Derive capabilities from profile state.
 * Single source of truth — never hardcode UI checks elsewhere.
 */
export function deriveCapabilities(
  hostStatus: HostAccessStatus,
  payoutStatus: PayoutStatus,
  riskStatus: RiskStatus,
  accountStatus: AccountStatus,
): HostCapabilities {
  if (accountStatus === 'suspended' || hostStatus === 'suspended') {
    return {
      canAccessHostMode: false,
      canCreateDraftEvents: false,
      canPublishFreeEvents: false,
      canPublishPaidEvents: false,
      canEditPublishedEvents: false,
      canUseDoorMode: false,
      canReceivePayouts: false,
      canViewHostAnalytics: false,
    };
  }

  if (hostStatus === 'not_started' || hostStatus === 'in_progress') {
    return {
      canAccessHostMode: hostStatus === 'in_progress',
      canCreateDraftEvents: false,
      canPublishFreeEvents: false,
      canPublishPaidEvents: false,
      canEditPublishedEvents: false,
      canUseDoorMode: false,
      canReceivePayouts: false,
      canViewHostAnalytics: false,
    };
  }

  if (hostStatus === 'action_required') {
    return {
      canAccessHostMode: true,
      canCreateDraftEvents: true,
      canPublishFreeEvents: false,
      canPublishPaidEvents: false,
      canEditPublishedEvents: false,
      canUseDoorMode: false,
      canReceivePayouts: false,
      canViewHostAnalytics: true,
    };
  }

  const isRestricted = hostStatus === 'restricted' || riskStatus === 'soft_flag';
  const payoutReady = payoutStatus === 'connected' && riskStatus !== 'hard_block';

  return {
    canAccessHostMode: true,
    canCreateDraftEvents: true,
    canPublishFreeEvents: !isRestricted || riskStatus !== 'hard_block',
    canPublishPaidEvents: payoutReady && !isRestricted,
    canEditPublishedEvents: true,
    canUseDoorMode: !isRestricted,
    canReceivePayouts: payoutReady,
    canViewHostAnalytics: true,
  };
}

// ─── Activation evaluator ───────────────────────────────────────────────────

export interface ActivationInput {
  emailVerified: boolean;
  phoneVerified: boolean;
  displayName: string;
  hostType: HostType | null;
  city: string;
  eventTypes: EventTypeOption[];
  termsAccepted: boolean;
  accountStatus: AccountStatus;
  riskStatus: RiskStatus;
}

export type ActivationResult = 'active' | 'action_required' | 'restricted' | 'suspended';

export function evaluateActivation(input: ActivationInput): ActivationResult {
  if (input.accountStatus === 'suspended' || input.riskStatus === 'hard_block') {
    return 'suspended';
  }

  if (input.riskStatus === 'soft_flag') {
    return 'restricted';
  }

  const complete =
    input.emailVerified &&
    input.phoneVerified &&
    input.displayName.trim().length > 0 &&
    input.hostType !== null &&
    input.city.trim().length > 0 &&
    input.eventTypes.length > 0 &&
    input.termsAccepted;

  return complete ? 'active' : 'action_required';
}

// ─── Missing fields helper ──────────────────────────────────────────────────

export function getMissingActivationFields(input: ActivationInput): string[] {
  const missing: string[] = [];
  if (!input.emailVerified) missing.push('Verify your email');
  if (!input.phoneVerified) missing.push('Verify your phone');
  if (!input.displayName.trim()) missing.push('Enter a display name');
  if (!input.hostType) missing.push('Select a host type');
  if (!input.city.trim()) missing.push('Select your city');
  if (input.eventTypes.length === 0) missing.push('Select at least one event type');
  if (!input.termsAccepted) missing.push('Accept host terms');
  return missing;
}
