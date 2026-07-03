/**
 * Refund Policy Engine — V3 Canonical
 * ═══════════════════════════════════
 * Per Lock 6C (tiered with ECHO presets) and 7A (customer-friendly cutoffs).
 *
 * Refund cascade rule: tiers are ordered by daysBefore DESC.
 * For a cancellation at time T relative to event date E:
 *   daysBefore_at_cancel = (E - T) / 1day
 *   Find the FIRST tier where daysBefore_at_cancel >= tier.daysBefore.
 *   Apply that tier's refundPct.
 */

import {
  REFUND_PRESETS,
  REFUND_PRESET_LABELS,
  type RefundPolicy,
  type RefundPresetId,
  type RefundTier,
} from '../types/v3';

// ─── Construction ───────────────────────────────────────────────────────────

/**
 * Create a RefundPolicy from a preset id.
 * Tiers are deep-cloned to preserve at-time-of-publish behavior.
 */
export function createRefundPolicy(presetId: RefundPresetId): RefundPolicy {
  return {
    presetId,
    tiers: REFUND_PRESETS[presetId].map((t) => ({ ...t })),
  };
}

// ─── Migration (R6) ─────────────────────────────────────────────────────────

/**
 * R6 migration mapping for v59.3 boolean refund flag.
 *
 *   allowRefunds: true  → 'balanced' (sensible default)
 *   allowRefunds: false → 'strict'   (closest to "no refunds" intent)
 */
export function migrateLegacyRefundFlag(allowRefunds: boolean): RefundPolicy {
  return createRefundPolicy(allowRefunds ? 'balanced' : 'strict');
}

/** Inverse for any remaining legacy consumers during migration window */
export function legacyAllowRefunds(policy: RefundPolicy): boolean {
  // True if any tier offers a non-zero refund
  return policy.tiers.some((t) => t.refundPct > 0);
}

// ─── Refund Computation ─────────────────────────────────────────────────────

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/**
 * Compute the applicable refund percentage and amount for a cancellation.
 *
 * @param policy            Refund policy snapshotted at publish time
 * @param ticketPriceCents  Price of ticket in cents
 * @param eventDateISO      ISO datetime when event happens
 * @param cancellationDateISO ISO datetime when cancellation is requested
 * @returns { refundPct, refundAmountCents }
 */
export function computeRefundAmount(
  policy: RefundPolicy,
  ticketPriceCents: number,
  eventDateISO: string,
  cancellationDateISO: string,
): { refundPct: number; refundAmountCents: number; tierApplied: RefundTier | null } {
  const eventTime = new Date(eventDateISO).getTime();
  const cancelTime = new Date(cancellationDateISO).getTime();
  const daysBefore = Math.max(0, Math.floor((eventTime - cancelTime) / MS_PER_DAY));

  // Sort tiers by daysBefore DESC, find first qualifying tier
  const sortedTiers = [...policy.tiers].sort((a, b) => b.daysBefore - a.daysBefore);
  const tierApplied = sortedTiers.find((t) => daysBefore >= t.daysBefore) ?? null;

  const refundPct = tierApplied?.refundPct ?? 0;
  const refundAmountCents = Math.round((ticketPriceCents * refundPct) / 100);

  return { refundPct, refundAmountCents, tierApplied };
}

// ─── UI Helpers ─────────────────────────────────────────────────────────────

export function getRefundPresetLabel(presetId: RefundPresetId): string {
  return REFUND_PRESET_LABELS[presetId].label;
}

export function getRefundPresetDescription(presetId: RefundPresetId): string {
  return REFUND_PRESET_LABELS[presetId].description;
}

/**
 * Render policy tiers as a human-readable list for UI display.
 * Example: ["100% refund up to 7 days before", "50% refund up to 48 hours before", "No refund after"]
 */
export function describeTiers(policy: RefundPolicy): string[] {
  const sorted = [...policy.tiers].sort((a, b) => b.daysBefore - a.daysBefore);
  return sorted.map((t) => {
    if (t.refundPct === 0) {
      return 'No refund after';
    }
    if (t.daysBefore >= 7) {
      return `${t.refundPct}% refund up to ${t.daysBefore} days before`;
    }
    if (t.daysBefore >= 1) {
      const hours = t.daysBefore * 24;
      return `${t.refundPct}% refund up to ${hours} hours before`;
    }
    return `${t.refundPct}% refund`;
  });
}
