/**
 * Access Pass Service — Canonical credential helpers
 * Guests receive Access Passes, not generic tickets. Ticket wording may still
 * appear only in quantity/pricing purchase contexts.
 */

import type { AccessPass, NFCChallengeResponseConfig, SignedCredential } from '../types/canonicalPlatform';
import type { AccessTierId, AccessZoneId } from '../types/v3';

export function createAccessPass(args: {
  id: string;
  attendeeId: string;
  eventId: string;
  tierId: AccessTierId;
  permissions: AccessZoneId[];
  issuedAt?: string;
}): AccessPass {
  return {
    id: args.id,
    attendeeId: args.attendeeId,
    eventId: args.eventId,
    tierId: args.tierId,
    permissions: args.permissions,
    status: 'issued',
    issuedAt: args.issuedAt ?? new Date().toISOString(),
  };
}

export function buildSignedCredential(args: {
  credentialId: string;
  accessPass: AccessPass;
  type: SignedCredential['type'];
  validationToken: string;
  signature: string;
  expiresAt?: string;
}): SignedCredential {
  return {
    credentialId: args.credentialId,
    accessPassId: args.accessPass.id,
    type: args.type,
    eventId: args.accessPass.eventId,
    tierId: args.accessPass.tierId,
    accessRights: args.accessPass.permissions,
    validationToken: args.validationToken,
    signature: args.signature,
    issuedAt: new Date().toISOString(),
    expiresAt: args.expiresAt,
    rotatingQrEnabled: args.type === 'qr_fallback',
    screenshotResistant: args.type === 'qr_fallback',
  };
}

export function buildNfcChallengeResponseConfig(args: {
  credentialId: string;
  hardwareDeviceId?: string;
  challengeNonce: string;
}): NFCChallengeResponseConfig {
  return {
    credentialId: args.credentialId,
    hardwareDeviceId: args.hardwareDeviceId,
    challengeNonce: args.challengeNonce,
    signedResponseRequired: true,
    serialNumberOnlyValidationAllowed: false,
    replayProtectionEnabled: true,
  };
}
