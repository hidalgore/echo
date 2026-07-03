/**
 * HOST Payouts & Reporting — Full Build
 * ══════════════════════════════════════
 * Per ECHO Host Payout & Reporting Developer Build Spec v1.0
 * Sections: Hero → Funds Breakdown → Financial Summary → Nonprofit Summary →
 *           Reports Hub → Recent Payouts → Tax Docs → Finance Alerts
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, ScrollView, StyleSheet, TouchableOpacity, Alert,
  ActivityIndicator, LayoutAnimation, Platform, UIManager,
  ViewStyle,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius } from '../../../theme/hostTokens';
import { getCloseoutReports, type CloseoutReport } from '../../../services/eventCloseoutReportService';
import { Text } from '../../../components/ui';
import { ModeSwitchHeader } from '../../../components/navigation/ModeSwitchHeader';
import { useHostProfileStore } from '../../../stores/hostProfileStore';
import {
  getPayoutStatus, getEventFinanceSummary, getNonprofitSummary,
  getRecentPayouts, getFinanceAlerts, getTaxDocuments,
} from '../../../services/payoutMock';
import type {
  PayoutStatus, EventFinanceSummary, NonprofitReportingSummary,
  RecentPayout, FinanceAlert, TaxDocument, DateRangeKey, PayoutItemStatus,
} from '../../../types/payout';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const DATE_RANGES: { key: DateRangeKey; label: string }[] = [
  { key: 'last_7', label: 'Last 7 days' },
  { key: 'last_30', label: 'Last 30 days' },
  { key: 'this_month', label: 'This month' },
  { key: 'qtd', label: 'QTD' },
  { key: 'ytd', label: 'YTD' },
];

const STATUS_STYLES: Record<PayoutItemStatus, { color: string; label: string }> = {
  paid:          { color: '#10B981', label: 'Paid' },
  in_transit:    { color: '#20C7FF', label: 'In transit' },
  scheduled:     { color: '#F59E0B', label: 'Scheduled' },
  on_hold:       { color: '#EF4444', label: 'On hold' },
  action_needed: { color: '#EF4444', label: 'Action needed' },
};

const fmt = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function HostPayoutsScreen() {
  const insets = useSafeAreaInsets();
  const { payout: payoutProfile, completePayoutSetup } = useHostProfileStore();
  const connected = payoutProfile.payoutStatus === 'connected';
  const isNonprofit = false;

  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRangeKey>('last_30');
  const [selectedEvent, setSelectedEvent] = useState('all');
  const [payoutStatus, setPayoutStatus] = useState<PayoutStatus | null>(null);
  const [financeSummary, setFinanceSummary] = useState<EventFinanceSummary | null>(null);
  const [nonprofitSummary, setNonprofitSummary] = useState<NonprofitReportingSummary | null>(null);
  const [recentPayouts, setRecentPayouts] = useState<RecentPayout[]>([]);
  const [alerts, setAlerts] = useState<FinanceAlert[]>([]);
  const [taxDocs, setTaxDocs] = useState<TaxDocument[]>([]);
  const [closeoutReports, setCloseoutReports] = useState<CloseoutReport[]>([]);
  const [pastExpanded, setPastExpanded] = useState(true);
  const [taxExpanded, setTaxExpanded] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [ps, fs, rp, fa, td, cr] = await Promise.all([
      getPayoutStatus(), getEventFinanceSummary(), getRecentPayouts(),
      getFinanceAlerts(), getTaxDocuments(), getCloseoutReports(),
    ]);
    if (isNonprofit) {
      const ns = await getNonprofitSummary();
      setNonprofitSummary(ns);
    }
    setPayoutStatus(ps); setFinanceSummary(fs);
    setRecentPayouts(rp); setAlerts(fa); setTaxDocs(td); setCloseoutReports(cr);
    setLoading(false);
  }, [isNonprofit]);

  useEffect(() => { if (connected) loadData(); }, [connected, loadData]);

  const formatShortDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const toggleSection = (setter: React.Dispatch<React.SetStateAction<boolean>>) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setter(prev => !prev);
  };

  const handleExport = (type: string) => {
    Alert.alert('Export', `${type} report will be generated with current filters applied.`);
  };

  if (!connected) {
    return (
      <View style={s.container}>
        <ModeSwitchHeader title="Payouts & Reporting" showNotification />
        <ScrollView contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 120 }]} showsVerticalScrollIndicator={false}>
          <View style={s.connectCard}>
            <LinearGradient colors={['rgba(245,158,11,0.12)', 'rgba(239,68,68,0.08)', 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.connectGlow} />
            <Ionicons name="wallet-outline" size={40} color="#F59E0B" style={{ marginBottom: 16 }} />
            <Text style={s.connectTitle}>Connect payouts</Text>
            <Text style={s.connectBody}>Set up your payout account to receive earnings from paid events.</Text>
            <View style={s.trustList}>
              <TrustRow icon="shield-checkmark-outline" text="Secure processing via Stripe" />
              <TrustRow icon="time-outline" text="Payouts within 2-5 business days" />
              <TrustRow icon="lock-closed-outline" text="Bank-level encryption" />
            </View>
            <TouchableOpacity style={s.connectBtn} onPress={completePayoutSetup} activeOpacity={0.88}>
              <Ionicons name="card-outline" size={18} color={colors.bg} />
              <Text style={s.connectBtnText}>Connect payouts</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  if (loading || !payoutStatus || !financeSummary) {
    return (
      <View style={s.container}>
        <ModeSwitchHeader title="Payouts & Reporting" showNotification />
        <View style={s.loadingWrap}><ActivityIndicator color={colors.accentCyan} size="large" /></View>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <ModeSwitchHeader title="Payouts & Reporting" showNotification />
      <ScrollView contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 120 }]} showsVerticalScrollIndicator={false}>
        {/* Filter Row */}
        <View style={s.filterRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterScroll}>
            {DATE_RANGES.map(({ key, label }) => (
              <TouchableOpacity key={key} style={[s.filterPill, dateRange === key && s.filterPillActive]} onPress={() => setDateRange(key)} activeOpacity={0.82}>
                <Text style={[s.filterPillText, dateRange === key && s.filterPillTextActive]}>{label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Hero */}
        <View style={s.heroCard}>
          <LinearGradient colors={['rgba(32,199,255,0.08)', 'rgba(123,77,255,0.06)', 'transparent']} style={s.heroGlow} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
          <View style={s.heroTop}>
            <Text style={s.heroLabel}>AVAILABLE NOW</Text>
            <View style={[s.healthBadge, payoutStatus.payout_health === 'healthy' ? s.healthGreen : s.healthYellow]}>
              <Ionicons name={payoutStatus.payout_health === 'healthy' ? 'checkmark-circle' : 'alert-circle'} size={13} color={payoutStatus.payout_health === 'healthy' ? '#10B981' : '#F59E0B'} />
              <Text style={[s.healthText, { color: payoutStatus.payout_health === 'healthy' ? '#10B981' : '#F59E0B' }]}>{payoutStatus.payout_status_label}</Text>
            </View>
          </View>
          <Text style={s.heroAmount} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72}>{fmt(payoutStatus.available_now)}</Text>
          <View style={s.heroMeta}>
            <View style={s.heroMetaItem}><Ionicons name="calendar-outline" size={14} color="rgba(255,255,255,0.40)" /><Text style={s.heroMetaText}>Next payout {formatShortDate(payoutStatus.next_payout_date)}</Text></View>
            <View style={s.heroMetaItem}><Ionicons name="card-outline" size={14} color="rgba(255,255,255,0.40)" /><Text style={s.heroMetaText}>{payoutStatus.bank_name} ····{payoutStatus.bank_last_four}</Text></View>
          </View>
        </View>

        {/* Funds Breakdown */}
        <View style={s.fundsStrip}>
          <FundBlock label="Available" value={payoutStatus.available_now} color="#10B981" />
          <View style={s.fundsDivider} />
          <FundBlock label="Pending" value={payoutStatus.pending_settlement} color="#F59E0B" />
          <View style={s.fundsDivider} />
          <FundBlock label="On hold" value={payoutStatus.on_hold} color="#EF4444" />
          <View style={s.fundsDivider} />
          <FundBlock label="Paid out" value={payoutStatus.paid_out} color={colors.accentCyan} />
        </View>

        {/* Financial Summary */}
        <SectionHeader title="Financial Summary" />
        <View style={s.summaryCard}>
          <SummaryRow label="Gross Ticket Sales" value={fmt(financeSummary.gross_ticket_sales)} />
          {financeSummary.donations_received > 0 && <SummaryRow label="Donations Received" value={fmt(financeSummary.donations_received)} accent="#E4405F" />}
          <SummaryRow label="Platform Fees" value={`-${fmt(financeSummary.platform_fees)}`} muted />
          <SummaryRow label="Processing Fees" value={`-${fmt(financeSummary.processing_fees)}`} muted />
          <SummaryRow label="Refunds" value={`-${fmt(financeSummary.refunds)}`} muted />
          <View style={s.summaryDivider} />
          <SummaryRow label="Net Ticket Proceeds" value={fmt(financeSummary.net_ticket_proceeds)} bold />
          {financeSummary.net_donations > 0 && <SummaryRow label="Net Donations" value={fmt(financeSummary.net_donations)} bold accent="#E4405F" />}
          <View style={s.summaryDivider} />
          <SummaryRow label="Total Net Payout" value={fmt(financeSummary.total_net_payout)} bold hero />
        </View>

        {/* Reports Hub */}
        <SectionHeader title="Reports & Exports" />
        <View style={s.reportsGrid}>
          <ReportTile icon="document-text-outline" label="PDF Summary" sub="Presentation-ready" onPress={() => handleExport('Financial Summary PDF')} />
          <ReportTile icon="grid-outline" label="Excel Ledger" sub="Row-level detail" onPress={() => handleExport('Detailed Ledger XLSX')} />
          <ReportTile icon="heart-outline" label="Donations" sub="Donor report" onPress={() => handleExport('Donations Report')} />
          <ReportTile icon="swap-vertical-outline" label="Reconciliation" sub="Payout tracing" onPress={() => handleExport('Payout Reconciliation')} />
          <ReportTile icon="people-outline" label="Attendee Detail" sub="Event records" onPress={() => handleExport('Attendee Detail')} />
          <ReportTile icon="construct-outline" label="Custom Report" sub="Choose fields" onPress={() => handleExport('Custom Report Builder')} />
        </View>
        <Text style={s.filterContext}>Exports use: {DATE_RANGES.find(d => d.key === dateRange)?.label}, All events</Text>

        {/* Closeout reports access */}
        <View style={s.closeoutAccessCard}>
          <View style={{ flex: 1 }}>
            <Text style={s.closeoutTitle}>Event closeout reports</Text>
            <Text style={s.closeoutMeta}>
              {closeoutReports.length} report{closeoutReports.length === 1 ? '' : 's'} available. Open Past Events to view attendee lists, analytics, and downloads by event.
            </Text>
          </View>
          <TouchableOpacity style={s.closeoutAccessBtn} onPress={() => router.push('/(host)/(tabs)/events')} activeOpacity={0.82}>
            <Text style={s.closeoutAccessBtnText}>Past Events</Text>
            <Ionicons name="chevron-forward" size={14} color={colors.bg} />
          </TouchableOpacity>
        </View>

        {/* Recent Payouts */}
        <TouchableOpacity activeOpacity={0.82} style={s.sectionToggle} onPress={() => toggleSection(setPastExpanded)}>
          <Text style={s.sectionTitle}>Recent Payouts</Text>
          <Ionicons name={pastExpanded ? 'chevron-up' : 'chevron-down'} size={18} color="rgba(255,255,255,0.35)" />
        </TouchableOpacity>
        {pastExpanded && recentPayouts.map(p => {
          const sm = STATUS_STYLES[p.status];
          return (
            <View key={p.id} style={s.payoutRow}>
              <View style={[s.payoutIcon, { backgroundColor: `${sm.color}14` }]}>
                <Ionicons name={p.status === 'paid' ? 'arrow-up-outline' : p.status === 'scheduled' ? 'time-outline' : 'swap-horizontal-outline'} size={16} color={sm.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.payoutEvent}>{p.event_source}</Text>
                <Text style={s.payoutDate}>{formatShortDate(p.payout_date)}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={s.payoutAmount}>{fmt(p.amount)}</Text>
                <Text style={[s.payoutStatus, { color: sm.color }]}>{sm.label}</Text>
              </View>
            </View>
          );
        })}

        {/* Tax Docs */}
        <TouchableOpacity activeOpacity={0.82} style={s.sectionToggle} onPress={() => toggleSection(setTaxExpanded)}>
          <Text style={s.sectionTitle}>Tax & Reporting Documents</Text>
          <Ionicons name={taxExpanded ? 'chevron-up' : 'chevron-down'} size={18} color="rgba(255,255,255,0.35)" />
        </TouchableOpacity>
        {taxExpanded && taxDocs.map(doc => (
          <TouchableOpacity key={doc.id} style={s.taxRow} activeOpacity={0.82}>
            <View style={s.taxIcon}><Ionicons name="document-text-outline" size={18} color={colors.accentCyan} /></View>
            <View style={{ flex: 1 }}>
              <Text style={s.taxTitle}>{doc.title}</Text>
              <Text style={s.taxPeriod}>{doc.period}</Text>
            </View>
            <Ionicons name="download-outline" size={18} color="rgba(255,255,255,0.30)" />
          </TouchableOpacity>
        ))}

        {/* Finance Alerts */}
        <SectionHeader title="Finance Alerts" />
        <View style={s.alertEmpty}>
          <Ionicons name="shield-checkmark-outline" size={20} color="#10B981" />
          <Text style={s.alertEmptyText}>No issues detected</Text>
        </View>

        {/* Settings link */}
        <TouchableOpacity style={s.manageRow} onPress={() => router.push('/(host)/payout-settings')} activeOpacity={0.82}>
          <Ionicons name="settings-outline" size={18} color="rgba(255,255,255,0.45)" />
          <Text style={s.manageText}>Manage Payout Settings</Text>
          <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.20)" style={{ marginLeft: 'auto' }} />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function TrustRow({ icon, text }: { icon: string; text: string }) {
  return <View style={s.trustRow}><Ionicons name={icon as never} size={16} color="rgba(255,255,255,0.45)" /><Text style={s.trustText}>{text}</Text></View>;
}
function FundBlock({ label, value, color }: { label: string; value: number; color: string }) {
  return <View style={s.fundBlock}><View style={[s.fundDot, { backgroundColor: color }]} /><Text style={s.fundLabel}>{label}</Text><Text style={s.fundValue}>{fmt(value)}</Text></View>;
}
function SectionHeader({ title }: { title: string }) {
  return <View style={s.sectionHeaderRow}><Text style={s.sectionTitle}>{title}</Text></View>;
}
function SummaryRow({ label, value, bold, muted, hero, accent }: { label: string; value: string; bold?: boolean; muted?: boolean; hero?: boolean; accent?: string }) {
  return <View style={s.summaryRow}><Text style={[s.summaryLabel, bold && s.summaryBold, muted && s.summaryMuted]}>{label}</Text><Text style={[s.summaryValue, bold && s.summaryBold, muted && s.summaryMuted, hero && s.summaryHero, accent ? { color: accent } : null]}>{value}</Text></View>;
}
function ReportTile({ icon, label, sub, onPress }: { icon: string; label: string; sub: string; onPress: () => void }) {
  return <TouchableOpacity style={s.reportTile} onPress={onPress} activeOpacity={0.82}><Ionicons name={icon as never} size={22} color={colors.accentCyan} /><Text style={s.reportLabel}>{label}</Text><Text style={s.reportSub}>{sub}</Text></TouchableOpacity>;
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingHorizontal: 20 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  connectCard: { position: 'relative', borderRadius: radius.xl, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', padding: 24, alignItems: 'center', overflow: 'hidden' },
  connectGlow: { ...StyleSheet.absoluteFillObject },
  connectTitle: { color: colors.textPrimary, fontSize: 22, fontWeight: '700', marginBottom: 10, textAlign: 'center' },
  connectBody: { color: colors.textSecondary, fontSize: 15, lineHeight: 22, textAlign: 'center', marginBottom: 24, maxWidth: 300 },
  trustList: { gap: 14, width: '100%', marginBottom: 24 },
  trustRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  trustText: { color: 'rgba(255,255,255,0.55)', fontSize: 14 },
  connectBtn: { width: '100%', height: 56, borderRadius: radius.pill, backgroundColor: '#F59E0B', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  connectBtnText: { fontSize: 17, fontWeight: '700', color: colors.bg },
  filterRow: { marginBottom: 16 },
  filterScroll: { gap: 8 },
  filterPill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  filterPillActive: { backgroundColor: 'rgba(32,199,255,0.12)', borderColor: 'rgba(32,199,255,0.30)' },
  filterPillText: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.40)' },
  filterPillTextActive: { color: colors.accentCyan },
  heroCard: { position: 'relative', borderRadius: radius.xl, padding: 24, marginBottom: 14, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  heroGlow: { ...StyleSheet.absoluteFillObject },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  heroLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1, color: 'rgba(255,255,255,0.35)' },
  healthBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  healthGreen: { backgroundColor: 'rgba(16,185,129,0.10)' },
  healthYellow: { backgroundColor: 'rgba(245,158,11,0.10)' },
  healthText: { fontSize: 12, fontWeight: '600' },
  heroAmount: { fontSize: 44, lineHeight: 50, fontWeight: '800', letterSpacing: -1.2, color: '#F8FAFC', marginBottom: 16, textShadowColor: 'rgba(32,199,255,0.22)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 14 },
  heroMeta: { gap: 8 },
  heroMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  heroMetaText: { color: 'rgba(255,255,255,0.45)', fontSize: 13 },
  fundsStrip: { flexDirection: 'row', borderRadius: radius.xl, padding: 16, marginBottom: 8, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  fundBlock: { flex: 1, alignItems: 'center', gap: 4 },
  fundDot: { width: 6, height: 6, borderRadius: 3 },
  fundLabel: { fontSize: 10, fontWeight: '600', color: 'rgba(255,255,255,0.35)', letterSpacing: 0.3 },
  fundValue: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  fundsDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginHorizontal: 4 },
  sectionHeaderRow: { marginTop: 24, marginBottom: 10 },
  sectionToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 24, marginBottom: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  summaryCard: { borderRadius: radius.xl, padding: 18, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 9 },
  summaryLabel: { fontSize: 14, color: 'rgba(255,255,255,0.55)' },
  summaryValue: { fontSize: 14, color: colors.textPrimary, fontWeight: '500' },
  summaryBold: { fontWeight: '700', color: colors.textPrimary },
  summaryMuted: { color: 'rgba(255,255,255,0.35)' },
  summaryHero: { fontSize: 18, color: colors.accentCyan },
  summaryDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginVertical: 6 },
  reportsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  reportTile: { width: '48%' as ViewStyle['width'], borderRadius: radius.xl, padding: 16, gap: 6, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', alignItems: 'center' },
  reportLabel: { fontSize: 13, fontWeight: '700', color: colors.textPrimary, textAlign: 'center' },
  reportSub: { fontSize: 11, color: 'rgba(255,255,255,0.35)', textAlign: 'center' },
  filterContext: { color: 'rgba(255,255,255,0.25)', fontSize: 11, textAlign: 'center', marginTop: 10, fontStyle: 'italic' },
  payoutRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
  payoutIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  payoutEvent: { color: colors.textPrimary, fontSize: 15, fontWeight: '600', marginBottom: 2 },
  payoutDate: { color: 'rgba(255,255,255,0.35)', fontSize: 12 },
  payoutAmount: { color: colors.textPrimary, fontSize: 15, fontWeight: '700', marginBottom: 2 },
  payoutStatus: { fontSize: 11, fontWeight: '600' },
  taxRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
  taxIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(32,199,255,0.08)' },
  taxTitle: { color: colors.textPrimary, fontSize: 14, fontWeight: '600', marginBottom: 2 },
  taxPeriod: { color: 'rgba(255,255,255,0.35)', fontSize: 12 },
  alertEmpty: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 16, borderRadius: radius.xl, backgroundColor: 'rgba(16,185,129,0.06)', borderWidth: 1, borderColor: 'rgba(16,185,129,0.12)' },
  alertEmptyText: { color: '#10B981', fontSize: 14, fontWeight: '600' },
  manageRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 24, padding: 16, borderRadius: radius.xl, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  manageText: { color: colors.textPrimary, fontSize: 15, fontWeight: '600' },

  closeoutCard: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(32,199,255,0.12)',
    backgroundColor: 'rgba(32,199,255,0.045)',
    padding: 16,
    marginBottom: 12,
  },
  closeoutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  closeoutTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 5,
  },
  closeoutMeta: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
  closeoutScore: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: 'rgba(16,185,129,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.20)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeoutScoreText: {
    color: '#10B981',
    fontSize: 17,
    fontWeight: '900',
  },
  closeoutScoreLabel: {
    color: 'rgba(255,255,255,0.42)',
    fontSize: 10,
    fontWeight: '700',
  },
  closeoutDownloads: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    marginTop: 14,
  },
  downloadPill: {
    minHeight: 34,
    borderRadius: 999,
    paddingHorizontal: 11,
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

  closeoutAccessCard: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(32,199,255,0.12)',
    backgroundColor: 'rgba(32,199,255,0.045)',
    padding: 16,
    marginBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  closeoutAccessBtn: {
    minHeight: 40,
    borderRadius: 999,
    paddingHorizontal: 13,
    backgroundColor: colors.accentCyan,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  closeoutAccessBtnText: {
    color: colors.bg,
    fontSize: 12,
    fontWeight: '900',
  },
});
