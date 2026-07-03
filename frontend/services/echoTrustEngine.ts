/**
 * EchoTrustEngine — Phase 2 Canonical Stub
 * Recommendation-only trust scoring for user, host, venue, event, payment,
 * access, and hardware layers. Humans remain final decision-makers.
 */

import type {
  EchoTrustLayer,
  EchoTrustProfile,
  TrustDecision,
  TrustSignal,
  UserTrustFactors,
  HostTrustFactors,
  VenueTrustFactors,
  EventTrustFactors,
  PaymentTrustFactors,
  AccessTrustFactors,
  HardwareTrustFactors,
} from '../types/canonicalPlatform';

export function evaluateUserTrust(subjectId: string, factors: UserTrustFactors, nowIso = new Date().toISOString()): EchoTrustProfile {
  const signals: TrustSignal[] = [];
  addBooleanSignal(signals, 'identity', 'Email verified', factors.emailVerified, 12, nowIso);
  addBooleanSignal(signals, 'identity', 'Phone verified', factors.phoneVerified, 12, nowIso);
  addBooleanSignal(signals, 'identity', 'Trusted device present', factors.trustedDeviceCount > 0, 8, nowIso);
  addBooleanSignal(signals, 'access', 'Attendance history', factors.attendanceCount > 0, 8, nowIso);

  if (factors.chargebackCount > 0) {
    signals.push(makeSignal('payment_chargebacks', 'payment', 'Chargeback history', 'critical', -40, nowIso));
  }
  if (factors.securityIncidentCount > 0) {
    signals.push(makeSignal('security_incidents', 'access', 'Security incident history', 'critical', -50, nowIso));
  }
  if (factors.ageVerificationStatus === 'failed') {
    signals.push(makeSignal('age_failed', 'identity', 'Age verification failed', 'critical', -60, nowIso));
  }

  return buildProfile(subjectId, 'user', signals, nowIso);
}

export function evaluateHostTrust(subjectId: string, factors: HostTrustFactors, nowIso = new Date().toISOString()): EchoTrustProfile {
  const signals: TrustSignal[] = [];
  addBooleanSignal(signals, 'host', 'Business verified', factors.businessVerified, 20, nowIso);
  addBooleanSignal(signals, 'host', 'Tax profile verified', factors.taxVerified, 15, nowIso);
  addBooleanSignal(signals, 'venue', 'Venue verification rate healthy', factors.venueVerificationRate >= 80, 12, nowIso);
  addBooleanSignal(signals, 'event', 'Completed event history', factors.completedEventCount > 0, 10, nowIso);
  addBooleanSignal(signals, 'event', 'Attendance success healthy', factors.attendanceSuccessPct >= 85, 15, nowIso);

  if (factors.refundRatePct > 25) signals.push(makeSignal('high_refund_rate', 'payment', 'High refund rate', 'warning', -20, nowIso));
  if (factors.chargebackRatePct > 2) signals.push(makeSignal('high_chargeback_rate', 'payment', 'High chargeback rate', 'critical', -35, nowIso));
  signals.push(...factors.reputationSignals);

  return buildProfile(subjectId, 'host', signals, nowIso);
}

export function evaluateVenueTrust(subjectId: string, factors: VenueTrustFactors, nowIso = new Date().toISOString()): EchoTrustProfile {
  const signals: TrustSignal[] = [];
  addBooleanSignal(signals, 'venue', 'Ownership verified', factors.ownershipVerified, 22, nowIso);
  addBooleanSignal(signals, 'venue', 'Capacity verified', factors.capacityVerified, 14, nowIso);
  addBooleanSignal(signals, 'venue', 'Venue manager assigned', factors.venueManagerCount > 0, 8, nowIso);
  addBooleanSignal(signals, 'event', 'Prior event history', factors.priorEventCount > 0, 10, nowIso);
  if (factors.incidentCount > 0) {
    signals.push(makeSignal('venue_incidents', 'venue', 'Venue incident history', 'warning', -15 * Math.min(3, factors.incidentCount), nowIso));
  }
  return buildProfile(subjectId, 'venue', signals, nowIso);
}

export function evaluateEventTrust(subjectId: string, factors: EventTrustFactors, nowIso = new Date().toISOString()): EchoTrustProfile {
  const signals: TrustSignal[] = [];
  addBooleanSignal(signals, 'host', 'Host verified', factors.hostVerified, 18, nowIso);
  addBooleanSignal(signals, 'event', 'Age gating configured', factors.ageGatingConfigured, 10, nowIso);
  addBooleanSignal(signals, 'payment', 'Refund policy set', factors.refundPolicySet, 8, nowIso);
  addBooleanSignal(signals, 'event', 'Flyer quality healthy', factors.flyerScore >= 80, 12, nowIso);
  if (factors.duplicateReportCount > 0) {
    signals.push(makeSignal('event_duplicate_reports', 'event', 'Duplicate-event reports', 'critical', -25, nowIso));
  }
  return buildProfile(subjectId, 'event', signals, nowIso);
}

export function evaluatePaymentTrust(subjectId: string, factors: PaymentTrustFactors, nowIso = new Date().toISOString()): EchoTrustProfile {
  const signals: TrustSignal[] = [];
  addBooleanSignal(signals, 'payment', 'Processor connected', factors.processorConnected, 18, nowIso);
  addBooleanSignal(signals, 'payment', 'Payout MFA enabled', factors.mfaEnabled, 14, nowIso);
  if (factors.chargebackRatePct > 2) signals.push(makeSignal('pay_chargebacks', 'payment', 'High chargeback rate', 'critical', -35, nowIso));
  if (factors.refundRatePct > 25) signals.push(makeSignal('pay_refunds', 'payment', 'High refund rate', 'warning', -18, nowIso));
  if (factors.payoutHoldActive) signals.push(makeSignal('pay_hold', 'payment', 'Payout security hold active', 'warning', -10, nowIso));
  return buildProfile(subjectId, 'event', signals, nowIso);
}

export function evaluateAccessTrust(subjectId: string, factors: AccessTrustFactors, nowIso = new Date().toISOString()): EchoTrustProfile {
  const signals: TrustSignal[] = [];
  addBooleanSignal(signals, 'access', 'Signed credentials', factors.signedCredentials, 16, nowIso);
  addBooleanSignal(signals, 'access', 'Replay protection', factors.replayProtection, 12, nowIso);
  addBooleanSignal(signals, 'access', 'Duplicate scan detection', factors.duplicateScanDetection, 12, nowIso);
  addBooleanSignal(signals, 'access', 'Offline cache valid', factors.offlineCacheValid, 8, nowIso);
  // Serial-number-only NFC is insecure for production — challenge-response is required for full trust.
  if (!factors.nfcChallengeResponse) {
    signals.push(makeSignal('access_nfc_serial_only', 'access', 'NFC serial-number-only (insecure)', 'warning', -20, nowIso));
  } else {
    signals.push(makeSignal('access_nfc_challenge', 'access', 'NFC challenge-response', 'positive', 14, nowIso));
  }
  return buildProfile(subjectId, 'credential', signals, nowIso);
}

export function evaluateHardwareTrust(subjectId: string, factors: HardwareTrustFactors, nowIso = new Date().toISOString()): EchoTrustProfile {
  const signals: TrustSignal[] = [];
  addBooleanSignal(signals, 'hardware', 'Device certificate', factors.deviceCertified, 18, nowIso);
  addBooleanSignal(signals, 'hardware', 'Clone detection', factors.cloneDetection, 14, nowIso);
  addBooleanSignal(signals, 'hardware', 'Secure element', factors.secureElement, 14, nowIso);
  addBooleanSignal(signals, 'hardware', 'Trusted registry enrolled', factors.trustedRegistryEnrolled, 10, nowIso);
  addBooleanSignal(signals, 'hardware', 'Firmware current', factors.firmwareCurrent, 6, nowIso);
  return buildProfile(subjectId, 'device', signals, nowIso);
}

export function recommendTrustDecision(score: number): TrustDecision {
  if (score >= 75) return 'allow';
  if (score >= 55) return 'allow_with_review';
  if (score >= 35) return 'hold';
  if (score >= 20) return 'escalate';
  return 'deny';
}

function buildProfile(subjectId: string, subjectType: EchoTrustProfile['subjectType'], signals: TrustSignal[], nowIso: string): EchoTrustProfile {
  const raw = 50 + signals.reduce((sum, signal) => sum + signal.weight, 0);
  const score = Math.max(0, Math.min(100, Math.round(raw)));
  const decision = recommendTrustDecision(score);
  return {
    subjectId,
    subjectType,
    internalScore: score,
    publicLabel: score >= 75 ? 'Trusted' : score >= 55 ? 'Verified' : score >= 35 ? 'Review Required' : 'Restricted',
    signals,
    lastEvaluatedAt: nowIso,
    decision,
    recommendationOnly: true,
  };
}

function addBooleanSignal(signals: TrustSignal[], layer: EchoTrustLayer, label: string, value: boolean, weight: number, nowIso: string) {
  signals.push(makeSignal(label.toLowerCase().replace(/\s+/g, '_'), layer, label, value ? 'positive' : 'warning', value ? weight : -Math.round(weight / 2), nowIso));
}

function makeSignal(id: string, layer: EchoTrustLayer, label: string, severity: TrustSignal['severity'], weight: number, observedAt: string): TrustSignal {
  return { id, layer, label, severity, weight, observedAt, source: 'system' };
}
