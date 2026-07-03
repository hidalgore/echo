/**
 * Event Success Score (ESS) Engine — V3 Canonical
 * ═══════════════════════════════════════════════
 * Per Lock 5A: ESS = (Flyer + Trust + Pricing + Competition) / 4 (when all available).
 * Per Lock 9A: Exclude missing sub-scores from divisor.
 *   V3 default: ESS = (Flyer + Pricing + Competition) / 3
 *   (Trust excluded until EchoTrustEngine ships — per 8B binary stub)
 *
 * Distinct from v59.3's Event Operations Score (R2 rename of computeEventHealth).
 * - Operations Score = live event performance
 * - Success Score = setup quality + market fit
 */

import type { EventSuccessScore, ESSSubScore, TrustScoreStub } from '../types/v3';

// ─── Inputs ─────────────────────────────────────────────────────────────────

export type ESSInputs = {
  /** Flyer Score 0-100, or null if not yet computed */
  flyerScore: number | null;
  /** V3 stub — binary verified badge (8B). Null means unavailable; bool means available */
  trustVerified: boolean | null;
  /** Pricing Score 0-100, null when Market Pulse data insufficient */
  pricingScore: number | null;
  /** Competition Score 0-100, null when Market Pulse data insufficient */
  competitionScore: number | null;
};

// ─── Computation ────────────────────────────────────────────────────────────

/**
 * Compute the Event Success Score with available-sub-score divisor (9A).
 *
 * Note on Trust handling:
 *   V3 ships with TrustEngine STUBBED. Per 9A, the stub state means
 *   Trust is EXCLUDED from the ESS divisor entirely — NOT mapped to 0/50/100.
 *   This keeps the score honest until the real engine ships.
 */
export function computeEventSuccessScore(inputs: ESSInputs): EventSuccessScore {
  const flyerSub: ESSSubScore = inputs.flyerScore != null
    ? { score: inputs.flyerScore, available: true }
    : { score: 0, available: false, reason: 'Flyer Score not yet computed' };

  // Per 8B + 9A: Trust is excluded from divisor until TrustEngine ships
  // The binary verified status drives a separate badge surface, not the score.
  const trustSub: ESSSubScore = {
    score: 0,
    available: false,
    reason: 'Trust Score arrives when EchoTrustEngine ships',
  };

  const pricingSub: ESSSubScore = inputs.pricingScore != null
    ? { score: inputs.pricingScore, available: true }
    : { score: 0, available: false, reason: 'Market data still building' };

  const competitionSub: ESSSubScore = inputs.competitionScore != null
    ? { score: inputs.competitionScore, available: true }
    : { score: 0, available: false, reason: 'Market data still building' };

  // Build divisor + sum from available sub-scores only (9A)
  const availableScores: number[] = [];
  if (flyerSub.available) availableScores.push(flyerSub.score);
  if (trustSub.available) availableScores.push(trustSub.score);
  if (pricingSub.available) availableScores.push(pricingSub.score);
  if (competitionSub.available) availableScores.push(competitionSub.score);

  const divisor = availableScores.length;
  const sum = availableScores.reduce((acc, n) => acc + n, 0);
  const total = divisor > 0 ? Math.round(sum / divisor) : 0;

  return {
    total,
    divisor,
    subScores: {
      flyer: flyerSub,
      trust: trustSub,
      pricing: pricingSub,
      competition: competitionSub,
    },
  };
}

// ─── Display Helpers ────────────────────────────────────────────────────────

/**
 * Minimum divisor rule for displaying ESS (from v1.1 Locks Part C backlog).
 * Display ESS only when ≥ 2 real sub-scores are available — otherwise the
 * score is too thin to be meaningful. UI surfaces "Building signal" state.
 */
export const ESS_MIN_DIVISOR_TO_DISPLAY = 2;

export function isESSDisplayable(ess: EventSuccessScore): boolean {
  return ess.divisor >= ESS_MIN_DIVISOR_TO_DISPLAY;
}

/**
 * Categorical label for ESS (for calm-trust UI per ECHO doctrine).
 * Numerical score remains primary; label is supplementary.
 */
export function getESSLabel(ess: EventSuccessScore): string {
  if (!isESSDisplayable(ess)) return 'Building signal';
  if (ess.total >= 85) return 'Excellent';
  if (ess.total >= 70) return 'Strong';
  if (ess.total >= 55) return 'Good';
  if (ess.total >= 40) return 'Needs work';
  return 'Significant gaps';
}

/**
 * Convenience: derive TrustScoreStub from host verified flag (8B).
 * Surfaces as a binary badge separate from ESS.
 */
export function buildTrustScoreStub(verified: boolean): TrustScoreStub {
  return {
    verified,
    label: verified ? 'Verified Host' : 'Unverified',
  };
}
