/**
 * /nonprofits — ECHO Nonprofit Support page.
 *
 * Locked v59 positioning:
 * - "Donation support without disrupting checkout."
 * - Nonprofit is a supported host type, not the headline positioning.
 * - Donation amount/cause/routing visible BEFORE confirm.
 * - Donation receipts delivered after checkout.
 */
import React from 'react';
import { Platform, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { brand } from '../theme/brand';
import { WebShell } from '../components/web/WebShell';
import { WebSection } from '../components/web/WebSection';
import { WebCTA } from '../components/web/WebCTA';
import { WebTrustStrip } from '../components/web/WebTrustStrip';

type Block = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
};

const HOST_TOOLS: Block[] = [
  {
    icon: 'ribbon-outline',
    title: 'Verified nonprofit host',
    body: 'Apply once. Once verified, your events carry a donation badge and your campaigns appear on the event page \u2014 cleanly, not as a popup.',
  },
  {
    icon: 'card-outline',
    title: 'Donation-enabled events',
    body: 'Add a donation campaign to any event. Guests can give an amount during checkout, or skip it. Either way, the ticket flow stays calm.',
  },
  {
    icon: 'cash-outline',
    title: 'Checkout donation card',
    body: 'A single, optional donation card appears on the order summary. Suggested amounts, custom amount, or no donation \u2014 the guest decides without friction.',
  },
];

const REPORTING_TOOLS: Block[] = [
  {
    icon: 'document-text-outline',
    title: 'Donor export',
    body: 'Export your donor list as CSV after the event. Names, amounts, and receipt status, with explicit consent only.',
  },
  {
    icon: 'stats-chart-outline',
    title: 'Campaign reporting',
    body: 'Total raised, average gift, conversion from checkout. Built into the event closeout summary so it\u2019s in one place, not three.',
  },
  {
    icon: 'mail-outline',
    title: 'Receipts after checkout',
    body: 'Donation receipts are delivered after the order completes \u2014 with your nonprofit\u2019s name, EIN, and the date of the gift. Ready for tax season.',
  },
];

export default function NonprofitsPage() {
  if (Platform.OS !== 'web') return null;
  const { width } = useWindowDimensions();
  const compact = width < 760;
  const cardWidth = width >= 980 ? '32%' : width >= 700 ? '48.5%' : '100%';

  return (
    <WebShell>
      {/* Hero */}
      <WebSection
        eyebrow="NONPROFIT SUPPORT"
        title="Donation support without disrupting checkout."
        description="ECHO supports verified nonprofits as a host type. Donations live inside the event experience \u2014 not as a popup, not as a pressure tactic, not as a separate flow."
        align="center"
        maxWidth={940}
      >
        <View style={[styles.ctaRow, compact && { flexDirection: 'column' }]}>
          <WebCTA label="Apply as a Nonprofit Host" href="/host/login" variant="primary" size="lg" />
          <WebCTA label="See an Event" href="/search" variant="secondary" size="lg" />
        </View>
        <View style={{ height: 28 }} />
        <WebTrustStrip />
      </WebSection>

      {/* Host tools */}
      <WebSection
        eyebrow="HOST TOOLS"
        title="Built for the people running the cause."
        align="left"
      >
        <View style={styles.grid}>
          {HOST_TOOLS.map((b, i) => (
            <View key={i} style={[styles.card, { width: cardWidth }]}>
              <View style={styles.iconWrap}>
                <Ionicons name={b.icon} size={18} color={brand.cyanAccessible} />
              </View>
              <Text style={styles.cardTitle}>{b.title}</Text>
              <Text style={styles.cardBody}>{b.body}</Text>
            </View>
          ))}
        </View>
      </WebSection>

      {/* Reporting */}
      <WebSection
        eyebrow="REPORTING"
        title="Closeout that actually closes the loop."
        align="left"
        divider
      >
        <View style={styles.grid}>
          {REPORTING_TOOLS.map((b, i) => (
            <View key={i} style={[styles.card, { width: cardWidth }]}>
              <View style={styles.iconWrap}>
                <Ionicons name={b.icon} size={18} color={brand.cyanAccessible} />
              </View>
              <Text style={styles.cardTitle}>{b.title}</Text>
              <Text style={styles.cardBody}>{b.body}</Text>
            </View>
          ))}
        </View>
      </WebSection>

      {/* Transparency callout */}
      <WebSection align="center" maxWidth={820}>
        <View style={styles.transparency}>
          <Ionicons name="eye-outline" size={22} color={brand.cyanAccessible} />
          <Text style={styles.transparencyTitle}>Transparency, by default.</Text>
          <Text style={styles.transparencyBody}>
            Donors see the cause, the amount, and the routing before they confirm. There are no pre-checked boxes, no dark patterns, no shame.
          </Text>
          <View style={[styles.ctaRow, compact && { flexDirection: 'column' }]}>
            <WebCTA label="Trust & Access" href="/trust" variant="secondary" size="md" />
            <WebCTA label="Apply Now" href="/host/login" variant="primary" size="md" />
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
  iconWrap: {
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
  transparency: {
    backgroundColor: 'rgba(32,199,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(32,199,255,0.18)',
    borderRadius: 24,
    padding: 36,
    alignItems: 'center',
    gap: 14,
  },
  transparencyTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  transparencyBody: {
    color: 'rgba(255,255,255,0.66)',
    fontSize: 15,
    lineHeight: 23,
    textAlign: 'center',
    maxWidth: 580,
    marginBottom: 8,
  },
});
