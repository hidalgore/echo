/**
 * /trust — ECHO Trust & Access public page.
 *
 * Locked v59 sections (do not drift):
 * - Verified hosts
 * - Secure checkout
 * - Age verification BEFORE payment (locked copy)
 * - Wallet-ready passes
 * - NFC-first entry
 * - QR fallback
 * - Donation transparency
 * - Privacy-safe ECHO AI
 * - Refund + transfer rules
 * - Event access history
 * - Host reporting
 */
import React from 'react';
import { Platform, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { brand } from '../theme/brand';
import { WebShell } from '../components/web/WebShell';
import { WebSection } from '../components/web/WebSection';
import { WebCTA } from '../components/web/WebCTA';
import { WebTrustStrip } from '../components/web/WebTrustStrip';

type TrustPillar = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
};

const PILLARS: TrustPillar[] = [
  {
    icon: 'shield-checkmark-outline',
    title: 'Verified hosts',
    body: 'Every host on ECHO is reviewed for legitimacy before they can publish. A verified host badge sits on every event page so guests know who they\u2019re buying from.',
  },
  {
    icon: 'lock-closed-outline',
    title: 'Secure checkout',
    body: 'All payments run through a PCI-compliant processor. Card details never touch ECHO servers. Receipts and order history live in your account, never in marketing pipelines.',
  },
  {
    icon: 'finger-print-outline',
    title: 'Age verification before payment',
    body: 'Age verification happens before payment when required, so checkout stays clean, compliant, and trusted. No surprises at the door, no last-minute holds on your card.',
  },
  {
    icon: 'card-outline',
    title: 'Wallet-ready passes',
    body: 'Every reservation generates an ECHO Access Pass. Add it to Apple Wallet or Google Wallet so it\u2019s ready at the door, even with no signal.',
  },
  {
    icon: 'radio-outline',
    title: 'NFC-first entry',
    body: 'ECHO is built around tap entry first. Doors move faster, the line stays calm, and guests never fumble for a barcode in the dark.',
  },
  {
    icon: 'qr-code-outline',
    title: 'QR fallback',
    body: 'If a phone\u2019s NFC is unavailable, the same pass shows a verifiable QR code. One pass, two entry methods, no panic.',
  },
  {
    icon: 'heart-outline',
    title: 'Donation transparency',
    body: 'When an event supports a nonprofit, the donation amount, cause, and routing are visible to the guest before they confirm. Donation receipts arrive after checkout.',
  },
  {
    icon: 'sparkles-outline',
    title: 'Privacy-safe ECHO AI',
    body: 'ECHO\u2019s AI surfaces relevant events using calm signals. It never says what you watched, how long you watched it, or who you watched it with.',
  },
  {
    icon: 'refresh-outline',
    title: 'Refund & transfer rules',
    body: 'Refunds and transfers follow the host\u2019s published policy and ECHO\u2019s transfer window. Rules are shown on the event page and the access pass, not buried.',
  },
  {
    icon: 'time-outline',
    title: 'Event access history',
    body: 'Every reservation, transfer, and door scan is recorded in your wallet. You always know what you reserved, where it came from, and when it was used.',
  },
  {
    icon: 'document-text-outline',
    title: 'Host reporting',
    body: 'After every event, hosts get a closeout summary: attendance, revenue, donations, and operational notes. Trust is built on what happens after the doors close.',
  },
];

export default function TrustPage() {
  if (Platform.OS !== 'web') return null;
  const { width } = useWindowDimensions();
  const compact = width < 760;
  const columns = width >= 1100 ? 3 : width >= 720 ? 2 : 1;

  return (
    <WebShell>
      {/* Hero */}
      <WebSection
        eyebrow="TRUST & ACCESS"
        title="Built for secure, verified event access."
        description="ECHO is built around how a trusted door actually runs. Verified hosts, age verification before payment, wallet-ready passes, NFC-first entry. The details that make the room feel premium."
        align="center"
        maxWidth={920}
      >
        <View style={[styles.ctaRow, compact && { flexDirection: 'column' }]}>
          <WebCTA label="Explore Events" href="/search" variant="primary" size="lg" />
          <WebCTA label="For Hosts" href="/host" variant="secondary" size="lg" />
        </View>
        <View style={{ height: 28 }} />
        <WebTrustStrip />
      </WebSection>

      {/* Pillars grid */}
      <WebSection
        eyebrow="EVERY DETAIL"
        title="What \u201Csecure event access\u201D actually means."
        description="No marketing language. These are the systems behind every ECHO event."
        align="left"
        divider
      >
        <View style={styles.grid}>
          {PILLARS.map((p, i) => (
            <View
              key={i}
              style={[
                styles.card,
                { width: columns === 1 ? '100%' : columns === 2 ? '48.5%' : '32%' },
              ]}
            >
              <View style={styles.cardIconWrap}>
                <Ionicons name={p.icon} size={18} color={brand.cyanAccessible} />
              </View>
              <Text style={styles.cardTitle}>{p.title}</Text>
              <Text style={styles.cardBody}>{p.body}</Text>
            </View>
          ))}
        </View>
      </WebSection>

      {/* Final CTA */}
      <WebSection align="center" maxWidth={820}>
        <View style={styles.finalCta}>
          <Text style={styles.finalTitle}>Trust is the product.</Text>
          <Text style={styles.finalBody}>
            ECHO exists because the access layer of an event \u2014 the part guests actually feel \u2014 has been an afterthought for too long. We made it the whole point.
          </Text>
          <View style={[styles.ctaRow, compact && { flexDirection: 'column' }]}>
            <WebCTA label="Start Hosting" href="/host/login" variant="primary" size="lg" />
            <WebCTA label="Explore Events" href="/search" variant="secondary" size="lg" />
          </View>
        </View>
      </WebSection>
    </WebShell>
  );
}

const styles = StyleSheet.create({
  ctaRow: {
    flexDirection: 'row',
    gap: 14,
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 18,
    padding: 22,
  },
  cardIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(32,199,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(32,199,255,0.20)',
    marginBottom: 14,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginBottom: 8,
  },
  cardBody: {
    color: 'rgba(255,255,255,0.62)',
    fontSize: 14,
    lineHeight: 21,
  },
  finalCta: {
    backgroundColor: 'rgba(123,77,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(123,77,255,0.18)',
    borderRadius: 24,
    padding: 36,
    alignItems: 'center',
    gap: 14,
  },
  finalTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  finalBody: {
    color: 'rgba(255,255,255,0.66)',
    fontSize: 15,
    lineHeight: 23,
    textAlign: 'center',
    maxWidth: 640,
    marginBottom: 10,
  },
});
