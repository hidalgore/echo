/**
 * Presale Service — V3 Canonical
 * ══════════════════════════════
 * Per Lock 3C: Invite-only presale, ECHO username-tied.
 * Per Lock 4C: Single-use token, consumed on first purchase.
 * Per Lock 7B: Single transaction with host-set cap 1–8 per invite.
 *
 * Token model:
 *   - Cryptographically random (32 bytes hex)
 *   - One token = one invite = one purchase transaction (single-use)
 *   - Invitee can buy N tickets up to ticketCap in their one transaction
 *   - Token expires at presale window end OR consumption, whichever first
 */

import {
  PRESALE_DEFAULT_CAP,
  PRESALE_MAX_CAP,
  PRESALE_MIN_CAP,
  type PresaleInvite,
} from '../types/v3';

// ─── Token Generation ───────────────────────────────────────────────────────

/**
 * Generate a cryptographically-strong presale token.
 *
 * Uses Web Crypto API (available in Hermes / iOS WebKit / Android Chromium).
 * Returns 64-char hex string (32 bytes of entropy).
 */
export function generatePresaleToken(): string {
  // React Native: crypto.getRandomValues is available via expo / RN polyfill
  const bytes = new Uint8Array(32);
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(bytes);
  } else {
    // Fallback for environments without Web Crypto (should not happen in RN/Expo)
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// ─── Invite Creation ────────────────────────────────────────────────────────

export type CreatePresaleInviteInput = {
  eventId: string;
  inviteeUserId: string;
  /** 1-8 per 7B. Defaults to PRESALE_DEFAULT_CAP (2) if omitted. */
  ticketCap?: number;
  /** ISO datetime when the presale window ends */
  presaleEndDate: string;
};

export function createPresaleInvite(input: CreatePresaleInviteInput): PresaleInvite {
  const ticketCap = clampCap(input.ticketCap ?? PRESALE_DEFAULT_CAP);

  return {
    inviteToken: generatePresaleToken(),
    eventId: input.eventId,
    inviteeUserId: input.inviteeUserId,
    ticketCap,
    ticketsPurchased: 0,
    status: 'pending',
    expiresAt: input.presaleEndDate,
    createdAt: new Date().toISOString(),
  };
}

function clampCap(n: number): number {
  return Math.max(PRESALE_MIN_CAP, Math.min(PRESALE_MAX_CAP, Math.floor(n)));
}

// ─── Validation ─────────────────────────────────────────────────────────────

export type ValidationResult =
  | { valid: true; invite: PresaleInvite }
  | { valid: false; reason: string };

/**
 * Validate a presale token against an invitee's ECHO identity.
 * Per 3C: token must be tied to ECHO username (inviteeUserId).
 */
export function validatePresaleToken(
  token: string,
  inviteeUserId: string,
  invite: PresaleInvite | null,
): ValidationResult {
  if (!invite) {
    return { valid: false, reason: 'Invite not found or already used.' };
  }
  if (invite.inviteToken !== token) {
    return { valid: false, reason: 'Token mismatch.' };
  }
  if (invite.inviteeUserId !== inviteeUserId) {
    return { valid: false, reason: 'This invite belongs to a different ECHO user.' };
  }
  if (invite.status === 'consumed') {
    return { valid: false, reason: 'Invite already used.' };
  }
  if (invite.status === 'expired') {
    return { valid: false, reason: 'Invite has expired.' };
  }
  const now = new Date().getTime();
  const expiresAt = new Date(invite.expiresAt).getTime();
  if (now > expiresAt) {
    return { valid: false, reason: 'Invite has expired.' };
  }
  return { valid: true, invite };
}

// ─── Consumption ────────────────────────────────────────────────────────────

export type ConsumeResult =
  | { success: true; invite: PresaleInvite }
  | { success: false; reason: string };

/**
 * Consume a presale token in a single transaction (4C).
 * The invitee buys ticketCount tickets (up to ticketCap) in this one transaction.
 * Token is marked consumed on success.
 */
export function consumePresaleInvite(
  invite: PresaleInvite,
  ticketCount: number,
): ConsumeResult {
  if (invite.status !== 'pending') {
    return { success: false, reason: 'Invite is not active.' };
  }
  if (ticketCount < 1) {
    return { success: false, reason: 'Must purchase at least 1 ticket.' };
  }
  if (ticketCount > invite.ticketCap) {
    return {
      success: false,
      reason: `This invite allows a maximum of ${invite.ticketCap} ticket${invite.ticketCap === 1 ? '' : 's'}.`,
    };
  }

  const consumed: PresaleInvite = {
    ...invite,
    ticketsPurchased: ticketCount,
    status: 'consumed',
    consumedAt: new Date().toISOString(),
  };
  return { success: true, invite: consumed };
}

// ─── Expiry Sweep ───────────────────────────────────────────────────────────

/**
 * Mark a pending invite as expired if past its expiresAt.
 * Run on app foreground + on a cron in Phase 3.
 */
export function sweepExpiry(invite: PresaleInvite): PresaleInvite {
  if (invite.status !== 'pending') return invite;
  const now = new Date().getTime();
  const expiresAt = new Date(invite.expiresAt).getTime();
  if (now > expiresAt) {
    return { ...invite, status: 'expired' };
  }
  return invite;
}
