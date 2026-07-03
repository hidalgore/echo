/**
 * ECHO Access Control Service
 * ═══════════════════════════
 * Door Mode helpers for Access Pass validation, VIP vs GA differentiation,
 * zone checks, guest holds/denials, and calm staff-facing scan copy.
 */

import type {
  AccessPassCredential,
  AccessTierId,
  AccessZoneId,
  GuestAccessDecision,
  GuestAccessState,
} from '../types/v3';
import { ACCESS_TIER_DEFINITIONS } from '../types/v3';

export type DoorScanResult = {
  approved: boolean;
  colorToken: string;
  headline: string;
  subheadline: string;
  tierId: AccessTierId;
  zoneId: AccessZoneId;
  showVipArrivalAlert: boolean;
  hapticPattern: 'success' | 'warning' | 'error';
};

export function buildDoorScanResult(args: {
  credential: AccessPassCredential;
  zoneId?: AccessZoneId;
  guestDecision?: GuestAccessDecision;
  duplicateAttempt?: boolean;
}): DoorScanResult {
  const tier = ACCESS_TIER_DEFINITIONS[args.credential.tierId];
  const zoneId = args.zoneId ?? 'main_entry';

  if (args.duplicateAttempt) {
    return deniedResult(args.credential.tierId, zoneId, 'Duplicate Attempt Blocked', 'This Access Pass has already been used.');
  }

  if (args.guestDecision && args.guestDecision.state !== 'approved') {
    return guestDecisionResult(args.credential.tierId, zoneId, args.guestDecision);
  }

  if (!tier.allowedZones.includes(zoneId)) {
    return deniedResult(args.credential.tierId, zoneId, 'Wrong Access Zone', `${tier.label} does not include this checkpoint.`);
  }

  return {
    approved: true,
    colorToken: tier.colorToken,
    headline: tier.scanLabel,
    subheadline: zoneLabel(zoneId),
    tierId: tier.id,
    zoneId,
    showVipArrivalAlert: tier.doorAlertEnabled,
    hapticPattern: 'success',
  };
}

export function canTierAccessZone(tierId: AccessTierId, zoneId: AccessZoneId): boolean {
  return ACCESS_TIER_DEFINITIONS[tierId].allowedZones.includes(zoneId);
}

function deniedResult(tierId: AccessTierId, zoneId: AccessZoneId, headline: string, subheadline: string): DoorScanResult {
  return {
    approved: false,
    colorToken: 'red',
    headline,
    subheadline,
    tierId,
    zoneId,
    showVipArrivalAlert: false,
    hapticPattern: 'error',
  };
}

function guestDecisionResult(tierId: AccessTierId, zoneId: AccessZoneId, decision: GuestAccessDecision): DoorScanResult {
  const warningStates: GuestAccessState[] = ['flagged', 'security_hold'];
  return {
    approved: false,
    colorToken: warningStates.includes(decision.state) ? 'gold' : 'red',
    headline: decision.state === 'security_hold' ? 'Security Hold' : decision.state === 'flagged' ? 'Guest Flagged' : 'Access Denied',
    subheadline: decision.staffFacingMessage,
    tierId,
    zoneId,
    showVipArrivalAlert: false,
    hapticPattern: warningStates.includes(decision.state) ? 'warning' : 'error',
  };
}

function zoneLabel(zoneId: AccessZoneId): string {
  switch (zoneId) {
    case 'main_entry': return 'Main Entry';
    case 'vip_lounge': return 'VIP Lounge';
    case 'meet_and_greet': return 'Meet & Greet';
    case 'backstage': return 'Backstage';
    case 'after_party': return 'After Party';
    case 'sponsor_lounge': return 'Sponsor Lounge';
    case 'restricted_area': return 'Restricted Area';
    case 'green_room': return 'Green Room';
    case 'stage_access': return 'Stage Access';
    case 'operations_areas': return 'Operations Areas';
    default: return 'Entry';
  }
}

export function buildAccessFailureCopy(reason: import('../types/v3').AccessFailureReason): { headline: string; action: import('../types/v3').AccessIssueResolutionAction[] } {
  switch (reason) {
    case 'payment_reversed':
      return { headline: 'Payment Reversed', action: ['view_details', 'contact_host'] };
    case 'age_verification_required':
      return { headline: 'Age Verification Required', action: ['view_details', 'contact_host'] };
    case 'credential_already_used':
      return { headline: 'Credential Already Used', action: ['view_details', 'supervisor_override'] };
    case 'credential_suspended':
      return { headline: 'Credential Suspended', action: ['view_details', 'contact_host'] };
    case 'access_not_authorized':
      return { headline: 'Access Not Authorized', action: ['view_details', 'supervisor_override', 'contact_host'] };
    case 'offline_cache_expired':
      return { headline: 'Offline Cache Expired', action: ['view_details', 'contact_host'] };
    case 'signed_credential_invalid':
      return { headline: 'Credential Could Not Be Verified', action: ['view_details', 'place_security_hold'] };
    case 'nfc_challenge_failed':
      return { headline: 'NFC Challenge Failed', action: ['view_details', 'place_security_hold', 'escalate_to_echo_trust'] };
    default:
      return { headline: 'Access Review Required', action: ['view_details'] };
  }
}

export function buildAITrustAssistantRecommendation(args: {
  eventId: string;
  guestUserId?: string;
  passId?: string;
  suggestedAction: import('../types/v3').SecurityAction;
  confidence: number;
  reasons: string[];
}): import('../types/v3').AITrustAssistantRecommendation {
  return {
    recommendationId: `trust_rec_${Math.random().toString(36).slice(2)}_${Date.now()}`,
    eventId: args.eventId,
    guestUserId: args.guestUserId,
    passId: args.passId,
    suggestedAction: args.suggestedAction,
    confidence: args.confidence,
    reasons: args.reasons,
    recommendationOnly: true,
    humanFinalDecisionRequired: true,
    createdAt: new Date().toISOString(),
  };
}

// ─── Door Mode Result View (decision 5B) ─────────────────────────────────────

/**
 * Full-screen Door Mode result the scan screen renders (Access Control spec).
 * Composes the existing buildDoorScanResult with the credential + tier so the
 * screen has everything in one object: guest name, tier, authorized areas,
 * special instructions, verification state, decision, failure reason, and the
 * suggested staff action. Pure/deterministic; safe for offline Door Mode.
 */
export type DoorVerificationState = 'verified' | 'duplicate_blocked' | 'security_hold' | 'flagged' | 'denied' | 'wrong_zone';

export type DoorModeResultView = {
  approved: boolean;
  decisionLabel: string;
  colorToken: string;
  hapticPattern: 'success' | 'warning' | 'error';
  guestName: string;
  tierId: AccessTierId;
  tierLabel: string;
  checkpointLabel: string;
  authorizedAreas: string[];
  specialInstructions?: string;
  verificationState: DoorVerificationState;
  /** Present on denial/hold */
  failureReason?: string;
  /** Calm, single next step for door staff */
  suggestedStaffAction: string;
  showVipArrivalAlert: boolean;
};

export function buildDoorModeResultView(args: {
  credential: AccessPassCredential;
  zoneId?: AccessZoneId;
  guestDecision?: GuestAccessDecision;
  duplicateAttempt?: boolean;
  specialInstructions?: string;
}): DoorModeResultView {
  const scan = buildDoorScanResult(args);
  const tier = ACCESS_TIER_DEFINITIONS[args.credential.tierId];
  const zoneId = args.zoneId ?? 'main_entry';

  let verificationState: DoorVerificationState = 'verified';
  let failureReason: string | undefined;
  let suggestedStaffAction = 'Allow entry.';

  if (!scan.approved) {
    if (args.duplicateAttempt) {
      verificationState = 'duplicate_blocked';
      failureReason = 'This Access Pass has already been used.';
      suggestedStaffAction = 'Hold the guest and verify identity before any override.';
    } else if (args.guestDecision?.state === 'security_hold') {
      verificationState = 'security_hold';
      failureReason = args.guestDecision.staffFacingMessage;
      suggestedStaffAction = 'Route the guest to the Security Hold lane.';
    } else if (args.guestDecision?.state === 'flagged') {
      verificationState = 'flagged';
      failureReason = args.guestDecision.staffFacingMessage;
      suggestedStaffAction = 'Proceed with caution; a supervisor may review.';
    } else if (!tier.allowedZones.includes(zoneId)) {
      verificationState = 'wrong_zone';
      failureReason = `${tier.label} is not authorized at this checkpoint.`;
      suggestedStaffAction = 'Direct the guest to their authorized entrance.';
    } else {
      verificationState = 'denied';
      failureReason = args.guestDecision?.staffFacingMessage ?? 'Access not authorized.';
      suggestedStaffAction = 'Do not admit. Offer Contact Host for resolution.';
    }
  }

  return {
    approved: scan.approved,
    decisionLabel: scan.headline,
    colorToken: scan.colorToken,
    hapticPattern: scan.hapticPattern,
    guestName: args.credential.holderName ?? 'Guest',
    tierId: tier.id,
    tierLabel: tier.label,
    checkpointLabel: zoneLabel(zoneId),
    authorizedAreas: tier.allowedZones.map(zoneLabel),
    specialInstructions: args.specialInstructions,
    verificationState,
    failureReason,
    suggestedStaffAction,
    showVipArrivalAlert: scan.showVipArrivalAlert,
  };
}
