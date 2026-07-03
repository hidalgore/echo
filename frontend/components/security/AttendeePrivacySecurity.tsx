/**
 * components/security/AttendeePrivacySecurity.tsx
 * ════════════════════════════════════════════════
 * Attendee Privacy & Security settings screen. Three panels:
 *   1. Account security (passkey, MFA, transfer protection, device alerts)
 *   2. Privacy controls (4 toggles)
 *   3. TuneMyECHO personalisation recommendations
 * Plus trusted devices list and login history.
 *
 * Doctrine: tokens only, a11y on all interactives, no emoji, status always
 * icon + text + colour. Mounted from app/security/privacy.tsx.
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Switch,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type {
  AttendeeSecurityState,
  PrivacyControls,
  RecommendationRow,
  TrustedDevice,
  LoginHistoryEntry,
} from '../../types/securityCenters';
import { COLOR, RADIUS, SPACE, TYPE } from '../../theme/a11yTokens';

// ─── Props ────────────────────────────────────────────────────────────────────

export type AttendeePrivacySecurityProps = {
  security: AttendeeSecurityState;
  privacy: PrivacyControls;
  recommendations: RecommendationRow[];
  devices: TrustedDevice[];
  loginHistory: LoginHistoryEntry[];
  onToggleSecurity: (key: keyof AttendeeSecurityState, value: boolean) => void;
  onTogglePrivacy: (key: keyof PrivacyControls, value: boolean) => void;
  onToggleRecommendation: (id: string, value: boolean) => void;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const OUTCOME_CONFIG = {
  success:    { glyph: '✓', color: COLOR.success, label: 'Success' },
  blocked:    { glyph: '⊘', color: COLOR.danger,  label: 'Blocked' },
  suspicious: { glyph: '!', color: COLOR.warning,  label: 'Suspicious' },
};

// ─── Reusable toggle row ─────────────────────────────────────────────────────

function ToggleRow({
  label, hint, value, onToggle,
}: { label: string; hint: string; value: boolean; onToggle: (v: boolean) => void }) {
  return (
    <View style={s.toggleRow}>
      <Text style={s.toggleLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onToggle}
        accessible
        accessibilityLabel={label}
        accessibilityHint={hint}
        accessibilityRole="switch"
        accessibilityState={{ checked: value }}
        thumbColor={COLOR.on}
        trackColor={{ true: COLOR.primaryCta, false: COLOR.on2 }}
      />
    </View>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return <Text style={s.sectionTitle}>{title}</Text>;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function AttendeePrivacySecurity({
  security, privacy, recommendations, devices, loginHistory,
  onToggleSecurity, onTogglePrivacy, onToggleRecommendation,
}: AttendeePrivacySecurityProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={{ padding: SPACE[16], paddingBottom: insets.bottom + SPACE[32] }}
      >
        <Text style={s.pageTitle}>Privacy & Security</Text>

        {/* ── Account security ── */}
        <View style={s.section}>
          <SectionHeader title="Account Security" />
          <View style={s.card}>
            <ToggleRow
              label="Passkey sign-in"
              hint="Use Face ID or Touch ID instead of a password"
              value={security.passkeyEnabled}
              onToggle={(v) => onToggleSecurity('passkeyEnabled', v)}
            />
            <View style={s.divider} />
            <ToggleRow
              label="Two-factor authentication"
              hint="Require a second step when signing in on a new device"
              value={security.mfaEnabled}
              onToggle={(v) => onToggleSecurity('mfaEnabled', v)}
            />
            <View style={s.divider} />
            <ToggleRow
              label="Ticket transfer protection"
              hint="Require identity confirmation before transferring a ticket"
              value={security.ticketTransferProtection}
              onToggle={(v) => onToggleSecurity('ticketTransferProtection', v)}
            />
            <View style={s.divider} />
            <ToggleRow
              label="New device alerts"
              hint="Get notified when your account is accessed from an unrecognised device"
              value={security.newDeviceAlerts}
              onToggle={(v) => onToggleSecurity('newDeviceAlerts', v)}
            />
          </View>
        </View>

        {/* ── Privacy controls ── */}
        <View style={s.section}>
          <SectionHeader title="Privacy Controls" />
          <View style={s.card}>
            <ToggleRow
              label="Share attendance with hosts"
              hint="Hosts see anonymised attendance data for events you attended"
              value={privacy.shareAttendanceWithHosts}
              onToggle={(v) => onTogglePrivacy('shareAttendanceWithHosts', v)}
            />
            <View style={s.divider} />
            <ToggleRow
              label="TuneMyECHO recommendations"
              hint="Personalise your event feed based on your activity"
              value={privacy.allowTuneMyEcho}
              onToggle={(v) => onTogglePrivacy('allowTuneMyEcho', v)}
            />
            <View style={s.divider} />
            <ToggleRow
              label="Local events by location"
              hint="Surface events near you based on coarse location"
              value={privacy.shareLocationForLocalEvents}
              onToggle={(v) => onTogglePrivacy('shareLocationForLocalEvents', v)}
            />
            <View style={s.divider} />
            <ToggleRow
              label="Marketing emails"
              hint="Receive promotional offers and featured event announcements"
              value={privacy.marketingEmails}
              onToggle={(v) => onTogglePrivacy('marketingEmails', v)}
            />
          </View>
        </View>

        {/* ── TuneMyECHO ── */}
        <View style={s.section}>
          <SectionHeader title="TuneMyECHO" />
          {recommendations.map((rec) => (
            <View key={rec.id} style={[s.card, s.recCard]}>
              <View style={s.recLeft}>
                <Text style={s.bodyText}>{rec.label}</Text>
                <Text style={s.subText}>{rec.description}</Text>
              </View>
              <Switch
                value={rec.enabled}
                onValueChange={(v) => onToggleRecommendation(rec.id, v)}
                accessible
                accessibilityLabel={rec.label}
                accessibilityHint={rec.description}
                accessibilityRole="switch"
                accessibilityState={{ checked: rec.enabled }}
                thumbColor={COLOR.on}
                trackColor={{ true: COLOR.primaryCta, false: COLOR.on2 }}
              />
            </View>
          ))}
        </View>

        {/* ── Trusted devices ── */}
        <View style={s.section}>
          <SectionHeader title="Trusted Devices" />
          {devices.map((d) => (
            <View key={d.id} style={s.card}
              accessible
              accessibilityLabel={`${d.name}, ${d.model}, last seen ${formatRelative(d.lastSeen)}. ${d.current ? 'This device.' : d.trusted ? 'Trusted.' : 'Not trusted.'}`}
            >
              <View style={s.rowBetween}>
                <View style={s.flex1}>
                  <Text style={s.bodyText}>{d.name}{d.current ? ' (this device)' : ''}</Text>
                  <Text style={s.subText}>{d.model} · {formatRelative(d.lastSeen)}</Text>
                </View>
                {d.trusted ? (
                  <View style={[s.badge, { borderColor: COLOR.success }]}>
                    <Text style={[s.badgeGlyph, { color: COLOR.success }]} accessibilityElementsHidden>✓</Text>
                    <Text style={[s.badgeText, { color: COLOR.success }]}>Trusted</Text>
                  </View>
                ) : (
                  <View style={[s.badge, { borderColor: COLOR.on2 }]}>
                    <Text style={[s.badgeText, { color: COLOR.on2 }]}>Unknown</Text>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* ── Login history ── */}
        <View style={s.section}>
          <SectionHeader title="Login History" />
          {loginHistory.map((entry) => {
            const oc = OUTCOME_CONFIG[entry.outcome] ?? OUTCOME_CONFIG.success;
            return (
              <View key={entry.id} style={s.card}
                accessible
                accessibilityLabel={`${oc.label} login from ${entry.device} in ${entry.location}, ${formatRelative(entry.at)}`}
              >
                <View style={s.rowBetween}>
                  <View style={s.flex1}>
                    <Text style={s.bodyText}>{entry.device}</Text>
                    <Text style={s.subText}>{entry.location} · {formatRelative(entry.at)}</Text>
                  </View>
                  <View style={[s.badge, { borderColor: oc.color }]}>
                    <Text style={[s.badgeGlyph, { color: oc.color }]} accessibilityElementsHidden>{oc.glyph}</Text>
                    <Text style={[s.badgeText, { color: oc.color }]}>{oc.label}</Text>
                  </View>
                </View>
              </View>
            );
          })}
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
  },
  recCard: { flexDirection: 'row', alignItems: 'center', gap: SPACE[12] },
  recLeft: { flex: 1 },

  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.07)', marginVertical: SPACE[12] },

  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: SPACE[12] },
  toggleLabel: { flex: 1, fontSize: TYPE['text-md'].fontSize, color: COLOR.on, fontWeight: '500' },

  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: SPACE[8] },
  flex1: { flex: 1 },

  bodyText: { fontSize: TYPE['text-md'].fontSize, color: COLOR.on, fontWeight: '600' },
  subText: { fontSize: TYPE['text-sm'].fontSize, color: COLOR.on2, marginTop: 2 },

  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1, borderRadius: RADIUS.full,
    paddingHorizontal: SPACE[8], paddingVertical: 4,
  },
  badgeGlyph: { fontSize: 10, fontWeight: '800' },
  badgeText: { fontSize: TYPE['text-xs'].fontSize, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
});
