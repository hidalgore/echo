/**
 * components/door/DoorScanResultScreen.tsx
 * ════════════════════════════════════════
 * Full-screen Door Mode access result (Access Control spec; build decision 5B).
 * Renders the output of accessControlService.buildDoorModeResultView:
 * guest name, tier (color-coded), authorized areas, special instructions,
 * verification state, access decision, failure reason, and the single suggested
 * staff action.
 *
 * Mission-critical and calm: one decision fills the screen, color tells staff
 * the outcome within ~1 second (GA green, VIP gold, denied red, hold amber).
 * Works on native and React Native Web. Theme tokens inlined per ECHO rule.
 */

import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import type { DoorModeResultView } from '../../services/accessControlService';
import type { AccessIssueResolutionAction } from '../../types/v3';

const COLOR: Record<string, { bg: string; fg: string; chip: string }> = {
  green:      { bg: '#0E2A1B', fg: '#34D399', chip: 'rgba(52,211,153,0.16)' },
  gold:       { bg: '#2A220E', fg: '#FBBF24', chip: 'rgba(251,191,36,0.16)' },
  black_gold: { bg: '#1A1606', fg: '#E7C66B', chip: 'rgba(231,198,107,0.16)' },
  purple:     { bg: '#1E1633', fg: '#A78BFA', chip: 'rgba(167,139,250,0.16)' },
  blue:       { bg: '#0E2030', fg: '#60A5FA', chip: 'rgba(96,165,250,0.16)' },
  orange:     { bg: '#2A1A0A', fg: '#FB923C', chip: 'rgba(251,146,60,0.16)' },
  white:      { bg: '#1A1C22', fg: '#F4F5F7', chip: 'rgba(244,245,247,0.14)' },
  red:        { bg: '#2A1012', fg: '#F87171', chip: 'rgba(248,113,113,0.18)' },
  cyan:       { bg: '#06222A', fg: '#22D3EE', chip: 'rgba(34,211,238,0.16)' },
  charcoal:   { bg: '#15171C', fg: '#C7CCD6', chip: 'rgba(199,204,214,0.14)' },
  slate:      { bg: '#161A22', fg: '#94A3B8', chip: 'rgba(148,163,184,0.16)' },
};

const STATE_LABEL: Record<string, string> = {
  verified: 'Verified',
  duplicate_blocked: 'Duplicate Blocked',
  security_hold: 'Security Hold',
  flagged: 'Flagged',
  denied: 'Access Not Authorized',
  wrong_zone: 'Wrong Checkpoint',
};

export type DoorScanResultScreenProps = {
  result: DoorModeResultView;
  /** Available resolution actions for staff (RBAC-gated by the caller). */
  actions?: AccessIssueResolutionAction[];
  onAction?: (action: AccessIssueResolutionAction) => void;
  onNextScan?: () => void;
};

const ACTION_LABEL: Record<AccessIssueResolutionAction, string> = {
  view_details: 'View Details',
  supervisor_override: 'Supervisor Override',
  contact_host: 'Contact Host',
  place_security_hold: 'Place Security Hold',
  reverse_decision: 'Reverse Decision',
  escalate_to_echo_trust: 'Escalate to ECHO Trust',
};

export function DoorScanResultScreen({ result, actions = [], onAction, onNextScan }: DoorScanResultScreenProps) {
  const c = COLOR[result.colorToken] ?? COLOR.slate;
  const denied = !result.approved;

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* big decision */}
        <View style={[styles.badge, { backgroundColor: c.chip }]}>
          <Text style={[styles.badgeText, { color: c.fg }]}>{STATE_LABEL[result.verificationState]}</Text>
        </View>
        <Text style={[styles.decision, { color: c.fg }]}>{result.decisionLabel}</Text>
        <Text style={styles.guest}>{result.guestName}</Text>

        {/* tier + checkpoint */}
        <View style={styles.rowChips}>
          <View style={[styles.tierChip, { borderColor: c.fg }]}><Text style={[styles.tierChipText, { color: c.fg }]}>{result.tierLabel}</Text></View>
          <View style={styles.zoneChip}><Text style={styles.zoneChipText}>{result.checkpointLabel}</Text></View>
          {result.showVipArrivalAlert && (
            <View style={[styles.tierChip, { borderColor: '#FBBF24' }]}><Text style={[styles.tierChipText, { color: '#FBBF24' }]}>VIP Arrival</Text></View>
          )}
        </View>

        {/* failure reason */}
        {denied && result.failureReason ? (
          <View style={styles.block}>
            <Text style={styles.blockLabel}>Reason</Text>
            <Text style={styles.blockBody}>{result.failureReason}</Text>
          </View>
        ) : null}

        {/* authorized areas */}
        <View style={styles.block}>
          <Text style={styles.blockLabel}>Authorized Areas</Text>
          <View style={styles.areas}>
            {result.authorizedAreas.map((a) => (
              <View key={a} style={styles.areaChip}><Text style={styles.areaChipText}>{a}</Text></View>
            ))}
          </View>
        </View>

        {/* special instructions */}
        {result.specialInstructions ? (
          <View style={styles.block}>
            <Text style={styles.blockLabel}>Special Instructions</Text>
            <Text style={styles.blockBody}>{result.specialInstructions}</Text>
          </View>
        ) : null}

        {/* suggested staff action */}
        <View style={[styles.block, styles.staffAction]}>
          <Text style={styles.blockLabel}>Suggested action</Text>
          <Text style={styles.staffActionText}>{result.suggestedStaffAction}</Text>
        </View>

        {/* resolution actions (RBAC-gated by caller) */}
        {actions.length > 0 && (
          <View style={styles.actions}>
            {actions.map((a) => (
              <Pressable key={a} onPress={() => onAction?.(a)} style={styles.actionBtn} accessibilityRole="button" accessibilityLabel={ACTION_LABEL[a]}>
                <Text style={styles.actionBtnText}>{ACTION_LABEL[a]}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      {/* persistent primary action: next scan */}
      <Pressable onPress={onNextScan} style={[styles.next, { backgroundColor: c.fg }]} accessibilityRole="button" accessibilityLabel="Ready for next scan">
        <Text style={[styles.nextText, { color: c.bg }]}>Next Scan</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: 28, paddingTop: 64, paddingBottom: 120 },
  badge: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7 },
  badgeText: { fontSize: 13, fontWeight: '700', letterSpacing: 0.4, textTransform: 'uppercase' },
  decision: { fontSize: 40, fontWeight: '800', marginTop: 18, letterSpacing: -0.8, lineHeight: 44 },
  guest: { fontSize: 26, fontWeight: '700', color: '#F4F5F7', marginTop: 6 },
  rowChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 18 },
  tierChip: { borderWidth: 1.5, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  tierChipText: { fontSize: 14, fontWeight: '700' },
  zoneChip: { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  zoneChipText: { fontSize: 14, color: '#C7CCD6' },
  block: { marginTop: 26 },
  blockLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', color: '#8A90A0' },
  blockBody: { fontSize: 17, color: '#E7EAF0', marginTop: 8, lineHeight: 24 },
  areas: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  areaChip: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9 },
  areaChipText: { fontSize: 14, color: '#E7EAF0' },
  staffAction: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 18 },
  staffActionText: { fontSize: 18, fontWeight: '600', color: '#F4F5F7', marginTop: 8 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 24 },
  actionBtn: { borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.22)', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 13, minHeight: 44, justifyContent: 'center' },
  actionBtnText: { color: '#F4F5F7', fontSize: 15, fontWeight: '600' },
  next: { position: 'absolute', left: 20, right: 20, bottom: 24, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  nextText: { fontSize: 18, fontWeight: '800' },
});

export default DoorScanResultScreen;
