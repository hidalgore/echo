/**
 * /host/reports — Event closeout & reports page (mock UI).
 *
 * Locked v59 sections:
 * - Event closeout summary
 * - Attendance report
 * - Ticket revenue
 * - Donation breakdown
 * - Payout status
 * - CSV / PDF export placeholders
 * - Analytics placeholder
 * - Email report placeholder
 */
import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { brand } from '../../theme/brand';
import { WebShell } from '../../components/web/WebShell';
import { WebSection } from '../../components/web/WebSection';
import { WebCTA } from '../../components/web/WebCTA';

type StatRow = { label: string; value: string; sub?: string };

const ATTENDANCE: StatRow[] = [
  { label: 'Tickets reserved', value: '482', sub: 'of 600 capacity' },
  { label: 'Checked in', value: '443', sub: '92% of reservations' },
  { label: 'No-shows', value: '39', sub: '8% of reservations' },
  { label: 'Transfers completed', value: '57', sub: '12% of tickets' },
];

const REVENUE: StatRow[] = [
  { label: 'Gross revenue', value: '$28,440' },
  { label: 'ECHO platform fee (5%)', value: '\u2212 $1,422' },
  { label: 'Processing fees', value: '\u2212 $806' },
  { label: 'Net payout', value: '$26,212', sub: 'Scheduled 48h after event close' },
];

const DONATION: StatRow[] = [
  { label: 'Donors', value: '186', sub: '38% of attendees' },
  { label: 'Total raised', value: '$4,210' },
  { label: 'Average gift', value: '$22.64' },
  { label: 'Cause', value: 'Greenline Youth Music', sub: 'EIN ending 4421' },
];

export default function HostReportsPage() {
  if (Platform.OS !== 'web') return null;
  const { width } = useWindowDimensions();
  const compact = width < 880;

  return (
    <WebShell ambient>
      {/* Header */}
      <WebSection align="left" paddingVertical={40} maxWidth={1100}>
        <View style={[styles.header, compact && { flexDirection: 'column', alignItems: 'flex-start', gap: 12 }]}>
          <View>
            <Text style={styles.eyebrow}>EVENT CLOSEOUT</Text>
            <Text style={styles.title}>The Midnight Tour \u2014 Seattle</Text>
            <Text style={styles.sub}>Closed Saturday at 2:14 AM \u00B7 482 reservations, 443 checked in</Text>
          </View>
          <View style={styles.exportRow}>
            <TouchableOpacity style={styles.exportBtn}>
              <Ionicons name="document-text-outline" size={16} color="#FFFFFF" />
              <Text style={styles.exportBtnText}>Export CSV</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.exportBtn}>
              <Ionicons name="document-outline" size={16} color="#FFFFFF" />
              <Text style={styles.exportBtnText}>Export PDF</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.exportBtn}>
              <Ionicons name="mail-outline" size={16} color="#FFFFFF" />
              <Text style={styles.exportBtnText}>Email Report</Text>
            </TouchableOpacity>
          </View>
        </View>
      </WebSection>

      {/* Closeout summary hero */}
      <WebSection align="left" paddingVertical={40} maxWidth={1100}>
        <View style={styles.summaryCard}>
          <View style={[styles.summaryRow, compact && { flexDirection: 'column', gap: 22 }]}>
            <View style={styles.summaryBlock}>
              <Text style={styles.summaryLabel}>Attendance rate</Text>
              <Text style={styles.summaryValue}>92%</Text>
              <Text style={styles.summarySub}>443 of 482 checked in</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryBlock}>
              <Text style={styles.summaryLabel}>Net payout</Text>
              <Text style={styles.summaryValue}>$26,212</Text>
              <Text style={styles.summarySub}>Paying Tuesday</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryBlock}>
              <Text style={styles.summaryLabel}>Total raised</Text>
              <Text style={styles.summaryValue}>$4,210</Text>
              <Text style={styles.summarySub}>For Greenline Youth Music</Text>
            </View>
          </View>
        </View>
      </WebSection>

      {/* Three breakdown cards */}
      <WebSection align="left" paddingVertical={40} maxWidth={1100}>
        <View style={[styles.grid, compact && { flexDirection: 'column' }]}>
          <StatPanel title="Attendance" rows={ATTENDANCE} />
          <StatPanel title="Revenue & fees" rows={REVENUE} highlightLast />
          <StatPanel title="Donations" rows={DONATION} accent />
        </View>
      </WebSection>

      {/* Analytics placeholder */}
      <WebSection align="left" paddingVertical={40} maxWidth={1100}>
        <View style={styles.panel}>
          <View style={styles.panelHeader}>
            <Ionicons name="stats-chart-outline" size={18} color={brand.cyanAccessible} />
            <Text style={styles.panelTitle}>Door analytics</Text>
          </View>
          <View style={styles.chartPlaceholder}>
            {[28, 44, 62, 75, 88, 92, 76, 58, 40, 28, 16, 8].map((h, i) => (
              <View
                key={i}
                style={[styles.chartBar, { height: `${h}%` }]}
              />
            ))}
          </View>
          <Text style={styles.chartCaption}>Hourly check-ins from 9:00 PM to 1:00 AM</Text>
        </View>
      </WebSection>

      {/* Payout status footer */}
      <WebSection align="center" paddingVertical={40} maxWidth={820}>
        <View style={styles.payoutFooter}>
          <Ionicons name="wallet-outline" size={22} color={brand.cyanAccessible} />
          <Text style={styles.payoutFooterTitle}>Payout in motion</Text>
          <Text style={styles.payoutFooterBody}>
            $26,212 will land in your connected account within 48 hours of event close. Donation routing to Greenline Youth Music is processed separately on the same schedule.
          </Text>
          <WebCTA label="Back to Dashboard" href="/host/dashboard" variant="primary" size="md" />
        </View>
      </WebSection>
    </WebShell>
  );
}

function StatPanel({
  title,
  rows,
  highlightLast,
  accent,
}: {
  title: string;
  rows: StatRow[];
  highlightLast?: boolean;
  accent?: boolean;
}) {
  return (
    <View style={[styles.statPanel, accent && styles.statPanelAccent]}>
      <Text style={styles.statPanelTitle}>{title}</Text>
      {rows.map((r, i) => {
        const isLast = i === rows.length - 1;
        const highlighted = highlightLast && isLast;
        return (
          <View
            key={i}
            style={[
              styles.statRow,
              i > 0 && { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
              highlighted && { backgroundColor: 'rgba(123,77,255,0.10)', marginHorizontal: -14, paddingHorizontal: 14, borderRadius: 10 },
            ]}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.statLabel, highlighted && { color: '#FFFFFF' }]}>{r.label}</Text>
              {r.sub && <Text style={styles.statSub}>{r.sub}</Text>}
            </View>
            <Text style={[styles.statValue, highlighted && styles.statValueHighlight]}>{r.value}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  eyebrow: {
    color: brand.cyanAccessible,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
    marginBottom: 6,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  sub: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 14,
  },
  exportRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  exportBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  summaryCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 22,
    padding: 28,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 32,
  },
  summaryBlock: {
    flex: 1,
    minWidth: 0,
  },
  summaryDivider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  summaryLabel: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  summaryValue: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.6,
    marginBottom: 6,
  },
  summarySub: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 13,
  },
  grid: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'flex-start',
  },
  statPanel: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 18,
    padding: 20,
  },
  statPanelAccent: {
    backgroundColor: 'rgba(32,199,255,0.06)',
    borderColor: 'rgba(32,199,255,0.18)',
  },
  statPanelTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginBottom: 12,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    gap: 12,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
    fontWeight: '500',
  },
  statSub: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 11,
    marginTop: 2,
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  statValueHighlight: {
    color: brand.cyanAccessible,
    fontSize: 18,
    fontWeight: '800',
  },
  panel: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 20,
    padding: 24,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  panelTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  chartPlaceholder: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 160,
    gap: 6,
  },
  chartBar: {
    flex: 1,
    backgroundColor: 'rgba(32,199,255,0.55)',
    borderRadius: 4,
    minHeight: 6,
  },
  chartCaption: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
    marginTop: 12,
    textAlign: 'center',
  },
  payoutFooter: {
    backgroundColor: 'rgba(123,77,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(123,77,255,0.18)',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    gap: 12,
  },
  payoutFooterTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  payoutFooterBody: {
    color: 'rgba(255,255,255,0.66)',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 540,
    marginBottom: 8,
  },
});
