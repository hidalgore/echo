/**
 * Host Event Detail — Analytics Overlay
 * ══════════════════════════════════════
 * Shows published event details with live performance metrics,
 * sell-through visualization, and quick action pills.
 * Accessed from Events list → tap on published/past event.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Share } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius } from '../../theme/hostTokens';
import { Text } from '../../components/ui';
import { EventHeroMedia } from '../../components/event';
import { useModeStore } from '../../stores/modeStore';
import { useEventStore } from '../../stores/eventStore';
import { hostAnalytics } from '../../services/analytics';
import { getEventRuntime, loadHostRuntime } from '../../services/doorModeService';
import { EVENT_DETAIL_VIDEO_MAX_SECONDS } from '../../constants/eventMedia';

import { ScreenBackButton } from '../../components/shared/ScreenBackButton';
// ─── Mock event data (will come from eventStore in production) ───────────────

const MOCK_EVENTS: Record<string, {
  id: string; title: string; venue: string; city: string;
  date: string; time: string; status: 'published' | 'past';
  sold: number; capacity: number; revenue: number;
  checkedIn: number; ticketTypes: Array<{ name: string; price: number; sold: number; capacity: number }>;
  hourlyData: Array<{ hour: string; tickets: number }>;
}> = {
  evt_1: {
    id: 'evt_1',
    title: 'Midnight Pulse: Friday Night at Nova',
    venue: 'Nova Rooftop', city: 'Seattle, WA',
    date: 'Fri, Apr 24', time: '9:00 PM',
    status: 'published',
    sold: 182, capacity: 250, revenue: 7240,
    checkedIn: 0,
    ticketTypes: [
      { name: 'General Admission', price: 30, sold: 142, capacity: 200 },
      { name: 'VIP', price: 75, sold: 40, capacity: 50 },
    ],
    hourlyData: [
      { hour: 'Mon', tickets: 12 }, { hour: 'Tue', tickets: 28 },
      { hour: 'Wed', tickets: 45 }, { hour: 'Thu', tickets: 38 },
      { hour: 'Fri', tickets: 32 }, { hour: 'Sat', tickets: 18 },
      { hour: 'Sun', tickets: 9 },
    ],
  },
  evt_2: {
    id: 'evt_2',
    title: 'Sunset Social',
    venue: 'Abbe Winery', city: 'Seattle, WA',
    date: 'Sat, Apr 19', time: '5:00 PM',
    status: 'past',
    sold: 140, capacity: 140, revenue: 4200,
    checkedIn: 128,
    ticketTypes: [
      { name: 'General Admission', price: 30, sold: 140, capacity: 140 },
    ],
    hourlyData: [
      { hour: 'Mon', tickets: 22 }, { hour: 'Tue', tickets: 35 },
      { hour: 'Wed', tickets: 40 }, { hour: 'Thu', tickets: 25 },
      { hour: 'Fri', tickets: 18 },
    ],
  },
};

export default function HostEventDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { capabilities } = useModeStore();
  const hydrateEvents = useEventStore((state) => state.hydrate);
  const liveEvent = useEventStore((state) => (id ? state.getEventById(id) : undefined));
  const [runtime, setRuntime] = useState<any>(null);

  useEffect(() => { void hydrateEvents(); }, [hydrateEvents]);
  useEffect(() => { if (id) void getEventRuntime(id).then(setRuntime); }, [id]);

  const event = liveEvent ? {
    id: liveEvent.id,
    title: liveEvent.title,
    venue: liveEvent.venue_name,
    city: liveEvent.venue_address.split(',').slice(-2).join(',').trim(),
    date: new Date(liveEvent.start_time).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
    time: new Date(liveEvent.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    status: (runtime?.status === 'ended' || liveEvent.status === 'ended') ? 'past' as const : 'published' as const,
    sold: runtime?.sold ?? 0,
    capacity: liveEvent.ticket_types.reduce((sum, ticket) => sum + ticket.available, 0),
    revenue: runtime?.revenue ?? 0,
    checkedIn: runtime?.checkedIn ?? 0,
    ticketTypes: liveEvent.ticket_types.map((ticket) => ({ name: ticket.name, price: ticket.price, sold: 0, capacity: ticket.available })),
    hourlyData: [
      { hour: 'Mon', tickets: 4 }, { hour: 'Tue', tickets: 8 }, { hour: 'Wed', tickets: 12 }, { hour: 'Thu', tickets: 10 }, { hour: 'Fri', tickets: 6 },
    ],
  } : (MOCK_EVENTS[id || 'evt_1'] || MOCK_EVENTS.evt_1);
  const sellPct = event.capacity > 0 ? Math.round((event.sold / event.capacity) * 100) : 0;
  const isPast = event.status === 'past';
  const checkInPct = isPast && event.checkedIn > 0
    ? Math.round((event.checkedIn / event.sold) * 100) : 0;

  React.useEffect(() => {
    hostAnalytics.screenViewed('host_event_detail');
  }, []);

  // Sparkline bars (simple horizontal bar chart)
  const maxTickets = useMemo(
    () => Math.max(...event.hourlyData.map((d) => d.tickets), 1),
    [event.hourlyData],
  );

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <ScreenBackButton />
        <Text style={s.headerTitle} numberOfLines={1}>Event Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 28 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Event media direction */}
        {liveEvent ? (
          <View style={s.mediaCard}>
            <EventHeroMedia
              uri={liveEvent.detail_media_url || liveEvent.image_url}
              type={liveEvent.detail_media_type || 'image'}
              posterUri={liveEvent.detail_media_poster_url || liveEvent.image_url}
              style={s.eventMedia}
              fallbackSeed={liveEvent.id}
            />
            <View style={s.mediaMetaRow}>
              <Text style={s.mediaLabel}>Home: still photo</Text>
              <Text style={s.mediaLabel}>Event Details: {liveEvent.detail_media_type === 'video' ? `video · ${EVENT_DETAIL_VIDEO_MAX_SECONDS}s max` : 'photo'}</Text>
            </View>
          </View>
        ) : null}

        {/* Event info card */}
        <View style={s.card}>
          <View style={s.statusRow}>
            <View style={[
              s.statusPill,
              { backgroundColor: isPast ? 'rgba(255,255,255,0.06)' : 'rgba(16,185,129,0.10)', borderColor: isPast ? 'rgba(255,255,255,0.10)' : 'rgba(16,185,129,0.25)' },
            ]}>
              <View style={[s.statusDot, { backgroundColor: isPast ? 'rgba(255,255,255,0.30)' : '#10B981' }]} />
              <Text style={[s.statusText, { color: isPast ? 'rgba(255,255,255,0.50)' : '#10B981' }]}>
                {isPast ? 'Completed' : 'Live'}
              </Text>
            </View>
          </View>
          <Text style={s.eventTitle}>{event.title}</Text>
          <Text style={s.eventMeta}>{event.venue} {'\u00b7'} {event.city}</Text>
          <Text style={s.eventMeta}>{event.date} {'\u00b7'} {event.time}</Text>
        </View>

        {/* Analytics overlay — only if canViewHostAnalytics */}
        {capabilities.canViewHostAnalytics ? (
          <>
            {/* Key metrics */}
            <View style={s.metricsGrid}>
              <MetricTile label="Tickets Sold" value={`${event.sold}/${event.capacity}`} accent={sellPct >= 75} />
              <MetricTile label="Revenue" value={`$${event.revenue.toLocaleString()}`} accent={false} />
              <MetricTile label="Sell-Through" value={`${sellPct}%`} accent={sellPct >= 90} />
              {isPast && <MetricTile label="Check-In Rate" value={`${checkInPct}%`} accent={checkInPct >= 80} />}
            </View>

            {/* Sell-through bar */}
            <View style={s.card}>
              <Text style={s.cardLabel}>SELL-THROUGH</Text>
              <View style={s.progressTrack}>
                <View style={[s.progressFill, { width: `${sellPct}%` }]} />
              </View>
              <Text style={s.progressText}>
                {event.sold} of {event.capacity} tickets sold ({sellPct}%)
              </Text>
            </View>

            {/* Ticket tier breakdown */}
            <View style={s.card}>
              <Text style={s.cardLabel}>TICKET TIERS</Text>
              {event.ticketTypes.map((tier) => {
                const tierPct = Math.round((tier.sold / tier.capacity) * 100);
                return (
                  <View key={tier.name} style={s.tierRow}>
                    <View style={s.tierInfo}>
                      <Text style={s.tierName}>{tier.name}</Text>
                      <Text style={s.tierMeta}>${tier.price} {'\u00b7'} {tier.sold}/{tier.capacity}</Text>
                    </View>
                    <View style={s.tierBarTrack}>
                      <View style={[s.tierBarFill, { width: `${tierPct}%` }]} />
                    </View>
                    <Text style={s.tierPct}>{tierPct}%</Text>
                  </View>
                );
              })}
            </View>

            {/* Sales velocity sparkline */}
            <View style={s.card}>
              <Text style={s.cardLabel}>SALES VELOCITY</Text>
              <View style={s.sparklineWrap}>
                {event.hourlyData.map((d) => (
                  <View key={d.hour} style={s.sparkCol}>
                    <View style={s.sparkBarOuter}>
                      <View style={[s.sparkBarInner, { height: `${(d.tickets / maxTickets) * 100}%` }]} />
                    </View>
                    <Text style={s.sparkLabel}>{d.hour}</Text>
                  </View>
                ))}
              </View>
            </View>
          </>
        ) : (
          <View style={s.lockedCard}>
            <Ionicons name="lock-closed" size={24} color="rgba(255,255,255,0.20)" />
            <Text style={s.lockedTitle}>Analytics unavailable</Text>
            <Text style={s.lockedBody}>Complete HOST activation to unlock event analytics.</Text>
          </View>
        )}

        {/* Quick actions */}
        <View style={s.actionsRow}>
          {!isPast && (
            <ActionPill icon="create-outline" label="Edit" onPress={() => router.push({ pathname: '/(host)/preview-edit', params: { eventId: event.id } })} />
          )}
          {!isPast && (
            <ActionPill icon="megaphone-outline" label="Promote" onPress={() => router.push({ pathname: '/(host)/promote', params: { eventId: event.id } })} />
          )}
          {!isPast && capabilities.canUseDoorMode && (
            <ActionPill icon="scan-outline" label="Door Mode" onPress={() => router.push({ pathname: '/(host)/(tabs)/door', params: { id: event.id } })} />
          )}
          {isPast && (
            <ActionPill icon="sparkles" label="Recap" onPress={() => router.push('/(host)/recap')} />
          )}
          <ActionPill icon="copy-outline" label="Duplicate" onPress={() => {
            hostAnalytics.eventDuplicated(event.id);
            router.push('/(host)/create');
          }} />
          <ActionPill icon="share-outline" label="Share" onPress={() => Share.share({ message: `View ${event.title} on ECHO: https://getechoaccess.com/events/${event.id}` })} />
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function MetricTile({ label, value, accent }: { label: string; value: string; accent: boolean }) {
  return (
    <View style={s.metricTile}>
      <Text style={[s.metricValue, accent && { color: '#10B981' }]}>{value}</Text>
      <Text style={s.metricLabel}>{label}</Text>
    </View>
  );
}

function ActionPill({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={s.actionPill} onPress={onPress} activeOpacity={0.82}>
      <Ionicons name={icon as never} size={16} color={colors.textSecondary} />
      <Text style={s.actionPillText}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.04)' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: colors.textPrimary },
  content: { padding: 16, gap: 14 },

  mediaCard: {
    marginBottom: 14,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  eventMedia: { width: '100%', height: 220, backgroundColor: 'rgba(255,255,255,0.06)' },
  mediaMetaRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingHorizontal: 14, paddingVertical: 11 },
  mediaLabel: { fontSize: 11.5, fontWeight: '800', color: 'rgba(255,255,255,0.58)', textTransform: 'uppercase', letterSpacing: 0.3 },
  card: { backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', borderRadius: radius.xl, padding: 18 },
  cardLabel: { fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.35)', letterSpacing: 1.2, marginBottom: 14 },

  statusRow: { marginBottom: 12 },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 12, fontWeight: '700' },
  eventTitle: { fontSize: 22, fontWeight: '700', color: colors.textPrimary, marginBottom: 6 },
  eventMeta: { fontSize: 14, color: colors.textSecondary, marginBottom: 2 },

  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metricTile: { flex: 1, minWidth: '45%', backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', borderRadius: radius.xl, padding: 16, alignItems: 'center' },
  metricValue: { fontSize: 24, fontWeight: '800', color: colors.textPrimary, marginBottom: 4 },
  metricLabel: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.40)', letterSpacing: 0.4, textTransform: 'uppercase' },

  progressTrack: { height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.06)', marginBottom: 10, overflow: 'hidden' },
  progressFill: { height: 8, borderRadius: 4, backgroundColor: '#10B981' },
  progressText: { fontSize: 13, color: 'rgba(255,255,255,0.50)' },

  tierRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  tierInfo: { width: 120 },
  tierName: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  tierMeta: { fontSize: 12, color: 'rgba(255,255,255,0.40)', marginTop: 2 },
  tierBarTrack: { flex: 1, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.06)', overflow: 'hidden' },
  tierBarFill: { height: 6, borderRadius: 3, backgroundColor: '#20C7FF' },
  tierPct: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.50)', width: 40, textAlign: 'right' },

  sparklineWrap: { flexDirection: 'row', gap: 6, alignItems: 'flex-end', height: 80 },
  sparkCol: { flex: 1, alignItems: 'center' },
  sparkBarOuter: { width: '100%', height: 60, justifyContent: 'flex-end', alignItems: 'center' },
  sparkBarInner: { width: '70%', minHeight: 4, borderRadius: 3, backgroundColor: '#7B4DFF' },
  sparkLabel: { fontSize: 10, color: 'rgba(255,255,255,0.30)', marginTop: 4 },

  lockedCard: { backgroundColor: 'rgba(255,255,255,0.02)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', borderRadius: radius.xl, padding: 32, alignItems: 'center', gap: 10 },
  lockedTitle: { fontSize: 16, fontWeight: '700', color: 'rgba(255,255,255,0.50)' },
  lockedBody: { fontSize: 13, color: 'rgba(255,255,255,0.35)', textAlign: 'center' },

  actionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionPill: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  actionPillText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
});
