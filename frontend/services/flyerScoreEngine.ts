/**
 * Flyer Score Engine — V3 Canonical
 * ═════════════════════════════════
 * Per Lock 9B: 4 locked categories (Visual / Completeness / CTA / Venue).
 * Per Lock 2A: unified Flyer Score surfaced everywhere.
 * Per Lock 3A: numerical 0-100 format.
 *
 * Algo internals (how each sub-score is computed) intentionally open.
 * V3 ships with equal weighting; can retune later without breaking consumers.
 */

import type {
  FlyerScore,
  FlyerScoreBreakdown,
  V3ExtractedField,
  V3ExtractionResult,
} from '../types/v3';

// ─── Computation ────────────────────────────────────────────────────────────

/**
 * Compose a unified Flyer Score from the 4 sub-components.
 * Equal-weighted average per 9B.
 */
export function composeFlyerScore(breakdown: FlyerScoreBreakdown): FlyerScore {
  const total = Math.round(
    (breakdown.visual + breakdown.completeness + breakdown.cta + breakdown.venue) / 4,
  );

  return {
    total: clamp(total, 0, 100),
    breakdown: {
      visual: clamp(breakdown.visual, 0, 100),
      completeness: clamp(breakdown.completeness, 0, 100),
      cta: clamp(breakdown.cta, 0, 100),
      venue: clamp(breakdown.venue, 0, 100),
    },
    computedAt: new Date().toISOString(),
  };
}

/**
 * Compute Flyer Score from an extraction result.
 *
 * Visual:       From AI Vision analysis (delegated to extraction backend).
 *               If not provided by Edge Function, fallback to neutral 70.
 * Completeness: % of required fields detected (locally computable).
 * CTA:          From AI Vision analysis (delegated). Fallback to 70.
 * Venue:        Confidence of 'venue' + 'address' fields (locally computable).
 */
export function computeFlyerScoreFromExtraction(extraction: V3ExtractionResult): FlyerScore {
  // If the backend already provided a flyerScore, use it
  if (extraction.flyerScore) {
    return extraction.flyerScore;
  }

  // Fallback computation from fields (used during mock/local mode)
  const completeness = computeCompletenessScore(extraction.fields);
  const venue = computeVenueScore(extraction.fields);

  return composeFlyerScore({
    visual: 70,         // Default — Edge Function provides real value
    completeness,
    cta: 70,            // Default — Edge Function provides real value
    venue,
  });
}

// ─── Sub-component Calculators (Local, Heuristic) ──────────────────────────

/**
 * Required field set for an event flyer (per V3 spec extraction targets):
 *   title, date, time, venue, address, age, price, talent, organizer
 */
const REQUIRED_FIELDS = ['title', 'date', 'time', 'venue', 'address', 'price'] as const;
const RECOMMENDED_FIELDS = ['age', 'talent', 'organizer', 'category'] as const;

function computeCompletenessScore(fields: V3ExtractedField[]): number {
  const fieldsByKey = new Map(fields.map((f) => [f.key, f]));

  // Required fields: each missing field drops score by 100/required_count
  const requiredHits = REQUIRED_FIELDS.filter((key) => {
    const f = fieldsByKey.get(key);
    return f && f.value && String(f.value).trim().length > 0;
  }).length;
  const requiredScore = (requiredHits / REQUIRED_FIELDS.length) * 80; // 80 pts for required

  // Recommended fields: bonus up to 20 pts
  const recommendedHits = RECOMMENDED_FIELDS.filter((key) => {
    const f = fieldsByKey.get(key);
    return f && f.value && String(f.value).trim().length > 0;
  }).length;
  const recommendedScore = (recommendedHits / RECOMMENDED_FIELDS.length) * 20;

  return Math.round(requiredScore + recommendedScore);
}

function computeVenueScore(fields: V3ExtractedField[]): number {
  const venueField = fields.find((f) => f.key === 'venue');
  const addressField = fields.find((f) => f.key === 'address');

  if (!venueField || !venueField.value) return 0;

  let score = venueField.confidence;

  // Boost if address is also detected with high confidence
  if (addressField && addressField.value && addressField.confidence >= 70) {
    score = Math.min(100, score + 15);
  }

  return Math.round(score);
}

// ─── Threshold Helpers ──────────────────────────────────────────────────────

import { FLYER_SCORE_PUBLISH_FLOOR } from '../types/v3';

/** Lock 5B — true if score meets the publish-ready floor */
export function isPublishReady(score: FlyerScore | number): boolean {
  const total = typeof score === 'number' ? score : score.total;
  return total >= FLYER_SCORE_PUBLISH_FLOOR;
}

/** Recommendations for hosts to improve a sub-par flyer score (Round 10+ UX detail) */
export function getImprovementHints(score: FlyerScore): string[] {
  const hints: string[] = [];
  if (score.breakdown.visual < 70) {
    hints.push('Improve flyer image quality — sharper text, better contrast.');
  }
  if (score.breakdown.completeness < 80) {
    hints.push('Add missing details — venue, date, time, and pricing must be clearly visible.');
  }
  if (score.breakdown.cta < 70) {
    hints.push('Make the ticket info or call-to-action more prominent.');
  }
  if (score.breakdown.venue < 75) {
    hints.push('Ensure the venue name and address are clearly readable.');
  }
  return hints;
}

// ─── Utility ────────────────────────────────────────────────────────────────

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}
