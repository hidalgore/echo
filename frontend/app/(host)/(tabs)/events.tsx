/**
 * HOST Events List
 * ════════════════
 * Sections: Drafts, Upcoming, Past. Real store data + card actions.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius } from '../../../theme/hostTokens';
import { Text } from '../../../components/ui';
import { ModeSwitchHeader } from '../../../components/navigation/ModeSwitchHeader';
import { HostCapabilityBanner } from '../../../components/host/HostCapabilityBanner';
import { useEventDraftStore } from '../../../stores/eventDraftStore';
import { useEventStore } from '../../../stores/eventStore';
import { useHostProfileStore } from '../../../stores/hostProfileStore';
import { useAuthStore } from '../../../stores/authStore';
import { loadHostRuntime } from '../../../services/doorModeService';
import { getCloseoutReports, type CloseoutReport } from '../../../services/eventCloseoutReportService';
import { isDemoHostEvent } from '../../../services/mockHostEventSuite';
import { useDonationStore } from '../../../stores/donationStore';
import { formatDonationCurrency } from '../../../services/donationCampaignService';

/** Convert ISO date (YYYY-MM-DD) to US display format */
function formatDateUS(iso: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  if (!y || !m || !d) return iso;
  return `${parseInt(m, 10)}/${parseInt(d, 10)}/${y}`;
}

type EventStatus = 'draft' | 'published' | 'past';

const MOCK_PAST_EVENTS = [
  {
    id: 'mock_past_closeout_001',
    title: 'ECHO Nights: R&B Social',
    date: 'Sat, Apr 18',
    venue: 'The Listening Room',
    sold: 168,
    capacity: 200,
    isPast: true,
    report: null,
  },
  {
    id: 'mock_past_closeout_002',
    title: 'Golden Hour Nonprofit Mixer',
    date: 'Fri, Apr 10',
    venue: 'Tacoma Social Hall',
    sold: 126,
    capacity: 150,
    isPast: true,
    report: null,
  },
  {
    id: 'mock_past_closeout_003',
    title: 'Capitol Hill Afrobeats Lounge',
    date: 'Sat, Mar 28',
    venue: 'Midnight Loft',
    sold: 214,
    capacity: 240,
    isPast: true,
    report: null,
  },
  {
    id: 'mock_past_closeout_004',
    title: 'Community Arts & Access Night',
    date: 'Thu, Mar 12',
    venue: 'Pierce County Arts Center',
    sold: 94,
    capacity: 120,
    isPast: true,
    report: null,
  },
];


export default function HostEventsScreen() {
  const insets = useSafeAreaInsets();
  const { draft, isDirty } = useEventDraftStore();
  const events = useEventStore((state) => state.events);
  const hostProfile = useHostProfileStore((state) => state.profile);
  const hydrateHost = useHostProfileStore((state) => state.hydrate);
  const authUser = useAuthStore((state) => state.user);
  const activeHostName = hostProfile.displayName?.trim() || authUser?.name?.trim() || 'ECHO Host';
  const [runtime, setRuntime] = useState<Record<string, any>>({});
  const [closeoutReports, setCloseoutReports] = useState<CloseoutReport[]>([]);
  const [expandedPastId, setExpandedPastId] = useState<string | null>(null);

  useEffect(() => { void hydrateHost(); }, [hydrateHost]);
  useEffect(() => { void loadHostRuntime().then(setRuntime); void getCloseoutReports().then(setCloseoutReports); }, [events.length]);

  // Build sections
  const drafts = useMemo(() => {
    if (!isDirty) return [];
    return [{ id: 'draft_current', title: draft.title || 'Untitled Event', date: draft.date ? formatDateUS(draft.date) : 'No date set', venue: draft.venue || 'No venue', sold: 0, capacity: 0, status: 'draft' as const, isPast: false }];
  }, [isDirty, draft.title, draft.date, draft.venue]);

  const hostEvents = useMemo(() => events.filter((event) => {
    const eventHost = (event.host_name || '').trim();
    return eventHost === activeHostName || isDemoHostEvent(event.id) || String(event.id).startsWith('evt_host_');
  }), [events, activeHostName]);
  const upcoming = useMemo(() => hostEvents.filter((event) => (runtime[event.id]?.status || event.status || 'on_sale') !== 'ended').map((event) => ({ id: event.id, title: event.title, date: new Date(event.start_time).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }), venue: event.venue_name, sold: runtime[event.id]?.sold ?? 0, capacity: event.ticket_types.reduce((sum, ticket) => sum + ticket.available, 0), isPast: false })), [hostEvents, runtime]);
  const past = useMemo(() => {
    const realPast = hostEvents
      .filter((event) => (runtime[event.id]?.status || event.status) === 'ended')
      .map((event) => ({
        id: event.id,
        title: event.title,
        date: new Date(event.start_time).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        venue: event.venue_name,
        sold: runtime[event.id]?.sold ?? 0,
        capacity: event.ticket_types.reduce((sum, ticket) => sum + ticket.available, 0),
        isPast: true,
        report: closeoutReports.find((report) => report.eventId === event.id) || null,
      }));

    const existingIds = new Set(realPast.map((event) => event.id));
    const previewPast = MOCK_PAST_EVENTS.filter((event) => !existingIds.has(event.id));

    // Always keep four functional past events visible in demo/dev builds so
    // hosts can test expand/collapse, report previews, duplicate actions, and
    // download pill behavior even before real closeout data exists.
    return [...realPast, ...previewPast].slice(0, Math.max(4, realPast.length));
  }, [hostEvents, runtime, closeoutReports]);

  const handleEventPress = (id: string, status: EventStatus) => {
    if (status === 'draft') {
      router.push('/(host)/create');
    } else if (status === 'past') {
      setExpandedPastId((current) => current === id ? null : id);
    } else {
      router.push({ pathname: '/(host)/event-detail', params: { id } });
    }
  };

  const handleDuplicate = (event: { title: string; venue: string }) => {
    Alert.alert('Duplicate Event', `Create a copy of "${event.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Duplicate', onPress: () => {
        useEventDraftStore.getState().loadFromEvent({
          title: `${event.title} (Copy)`,
          venue: event.venue,
          city: '',
          categories: [],
          ageRestriction: 'all_ages',
          ticketingModel: 'paid',
          description: '',
          notes: '',
        });
        router.push('/(host)/create');
      }},
    ]);
  };

  return (
    <View style={s.container}>
      <ModeSwitchHeader title="Events" showNotification />
      <HostCapabilityBanner />

      {/* Create button */}
      <View style={s.headerRow}>
        <Text style={s.sectionCount}>
          {drafts.length + upcoming.length + past.length} events
        </Text>
        <TouchableOpacity style={s.createBtn} onPress={() => router.push('/(host)/create')} activeOpacity={0.85}>
          <Ionicons name="add" size={20} color={colors.bg} />
          <Text style={s.createBtnText}>Create</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 120 }]} showsVerticalScrollIndicator={false}>
        {/* Drafts */}
        {drafts.length > 0 && (
          <Section title="Drafts" count={drafts.length}>
            {drafts.map((e) => (
              <EventCard key={e.id} event={e} status="draft" onPress={() => handleEventPress(e.id, 'draft')} onDuplicate={() => {}} />
            ))}
          </Section>
        )}

        {/* Upcoming */}
        {upcoming.length > 0 && (
          <Section title="Upcoming" count={upcoming.length}>
            {upcoming.map((e) => (
              <EventCard key={e.id} event={e} status="published" onPress={() => handleEventPress(e.id, 'published')} onDuplicate={() => handleDuplicate(e)} />
            ))}
          </Section>
        )}

        {/* Past */}
        {past.length > 0 && (
          <Section title="Past" count={past.length}>
            {past.map((e) => (
              <EventCard
                key={e.id}
                event={e}
                status="past"
                onPress={() => handleEventPress(e.id, 'past')}
                onDuplicate={() => handleDuplicate(e)}
                expanded={expandedPastId === e.id}
                report={e.report}
              />
            ))}
          </Section>
        )}

        {/* Recap CTA */}
        {past.length > 0 && (
          <TouchableOpacity style={s.recapCard} activeOpacity={0.85} onPress={() => router.push('/(host)/recap')}>
            <Ionicons name="sparkles" size={18} color={colors.accentCyan} />
            <View style={{ flex: 1 }}>
              <Text style={s.recapTitle}>Post-event recap available</Text>
              <Text style={s.recapBody}>Review performance and AI recommendations.</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
          </TouchableOpacity>
        )}

        {/* Empty state */}
        {drafts.length === 0 && upcoming.length === 0 && past.length === 0 && (
          <View style={s.emptyState}>
            <Ionicons name="calendar-outline" size={48} color="rgba(255,255,255,0.12)" />
            <Text style={s.emptyTitle}>No events yet</Text>
            <Text style={s.emptyBody}>Create your first event to start selling tickets and managing entry.</Text>
            <TouchableOpacity style={s.emptyCta} onPress={() => router.push('/(host)/create')} activeOpacity={0.85}>
              <Text style={s.emptyCtaText}>Create Event</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function Section({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <View style={s.section}>
      <View style={s.sectionHeader}>
        <Text style={s.sectionTitle}>{title}</Text>
        <Text style={s.sectionBadge}>{count}</Text>
      </View>
      {children}
    </View>
  );
}

function EventCard({ event, status, onPress, onDuplicate, expanded = false, report = null }: { event: any; status: EventStatus; onPress: () => void; onDuplicate: () => void; expanded?: boolean; report?: CloseoutReport | null }) {
  const pct = event.capacity > 0 ? Math.round((event.sold / event.capacity) * 100) : 0;
  const statusConfig: Record<EventStatus, { label: string; color: string; bg: string }> = {
    draft: { label: 'Draft', color: '#F59E0B', bg: 'rgba(245,158,11,0.14)' },
    published: { label: 'Live', color: colors.accentCyan, bg: 'rgba(32,199,255,0.14)' },
    past: { label: 'Completed', color: colors.textTertiary, bg: 'rgba(255,255,255,0.06)' },
  };
  const cfg = statusConfig[status];

  return (
    <TouchableOpacity style={s.eventCard} activeOpacity={0.85} onPress={onPress}>
      <View style={s.eventHeader}>
        <View style={{ flex: 1 }}>
          <Text style={s.eventTitle}>{event.title}</Text>
          <Text style={s.eventMeta}>{event.venue} · {event.date}</Text>
        </View>
        <View style={[s.statusPill, { backgroundColor: cfg.bg }]}>
          <Text style={[s.statusPillText, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
      </View>

      {status !== 'draft' && (
        <>
          <View style={s.progressBar}><View style={[s.progressFill, { width: `${pct}%` }]} /></View>
          <Text style={s.soldCopy}>{event.sold} / {event.capacity} sold · {pct}%</Text>
        </>
      )}

      {/* Card actions */}
      <View style={s.actionsRow}>
        {status === 'draft' && (
          <ActionPill icon="create-outline" label="Continue editing" onPress={onPress} />
        )}
        {status === 'published' && (
          <>
            <ActionPill icon="megaphone-outline" label="Promote" onPress={() => router.push({ pathname: '/(host)/promote', params: { eventId: event.id } })} />
            <ActionPill icon="scan-outline" label="Door Mode" onPress={() => router.push({ pathname: '/(host)/(tabs)/door', params: { id: event.id } })} />
            <ActionPill icon="create-outline" label="Edit" onPress={onPress} />
          </>
        )}
        {status === 'past' && (
          <>
            <ActionPill icon={expanded ? 'chevron-up-outline' : 'analytics-outline'} label={expanded ? 'Hide report' : 'View report'} onPress={onPress} />
            <ActionPill icon="copy-outline" label="Duplicate" onPress={onDuplicate} />
          </>
        )}
      </View>

      {status === 'past' && expanded ? (
        <CloseoutReportPanel report={report} event={event} />
      ) : null}
    </TouchableOpacity>
  );
}

function CloseoutReportPanel({ report, event }: { report: CloseoutReport | null; event: any }) {
  const mockCapacity = Math.max(event.capacity || 180, 1);
  const mockCheckedIn = Math.max(event.sold || Math.round(mockCapacity * 0.72), 1);
  const mockRemaining = Math.max(mockCapacity - mockCheckedIn, 0);
  const mockAttendance = Math.round((mockCheckedIn / mockCapacity) * 100);
  const mockDenied = Math.max(2, Math.round(mockCapacity * 0.015));
  const mockScanSuccess = Math.max(90, Math.min(99, 100 - mockDenied));
  const mockTrustScore = Math.max(88, Math.min(98, 96 - Math.round(mockDenied / 2)));

  const display = report ? {
    title: 'Closeout Report',
    meta: `Email ${report.emailStatus === 'sent' ? 'sent' : 'queued'} to host · ${new Date(report.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
    checkedIn: report.checkedInCount,
    remaining: report.remainingCount,
    attendance: report.attendanceRate,
    denied: report.deniedCount,
    scanSuccess: report.analytics.scanSuccessRate,
    trust: report.analytics.entryTrustScore,
  } : {
    title: 'Report Preview',
    meta: 'Sample analytics shown until Door Mode closeout compiles the final report.',
    checkedIn: mockCheckedIn,
    remaining: mockRemaining,
    attendance: mockAttendance,
    denied: mockDenied,
    scanSuccess: mockScanSuccess,
    trust: mockTrustScore,
  };

  const donationCampaign = event.donation_campaign;
  const donationRecords = donationCampaign ? useDonationStore.getState().getRecordsForCampaign(donationCampaign.id) : [];
  const donationRaised = donationRecords.reduce((sum, record) => sum + record.amount, donationCampaign?.raisedAmount || 0);
  const donationDonors = donationRecords.length + (donationCampaign?.donorCount || 0);

  return (
    <View style={s.reportPanel}>
      <View style={s.reportTopRow}>
        <View style={{ flex: 1 }}>
          <Text style={s.reportTitle}>{display.title}</Text>
          <Text style={s.reportMeta}>{display.meta}</Text>
        </View>
        <View style={s.trustScore}>
          <Text style={s.trustScoreValue}>{display.trust}</Text>
          <Text style={s.trustScoreLabel}>Trust</Text>
        </View>
      </View>

      <View style={s.reportMetricGrid}>
        <ReportMetric label="Checked In" value={String(display.checkedIn)} />
        <ReportMetric label="No-show" value={String(display.remaining)} />
        <ReportMetric label="Attendance" value={`${display.attendance}%`} />
        <ReportMetric label="Denied" value={String(display.denied)} />
        <ReportMetric label="Scan Success" value={`${display.scanSuccess}%`} />
      </View>

      {donationCampaign ? (
        <View style={s.donationReportBox}>
          <View style={{ flex: 1 }}>
            <Text style={s.donationReportTitle}>Donation Campaign</Text>
            <Text style={s.donationReportMeta}>{donationCampaign.causeTitle} · closes at event closeout</Text>
          </View>
          <View style={s.donationReportMetric}>
            <Text style={s.donationReportValue}>{formatDonationCurrency(donationRaised)}</Text>
            <Text style={s.donationReportLabel}>{donationDonors} donors</Text>
          </View>
        </View>
      ) : null}

      <View style={s.reportDownloadRow}>
        <DownloadPill icon="document-text-outline" label="PDF" type="Attendance PDF" />
        <DownloadPill icon="people-outline" label="CSV" type="Attendee CSV" />
        <DownloadPill icon="analytics-outline" label="Analytics" type="Event Analytics PDF" />
        {donationCampaign ? <DownloadPill icon="heart-outline" label="Donors CSV" type="Donation donor CSV with name, email, amount, timestamp, refund status, and transaction IDs" /> : null}
      </View>
    </View>
  );
}

function ReportMetric({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.reportMetric}>
      <Text style={s.reportMetricValue}>{value}</Text>
      <Text style={s.reportMetricLabel}>{label}</Text>
    </View>
  );
}

function DownloadPill({ icon, label, type }: { icon: string; label: string; type: string }) {
  return (
    <TouchableOpacity style={s.downloadPill} activeOpacity={0.82} onPress={() => Alert.alert('Download', `${type} will be prepared for download.`)}>
      <Ionicons name={icon as never} size={14} color={colors.accentCyan} />
      <Text style={s.downloadPillText}>{label}</Text>
    </TouchableOpacity>
  );
}

function ActionPill({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={s.actionPill} onPress={onPress} activeOpacity={0.82}>
      <Ionicons name={icon as never} size={14} color={colors.textSecondary} />
      <Text style={s.actionPillText}>{label}</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 16 },
  sectionCount: { color: colors.textTertiary, fontSize: 13 },
  createBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 40, paddingHorizontal: 16, borderRadius: 20, backgroundColor: colors.accentCyan },
  createBtnText: { color: colors.bg, fontSize: 14, fontWeight: '700' },
  scroll: { paddingHorizontal: 20 },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '700' },
  sectionBadge: { color: colors.textTertiary, fontSize: 12, fontWeight: '600', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.06)' },
  eventCard: { padding: 16, marginBottom: 12, borderRadius: radius.xl, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  eventHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginBottom: 10 },
  eventTitle: { color: colors.textPrimary, fontSize: 17, fontWeight: '700', marginBottom: 4 },
  eventMeta: { color: colors.textSecondary, fontSize: 13 },
  statusPill: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill },
  statusPillText: { fontSize: 11, fontWeight: '700' },
  progressBar: { height: 4, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 999, marginBottom: 6, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.accentCyan, borderRadius: 999 },
  soldCopy: { color: colors.textSecondary, fontSize: 13, marginBottom: 12 },
  actionsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  actionPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.pill, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  actionPillText: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
  recapCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: radius.xl, backgroundColor: 'rgba(32,199,255,0.06)', borderWidth: 1, borderColor: 'rgba(32,199,255,0.12)', marginBottom: 12 },
  recapTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: '600', marginBottom: 2 },
  recapBody: { color: colors.textSecondary, fontSize: 13 },
  emptyState: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyTitle: { color: colors.textPrimary, fontSize: 20, fontWeight: '700' },
  emptyBody: { color: colors.textTertiary, fontSize: 15, textAlign: 'center', lineHeight: 22, maxWidth: 280 },
  emptyCta: { marginTop: 12, height: 48, paddingHorizontal: 28, borderRadius: radius.pill, backgroundColor: colors.accentCyan, alignItems: 'center', justifyContent: 'center' },
  emptyCtaText: { color: colors.bg, fontSize: 15, fontWeight: '700' },

  reportPanel: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingTop: 14,
  },
  reportTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  reportTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  reportMeta: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
  trustScore: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: 'rgba(16,185,129,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.20)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trustScoreValue: {
    color: '#10B981',
    fontSize: 17,
    fontWeight: '900',
  },
  trustScoreLabel: {
    color: 'rgba(255,255,255,0.42)',
    fontSize: 10,
    fontWeight: '700',
  },
  reportMetricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  reportMetric: {
    width: '47%',
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.035)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.055)',
    padding: 12,
  },
  reportMetricValue: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  donationReportBox: { marginTop: 14, padding: 14, borderRadius: radius.lg, backgroundColor: 'rgba(32,199,255,0.08)', borderWidth: 1, borderColor: 'rgba(32,199,255,0.16)', flexDirection: 'row', alignItems: 'center', gap: 12 },
  donationReportTitle: { fontSize: 13, fontWeight: '800', color: colors.textPrimary },
  donationReportMeta: { fontSize: 11, color: colors.textTertiary, marginTop: 3 },
  donationReportMetric: { alignItems: 'flex-end' },
  donationReportValue: { fontSize: 16, fontWeight: '800', color: colors.accentCyan },
  donationReportLabel: { fontSize: 10, color: colors.textTertiary, marginTop: 2 },
  reportMetricLabel: {
    color: colors.textTertiary,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 3,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  reportDownloadRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  downloadPill: {
    minHeight: 34,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  downloadPillText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '800',
  },
});
