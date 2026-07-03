/**
 * services/trustShieldService.ts
 * ══════════════════════════════
 * ECHO TrustShield — host-facing bot-defense status builder.
 * Consumes raw telemetry and produces a typed view-model for HostSecurityCenter.
 *
 * Pure TS — no RN import; safe to unit test.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export type BotDefenseStatus = {
  /** Total bot/scraper attempts blocked across checkout + door. */
  suspiciousAttemptsBlocked: number;
  /** Checkouts currently held pending manual review. */
  checkoutHolds: number;
  /** Percentage of ticket ops flagged as abuse (0–100). */
  ticketAbuseRatePct: number;
  /** Percentage of payout volume flagged as risky. */
  payoutRiskRatePct: number;
  /** Duplicate NFC / QR taps blocked at the door. */
  doorDuplicateAttempts: number;
  /** Expected demand for capacity planning. */
  expectedDemand: number;
  /** Venue capacity. */
  capacity: number;
  /** Derived overall risk level. */
  riskLevel: RiskLevel;
  /** One-liner for operators. */
  summary: string;
  /** True when ECHO active-protection mode is engaged (high/critical only). */
  activeProtection: boolean;
};

export type BotDefenseInput = Omit<BotDefenseStatus, 'riskLevel' | 'summary' | 'activeProtection'>;

// ─── Builder ─────────────────────────────────────────────────────────────────

function deriveRiskLevel(input: BotDefenseInput): RiskLevel {
  if (input.ticketAbuseRatePct >= 15 || input.payoutRiskRatePct >= 5) return 'critical';
  if (input.ticketAbuseRatePct >= 8 || input.checkoutHolds >= 20) return 'high';
  if (input.ticketAbuseRatePct >= 3 || input.checkoutHolds >= 5) return 'medium';
  return 'low';
}

const SUMMARY: Record<RiskLevel, string> = {
  low: 'No significant bot activity detected. Normal operating conditions.',
  medium: 'Moderate bot activity detected. Automated holds active. Monitor.',
  high: 'High bot activity. Manual review of held checkouts recommended.',
  critical: 'Critical threat level. Active protection engaged. Review now.',
};

/**
 * Builds a typed BotDefenseStatus from raw host telemetry.
 * Called by app/(host)/security.tsx before rendering HostSecurityCenter.
 */
export function buildHostBotDefenseStatus(input: BotDefenseInput): BotDefenseStatus {
  const riskLevel = deriveRiskLevel(input);
  return {
    ...input,
    riskLevel,
    summary: SUMMARY[riskLevel],
    activeProtection: riskLevel === 'high' || riskLevel === 'critical',
  };
}
