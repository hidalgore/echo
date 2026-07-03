/**
 * Host AI Types
 * ═════════════
 * Types for ECHO Intelligence surfaces across HOST mode.
 * One insight, one reason, one action. Premium, not chatbot.
 */

// ─── Intelligence Card State Priority ───────────────────────────────────────
// Only one state shown at a time, in this exact priority order:

export type IntelligenceState =
  | 'live_event'
  | 'event_today'
  | 'post_event_recap'
  | 'weak_momentum'
  | 'strong_momentum'
  | 'draft_exists'
  | 'no_event';

export const INTELLIGENCE_PRIORITY: IntelligenceState[] = [
  'live_event',
  'event_today',
  'post_event_recap',
  'weak_momentum',
  'strong_momentum',
  'draft_exists',
  'no_event',
];

export interface IntelligenceInsight {
  state: IntelligenceState;
  eyebrow: string;
  mainInsight: string;
  supportLine?: string;
  ctaLabel: string;
  ctaAction: string; // route or action key
  secondaryLabel?: string;
  secondaryAction?: string;
}

// ─── Event Health Chip ──────────────────────────────────────────────────────

export type EventHealthValue =
  | 'strong_momentum'
  | 'needs_attention'
  | 'door_ready'
  | 'draft_incomplete'
  | 'payout_required';

export const EVENT_HEALTH_LABELS: Record<EventHealthValue, string> = {
  strong_momentum: 'Strong Momentum',
  needs_attention: 'Needs Attention',
  door_ready: 'Door Ready',
  draft_incomplete: 'Draft Incomplete',
  payout_required: 'Payout Required',
};

export const EVENT_HEALTH_COLORS: Record<EventHealthValue, string> = {
  strong_momentum: '#10B981',
  needs_attention: '#F59E0B',
  door_ready: '#20C7FF',
  draft_incomplete: '#8E9099',
  payout_required: '#EF4444',
};

// ─── AI Title Suggestions ───────────────────────────────────────────────────

export interface AITitleSuggestion {
  id: string;
  text: string;
}

// ─── AI Description Tones ───────────────────────────────────────────────────

export type DescriptionTone = 'concise' | 'energetic' | 'premium';

export interface AIDescriptionOption {
  tone: DescriptionTone;
  text: string;
}

// ─── Event Readiness ────────────────────────────────────────────────────────

export type ReadinessStatus = 'strong' | 'good' | 'needs_attention' | 'incomplete';

export interface ReadinessCategory {
  label: string;
  status: ReadinessStatus;
}

export interface EventReadiness {
  overall: ReadinessStatus;
  categories: ReadinessCategory[];
}

// ─── Pricing Guidance ───────────────────────────────────────────────────────

export type PricingTone = 'recommendation' | 'affirmation' | 'caution';

export interface PricingGuidance {
  tone: PricingTone;
  recommendation: string;
  support: string;
  ctaLabel: string;
  ctaAction: string;
}

// ─── Clarity Guardrail ──────────────────────────────────────────────────────

export interface ClarityIssue {
  id: string;
  field: string;
  message: string;
  ctaLabel: string;
}

// ─── Post-Event Recap ───────────────────────────────────────────────────────

export type RecapTone = 'strong' | 'weak' | 'mixed';

export interface RecapSummary {
  tone: RecapTone;
  narrative: string;
}

export interface RecapBullet {
  id: string;
  text: string;
}

export interface RecapRecommendation {
  id: string;
  copy: string;
  ctaLabel: string;
  ctaAction: string;
}

export interface PostEventRecap {
  summary: RecapSummary;
  whatWorked: RecapBullet[];
  whatToImprove: RecapBullet[];
  recommendations: RecapRecommendation[];
}
