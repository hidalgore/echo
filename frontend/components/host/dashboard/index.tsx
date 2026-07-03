/**
 * Host Dashboard Components
 * ═════════════════════════
 * Production-ready card system for the ECHO Host command center.
 * Each card supports: primary value, context, trend, loading state.
 */
import React from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '../../ui';
import { colors, radius, shadows, typography } from '../../../theme/hostTokens';
import type {
  DashboardEvent, KPIMetric, DashboardAlert, LiveOpsMetrics,
  GrowthMetrics, FinanceMetrics, PostEventInsights, MarketPosition,
  EntryTrustScore, CircleEfficiency, EventPhase,
} from '../../../types/dashboard';

// ═══════════════════════════════════════════════════════════════════
// HERO COMMAND CARD
// ═══════════════════════════════════════════════════════════════════

export function HeroCommandCard({ event, phase }: { event: DashboardEvent; phase: EventPhase }) {
  const sellPct = event.capacity > 0 ? Math.round((event.ticketsSold / event.capacity) * 100) : 0;
  const healthC = HEALTH_COLORS[event.health.color];

  return (
    <LinearGradient
      colors={['rgba(32,199,255,0.15)', 'rgba(123,77,255,0.15)', 'rgba(230,61,173,0.10)']}
      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      style={s.heroGradient}
    >
      <View style={s.heroInner}>
        {/* Status + Health */}
        <View style={s.heroTopRow}>
          <View style={[s.pill, { backgroundColor: STATUS_BG[event.status] || 'rgba(255,255,255,0.06)' }]}>
            {phase === 'live' && <View style={[s.liveDot, { backgroundColor: '#10B981' }]} />}
            <Text style={[s.pillText, { color: STATUS_COLOR[event.status] || colors.textSecondary }]}>
              {event.status === 'selling' ? 'Selling' : event.status === 'live' ? 'Live Now' : event.status === 'completed' ? 'Completed' : event.status}
            </Text>
          </View>
          <View style={[s.pill, { backgroundColor: `${healthC}14` }]}>
            <Text style={[s.pillText, { color: healthC }]}>
              {event.health.label} {'\u00b7'} {event.health.score}
            </Text>
          </View>
        </View>

        {/* Title */}
        <Text style={s.heroTitle}>{event.title}</Text>
        <Text style={s.heroMeta}>{event.venue} {'\u00b7'} {event.city}</Text>

        {/* AI Summary */}
        <View style={s.aiSummaryWrap}>
          <Ionicons name="sparkles" size={13} color="rgba(32,199,255,0.70)" />
          <Text style={s.aiSummaryText}>{event.aiSummary}</Text>
        </View>

        {/* Metrics row */}
        <View style={s.heroMetricsRow}>
          <HeroMiniMetric label="Sold" value={`${event.ticketsSold}/${event.capacity}`} sub={`${sellPct}%`} />
          <HeroMiniMetric label="Revenue" value={`$${event.grossRevenue.toLocaleString()}`} sub={`Target: $${event.targetRevenue.toLocaleString()}`} />
          <HeroMiniMetric label="Forecast" value={`${event.forecastedSold}`} sub={event.ticketsSold >= event.forecastedSold ? 'Ahead' : 'Behind'} />
        </View>

        {/* Progress bar */}
        <View style={s.progressTrack}>
          <View style={[s.progressFill, { width: `${sellPct}%`, backgroundColor: sellPct >= 90 ? '#E63DAD' : '#20C7FF' }]} />
        </View>

        {/* CTA */}
        <TouchableOpacity
          style={s.heroCta}
          onPress={() => router.push(phase === 'live' ? '/(host)/(tabs)/door' : '/(host)/(tabs)/events')}
          activeOpacity={0.85}
        >
          <Text style={s.heroCtaText}>{phase === 'live' ? 'Open Door Mode' : phase === 'after' ? 'View Recap' : 'Manage Event'}</Text>
          <Ionicons name="arrow-forward" size={15} color={colors.bg} />
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

function HeroMiniMetric({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <View style={s.heroMini}>
      <Text style={s.heroMiniLabel}>{label}</Text>
      <Text style={s.heroMiniValue}>{value}</Text>
      <Text style={s.heroMiniSub}>{sub}</Text>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════
// KPI STAT CARD
// ═══════════════════════════════════════════════════════════════════

export function KPIStatCard({ metric }: { metric: KPIMetric }) {
  const trendColor = metric.trendDirection === 'up' ? colors.accentGreen
    : metric.trendDirection === 'down' ? colors.accentAmber : colors.textTertiary;

  return (
    <View style={s.kpiCard}>
      <Text style={s.kpiLabel}>{metric.label}</Text>
      <Text style={s.kpiValue}>{metric.value}</Text>
      <Text style={s.kpiContext}>{metric.context}</Text>
      <Text style={[s.kpiTrend, { color: trendColor }]}>{metric.trend}</Text>
    </View>
  );
}

export function KPIRow({ metrics }: { metrics: KPIMetric[] }) {
  return (
    <View style={s.kpiGrid}>
      {metrics.slice(0, 6).map((m) => <KPIStatCard key={m.key} metric={m} />)}
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ALERTS + ACTIONS
// ═══════════════════════════════════════════════════════════════════

export function AlertsPanel({ alerts }: { alerts: DashboardAlert[] }) {
  if (alerts.length === 0) return null;
  return (
    <View style={s.alertsWrap}>
      {alerts.map((a) => (
        <View key={a.id} style={[s.alertCard, { borderLeftColor: ALERT_COLORS[a.severity] }]}>
          <Ionicons name={ALERT_ICONS[a.severity] as never} size={18} color={ALERT_COLORS[a.severity]} />
          <View style={s.alertContent}>
            <Text style={[s.alertTitle, { color: ALERT_COLORS[a.severity] }]}>{a.title}</Text>
            <Text style={s.alertBody}>{a.body}</Text>
            {a.ctaLabel && a.ctaRoute && (
              <TouchableOpacity onPress={() => router.push(a.ctaRoute as never)} style={s.alertCta}>
                <Text style={[s.alertCtaText, { color: ALERT_COLORS[a.severity] }]}>{a.ctaLabel}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      ))}
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════
// LIVE OPS ROW
// ═══════════════════════════════════════════════════════════════════

export function LiveOpsRow({ ops, collapsed }: { ops: LiveOpsMetrics; collapsed?: boolean }) {
  if (collapsed) {
    return (
      <View style={s.sectionCard}>
        <Text style={s.sectionLabel}>LIVE OPS</Text>
        <Text style={s.collapsedText}>Door not active. Live ops will appear when your event goes live.</Text>
      </View>
    );
  }
  return (
    <View style={s.sectionCard}>
      <View style={s.sectionHeader}>
        <Text style={s.sectionLabel}>LIVE OPS</Text>
        <View style={[s.pill, { backgroundColor: ops.offlineSyncStatus === 'synced' ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)' }]}>
          <Text style={[s.pillText, { color: ops.offlineSyncStatus === 'synced' ? '#10B981' : '#F59E0B', fontSize: 10 }]}>
            {ops.offlineSyncStatus === 'synced' ? 'Synced' : ops.offlineSyncStatus}
          </Text>
        </View>
      </View>
      <View style={s.opsGrid}>
        <OpsStat label="Throughput" value={`${ops.doorThroughput}/min`} />
        <OpsStat label="Scan Rate" value={`${ops.scanSuccessRate}%`} />
        <OpsStat label="Occupancy" value={`${ops.occupancy}`} sub={`${ops.occupancyPercent}%`} />
        <OpsStat label="Denied" value={`${ops.deniedEntries}`} warn={ops.deniedEntries > 5} />
        <OpsStat label="Duplicates" value={`${ops.duplicateAttempts}`} warn={ops.duplicateAttempts > 3} />
        <OpsStat label="Door Sales" value={`${ops.doorSales}`} sub={`$${ops.doorSalesRevenue}`} />
      </View>
    </View>
  );
}

function OpsStat({ label, value, sub, warn }: { label: string; value: string; sub?: string; warn?: boolean }) {
  return (
    <View style={s.opsStat}>
      <Text style={s.opsLabel}>{label}</Text>
      <Text style={[s.opsValue, warn && { color: colors.accentAmber }]}>{value}</Text>
      {sub && <Text style={s.opsSub}>{sub}</Text>}
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════
// GROWTH ROW
// ═══════════════════════════════════════════════════════════════════

export function GrowthRow({ growth, collapsed }: { growth: GrowthMetrics; collapsed?: boolean }) {
  if (collapsed) {
    return (
      <View style={s.sectionCard}>
        <Text style={s.sectionLabel}>GROWTH</Text>
        <Text style={s.collapsedText}>{growth.views.toLocaleString()} views {'\u00b7'} {growth.conversionRate}% conversion</Text>
      </View>
    );
  }
  return (
    <View style={s.sectionCard}>
      <Text style={s.sectionLabel}>GROWTH</Text>
      <View style={s.opsGrid}>
        <OpsStat label="Impressions" value={growth.impressions.toLocaleString()} />
        <OpsStat label="Views" value={growth.views.toLocaleString()} />
        <OpsStat label="Saves" value={`${growth.saves}`} />
        <OpsStat label="Checkouts" value={`${growth.checkoutStarts}`} />
        <OpsStat label="Purchases" value={`${growth.purchases}`} />
        <OpsStat label="Conversion" value={`${growth.conversionRate}%`} />
      </View>
      {/* Traffic sources */}
      <View style={s.subSection}>
        <Text style={s.subLabel}>Traffic sources</Text>
        {growth.trafficSources.map((src) => (
          <View key={src.source} style={s.sourceRow}>
            <Text style={s.sourceText}>{src.source}</Text>
            <View style={s.sourceBarTrack}>
              <View style={[s.sourceBarFill, { width: `${src.percent}%` }]} />
            </View>
            <Text style={s.sourcePct}>{src.percent}%</Text>
          </View>
        ))}
      </View>
      {/* Circle performance */}
      <View style={s.subSection}>
        <Text style={s.subLabel}>ECHO Circle</Text>
        <Text style={s.subValue}>{growth.circleCompletions}/{growth.circleStarts} completed ({growth.circleStarts > 0 ? Math.round((growth.circleCompletions / growth.circleStarts) * 100) : 0}%)</Text>
      </View>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════
// FINANCE ROW
// ═══════════════════════════════════════════════════════════════════

export function FinanceRow({ finance }: { finance: FinanceMetrics }) {
  return (
    <View style={s.sectionCard}>
      <Text style={s.sectionLabel}>FINANCE</Text>
      <View style={s.financeGrid}>
        <FinanceLine label="Gross" value={`$${finance.gross.toLocaleString()}`} />
        <FinanceLine label="Service fees" value={`-$${finance.serviceFees.toLocaleString()}`} muted />
        <FinanceLine label="Processing" value={`-$${finance.processingFees.toLocaleString()}`} muted />
        {finance.refundCount > 0 && (
          <FinanceLine label={`Refunds (${finance.refundCount})`} value={`-$${finance.refunds.toLocaleString()}`} warn />
        )}
        {finance.donations > 0 && (
          <FinanceLine label="Donations" value={`+$${finance.donations.toLocaleString()}`} />
        )}
        <View style={s.financeDivider} />
        <FinanceLine label="Net Payout" value={`$${finance.netPayout.toLocaleString()}`} bold />
      </View>
      <View style={s.payoutRow}>
        <View style={[s.pill, { backgroundColor: PAYOUT_BG[finance.payoutStatus] }]}>
          <Text style={[s.pillText, { color: PAYOUT_COLOR[finance.payoutStatus], fontSize: 10 }]}>
            {finance.payoutStatus === 'not_configured' ? 'Not Connected' : finance.payoutStatus}
          </Text>
        </View>
        {finance.payoutDate && <Text style={s.payoutDate}>Expected {finance.payoutDate}</Text>}
      </View>
    </View>
  );
}

function FinanceLine({ label, value, muted, warn, bold }: { label: string; value: string; muted?: boolean; warn?: boolean; bold?: boolean }) {
  return (
    <View style={s.financeLine}>
      <Text style={[s.financeLabel, muted && { color: colors.textTertiary }]}>{label}</Text>
      <Text style={[
        s.financeValue,
        muted && { color: colors.textTertiary },
        warn && { color: colors.accentAmber },
        bold && { color: colors.textPrimary, fontSize: 18, fontWeight: '700' },
      ]}>{value}</Text>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════
// POST-EVENT INSIGHTS
// ═══════════════════════════════════════════════════════════════════

export function PostEventRow({ insights }: { insights: PostEventInsights }) {
  return (
    <View style={s.sectionCard}>
      <Text style={s.sectionLabel}>POST-EVENT INSIGHTS</Text>
      <View style={s.opsGrid}>
        <OpsStat label="Attendance" value={`${insights.finalAttendance}`} />
        <OpsStat label="No-Show" value={`${insights.noShowRate}%`} warn={insights.noShowRate > 15} />
        <OpsStat label="Repeat" value={`${insights.repeatAttendeeRate}%`} />
      </View>
      <View style={s.subSection}>
        <Text style={s.subLabel}>Best source</Text>
        <Text style={s.subValue}>{insights.bestSource}</Text>
      </View>
      <View style={s.subSection}>
        <Text style={s.subLabel}>Best purchase window</Text>
        <Text style={s.subValue}>{insights.bestPurchaseWindow}</Text>
      </View>
      <View style={s.insightBox}>
        <Ionicons name="sparkles" size={14} color="rgba(32,199,255,0.70)" />
        <Text style={s.insightText}>{insights.topLearning}</Text>
      </View>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MARKET POSITION CARD
// ═══════════════════════════════════════════════════════════════════

export function MarketPositionCard({ position }: { position: MarketPosition }) {
  return (
    <View style={s.sectionCard}>
      <Text style={s.sectionLabel}>MARKET POSITION</Text>
      <View style={s.opsGrid}>
        <OpsStat label="Uniqueness" value={`${position.localUniquenessScore}`} sub={position.uniquenessLabel} />
        <OpsStat label="Category" value={`${position.categoryDensity}`} sub={position.categoryDensityLabel} />
        <OpsStat label="Time Slot" value={`${position.timeSlotCrowding}`} sub={position.timeSlotLabel} />
      </View>
      <View style={s.insightBox}>
        <Ionicons name="trending-up" size={14} color="rgba(32,199,255,0.70)" />
        <Text style={s.insightText}>{position.benchmarkNote}</Text>
      </View>
      <View style={[s.insightBox, { marginTop: 8 }]}>
        <Ionicons name="calendar-outline" size={14} color="rgba(123,77,255,0.70)" />
        <Text style={s.insightText}>{position.bestFutureSlot}</Text>
      </View>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════
// EMPTY / LOADING STATES
// ═══════════════════════════════════════════════════════════════════

export function DashboardLoading() {
  return (
    <View style={s.stateWrap}>
      <ActivityIndicator size="large" color={colors.accentCyan} />
      <Text style={s.stateText}>Loading dashboard...</Text>
    </View>
  );
}

export function DashboardEmpty() {
  return (
    <View style={s.stateWrap}>
      <Ionicons name="calendar-outline" size={48} color="rgba(255,255,255,0.12)" />
      <Text style={s.stateTitle}>No events yet</Text>
      <Text style={s.stateText}>Create your first event to unlock the HOST command center with performance insights, live ops, and market intelligence.</Text>
      <TouchableOpacity style={s.heroCta} onPress={() => router.push('/(host)/create')} activeOpacity={0.85}>
        <Text style={s.heroCtaText}>Create Event</Text>
        <Ionicons name="add" size={16} color={colors.bg} />
      </TouchableOpacity>
    </View>
  );
}

export function DashboardError({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={s.stateWrap}>
      <Ionicons name="cloud-offline-outline" size={48} color="rgba(255,255,255,0.20)" />
      <Text style={s.stateTitle}>Unable to load dashboard</Text>
      <Text style={s.stateText}>Check your connection and try again.</Text>
      <TouchableOpacity style={[s.heroCta, { marginTop: 16 }]} onPress={onRetry} activeOpacity={0.85}>
        <Text style={s.heroCtaText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════
// COLOR MAPS
// ═══════════════════════════════════════════════════════════════════

const HEALTH_COLORS: Record<string, string> = {
  green: '#10B981', blue: '#3B82F6', amber: '#F59E0B', red: '#EF4444', gray: '#8E9099',
};

const STATUS_BG: Record<string, string> = {
  draft: 'rgba(245,158,11,0.12)', selling: 'rgba(59,130,246,0.12)',
  live: 'rgba(16,185,129,0.12)', completed: 'rgba(255,255,255,0.06)',
  published: 'rgba(59,130,246,0.12)',
};
const STATUS_COLOR: Record<string, string> = {
  draft: '#F59E0B', selling: '#3B82F6', live: '#10B981',
  completed: 'rgba(255,255,255,0.50)', published: '#3B82F6',
};

const ALERT_COLORS: Record<string, string> = {
  critical: '#EF4444', warning: '#F59E0B', info: '#3B82F6', success: '#10B981',
};
const ALERT_ICONS: Record<string, string> = {
  critical: 'alert-circle', warning: 'warning', info: 'information-circle', success: 'checkmark-circle',
};

const PAYOUT_BG: Record<string, string> = {
  pending: 'rgba(245,158,11,0.12)', processing: 'rgba(59,130,246,0.12)',
  paid: 'rgba(16,185,129,0.12)', scheduled: 'rgba(59,130,246,0.12)',
  not_configured: 'rgba(239,68,68,0.12)',
};
const PAYOUT_COLOR: Record<string, string> = {
  pending: '#F59E0B', processing: '#3B82F6', paid: '#10B981',
  scheduled: '#3B82F6', not_configured: '#EF4444',
};

// ═══════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════

const s = StyleSheet.create({
  // Hero
  heroGradient: { borderRadius: radius.xl, padding: 1, ...shadows.elevated },
  heroInner: { borderRadius: radius.xl, backgroundColor: 'rgba(24,27,34,0.97)', padding: 20 },
  heroTopRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill },
  liveDot: { width: 6, height: 6, borderRadius: 3 },
  pillText: { fontSize: 12, fontWeight: '700' },
  heroTitle: { color: colors.textPrimary, fontSize: 22, fontWeight: '700', lineHeight: 28, marginBottom: 4 },
  heroMeta: { color: colors.textSecondary, fontSize: 14, lineHeight: 20 },
  aiSummaryWrap: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 14, padding: 12, borderRadius: radius.lg, backgroundColor: 'rgba(32,199,255,0.04)', borderWidth: 1, borderColor: 'rgba(32,199,255,0.08)' },
  aiSummaryText: { flex: 1, color: colors.textSecondary, fontSize: 13, lineHeight: 19 },
  heroMetricsRow: { flexDirection: 'row', gap: 8, marginTop: 16, marginBottom: 12 },
  heroMini: { flex: 1, padding: 10, borderRadius: radius.md, backgroundColor: 'rgba(255,255,255,0.03)' },
  heroMiniLabel: { color: colors.textTertiary, fontSize: 10, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 4 },
  heroMiniValue: { color: colors.textPrimary, fontSize: 14, fontWeight: '700' },
  heroMiniSub: { color: colors.textTertiary, fontSize: 11, marginTop: 2 },
  progressTrack: { height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.06)', marginBottom: 16, overflow: 'hidden' },
  progressFill: { height: 4, borderRadius: 2 },
  heroCta: { minHeight: 46, borderRadius: radius.pill, backgroundColor: colors.textPrimary, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  heroCtaText: { color: colors.bg, fontSize: 14, fontWeight: '700' },

  // KPI
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  kpiCard: { width: '47%', flexGrow: 1, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', borderRadius: radius.xl, padding: 14 },
  kpiLabel: { ...typography.labelSm, color: colors.textTertiary, marginBottom: 8 },
  kpiValue: { color: colors.textPrimary, fontSize: 22, fontWeight: '700', marginBottom: 4 },
  kpiContext: { color: colors.textTertiary, fontSize: 12, lineHeight: 16, marginBottom: 4 },
  kpiTrend: { fontSize: 12, fontWeight: '600' },

  // Alerts
  alertsWrap: { gap: 10 },
  alertCard: { flexDirection: 'row', gap: 12, padding: 14, borderRadius: radius.lg, backgroundColor: 'rgba(255,255,255,0.02)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', borderLeftWidth: 3 },
  alertContent: { flex: 1 },
  alertTitle: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  alertBody: { color: colors.textSecondary, fontSize: 13, lineHeight: 18 },
  alertCta: { marginTop: 8 },
  alertCtaText: { fontSize: 13, fontWeight: '700' },

  // Section card
  sectionCard: { backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', borderRadius: radius.xl, padding: 18 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionLabel: { ...typography.labelSm, color: colors.textTertiary, marginBottom: 14 },
  collapsedText: { color: colors.textSecondary, fontSize: 14 },

  // Ops grid
  opsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  opsStat: { width: '30%', flexGrow: 1 },
  opsLabel: { color: colors.textTertiary, fontSize: 10, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 4 },
  opsValue: { color: colors.textPrimary, fontSize: 17, fontWeight: '700' },
  opsSub: { color: colors.textTertiary, fontSize: 11, marginTop: 2 },

  // Sub sections
  subSection: { marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.04)' },
  subLabel: { color: colors.textTertiary, fontSize: 11, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8 },
  subValue: { color: colors.textSecondary, fontSize: 14, lineHeight: 20 },

  // Traffic source bars
  sourceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  sourceText: { color: colors.textSecondary, fontSize: 13, width: 90 },
  sourceBarTrack: { flex: 1, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.06)', overflow: 'hidden' },
  sourceBarFill: { height: 5, borderRadius: 3, backgroundColor: '#7B4DFF' },
  sourcePct: { color: colors.textTertiary, fontSize: 12, width: 36, textAlign: 'right' },

  // Finance
  financeGrid: { gap: 10 },
  financeLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  financeLabel: { color: colors.textSecondary, fontSize: 14 },
  financeValue: { color: colors.textSecondary, fontSize: 14, fontWeight: '600', fontVariant: ['tabular-nums'] },
  financeDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginVertical: 6 },
  payoutRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14 },
  payoutDate: { color: colors.textTertiary, fontSize: 12 },

  // Insight box
  insightBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 14, padding: 12, borderRadius: radius.md, backgroundColor: 'rgba(32,199,255,0.03)', borderWidth: 1, borderColor: 'rgba(32,199,255,0.06)' },
  insightText: { flex: 1, color: colors.textSecondary, fontSize: 13, lineHeight: 19 },

  // States
  stateWrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, paddingHorizontal: 32, gap: 14 },
  stateTitle: { color: colors.textPrimary, fontSize: 20, fontWeight: '700', textAlign: 'center' },
  stateText: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, textAlign: 'center' },
});
