/**
 * services/botRiskService.ts
 * ══════════════════════════
 * Bot / fraud risk scoring. Generates RiskDecision view-models consumed by
 * AdminTrustConsole and HostSecurityCenter. Pure TS — no RN import.
 *
 * Score: 0–100. 0–29 = allow, 30–59 = challenge, 60+ = block.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type RiskSubjectType = 'checkout' | 'user' | 'scanner' | 'transfer';

export type RiskAction = 'allow' | 'challenge' | 'block';

/** Canonical risk-reason slugs. */
export type RiskReason =
  | 'multi_account_device'
  | 'over_device_limit'
  | 'high_request_speed'
  | 'impossible_geo'
  | 'velocity_checkout'
  | 'headless_browser'
  | 'known_proxy'
  | 'disposable_email'
  | 'payment_mismatch'
  | 'duplicate_nfc_tap';

export type RiskDecision = {
  subjectType: RiskSubjectType;
  subjectId: string;
  /** 0–100. */
  score: number;
  reasons: RiskReason[];
  action: RiskAction;
  /** ISO date. */
  timestamp: string;
  /** Human-readable one-liner for operator UI. */
  summary: string;
};

export type RiskDecisionInput = {
  subjectType: RiskSubjectType;
  subjectId: string;
  score: number;
  reasons: string[];
  action: RiskAction;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const REASON_LABELS: Record<string, string> = {
  multi_account_device: 'Multiple accounts on device',
  over_device_limit: 'Device limit exceeded',
  high_request_speed: 'Unusually high request speed',
  impossible_geo: 'Impossible geolocation',
  velocity_checkout: 'Checkout velocity spike',
  headless_browser: 'Headless browser detected',
  known_proxy: 'Known proxy / VPN',
  disposable_email: 'Disposable email address',
  payment_mismatch: 'Payment identity mismatch',
  duplicate_nfc_tap: 'Duplicate NFC tap',
};

function scoreToAction(score: number): RiskAction {
  if (score >= 60) return 'block';
  if (score >= 30) return 'challenge';
  return 'allow';
}

function buildSummary(score: number, reasons: string[], action: RiskAction): string {
  if (reasons.length === 0) return `Score ${score} — ${action}. No signals detected.`;
  const labels = reasons.map((r) => REASON_LABELS[r] ?? r).join(', ');
  return `Score ${score} — ${action}. Signals: ${labels}.`;
}

/** Build a typed RiskDecision from raw input (e.g. from the trust-console route). */
export function buildRiskDecision(input: RiskDecisionInput): RiskDecision {
  const action = input.action ?? scoreToAction(input.score);
  return {
    subjectType: input.subjectType,
    subjectId: input.subjectId,
    score: input.score,
    reasons: input.reasons as RiskReason[],
    action,
    timestamp: new Date().toISOString(),
    summary: buildSummary(input.score, input.reasons, action),
  };
}

/** Derive a risk action from a raw score (used by services that compute scores). */
export function scoreToRiskAction(score: number): RiskAction {
  return scoreToAction(score);
}
