/**
 * ECHO — HostOpsSection (v59.4, web)
 * ═══════════════════════════════════
 * Host operations story: the full lifecycle from Create Event to
 * Experience Recap, plus the locked role model. Tone: serious operator
 * tooling, plainly explained.
 *
 * Locked roles: Owner, Admin, Event Manager, Finance, Scanner,
 * Support, Security. MVP rule: Owner-only publish / pause / resume.
 */
import React from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { Text } from '../../ui/Text';
import { SectionShell } from './SectionShell';

const BANDS: { phase: string; title: string; items: string[] }[] = [
  {
    phase: 'Before',
    title: 'Launch without the busywork',
    items: [
      'Create Event from the Host Dashboard',
      'Scheduled Publish for sales release dates',
      'Flyer Upload with AI Flyer Scan — details extracted, not retyped',
      'Ticket Tiers: VIP, GA, Staff, Sponsor, Backstage, Custom',
      'Refund Presets set once, applied cleanly',
    ],
  },
  {
    phase: 'During',
    title: 'Run the door with confidence',
    items: [
      'Door Mode check-in, designed for the line',
      'Guest Access Control by zone and tier',
      'VIP vs GA scanning resolved per credential',
      'Security and Scanner roles see only what they need',
    ],
  },
  {
    phase: 'After',
    title: 'Close the loop',
    items: [
      'Payouts and Reports without spreadsheet archaeology',
      'Past Event Analytics across your whole history',
      'Experience Recap shared back to every guest',
    ],
  },
];

const ROLES: string[] = [
  'Owner', 'Admin', 'Event Manager', 'Finance', 'Scanner', 'Support', 'Security',
];

export function HostOpsSection() {
  const { width } = useWindowDimensions();
  const isMobile = width < 900;

  return (
    <SectionShell
      nativeID="hosts"
      eyebrow="Built for hosts"
      title="Built for hosts who care about the full experience"
      subtitle="From the first flyer to the final recap, ECHO gives event operators one place to launch, sell, secure, and settle."
      band
    >
      <View style={[styles.bandRow, isMobile && styles.bandRowStacked]}>
        {BANDS.map((b) => (
          <View key={b.phase} style={styles.bandCard}>
            <Text variant="caption" style={styles.bandPhase}>{b.phase}</Text>
            <Text variant="label" style={styles.bandTitle} accessibilityRole="header">
              {b.title}
            </Text>
            <View style={styles.itemList}>
              {b.items.map((item) => (
                <View key={item} style={styles.itemRow}>
                  <View style={styles.itemDot} />
                  <Text variant="bodySmall" style={styles.itemText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}
      </View>

      <View style={styles.rolesPanel}>
        <Text variant="label" style={styles.rolesHeading}>
          Seven roles. Clean boundaries.
        </Text>
        <View style={styles.rolesRow}>
          {ROLES.map((r) => (
            <View key={r} style={[styles.roleChip, r === 'Owner' && styles.roleChipOwner]}>
              <Text variant="caption" style={[styles.roleText, r === 'Owner' && styles.roleTextOwner]}>
                {r}
              </Text>
            </View>
          ))}
        </View>
        <Text variant="caption" style={styles.rolesNote}>
          Publishing, pausing, and resuming an event stays with the Owner — one accountable hand on the switch.
        </Text>
      </View>
    </SectionShell>
  );
}

const styles = StyleSheet.create({
  bandRow: { flexDirection: 'row', gap: 14 },
  bandRowStacked: { flexDirection: 'column' },
  bandCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    borderRadius: 16,
    padding: 20,
  },
  bandPhase: {
    color: '#20C7FF',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  bandTitle: { color: '#FFFFFF', fontSize: 16, marginBottom: 14 },
  itemList: { gap: 10 },
  itemRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  itemDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.40)', marginTop: 6,
  },
  itemText: { color: 'rgba(255,255,255,0.68)', flex: 1, lineHeight: 19 },
  rolesPanel: {
    marginTop: 40,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    borderRadius: 24,
    padding: 24,
    gap: 16,
  },
  rolesHeading: { color: '#FFFFFF', fontSize: 15 },
  rolesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  roleChip: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  roleChipOwner: {
    borderColor: '#FFB45C',
    backgroundColor: 'rgba(255,180,92,0.08)',
  },
  roleText: { color: 'rgba(255,255,255,0.78)', fontSize: 12 },
  roleTextOwner: { color: '#FFB45C' },
  rolesNote: { color: 'rgba(255,255,255,0.50)', lineHeight: 18 },
});
