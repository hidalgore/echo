/**
 * ECHO Host Dashboard — Command Center
 * ═════════════════════════════════════
 * State-aware layout: Before Event / Live Event / After Event.
 * Dynamic emphasis: Growth before, LiveOps live, Insights after.
 * Production-ready with loading/empty/error states.
 */
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ModeSwitchHeader } from '../../../components/navigation/ModeSwitchHeader';
import { HostCapabilityBanner } from '../../../components/host/HostCapabilityBanner';
import { Text } from '../../../components/ui';
import { colors, radius, spacing } from '../../../theme/hostTokens';
import { useHostProfileStore } from '../../../stores/hostProfileStore';
import { useEventDraftStore } from '../../../stores/eventDraftStore';
import { buildDashboardState, buildEmptyDashboard, buildLoadingDashboard } from '../../../services/dashboardMock';
import { hostAnalytics } from '../../../services/analytics';
import type { DashboardState, EventPhase } from '../../../types/dashboard';

import {
  HeroCommandCard, KPIRow, AlertsPanel,
  LiveOpsRow, GrowthRow, FinanceRow,
  PostEventRow, MarketPositionCard,
  DashboardLoading, DashboardEmpty, DashboardError,
} from '../../../components/host/dashboard';

// Phase selector for demo — in production, derived from real event status
const PHASE_OPTIONS: { value: EventPhase; label: string }[] = [
  { value: 'before', label: 'Before Event' },
  { value: 'live', label: 'Live Event' },
  { value: 'after', label: 'After Event' },
];

export default function HostDashboardScreen() {
  const insets = useSafeAreaInsets();
  const { payout, profile } = useHostProfileStore();
  const { isDirty: hasDraft } = useEventDraftStore();

  // Demo phase selector (production: derived from event.status)
  const [selectedPhase, setSelectedPhase] = useState<EventPhase>('before');
  const [dashState, setDashState] = useState<DashboardState>(buildLoadingDashboard());

  // Simulate loading
  useEffect(() => {
    hostAnalytics.screenViewed('host_dashboard');
    const timer = setTimeout(() => {
      if (!hasDraft && profile.hostAccessStatus === 'not_started') {
        setDashState(buildEmptyDashboard());
      } else {
        setDashState(buildDashboardState(selectedPhase));
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [selectedPhase, hasDraft, profile.hostAccessStatus]);

  const handleRetry = useCallback(() => {
    setDashState(buildLoadingDashboard());
    setTimeout(() => setDashState(buildDashboardState(selectedPhase)), 800);
  }, [selectedPhase]);

  const { loadState, event, phase, kpis, alerts, liveOps, growth, finance, postEvent, marketPosition } = dashState;

  return (
    <View style={styles.container}>
      <ModeSwitchHeader title="HOST" topInset={insets.top} showNotification />
      <HostCapabilityBanner />

      {/* Phase demo selector */}
      <View style={styles.phaseRow}>
        {PHASE_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={[styles.phasePill, selectedPhase === opt.value && styles.phasePillActive]}
            onPress={() => setSelectedPhase(opt.value)}
            activeOpacity={0.82}
          >
            <Text style={[styles.phaseText, selectedPhase === opt.value && styles.phaseTextActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Loading */}
      {loadState === 'loading' && <DashboardLoading />}

      {/* Error */}
      {loadState === 'error' && <DashboardError onRetry={handleRetry} />}

      {/* Empty */}
      {loadState === 'empty' && <DashboardEmpty />}

      {/* Ready — state-aware layout */}
      {loadState === 'ready' && event && (
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* 1. Hero Command Card — always first */}
          <HeroCommandCard event={event} phase={phase} />

          {/* 2. KPI Row — always second */}
          <KPIRow metrics={kpis} />

          {/* 3. Alerts — always third */}
          <AlertsPanel alerts={alerts} />

          {/* ── STATE-AWARE ORDERING ── */}

          {phase === 'before' && (
            <>
              {/* Before: Growth emphasis first */}
              {growth && <GrowthRow growth={growth} />}
              {finance && <FinanceRow finance={finance} />}
              {marketPosition && <MarketPositionCard position={marketPosition} />}
              {/* Live Ops collapsed/preview */}
              {liveOps ? <LiveOpsRow ops={liveOps} /> : <LiveOpsRow ops={EMPTY_OPS} collapsed />}
            </>
          )}

          {phase === 'live' && (
            <>
              {/* Live: Ops emphasis first */}
              {liveOps && <LiveOpsRow ops={liveOps} />}
              {finance && <FinanceRow finance={finance} />}
              {growth && <GrowthRow growth={growth} collapsed />}
              {marketPosition && <MarketPositionCard position={marketPosition} />}
            </>
          )}

          {phase === 'after' && (
            <>
              {/* After: Insights first */}
              {postEvent && <PostEventRow insights={postEvent} />}
              {finance && <FinanceRow finance={finance} />}
              {marketPosition && <MarketPositionCard position={marketPosition} />}
              {growth && <GrowthRow growth={growth} />}
              {/* Live Ops as historical */}
              {liveOps && <LiveOpsRow ops={liveOps} />}
            </>
          )}

          {/* Quick Actions */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.actionsRow}>
            {QUICK_ACTIONS.map((action) => (
              <TouchableOpacity key={action.label} style={styles.actionCard} onPress={action.onPress} activeOpacity={0.85}>
                <Ionicons name={action.icon as never} size={20} color={colors.textPrimary} />
                <Text style={styles.actionLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </ScrollView>
      )}
    </View>
  );
}

// ─── Constants ──────────────────────────────────────────────────────────────

const EMPTY_OPS = {
  doorThroughput: 0, scanSuccessRate: 0, qrFallbackRate: 0,
  occupancy: 0, occupancyPercent: 0, offlineSyncStatus: 'synced' as const,
  deniedEntries: 0, duplicateAttempts: 0, doorSales: 0, doorSalesRevenue: 0,
};

const QUICK_ACTIONS = [
  { label: 'Create Event', icon: 'add-circle-outline', onPress: () => router.push('/(host)/create') },
  { label: 'Promote', icon: 'megaphone-outline', onPress: () => router.push('/(host)/social-settings') },
  { label: 'Events', icon: 'calendar-outline', onPress: () => router.push('/(host)/(tabs)/events') },
  { label: 'Payouts', icon: 'cash-outline', onPress: () => router.push('/(host)/(tabs)/payouts') },
  { label: 'Door', icon: 'scan-outline', onPress: () => router.push('/(host)/(tabs)/door') },
];

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: spacing.screenPaddingX, gap: 16 },

  phaseRow: { flexDirection: 'row', gap: 8, paddingHorizontal: spacing.screenPaddingX, paddingVertical: 10 },
  phasePill: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  phasePillActive: { backgroundColor: 'rgba(32,199,255,0.12)', borderColor: 'rgba(32,199,255,0.25)' },
  phaseText: { color: colors.textTertiary, fontSize: 12, fontWeight: '600' },
  phaseTextActive: { color: '#20C7FF' },

  actionsRow: { gap: 12, paddingTop: 4 },
  actionCard: { width: 110, minHeight: 82, borderRadius: radius.xl, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', padding: 14, justifyContent: 'space-between' },
  actionLabel: { color: colors.textPrimary, fontSize: 13, fontWeight: '600', marginTop: 8 },
});
