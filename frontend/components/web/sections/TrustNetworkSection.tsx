/**
 * ECHO — TrustNetworkSection (v59.4, web)
 * ════════════════════════════════════════
 * The Trust Network story: seven locked trust layers plus the system
 * components behind them. Tone: premium security network, calm and
 * confident — not a compliance wall.
 */
import React from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { Text } from '../../ui/Text';
import { SectionShell } from './SectionShell';

const LAYERS: { title: string; copy: string }[] = [
  { title: 'Identity Trust', copy: 'Real people behind every account, verified once, respected everywhere.' },
  { title: 'Host Trust', copy: 'A track record that travels with every event a host publishes.' },
  { title: 'Venue Trust', copy: 'Verified venues with history attendees can actually see.' },
  { title: 'Ticket Trust', copy: 'Dynamic credentials that resist screenshots, resale fraud, and clones.' },
  { title: 'Payment Trust', copy: 'Clean checkout, clear fees, and protected payouts on both sides.' },
  { title: 'Access Trust', copy: 'Every door decision is validated, logged, and explainable.' },
  { title: 'Hardware Trust', copy: 'ECHO Disc devices attest themselves before they validate anyone else.' },
];

const COMPONENTS: string[] = [
  'User Trust Score', 'Host Trust Score', 'Verified Venue Program', 'Risk Engine',
  'Trust Ring', 'Secure Circle', 'Trusted Device Network', 'Passkeys',
  'Dynamic Ticket Security', 'Door Mode hardening', 'Audit Logging', 'RBAC',
  'Bot and abuse protection',
];

export function TrustNetworkSection() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  return (
    <SectionShell
      nativeID="trust"
      eyebrow="Trust Network"
      title="More than ticketing. A trust layer for events."
      subtitle="Every account, host, venue, ticket, payment, door, and device on ECHO contributes to one connected network. Each scan makes the next event safer."
      band
    >
      <View style={styles.layerGrid}>
        {LAYERS.map((l, i) => (
          <View
            key={l.title}
            style={[styles.layerCard, isMobile && styles.layerCardMobile]}
          >
            <Text variant="caption" style={styles.layerIndex}>
              {String(i + 1).padStart(2, '0')}
            </Text>
            <Text variant="label" style={styles.layerTitle}>{l.title}</Text>
            <Text variant="bodySmall" style={styles.layerCopy}>{l.copy}</Text>
          </View>
        ))}
      </View>

      <Text variant="label" style={styles.componentsHeading}>
        Inside the network
      </Text>
      <View style={styles.chipWrap}>
        {COMPONENTS.map((c) => (
          <View key={c} style={styles.chip}>
            <Text variant="caption" style={styles.chipText}>{c}</Text>
          </View>
        ))}
      </View>
    </SectionShell>
  );
}

const styles = StyleSheet.create({
  layerGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  layerCard: {
    flexGrow: 1,
    flexBasis: 250,
    maxWidth: 380,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    borderRadius: 16,
    padding: 18,
  },
  layerCardMobile: { maxWidth: '100%' },
  layerIndex: { color: '#7B4DFF', marginBottom: 8, letterSpacing: 1 },
  layerTitle: { color: '#FFFFFF', marginBottom: 6, fontSize: 15 },
  layerCopy: { color: 'rgba(255,255,255,0.62)', lineHeight: 19 },
  componentsHeading: {
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontSize: 12,
    marginTop: 44,
    marginBottom: 16,
  },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipText: { color: 'rgba(255,255,255,0.78)', fontSize: 12 },
});
