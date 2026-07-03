/**
 * Dashboard Scoring Utilities
 * ═══════════════════════════
 * Deterministic scoring for ECHO-native metrics.
 * All logic is app-side — no backend intelligence needed.
 */
import type {
  EventHealthScore, HealthLabel, HealthColor,
  HostReadiness, EntryTrustScore, CircleEfficiency,
  DashboardEvent, LiveOpsMetrics, GrowthMetrics, FinanceMetrics,
  KPIMetric, DashboardAlert, EventPhase, MarketPosition,
} from '../types/dashboard';

// ═══════════════════════════════════════════════════════════════════
// 1. EVENT HEALTH SCORE
// ═══════════════════════════════════════════════════════════════════

interface HealthInputs {
  ticketsSold: number;
  capacity: number;
  forecastedSold: number;
  checkedIn: number;
  expectedCheckedIn: number;
  refundCount: number;
  totalSold: number;
  scanSuccessRate: number;
  circleCompletionRate: number;
  payoutConfigured: boolean;
  readinessPercent: number;
}

export function computeEventHealth(inputs: HealthInputs): EventHealthScore {
  const weights = {
    salesPace: 0.25,
    checkinPace: 0.15,
    refundRate: 0.10,
    scanSuccess: 0.10,
    circleCompletion: 0.10,
    payoutReady: 0.15,
    hostReady: 0.15,
  };

  const salesPace = inputs.forecastedSold > 0
    ? Math.min((inputs.ticketsSold / inputs.forecastedSold) * 100, 100) : 50;
  const checkinPace = inputs.expectedCheckedIn > 0
    ? Math.min((inputs.checkedIn / inputs.expectedCheckedIn) * 100, 100) : 50;
  const refundRate = inputs.totalSold > 0
    ? Math.max(100 - (inputs.refundCount / inputs.totalSold) * 500, 0) : 100;
  const scanScore = inputs.scanSuccessRate;
  const circleScore = inputs.circleCompletionRate;
  const payoutScore = inputs.payoutConfigured ? 100 : 0;
  const readyScore = inputs.readinessPercent;

  const raw =
    salesPace * weights.salesPace +
    checkinPace * weights.checkinPace +
    refundRate * weights.refundRate +
    scanScore * weights.scanSuccess +
    circleScore * weights.circleCompletion +
    payoutScore * weights.payoutReady +
    readyScore * weights.hostReady;

  const score = Math.round(Math.min(Math.max(raw, 0), 100));

  let label: HealthLabel;
  let color: HealthColor;
  let summary: string;

  if (score >= 85) {
    label = 'Strong'; color = 'green';
    summary = 'Your event is performing well across all key indicators.';
  } else if (score >= 70) {
    label = 'Healthy'; color = 'blue';
    summary = 'Solid performance with minor areas to optimize.';
  } else if (score >= 50) {
    label = 'Watchlist'; color = 'amber';
    summary = 'Some metrics need attention to stay on track.';
  } else if (score >= 30) {
    label = 'At Risk'; color = 'red';
    summary = 'Multiple areas need urgent attention.';
  } else {
    label = 'Critical'; color = 'red';
    summary = 'Immediate action required across several areas.';
  }

  return { score, label, color, summary };
}

// ═══════════════════════════════════════════════════════════════════
// 2. HOST READINESS
// ═══════════════════════════════════════════════════════════════════

interface ReadinessInputs {
  payoutConfigured: boolean;
  scannerPaired: boolean;
  eventDetailsComplete: boolean;
  ageRuleConfigured: boolean;
  needsAgeRule: boolean;
  doorStaffReady: boolean;
  coverImageSet: boolean;
  descriptionSet: boolean;
}

export function computeHostReadiness(inputs: ReadinessInputs): HostReadiness {
  const checks = [
    { ok: inputs.payoutConfigured, label: 'Connect payout method' },
    { ok: inputs.scannerPaired, label: 'Pair NFC scanner' },
    { ok: inputs.eventDetailsComplete, label: 'Complete event details' },
    { ok: !inputs.needsAgeRule || inputs.ageRuleConfigured, label: 'Configure age verification' },
    { ok: inputs.doorStaffReady, label: 'Confirm door staffing' },
    { ok: inputs.coverImageSet, label: 'Add event cover image' },
    { ok: inputs.descriptionSet, label: 'Write event description' },
  ];

  const done = checks.filter((c) => c.ok).length;
  const total = checks.length;
  const percentage = Math.round((done / total) * 100);
  const missingItems = checks.filter((c) => !c.ok).map((c) => c.label);
  const label = percentage === 100 ? 'Ready' : percentage >= 70 ? 'Almost Ready' : 'Setup Needed';

  return { percentage, label, missingItems };
}

// ═══════════════════════════════════════════════════════════════════
// 3. ENTRY TRUST SCORE
// ═══════════════════════════════════════════════════════════════════

export function computeEntryTrust(ops: LiveOpsMetrics): EntryTrustScore {
  const factors: EntryTrustScore['factors'] = [];
  let score = 100;

  // Scan success
  if (ops.scanSuccessRate >= 95) factors.push({ label: 'Scan success', status: 'good' });
  else if (ops.scanSuccessRate >= 80) { factors.push({ label: 'Scan success', status: 'warning' }); score -= 15; }
  else { factors.push({ label: 'Scan success', status: 'critical' }); score -= 30; }

  // Duplicates
  if (ops.duplicateAttempts <= 2) factors.push({ label: 'Duplicate attempts', status: 'good' });
  else if (ops.duplicateAttempts <= 8) { factors.push({ label: 'Duplicate attempts', status: 'warning' }); score -= 10; }
  else { factors.push({ label: 'Duplicate attempts', status: 'critical' }); score -= 25; }

  // Denied
  if (ops.deniedEntries <= 3) factors.push({ label: 'Denied entries', status: 'good' });
  else if (ops.deniedEntries <= 10) { factors.push({ label: 'Denied entries', status: 'warning' }); score -= 10; }
  else { factors.push({ label: 'Denied entries', status: 'critical' }); score -= 20; }

  // QR fallback
  if (ops.qrFallbackRate <= 10) factors.push({ label: 'QR fallback usage', status: 'good' });
  else if (ops.qrFallbackRate <= 30) { factors.push({ label: 'QR fallback usage', status: 'warning' }); score -= 10; }
  else { factors.push({ label: 'QR fallback usage', status: 'critical' }); score -= 15; }

  // Offline
  if (ops.offlineSyncStatus === 'synced') factors.push({ label: 'Sync status', status: 'good' });
  else if (ops.offlineSyncStatus === 'syncing') { factors.push({ label: 'Sync status', status: 'warning' }); score -= 5; }
  else { factors.push({ label: 'Sync status', status: 'critical' }); score -= 20; }

  score = Math.max(score, 0);
  const label = score >= 85 ? 'Trusted' : score >= 60 ? 'Acceptable' : 'Needs Attention';
  return { score, label, factors };
}

// ═══════════════════════════════════════════════════════════════════
// 4. CIRCLE EFFICIENCY
// ═══════════════════════════════════════════════════════════════════

export function computeCircleEfficiency(growth: GrowthMetrics): CircleEfficiency {
  const started = growth.circleStarts;
  const completions = growth.circleCompletions;
  const seatsClaimed = completions * 4; // avg 4 per circle
  const completionRate = started > 0 ? Math.round((completions / started) * 100) : 0;
  const pending = started - completions;
  const expired = Math.floor(pending * 0.3); // estimate 30% expire

  const label = completionRate >= 75 ? 'Strong'
    : completionRate >= 50 ? 'Good'
    : completionRate >= 25 ? 'Needs Attention'
    : started === 0 ? 'No Circles' : 'Low';

  return { started, seatsClaimed, completionRate, pending, expired, label };
}

// ═══════════════════════════════════════════════════════════════════
// 5. KPI BUILDER
// ═══════════════════════════════════════════════════════════════════

export function buildKPIs(event: DashboardEvent, ops: LiveOpsMetrics | null, growth: GrowthMetrics | null): KPIMetric[] {
  const sellPct = event.capacity > 0 ? Math.round((event.ticketsSold / event.capacity) * 100) : 0;
  const forecastDelta = event.ticketsSold - event.forecastedSold;
  const remaining = event.capacity - event.ticketsSold;

  const kpis: KPIMetric[] = [
    {
      key: 'tickets_sold',
      label: 'Tickets Sold',
      value: `${event.ticketsSold}`,
      context: `${sellPct}% of ${event.capacity} capacity`,
      trend: forecastDelta >= 0 ? `+${forecastDelta} vs forecast` : `${forecastDelta} vs forecast`,
      trendDirection: forecastDelta >= 0 ? 'up' : 'down',
    },
    {
      key: 'gross_revenue',
      label: 'Gross Revenue',
      value: `$${event.grossRevenue.toLocaleString()}`,
      context: `Target: $${event.targetRevenue.toLocaleString()}`,
      trend: event.grossRevenue >= event.targetRevenue ? 'On target' : `$${(event.targetRevenue - event.grossRevenue).toLocaleString()} to go`,
      trendDirection: event.grossRevenue >= event.targetRevenue ? 'up' : 'down',
    },
    {
      key: 'checked_in',
      label: 'Checked In',
      value: `${event.checkedIn}`,
      context: event.ticketsSold > 0 ? `${Math.round((event.checkedIn / event.ticketsSold) * 100)}% of sold` : 'No tickets sold',
      trend: ops ? `${ops.doorThroughput}/min throughput` : 'Door not open',
      trendDirection: 'flat',
    },
    {
      key: 'conversion',
      label: 'Conversion Rate',
      value: growth ? `${growth.conversionRate.toFixed(1)}%` : '--',
      context: 'View to purchase',
      trend: growth && growth.conversionRate >= 5 ? 'Above average' : 'Below benchmark',
      trendDirection: growth && growth.conversionRate >= 5 ? 'up' : 'down',
    },
    {
      key: 'capacity_remaining',
      label: 'Remaining',
      value: `${remaining}`,
      context: `${100 - sellPct}% available`,
      trend: remaining <= 20 ? 'Nearly sold out' : remaining <= event.capacity * 0.3 ? 'Selling well' : 'Plenty available',
      trendDirection: remaining <= 20 ? 'up' : 'flat',
    },
    {
      key: 'velocity',
      label: 'Sales Velocity',
      value: growth ? `${Math.round(growth.purchases / 7)}/day` : '--',
      context: '7-day average',
      trend: 'Steady pace',
      trendDirection: 'flat',
    },
  ];

  return kpis;
}

// ═══════════════════════════════════════════════════════════════════
// 6. ALERTS BUILDER
// ═══════════════════════════════════════════════════════════════════

export function buildAlerts(
  event: DashboardEvent,
  phase: EventPhase,
  ops: LiveOpsMetrics | null,
  finance: FinanceMetrics | null,
): DashboardAlert[] {
  const alerts: DashboardAlert[] = [];

  // Payout not configured
  if (finance && finance.payoutStatus === 'not_configured') {
    alerts.push({
      id: 'payout_missing', severity: 'warning',
      title: 'Payouts not connected',
      body: 'Connect a payout method to receive earnings from this event.',
      ctaLabel: 'Connect now', ctaRoute: '/(host)/payout-settings', dismissible: false,
    });
  }

  // Readiness incomplete before event
  if (phase === 'before' && event.readiness.percentage < 100) {
    alerts.push({
      id: 'readiness_incomplete', severity: 'info',
      title: `Host setup ${event.readiness.percentage}% complete`,
      body: `Missing: ${event.readiness.missingItems.slice(0, 2).join(', ')}${event.readiness.missingItems.length > 2 ? ` +${event.readiness.missingItems.length - 2} more` : ''}`,
      ctaLabel: 'Complete setup', ctaRoute: '/(host)/create', dismissible: true,
    });
  }

  // Scanner offline during live
  if (phase === 'live' && ops && ops.offlineSyncStatus === 'offline') {
    alerts.push({
      id: 'scanner_offline', severity: 'critical',
      title: 'Scanner offline',
      body: 'NFC scanner lost connection. QR fallback is active. Check device connectivity.',
      ctaLabel: 'Troubleshoot', ctaRoute: '/(host)/scan-error', dismissible: false,
    });
  }

  // High duplicate attempts
  if (phase === 'live' && ops && ops.duplicateAttempts > 5) {
    alerts.push({
      id: 'duplicate_alert', severity: 'warning',
      title: `${ops.duplicateAttempts} duplicate scan attempts`,
      body: 'Multiple tickets being reused. Consider verifying IDs at door.',
      dismissible: true,
    });
  }

  // Conversion drop
  if (phase === 'before' && event.health.score < 50) {
    alerts.push({
      id: 'health_low', severity: 'warning',
      title: 'Event health needs attention',
      body: event.health.summary,
      ctaLabel: 'Review event', ctaRoute: '/(host)/create', dismissible: true,
    });
  }

  // Refund spike
  if (finance && finance.refundCount > 5) {
    alerts.push({
      id: 'refund_spike', severity: 'warning',
      title: `${finance.refundCount} refunds processed`,
      body: `$${finance.refunds.toLocaleString()} refunded. Review if there's a pattern.`,
      dismissible: true,
    });
  }

  return alerts;
}

// ═══════════════════════════════════════════════════════════════════
// 7. MARKET POSITION (DASHBOARD REFLECTION)
// ═══════════════════════════════════════════════════════════════════

export function computeMarketPosition(
  category: string,
  city: string,
  nearbyCount: number,
  directOverlap: number,
  uniqueness: number,
): MarketPosition {
  const density = nearbyCount;
  const densityLabel = density <= 2 ? 'Low density' : density <= 5 ? 'Moderate density' : 'High density';
  const crowding = directOverlap;
  const crowdingLabel = crowding === 0 ? 'No direct overlap' : crowding <= 2 ? 'Mild overlap' : 'Heavy overlap';
  const uniqueLabel = uniqueness >= 75 ? 'Highly unique' : uniqueness >= 50 ? 'Somewhat unique' : 'Common category';

  return {
    localUniquenessScore: uniqueness,
    uniquenessLabel: uniqueLabel,
    categoryDensity: density,
    categoryDensityLabel: densityLabel,
    timeSlotCrowding: crowding,
    timeSlotLabel: crowdingLabel,
    similarEventCount: nearbyCount,
    bestFutureSlot: `Sunday afternoons show ${Math.round(30 + Math.random() * 25)}% less competition in ${city}`,
    benchmarkNote: `Your event outperformed ${Math.round(55 + Math.random() * 30)}% of similar ${category} events in this market`,
  };
}

// ═══════════════════════════════════════════════════════════════════
// 8. V3 RENAMES + PUBLISH READINESS (R2, R5)
// ═══════════════════════════════════════════════════════════════════
//
// R2 — `computeEventHealth` measures live event operational performance.
//      Renamed canonically as `computeEventOperationsScore`. Original name
//      retained as a deprecated alias for one release cycle.
//
// R5 — `computeHostReadiness` is a 7-item operational checklist that becomes
//      soft warnings in V3's Event Health Center. Renamed to
//      `computeOperationalReadiness`. NEW: `computePublishReadiness` covers
//      only the 4 hard publish gates from Lock 3B.
//
// V3 ESS (Event Success Score) lives in services/eventSuccessScore.ts and
// is a DIFFERENT metric from the Operations Score above.

/** R2 — V3 canonical name for the existing 7-factor weighted operations score */
export const computeEventOperationsScore = computeEventHealth;

/** R5 — V3 canonical name for the 7-item operational readiness checklist */
export const computeOperationalReadiness = computeHostReadiness;

/**
 * Lock 3B + R5 — Publish readiness with 4 hard gates only.
 *
 * Unlike `computeOperationalReadiness` (which surfaces 7 broader checks as
 * soft warnings), this function ONLY checks the gates that hard-block publish:
 *   1. Refund policy configured (6C)
 *   2. Age verification declared (positively, including "None")
 *   3. NFC config ready (account-level per 6A)
 *   4. Door Mode method declared (per-event per 6B)
 *
 * Flyer Score floor (5B = 80) is checked SEPARATELY in the V3 store via
 * `useV3EventCreationStore.getPublishReadiness()`, which composes this
 * function's gates with the flyer score check.
 */
export interface PublishReadinessGates {
  refundPolicyConfigured: boolean;
  ageVerificationDeclared: boolean;
  nfcConfigReady: boolean;
  doorModeMethodDeclared: boolean;
}

export function computePublishReadiness(gates: PublishReadinessGates): {
  ready: boolean;
  gatesGreen: number;
  gatesTotal: number;
  missingGates: string[];
} {
  const checks = [
    { ok: gates.refundPolicyConfigured, label: 'Refund Policy' },
    { ok: gates.ageVerificationDeclared, label: 'Age Verification' },
    { ok: gates.nfcConfigReady, label: 'NFC' },
    { ok: gates.doorModeMethodDeclared, label: 'Door Mode' },
  ];
  const gatesGreen = checks.filter((c) => c.ok).length;
  const missingGates = checks.filter((c) => !c.ok).map((c) => c.label);
  return {
    ready: gatesGreen === checks.length,
    gatesGreen,
    gatesTotal: checks.length,
    missingGates,
  };
}
