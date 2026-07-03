/**
 * Host Dashboard Types
 * ════════════════════
 * Complete data models for the ECHO Host command center.
 * Covers: event summary, live ops, growth, finance, post-event,
 * scheduling intelligence, and market position.
 */

// ═══════════════════════════════════════════════════════════════════
// EVENT LIFECYCLE
// ═══════════════════════════════════════════════════════════════════

export type EventPhase = 'before' | 'live' | 'after';
export type EventStatus = 'draft' | 'published' | 'selling' | 'live' | 'completed' | 'cancelled';

export function getEventPhase(status: EventStatus): EventPhase {
  if (status === 'live') return 'live';
  if (status === 'completed' || status === 'cancelled') return 'after';
  return 'before';
}

// ═══════════════════════════════════════════════════════════════════
// HEALTH + READINESS
// ═══════════════════════════════════════════════════════════════════

export type HealthLabel = 'Strong' | 'Healthy' | 'Watchlist' | 'At Risk' | 'Critical';
export type HealthColor = 'green' | 'blue' | 'amber' | 'red' | 'gray';

export interface EventHealthScore {
  score: number;           // 0-100
  label: HealthLabel;
  color: HealthColor;
  summary: string;
}

export interface HostReadiness {
  percentage: number;
  label: string;
  missingItems: string[];
}

export interface EntryTrustScore {
  score: number;           // 0-100
  label: string;
  factors: { label: string; status: 'good' | 'warning' | 'critical' }[];
}

export interface CircleEfficiency {
  started: number;
  seatsClaimed: number;
  completionRate: number;
  pending: number;
  expired: number;
  label: string;
}

// ═══════════════════════════════════════════════════════════════════
// DASHBOARD EVENT SUMMARY
// ═══════════════════════════════════════════════════════════════════

export interface DashboardEvent {
  id: string;
  title: string;
  venue: string;
  city: string;
  dateTime: string;
  endTime?: string;
  status: EventStatus;
  category: string;
  ageRestriction: string;
  capacity: number;
  ticketsSold: number;
  checkedIn: number;
  grossRevenue: number;
  targetRevenue: number;
  forecastedSold: number;
  forecastedRevenue: number;
  health: EventHealthScore;
  readiness: HostReadiness;
  aiSummary: string;
}

// ═══════════════════════════════════════════════════════════════════
// KPI ROW
// ═══════════════════════════════════════════════════════════════════

export interface KPIMetric {
  key: string;
  label: string;
  value: string;
  context: string;
  trend: string;
  trendDirection: 'up' | 'down' | 'flat';
}

// ═══════════════════════════════════════════════════════════════════
// ALERTS + ACTIONS
// ═══════════════════════════════════════════════════════════════════

export type AlertSeverity = 'critical' | 'warning' | 'info' | 'success';

export interface DashboardAlert {
  id: string;
  severity: AlertSeverity;
  title: string;
  body: string;
  ctaLabel?: string;
  ctaRoute?: string;
  dismissible: boolean;
}

// ═══════════════════════════════════════════════════════════════════
// LIVE OPS
// ═══════════════════════════════════════════════════════════════════

export interface LiveOpsMetrics {
  doorThroughput: number;          // scans/min
  scanSuccessRate: number;         // 0-100
  qrFallbackRate: number;          // 0-100
  occupancy: number;               // checked-in count
  occupancyPercent: number;        // 0-100
  offlineSyncStatus: 'synced' | 'syncing' | 'offline' | 'error';
  deniedEntries: number;
  duplicateAttempts: number;
  doorSales: number;
  doorSalesRevenue: number;
}

// ═══════════════════════════════════════════════════════════════════
// GROWTH
// ═══════════════════════════════════════════════════════════════════

export interface GrowthMetrics {
  impressions: number;
  views: number;
  saves: number;
  checkoutStarts: number;
  purchases: number;
  conversionRate: number;          // views → purchase
  saveToConversion: number;        // saves → purchase
  circleStarts: number;
  circleCompletions: number;
  trafficSources: TrafficSource[];
  promoPerformance: PromoMetric[];
}

export interface TrafficSource {
  source: string;
  count: number;
  percent: number;
}

export interface PromoMetric {
  code: string;
  uses: number;
  revenue: number;
}

// ═══════════════════════════════════════════════════════════════════
// FINANCE
// ═══════════════════════════════════════════════════════════════════

export interface FinanceMetrics {
  gross: number;
  serviceFees: number;
  processingFees: number;
  refunds: number;
  refundCount: number;
  donations: number;
  netPayout: number;
  payoutStatus: 'pending' | 'processing' | 'paid' | 'scheduled' | 'not_configured';
  payoutDate?: string;
  payoutMethod?: string;
}

// ═══════════════════════════════════════════════════════════════════
// POST-EVENT INSIGHTS
// ═══════════════════════════════════════════════════════════════════

export interface PostEventInsights {
  finalAttendance: number;
  noShowRate: number;
  repeatAttendeeRate: number;
  bestSource: string;
  bestPurchaseWindow: string;
  topLearning: string;
}

// ═══════════════════════════════════════════════════════════════════
// MARKET POSITION (DASHBOARD MODULE)
// ═══════════════════════════════════════════════════════════════════

export interface MarketPosition {
  localUniquenessScore: number;     // 0-100
  uniquenessLabel: string;
  categoryDensity: number;          // events in same category, local
  categoryDensityLabel: string;
  timeSlotCrowding: number;         // overlapping events in window
  timeSlotLabel: string;
  similarEventCount: number;
  bestFutureSlot: string;           // "Saturdays 2-6 PM show 40% less competition"
  benchmarkNote: string;            // "Your event outperformed 73% of similar events in this market"
}

// ═══════════════════════════════════════════════════════════════════
// FULL DASHBOARD STATE
// ═══════════════════════════════════════════════════════════════════

export type DashboardLoadState = 'loading' | 'ready' | 'error' | 'empty';

export interface DashboardState {
  loadState: DashboardLoadState;
  event: DashboardEvent | null;
  phase: EventPhase;
  kpis: KPIMetric[];
  alerts: DashboardAlert[];
  liveOps: LiveOpsMetrics | null;
  growth: GrowthMetrics | null;
  finance: FinanceMetrics | null;
  postEvent: PostEventInsights | null;
  marketPosition: MarketPosition | null;
  entryTrust: EntryTrustScore | null;
  circleEfficiency: CircleEfficiency | null;
}

// ═══════════════════════════════════════════════════════════════════
// SCHEDULING INTELLIGENCE / MARKET PULSE
// ═══════════════════════════════════════════════════════════════════

export type SaturationLevel = 'low' | 'moderate' | 'high' | 'crowded' | 'saturated';
export type DayColor = 'green' | 'dark_green' | 'amber' | 'red';

export interface NearbyEvent {
  id: string;
  title: string;
  category: string;
  venue: string;
  distanceMiles: number;
  startTime: string;
  endTime: string;
  similarityType: 'direct' | 'adjacent' | 'unrelated';
  audienceOverlapLikelihood: number;  // 0-1
  prominenceWeight: number;           // 0-1 (larger events weigh more)
}

export interface MarketPulseResult {
  saturationLevel: SaturationLevel;
  saturationScore: number;            // 0-100
  nearbyEventCount: number;
  directOverlapCount: number;
  adjacentOverlapCount: number;
  timeSlotPressure: string;           // "High" | "Moderate" | "Low"
  localUniqueness: number;            // 0-100
  opportunityScore: number;           // 0-100
  insightText: string;
  recommendation: string;
  nearbyEvents: NearbyEvent[];
}

export interface CalendarDay {
  date: string;                       // YYYY-MM-DD
  dayOfWeek: string;
  color: DayColor;
  similarEventCount: number;
  directOverlapCount: number;
  peakCrowdingWindow: string;
  bestTimeWindows: string[];
  rationale: string;
}

export interface SchedulingSuggestion {
  date: string;
  time: string;
  dayOfWeek: string;
  reason: string;
  competitionReduction: string;       // "42% less competition"
  opportunityScore: number;
}

export interface SchedulingIntelligenceResult {
  selectedDate: string;
  selectedTime: string;
  selectedCategory: string;
  selectedCity: string;
  pulse: MarketPulseResult;
  calendar: CalendarDay[];
  suggestions: SchedulingSuggestion[];
  showCalendar: boolean;              // true when saturation >= high
}
