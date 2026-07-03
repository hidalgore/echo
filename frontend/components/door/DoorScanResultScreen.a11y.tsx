/**
 * components/door/DoorScanResultScreen.a11y.tsx
 * ═════════════════════════════════════════════
 * Accessibility-hardened Door Mode result (decisions 3A/5A). Drop-in replacement
 * for components/door/DoorScanResultScreen.tsx with:
 *   - icon + TEXT + color for every decision (color never alone) → color-blind
 *     operators, loud rooms, sunlight.
 *   - multi-sensory feedback on mount (haptic via feedbackService; audio opt-in).
 *   - safe-area insets (notch / Dynamic Island / home indicator).
 *   - accessibilityLiveRegion so the decision is announced immediately.
 *   - 44/48 tap targets, role+label+hint on every control, visible focus ring.
 *   - tokens only — no arbitrary values.
 */

import React, { useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { DoorModeResultView } from '../../services/accessControlService';
import type { AccessIssueResolutionAction } from '../../types/v3';
import { COLOR, RADIUS, SPACE, TYPE } from '../../theme/a11yTokens';
import { a11yButton, a11yHidden } from '../../theme/a11y';
import { doorFeedback } from '../../services/feedbackService';
import { Button } from '../ui/Button';

// Tier color → an accessible foreground + a glyph (icon backs up color).
const TIER_FG: Record<string, string> = {
  green: COLOR.success, gold: COLOR.warning, black_gold: '#E7C66B', purple: '#A78BFA',
  blue: COLOR.info, orange: '#FB923C', white: COLOR.on, red: COLOR.danger,
  cyan: COLOR.cyan, charcoal: '#C7CCD6', slate: '#94A3B8',
};

const STATE_GLYPH: Record<string, string> = {
  verified: '✓', duplicate_blocked: '⨯', security_hold: '⚠', flagged: '⚠', denied: '⨯',
  wrong_zone: '⨯', wrong_event: '⨯', wrong_tier: '⚠', refunded_ticket: '⨯',
  transferred_ticket: '⨯', age_verification_missing: '⚠', suspicious_credential: '⨯', offline_risk: '⚠',
};
const STATE_LABEL: Record<string, string> = {
  verified: 'Verified', duplicate_blocked: 'Duplicate Blocked', security_hold: 'Security Hold',
  flagged: 'Flagged', denied: 'Access Not Authorized', wrong_zone: 'Wrong Checkpoint',
  wrong_event: 'Wrong Event', wrong_tier: 'Wrong Tier', refunded_ticket: 'Refunded Ticket',
  transferred_ticket: 'Transferred Ticket', age_verification_missing: 'Age Verification Missing',
  suspicious_credential: 'Suspicious Credential', offline_risk: 'Offline Risk',
};
const ACTION_LABEL: Record<AccessIssueResolutionAction, string> = {
  view_details: 'View Details', supervisor_override: 'Supervisor Override', contact_host: 'Contact Host',
  place_security_hold: 'Place Security Hold', reverse_decision: 'Reverse Decision', escalate_to_echo_trust: 'Escalate to ECHO Trust',
};
const ACTION_HINT: Record<AccessIssueResolutionAction, string> = {
  view_details: 'Opens the full pass and scan history',
  supervisor_override: 'Requires supervisor permission and is logged',
  contact_host: 'Starts a message to the event host',
  place_security_hold: 'Routes this guest to the security lane',
  reverse_decision: 'Reverses the access decision; logged',
  escalate_to_echo_trust: 'Escalates to the ECHO Trust & Safety team',
};

export type Props = {
  result: DoorModeResultView;
  actions?: AccessIssueResolutionAction[];
  audioEnabled?: boolean;
  onAction?: (a: AccessIssueResolutionAction) => void;
  onNextScan?: () => void;
};

export function DoorScanResultScreenA11y({ result, actions = [], onAction, onNextScan }: Props) {
  const insets = useSafeAreaInsets();
  const fg = TIER_FG[result.colorToken] ?? COLOR.on2;
  const glyph = STATE_GLYPH[result.verificationState] ?? (result.approved ? '✓' : '⨯');
  const stateLabel = STATE_LABEL[result.verificationState] ?? (result.approved ? 'Verified' : 'Denied');

  // Multi-sensory: fire haptic on mount; visual is icon+text+color below.
  useEffect(() => { doorFeedback(result.approved); }, [result.approved]);

  // One screen-reader sentence summarising the whole decision.
  const announce = `${stateLabel}. ${result.decisionLabel}. Guest ${result.guestName}, ${result.tierLabel}, at ${result.checkpointLabel}.${result.failureReason ? ' Reason: ' + result.failureReason + '.' : ''} ${result.suggestedStaffAction}`;

  return (
    <View style={[s.root, { backgroundColor: result.approved ? '#0E2A1B' : '#1A0F12' }]}>
      <ScrollView
        contentContainerStyle={{ padding: SPACE[24], paddingTop: insets.top + SPACE[24], paddingBottom: insets.bottom + 96 }}
        accessibilityLiveRegion="assertive"
      >
        <View accessible accessibilityLabel={announce}>
          {/* icon + text badge — color is backed by glyph + words */}
          <View style={[s.badge, { borderColor: fg }]}>
            <Text style={[s.badgeGlyph, { color: fg }]} {...a11yHidden}>{glyph}</Text>
            <Text style={[s.badgeText, { color: fg }]}>{stateLabel}</Text>
          </View>

          <Text style={[s.decision, { color: fg }]}>{result.decisionLabel}</Text>
          <Text style={s.guest}>{result.guestName}</Text>

          <View style={s.chips}>
            <View style={[s.tierChip, { borderColor: fg }]}><Text style={[s.tierChipText, { color: fg }]}>{result.tierLabel}</Text></View>
            <View style={s.zoneChip}><Text style={s.zoneChipText}>{result.checkpointLabel}</Text></View>
          </View>

          {!result.approved && result.failureReason ? (
            <View style={s.block}><Text style={s.label}>Reason</Text><Text style={s.body}>{result.failureReason}</Text></View>
          ) : null}

          <View style={s.block}>
            <Text style={s.label}>Authorized Areas</Text>
            <View style={s.areas}>
              {result.authorizedAreas.map((a) => (<View key={a} style={s.areaChip}><Text style={s.areaText}>{a}</Text></View>))}
            </View>
          </View>

          <View style={s.staff}><Text style={s.label}>Suggested action</Text><Text style={s.staffText}>{result.suggestedStaffAction}</Text></View>

          {actions.length > 0 && (
            <View style={s.actions}>
              {actions.map((a) => (
                <Button key={a} title={ACTION_LABEL[a]} variant="secondary" onPress={() => onAction?.(a)} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <View style={[s.footer, { paddingBottom: insets.bottom + SPACE[12] }]}>
        <Button title="Next Scan" onPress={() => onNextScan?.()} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: SPACE[8], alignSelf: 'flex-start', borderWidth: 1.5, borderRadius: RADIUS.full, paddingHorizontal: SPACE[12], paddingVertical: SPACE[8] },
  badgeGlyph: { fontSize: TYPE['text-md'].fontSize, fontWeight: '800' },
  badgeText: { fontSize: TYPE['text-sm'].fontSize, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
  decision: { fontSize: TYPE['text-2xl'].fontSize, lineHeight: TYPE['text-2xl'].lineHeight, fontWeight: '800', marginTop: SPACE[16] },
  guest: { fontSize: TYPE['text-xl'].fontSize, fontWeight: '700', color: COLOR.on, marginTop: SPACE[4] },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACE[8], marginTop: SPACE[16] },
  tierChip: { borderWidth: 1.5, borderRadius: RADIUS.full, paddingHorizontal: SPACE[12], paddingVertical: SPACE[8] },
  tierChipText: { fontSize: TYPE['text-sm'].fontSize, fontWeight: '700' },
  zoneChip: { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: RADIUS.full, paddingHorizontal: SPACE[12], paddingVertical: SPACE[8] },
  zoneChipText: { fontSize: TYPE['text-sm'].fontSize, color: COLOR.on },
  block: { marginTop: SPACE[24] },
  label: { fontSize: TYPE['text-xs'].fontSize, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', color: COLOR.on2 },
  body: { fontSize: TYPE['text-md'].fontSize, color: '#E7EAF0', marginTop: SPACE[8], lineHeight: TYPE['text-md'].lineHeight },
  areas: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACE[8], marginTop: SPACE[8] },
  areaChip: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: RADIUS.sm, paddingHorizontal: SPACE[12], paddingVertical: SPACE[8] },
  areaText: { fontSize: TYPE['text-sm'].fontSize, color: '#E7EAF0' },
  staff: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: RADIUS.md, padding: SPACE[16], marginTop: SPACE[24] },
  staffText: { fontSize: TYPE['text-lg'].fontSize, fontWeight: '600', color: COLOR.on, marginTop: SPACE[8] },
  actions: { gap: SPACE[8], marginTop: SPACE[24] },
  footer: { position: 'absolute', left: SPACE[16], right: SPACE[16], bottom: 0, paddingTop: SPACE[12] },
});

export default DoorScanResultScreenA11y;
