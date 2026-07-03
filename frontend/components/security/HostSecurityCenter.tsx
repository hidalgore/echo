/**
 * components/security/HostSecurityCenter.tsx
 * ═══════════════════════════════════════════
 * Host-facing security dashboard. Surfaces TrustShield bot-defense status,
 * staff roster, trusted devices, payout protection, and the audit log.
 *
 * Doctrine: tokens only, a11y on all interactives, no emoji, icon+text+colour
 * for every status, one primary action per screen (Add Staff).
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Switch,
  StyleSheet,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BotDefenseStatus } from '../../services/trustShieldService';
import type {
  StaffMember,
  TrustedDevice,
  PayoutProtectionConfig,
  AuditLogEntry,
  EventRiskRow,
} from '../../types/securityCenters';
import { COLOR, RADIUS, SPACE, TYPE } from '../../theme/a11yTokens';
import { a11yButton } from '../../theme/a11y';
import { Button } from '../ui/Button';

// ─── Props ───────────────────────────────────────────────────────────────────

export type HostSecurityCenterProps = {
  botDefense: BotDefenseStatus;
  staff: StaffMember[];
  devices: TrustedDevice[];
  payout: PayoutProtectionConfig;
  auditLog: AuditLogEntry[];
  eventRisk: EventRiskRow[];
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const RISK_CONFIG = {
  low:      { label: 'Low',      color: COLOR.success, glyph: '✓' },
  medium:   { label: 'Medium',   color: COLOR.warning, glyph: '!' },
  high:     { label: 'High',     color: COLOR.danger,  glyph: '!!' },
  critical: { label: 'Critical', color: COLOR.danger,  glyph: '!!!' },
};

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const ROLE_LABEL: Record<string, string> = {
  scanner: 'Scanner',
  supervisor: 'Supervisor',
  host_admin: 'Admin',
};

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return <Text style={s.sectionTitle}>{title}</Text>;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function HostSecurityCenter({
  botDefense, staff, devices, payout, auditLog, eventRisk,
}: HostSecurityCenterProps) {
  const insets = useSafeAreaInsets();
  const rc = RISK_CONFIG[botDefense.riskLevel] ?? RISK_CONFIG.low;

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={{ padding: SPACE[16], paddingBottom: insets.bottom + SPACE[32] }}
      >
        {/* Page title */}
        <Text style={s.pageTitle}>Security</Text>

        {/* ── TrustShield status card ── */}
        <View style={[s.card, s.shieldCard]}>
          <View style={s.shieldHeader}>
            <View style={[s.riskBadge, { borderColor: rc.color }]}>
              <Text style={[s.riskGlyph, { color: rc.color }]} accessibilityElementsHidden>{rc.glyph}</Text>
              <Text style={[s.riskLabel, { color: rc.color }]}>{rc.label} Risk</Text>
            </View>
            {botDefense.activeProtection ? (
              <View style={s.activeBadge}>
                <Text style={s.activeBadgeText}>Protection Active</Text>
              </View>
            ) : null}
          </View>
          <Text style={s.shieldSummary}>{botDefense.summary}</Text>

          <View style={s.statGrid}>
            {[
              { label: 'Blocked', value: botDefense.suspiciousAttemptsBlocked.toString() },
              { label: 'Holds', value: botDefense.checkoutHolds.toString() },
              { label: 'Abuse Rate', value: `${botDefense.ticketAbuseRatePct}%` },
              { label: 'Door Dupes', value: botDefense.doorDuplicateAttempts.toString() },
            ].map(({ label, value }) => (
              <View key={label} style={s.stat} accessible accessibilityLabel={`${label}: ${value}`}>
                <Text style={s.statValue}>{value}</Text>
                <Text style={s.statLabel}>{label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Event risk ── */}
        {eventRisk.length > 0 ? (
          <View style={s.section}>
            <SectionHeader title="Event Risk" />
            {eventRisk.map((e) => {
              const erc = RISK_CONFIG[e.risk] ?? RISK_CONFIG.low;
              return (
                <View key={e.eventId} style={s.card}>
                  <View style={s.rowBetween}>
                    <Text style={s.bodyText}>{e.eventTitle}</Text>
                    <View style={[s.riskBadge, { borderColor: erc.color }]}>
                      <Text style={[s.riskGlyph, { color: erc.color }]} accessibilityElementsHidden>{erc.glyph}</Text>
                      <Text style={[s.riskLabel, { color: erc.color }]}>{erc.label}</Text>
                    </View>
                  </View>
                  <Text style={s.subText}>{e.note}</Text>
                </View>
              );
            })}
          </View>
        ) : null}

        {/* ── Staff roster ── */}
        <View style={s.section}>
          <SectionHeader title="Staff Access" />
          {staff.map((m) => (
            <View key={m.id} style={[s.card, s.staffRow]}
              accessible accessibilityLabel={`${m.name}, ${ROLE_LABEL[m.role] ?? m.role}, ${m.active ? 'active' : 'inactive'}`}
            >
              <View style={s.staffLeft}>
                <Text style={s.bodyText}>{m.name}</Text>
                <Text style={s.subText}>{ROLE_LABEL[m.role] ?? m.role}</Text>
              </View>
              <View style={[s.statusDot, { backgroundColor: m.active ? COLOR.success : COLOR.on2 }]} />
            </View>
          ))}
          <Button
            title="Add Staff Member"
            onPress={() => {}}
            style={s.primaryBtn}
          />
        </View>

        {/* ── Payout protection ── */}
        <View style={s.section}>
          <SectionHeader title="Payout Protection" />
          <View style={s.card}>
            <View style={s.rowBetween}>
              <View>
                <Text style={s.bodyText}>{payout.enabled ? 'Enabled' : 'Disabled'}</Text>
                <Text style={s.subText}>{payout.holdHours}h hold · {payout.holdPct}% held back</Text>
              </View>
              <Switch
                value={payout.enabled}
                onValueChange={() => {}}
                accessible
                accessibilityLabel="Payout protection"
                accessibilityHint="Toggles the post-event payout hold"
                accessibilityRole="switch"
                accessibilityState={{ checked: payout.enabled }}
                thumbColor={COLOR.on}
                trackColor={{ true: COLOR.primaryCta, false: COLOR.on2 }}
              />
            </View>
          </View>
        </View>

        {/* ── Trusted devices ── */}
        <View style={s.section}>
          <SectionHeader title="Trusted Scanner Devices" />
          {devices.map((d) => (
            <View key={d.id} style={s.card}
              accessible accessibilityLabel={`${d.name}, ${d.model}, last seen ${formatRelative(d.lastSeen)}. ${d.trusted ? 'Trusted' : 'Not trusted'}.`}
            >
              <View style={s.rowBetween}>
                <View>
                  <Text style={s.bodyText}>{d.name}</Text>
                  <Text style={s.subText}>{d.model} · {formatRelative(d.lastSeen)}</Text>
                </View>
                {d.trusted ? (
                  <View style={[s.riskBadge, { borderColor: COLOR.success }]}>
                    <Text style={[s.riskGlyph, { color: COLOR.success }]} accessibilityElementsHidden>✓</Text>
                    <Text style={[s.riskLabel, { color: COLOR.success }]}>Trusted</Text>
                  </View>
                ) : (
                  <View style={[s.riskBadge, { borderColor: COLOR.on2 }]}>
                    <Text style={[s.riskLabel, { color: COLOR.on2 }]}>Unverified</Text>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* ── Audit log ── */}
        <View style={s.section}>
          <SectionHeader title="Audit Log" />
          {auditLog.map((entry) => (
            <View key={entry.id} style={s.auditRow}
              accessible accessibilityLabel={`${entry.actor}: ${entry.action}. ${formatRelative(entry.at)}.`}
            >
              <Text style={s.auditActor}>{entry.actor}</Text>
              <Text style={s.auditAction}>{entry.action}</Text>
              <Text style={s.auditTime}>{formatRelative(entry.at)}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLOR.dark },
  pageTitle: { fontSize: TYPE['text-xl'].fontSize, fontWeight: '800', color: COLOR.on, marginBottom: SPACE[24] },

  section: { marginBottom: SPACE[24] },
  sectionTitle: {
    fontSize: TYPE['text-xs'].fontSize, fontWeight: '700', letterSpacing: 1,
    textTransform: 'uppercase', color: COLOR.on2, marginBottom: SPACE[8],
  },

  card: {
    backgroundColor: COLOR.darkCard,
    borderRadius: RADIUS.md,
    padding: SPACE[16],
    marginBottom: SPACE[8],
    gap: SPACE[8],
  },
  shieldCard: { marginBottom: SPACE[24] },
  shieldHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACE[8], flexWrap: 'wrap' },
  shieldSummary: { fontSize: TYPE['text-sm'].fontSize, color: COLOR.on, lineHeight: TYPE['text-sm'].lineHeight },

  riskBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1, borderRadius: RADIUS.full,
    paddingHorizontal: SPACE[8], paddingVertical: 4,
  },
  riskGlyph: { fontSize: 10, fontWeight: '800' },
  riskLabel: { fontSize: TYPE['text-xs'].fontSize, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },

  activeBadge: {
    backgroundColor: 'rgba(124,58,237,0.18)',
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACE[8], paddingVertical: 4,
  },
  activeBadgeText: { fontSize: TYPE['text-xs'].fontSize, color: COLOR.primaryCta, fontWeight: '700' },

  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACE[8], marginTop: SPACE[4] },
  stat: {
    flex: 1, minWidth: 70,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: RADIUS.sm,
    padding: SPACE[12],
    alignItems: 'center',
  },
  statValue: { fontSize: TYPE['text-lg'].fontSize, fontWeight: '800', color: COLOR.on },
  statLabel: { fontSize: TYPE['text-xs'].fontSize, color: COLOR.on2, textTransform: 'uppercase', letterSpacing: 0.4 },

  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: SPACE[8] },

  bodyText: { fontSize: TYPE['text-md'].fontSize, color: COLOR.on, fontWeight: '600' },
  subText: { fontSize: TYPE['text-sm'].fontSize, color: COLOR.on2, marginTop: 2 },

  staffRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  staffLeft: { flex: 1 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },

  primaryBtn: { marginTop: SPACE[8] },

  auditRow: {
    borderLeftWidth: 2, borderLeftColor: 'rgba(255,255,255,0.08)',
    paddingLeft: SPACE[12], marginBottom: SPACE[12],
  },
  auditActor: { fontSize: TYPE['text-sm'].fontSize, fontWeight: '700', color: COLOR.on },
  auditAction: { fontSize: TYPE['text-sm'].fontSize, color: COLOR.on2, marginTop: 2, lineHeight: TYPE['text-sm'].lineHeight },
  auditTime: { fontSize: TYPE['text-xs'].fontSize, color: COLOR.on2, marginTop: 4 },
});
