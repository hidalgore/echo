/**
 * /host/dashboard — Host command center landing.
 *
 * Locked v59 sections:
 * - Event health hero
 * - Tickets sold vs capacity
 * - Revenue vs target
 * - Check-in readiness
 * - Audience summary
 * - Revenue summary
 * - Operational readiness
 * - Risk alerts
 * - Actions checklist
 * - Door Mode entry
 * - Payouts / reports link
 * - Create event CTA
 *
 * Mock-only data, but structurally complete.
 */
import React from 'react';
import { Platform, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { brand } from '../../theme/brand';
import { WebShell } from '../../components/web/WebShell';
import { WebSection } from '../../components/web/WebSection';
import { WebCTA } from '../../components/web/WebCTA';

type Action = { icon: keyof typeof Ionicons.glyphMap; label: string; subtitle: string; done?: boolean };
type Risk = { severity: 'low' | 'medium' | 'high'; title: string; body: string };

const ACTIONS: Action[] = [
  { icon: 'image-outline', label: 'Add cover image', subtitle: '1024 \u00D7 1024 minimum', done: true },
  { icon: 'pricetag-outline', label: 'Set ticket tiers', subtitle: 'General Admission + VIP configured', done: true },
  { icon: 'calendar-outline', label: 'Publish on-sale time', subtitle: 'Goes live Saturday at 10:00 AM', done: true },
  { icon: 'shield-checkmark-outline', label: 'Confirm age requirement', subtitle: '21+ \u2014 verification before payment', done: false },
  { icon: 'document-text-outline', label: 'Upload door staff list', subtitle: '3 of 5 staff confirmed', done: false },
  { icon: 'heart-outline', label: 'Attach donation campaign (optional)', subtitle: 'Skipped for this event', done: false },
];

const RISKS: Risk[] = [
  { severity: 'medium', title: 'Door staff incomplete', body: '2 staff members have not confirmed their shift. Send reminders before 24h cutoff.' },
  { severity: 'low', title: 'Age verification reminders', body: '38% of ticket holders have not started age verification. Reminders auto-send 48h before doors.' },
];

export default function HostDashboardPage() {
  if (Platform.OS !== 'web') return null;
  const { width } = useWindowDimensions();
  const compact = width < 880;

  return (
    <WebShell ambient>
      {/* Top bar */}
      <WebSection align="left" paddingVertical={40} maxWidth={1240}>
        <View style={[styles.topBar, compact && { flexDirection: 'column', alignItems: 'flex-start' }]}>
          <View>
            <Text style={styles.eyebrow}>EVENT DASHBOARD</Text>
            <Text style={styles.eventTitle}>The Midnight Tour \u2014 Seattle</Text>
            <Text style={styles.eventMeta}>Saturday \u00B7 9:00 PM \u00B7 The Crocodile</Text>
          </View>
          <View style={styles.topBarActions}>
            <WebCTA label="Door Mode" href="/host/dashboard" variant="secondary" size="md" icon="radio-outline" />
            <WebCTA label="Create Event" href="/host/create-event" variant="primary" size="md" icon="add-outline" />
          </View>
        </View>
      </WebSection>

      {/* Event health hero */}
      <WebSection align="left" paddingVertical={40} maxWidth={1240}>
        <LinearGradient
          colors={['rgba(123,77,255,0.18)', 'rgba(32,199,255,0.08)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.healthCard}
        >
          <View style={[styles.healthRow, compact && { flexDirection: 'column', gap: 24 }]}>
            <View style={styles.healthBlock}>
              <Text style={styles.healthLabel}>Event health</Text>
              <Text style={styles.healthValue}>On track</Text>
              <View style={styles.healthMeter}>
                <View style={[styles.healthMeterFill, { width: '82%' }]} />
              </View>
              <Text style={styles.healthSub}>82% of pre-event milestones complete</Text>
            </View>
            <View style={styles.healthDivider} />
            <View style={styles.healthBlock}>
              <Text style={styles.healthLabel}>Tickets sold</Text>
              <Text style={styles.healthValue}>482 / 600</Text>
              <View style={styles.healthMeter}>
                <View style={[styles.healthMeterFill, { width: '80%' }]} />
              </View>
              <Text style={styles.healthSub}>80% sold \u00B7 118 remaining</Text>
            </View>
            <View style={styles.healthDivider} />
            <View style={styles.healthBlock}>
              <Text style={styles.healthLabel}>Revenue vs target</Text>
              <Text style={styles.healthValue}>$28,440</Text>
              <View style={styles.healthMeter}>
                <View style={[styles.healthMeterFill, { width: '71%' }]} />
              </View>
              <Text style={styles.healthSub}>71% of $40,000 target</Text>
            </View>
          </View>
        </LinearGradient>
      </WebSection>

      {/* KPI row */}
      <WebSection align="left" paddingVertical={40} maxWidth={1240}>
        <View style={[styles.kpiRow, compact && { flexDirection: 'column' }]}>
          {[
            { label: 'Check-in readiness', value: '92%', sub: 'Door staff + scanners ready' },
            { label: 'Audience verified for age', value: '62%', sub: '296 of 482 ticket holders' },
            { label: 'ECHO Circles active', value: '14', sub: '4 still inviting members' },
            { label: 'Average order value', value: '$72', sub: 'Up from $64 last event' },
          ].map((k, i) => (
            <View key={i} style={[styles.kpiCard, compact && { width: '100%' }]}>
              <Text style={styles.kpiLabel}>{k.label}</Text>
              <Text style={styles.kpiValue}>{k.value}</Text>
              <Text style={styles.kpiSub}>{k.sub}</Text>
            </View>
          ))}
        </View>
      </WebSection>

      {/* Actions + Risks side-by-side */}
      <WebSection align="left" paddingVertical={40} maxWidth={1240}>
        <View style={[styles.splitRow, compact && { flexDirection: 'column' }]}>
          {/* Actions */}
          <View style={[styles.panel, { flex: 1.4 }, compact && { width: '100%' }]}>
            <View style={styles.panelHeader}>
              <Ionicons name="checkbox-outline" size={18} color={brand.cyanAccessible} />
              <Text style={styles.panelTitle}>Pre-event checklist</Text>
            </View>
            {ACTIONS.map((a, i) => (
              <View key={i} style={styles.actionRow}>
                <View style={[styles.actionDot, a.done && styles.actionDotDone]}>
                  {a.done && <Ionicons name="checkmark" size={12} color="#FFFFFF" />}
                </View>
                <View style={styles.actionTextWrap}>
                  <Text style={[styles.actionLabel, a.done && styles.actionLabelDone]}>{a.label}</Text>
                  <Text style={styles.actionSub}>{a.subtitle}</Text>
                </View>
                <Ionicons name={a.icon} size={16} color="rgba(255,255,255,0.32)" />
              </View>
            ))}
          </View>

          {/* Risks */}
          <View style={[styles.panel, { flex: 1 }, compact && { width: '100%' }]}>
            <View style={styles.panelHeader}>
              <Ionicons name="alert-circle-outline" size={18} color="#FFB54C" />
              <Text style={styles.panelTitle}>Risk alerts</Text>
            </View>
            {RISKS.map((r, i) => (
              <View key={i} style={styles.riskRow}>
                <View
                  style={[
                    styles.riskBadge,
                    r.severity === 'high' && styles.riskBadgeHigh,
                    r.severity === 'medium' && styles.riskBadgeMed,
                    r.severity === 'low' && styles.riskBadgeLow,
                  ]}
                >
                  <Text style={styles.riskBadgeText}>{r.severity.toUpperCase()}</Text>
                </View>
                <Text style={styles.riskTitle}>{r.title}</Text>
                <Text style={styles.riskBody}>{r.body}</Text>
              </View>
            ))}

            <View style={styles.payoutCard}>
              <Ionicons name="wallet-outline" size={18} color={brand.cyanAccessible} />
              <Text style={styles.payoutTitle}>Next payout</Text>
              <Text style={styles.payoutValue}>$26,212</Text>
              <Text style={styles.payoutSub}>Scheduled 48h after event close</Text>
              <WebCTA label="View Reports" href="/host/reports" variant="secondary" size="md" />
            </View>
          </View>
        </View>
      </WebSection>
    </WebShell>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  topBarActions: {
    flexDirection: 'row',
    gap: 10,
  },
  eyebrow: {
    color: brand.cyanAccessible,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
    marginBottom: 6,
  },
  eventTitle: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  eventMeta: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 14,
  },
  healthCard: {
    borderRadius: 22,
    padding: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  healthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 32,
  },
  healthBlock: {
    flex: 1,
    minWidth: 0,
  },
  healthDivider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  healthLabel: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  healthValue: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.6,
    marginBottom: 12,
  },
  healthMeter: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
    marginBottom: 8,
  },
  healthMeterFill: {
    height: '100%',
    backgroundColor: brand.cyanAccessible,
    borderRadius: 3,
  },
  healthSub: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 14,
    flexWrap: 'wrap',
  },
  kpiCard: {
    flex: 1,
    minWidth: 180,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 20,
  },
  kpiLabel: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  kpiValue: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  kpiSub: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
  },
  splitRow: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'flex-start',
  },
  panel: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 20,
    padding: 22,
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
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.04)',
  },
  actionDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionDotDone: {
    backgroundColor: brand.primary,
    borderColor: brand.primary,
  },
  actionTextWrap: {
    flex: 1,
  },
  actionLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  actionLabelDone: {
    color: 'rgba(255,255,255,0.55)',
    textDecorationLine: 'line-through',
  },
  actionSub: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 12,
  },
  riskRow: {
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.04)',
    gap: 6,
  },
  riskBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  riskBadgeHigh: { backgroundColor: 'rgba(255,68,68,0.16)' },
  riskBadgeMed: { backgroundColor: 'rgba(255,181,76,0.16)' },
  riskBadgeLow: { backgroundColor: 'rgba(32,199,255,0.14)' },
  riskBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  riskTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
  },
  riskBody: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 13,
    lineHeight: 19,
  },
  payoutCard: {
    marginTop: 22,
    padding: 18,
    borderRadius: 14,
    backgroundColor: 'rgba(123,77,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(123,77,255,0.22)',
    gap: 6,
    alignItems: 'flex-start',
  },
  payoutTitle: {
    color: 'rgba(255,255,255,0.62)',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  payoutValue: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  payoutSub: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
    marginBottom: 8,
  },
});
