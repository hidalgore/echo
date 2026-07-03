/**
 * Dashboard Mock Data Service
 * ═══════════════════════════
 * Generates realistic dashboard state for before/live/after event phases.
 * Used until real backend wiring replaces mock calls.
 */
import type {
  DashboardState, DashboardEvent, EventPhase, EventStatus,
  LiveOpsMetrics, GrowthMetrics, FinanceMetrics, PostEventInsights,
} from '../types/dashboard';
import {
  computeEventHealth, computeHostReadiness, computeEntryTrust,
  computeCircleEfficiency, buildKPIs, buildAlerts, computeMarketPosition,
} from '../utils/dashboardScoring';

// ═══════════════════════════════════════════════════════════════════
// SEED DATA BY PHASE
// ═══════════════════════════════════════════════════════════════════

function makeBeforeEvent(): DashboardEvent {
  const readiness = computeHostReadiness({
    payoutConfigured: true, scannerPaired: false, eventDetailsComplete: true,
    ageRuleConfigured: true, needsAgeRule: true, doorStaffReady: false,
    coverImageSet: true, descriptionSet: true,
  });
  const health = computeEventHealth({
    ticketsSold: 182, capacity: 250, forecastedSold: 170,
    checkedIn: 0, expectedCheckedIn: 0, refundCount: 2, totalSold: 182,
    scanSuccessRate: 98, circleCompletionRate: 72,
    payoutConfigured: true, readinessPercent: readiness.percentage,
  });
  return {
    id: 'evt_hero', title: 'Midnight Pulse: Friday Night at Nova',
    venue: 'Nova Rooftop', city: 'Seattle, WA',
    dateTime: '2026-04-25T21:00:00', endTime: '2026-04-26T02:00:00',
    status: 'selling', category: 'Nightlife', ageRestriction: '21+',
    capacity: 250, ticketsSold: 182, checkedIn: 0,
    grossRevenue: 7240, targetRevenue: 8500,
    forecastedSold: 170, forecastedRevenue: 7800,
    health, readiness,
    aiSummary: 'Your event is pacing 7% ahead of forecast with strong momentum. Focus on final-week conversion and payout setup.',
  };
}

function makeLiveEvent(): DashboardEvent {
  const readiness = computeHostReadiness({
    payoutConfigured: true, scannerPaired: true, eventDetailsComplete: true,
    ageRuleConfigured: true, needsAgeRule: true, doorStaffReady: true,
    coverImageSet: true, descriptionSet: true,
  });
  const health = computeEventHealth({
    ticketsSold: 238, capacity: 250, forecastedSold: 220,
    checkedIn: 96, expectedCheckedIn: 180, refundCount: 3, totalSold: 238,
    scanSuccessRate: 96, circleCompletionRate: 80,
    payoutConfigured: true, readinessPercent: readiness.percentage,
  });
  return {
    id: 'evt_hero', title: 'Midnight Pulse: Friday Night at Nova',
    venue: 'Nova Rooftop', city: 'Seattle, WA',
    dateTime: '2026-04-20T21:00:00', status: 'live',
    category: 'Nightlife', ageRestriction: '21+',
    capacity: 250, ticketsSold: 238, checkedIn: 96,
    grossRevenue: 9120, targetRevenue: 8500,
    forecastedSold: 220, forecastedRevenue: 7800,
    health, readiness,
    aiSummary: 'Event is live. 96 checked in with strong scan rates. Peak arrival expected in the next 30 minutes.',
  };
}

function makeAfterEvent(): DashboardEvent {
  const readiness = computeHostReadiness({
    payoutConfigured: true, scannerPaired: true, eventDetailsComplete: true,
    ageRuleConfigured: true, needsAgeRule: true, doorStaffReady: true,
    coverImageSet: true, descriptionSet: true,
  });
  const health = computeEventHealth({
    ticketsSold: 242, capacity: 250, forecastedSold: 220,
    checkedIn: 218, expectedCheckedIn: 242, refundCount: 4, totalSold: 242,
    scanSuccessRate: 97, circleCompletionRate: 82,
    payoutConfigured: true, readinessPercent: readiness.percentage,
  });
  return {
    id: 'evt_hero', title: 'Midnight Pulse: Friday Night at Nova',
    venue: 'Nova Rooftop', city: 'Seattle, WA',
    dateTime: '2026-04-18T21:00:00', status: 'completed',
    category: 'Nightlife', ageRestriction: '21+',
    capacity: 250, ticketsSold: 242, checkedIn: 218,
    grossRevenue: 9480, targetRevenue: 8500,
    forecastedSold: 220, forecastedRevenue: 7800,
    health, readiness,
    aiSummary: 'Strong performance. 97% sell-through, 90% check-in rate. Revenue exceeded target by 12%.',
  };
}

// ═══════════════════════════════════════════════════════════════════
// LIVE OPS
// ═══════════════════════════════════════════════════════════════════

function makeLiveOps(phase: EventPhase): LiveOpsMetrics | null {
  if (phase === 'before') return null;
  if (phase === 'live') return {
    doorThroughput: 8.2, scanSuccessRate: 96, qrFallbackRate: 4,
    occupancy: 96, occupancyPercent: 38,
    offlineSyncStatus: 'synced', deniedEntries: 2,
    duplicateAttempts: 1, doorSales: 6, doorSalesRevenue: 180,
  };
  return { // after = historical snapshot
    doorThroughput: 0, scanSuccessRate: 97, qrFallbackRate: 3,
    occupancy: 218, occupancyPercent: 87,
    offlineSyncStatus: 'synced', deniedEntries: 4,
    duplicateAttempts: 3, doorSales: 12, doorSalesRevenue: 360,
  };
}

// ═══════════════════════════════════════════════════════════════════
// GROWTH
// ═══════════════════════════════════════════════════════════════════

function makeGrowth(): GrowthMetrics {
  return {
    impressions: 12840, views: 4260, saves: 890,
    checkoutStarts: 420, purchases: 242,
    conversionRate: 5.7, saveToConversion: 27.2,
    circleStarts: 38, circleCompletions: 28,
    trafficSources: [
      { source: 'ECHO App', count: 2100, percent: 49 },
      { source: 'Instagram', count: 1120, percent: 26 },
      { source: 'Direct Link', count: 640, percent: 15 },
      { source: 'Other', count: 400, percent: 10 },
    ],
    promoPerformance: [
      { code: 'NOVA20', uses: 34, revenue: 680 },
      { code: 'EARLYPULSE', uses: 18, revenue: 432 },
    ],
  };
}

// ═══════════════════════════════════════════════════════════════════
// FINANCE
// ═══════════════════════════════════════════════════════════════════

function makeFinance(phase: EventPhase): FinanceMetrics {
  return {
    gross: phase === 'after' ? 9480 : 7240,
    serviceFees: phase === 'after' ? 948 : 724,
    processingFees: phase === 'after' ? 275 : 210,
    refunds: phase === 'after' ? 120 : 60,
    refundCount: phase === 'after' ? 4 : 2,
    donations: 0,
    netPayout: phase === 'after' ? 8137 : 6246,
    payoutStatus: phase === 'after' ? 'scheduled' : phase === 'live' ? 'pending' : 'pending',
    payoutDate: phase === 'after' ? '2026-04-22' : undefined,
    payoutMethod: 'Stripe',
  };
}

// ═══════════════════════════════════════════════════════════════════
// POST-EVENT
// ═══════════════════════════════════════════════════════════════════

function makePostEvent(phase: EventPhase): PostEventInsights | null {
  if (phase !== 'after') return null;
  return {
    finalAttendance: 218,
    noShowRate: 9.9,
    repeatAttendeeRate: 34,
    bestSource: 'ECHO App (49% of traffic)',
    bestPurchaseWindow: 'Tues-Wed evening, 7 days before event',
    topLearning: 'Early-week promotion drove 62% of total sales. Consider launching campaigns on Monday evenings for future events.',
  };
}

// ═══════════════════════════════════════════════════════════════════
// FULL DASHBOARD STATE BUILDER
// ═══════════════════════════════════════════════════════════════════

export function buildDashboardState(phase: EventPhase): DashboardState {
  const event = phase === 'before' ? makeBeforeEvent()
    : phase === 'live' ? makeLiveEvent()
    : makeAfterEvent();

  const ops = makeLiveOps(phase);
  const growth = makeGrowth();
  const finance = makeFinance(phase);
  const postEvent = makePostEvent(phase);
  const kpis = buildKPIs(event, ops, growth);
  const alerts = buildAlerts(event, phase, ops, finance);

  const entryTrust = ops ? computeEntryTrust(ops) : null;
  const circleEfficiency = computeCircleEfficiency(growth);
  const marketPosition = computeMarketPosition(
    event.category, event.city, 4, 1, 72,
  );

  return {
    loadState: 'ready',
    event, phase, kpis, alerts,
    liveOps: ops, growth, finance, postEvent,
    marketPosition, entryTrust, circleEfficiency,
  };
}

export function buildEmptyDashboard(): DashboardState {
  return {
    loadState: 'empty',
    event: null, phase: 'before',
    kpis: [], alerts: [],
    liveOps: null, growth: null, finance: null, postEvent: null,
    marketPosition: null, entryTrust: null, circleEfficiency: null,
  };
}

export function buildLoadingDashboard(): DashboardState {
  return {
    ...buildEmptyDashboard(),
    loadState: 'loading',
  };
}
