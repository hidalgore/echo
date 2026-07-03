/**
 * WebWalletPage — Web variant of the ECHO wallet.
 *
 * Rendered from app/(tabs)/wallet.tsx when Platform.OS === 'web'.
 * Native wallet (mobile bottom-tab) is untouched.
 *
 * Locked v59 sections:
 * - Active ticket card (ECHO Access Pass preview)
 * - Add to Apple / Google Wallet placeholders (SWAP-POINT)
 * - ECHO Circle status card (if applicable, mock-enabled by default for showcase)
 * - Upcoming tickets list
 * - Past tickets (collapsed)
 * - Entry method explanation (NFC primary, QR fallback)
 * - Donation receipt indicator (if any)
 */
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { brand } from '../../theme/brand';
import { WebShell } from './WebShell';
import { WebSection } from './WebSection';
import { WebCTA } from './WebCTA';
import { EchoAccessPassPreview } from './EchoAccessPassPreview';
import { EchoCirclePreview } from './EchoCirclePreview';
import { getPublicWebEvents } from '../../services/webPlatformMock';

export function WebWalletPage() {
  const { width } = useWindowDimensions();
  const compact = width < 880;
  const events = getPublicWebEvents(6);
  const active = events[0];
  const upcoming = events.slice(1, 4);
  const past = events.slice(4, 6);

  return (
    <WebShell ambient>
      {/* Header */}
      <WebSection align="left" paddingVertical={40} maxWidth={1100}>
        <Text style={styles.eyebrow}>YOUR WALLET</Text>
        <Text style={styles.title}>Access pass, ready when you are.</Text>
        <Text style={styles.sub}>NFC-first entry. QR backup. One pass per reservation.</Text>
      </WebSection>

      {/* Active ticket two-col */}
      <WebSection align="left" paddingVertical={40} maxWidth={1100}>
        <View style={[styles.grid, compact && { flexDirection: 'column' }]}>
          {/* Pass preview */}
          <View style={[styles.colMain, compact && { width: '100%' }]}>
            <EchoAccessPassPreview
              flyerUrl={active?.image_url}
              eventTitle={active?.title}
              eventDate={active ? new Date(active.start_time).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) : undefined}
              venue={active?.venue_name}
            />
            <View style={styles.walletBtnRow}>
              <TouchableOpacity style={styles.walletBtn}>
                <Ionicons name="logo-apple" size={18} color="#FFFFFF" />
                <Text style={styles.walletBtnText}>Add to Apple Wallet</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.walletBtn}>
                <Ionicons name="logo-google" size={18} color="#FFFFFF" />
                <Text style={styles.walletBtnText}>Add to Google Wallet</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Side panel */}
          <View style={[styles.colSide, compact && { width: '100%' }]}>
            {/* Entry method */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="radio-outline" size={18} color={brand.cyanAccessible} />
                <Text style={styles.cardTitle}>Entry method</Text>
              </View>
              <View style={styles.methodRow}>
                <View style={styles.methodIcon}>
                  <Ionicons name="radio-outline" size={16} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.methodTitle}>NFC tap \u2014 primary</Text>
                  <Text style={styles.methodBody}>Hold your phone near the ECHO door reader.</Text>
                </View>
              </View>
              <View style={styles.methodRow}>
                <View style={styles.methodIcon}>
                  <Ionicons name="qr-code-outline" size={16} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.methodTitle}>QR fallback</Text>
                  <Text style={styles.methodBody}>If NFC isn\u2019t available, your pass shows a verifiable QR code.</Text>
                </View>
              </View>
            </View>

            {/* ECHO Circle status */}
            <EchoCirclePreview />

            {/* Donation receipt (if active event has donation) */}
            {active?.donation_campaign && (
              <View style={[styles.card, styles.donationCard]}>
                <View style={styles.cardHeader}>
                  <Ionicons name="heart-outline" size={18} color={brand.cyanAccessible} />
                  <Text style={styles.cardTitle}>Donation receipt</Text>
                </View>
                <Text style={styles.donationBody}>
                  You donated to {active.donation_campaign.causeTitle}. Your tax-deductible receipt has been emailed to you.
                </Text>
              </View>
            )}
          </View>
        </View>
      </WebSection>

      {/* Upcoming list */}
      {upcoming.length > 0 && (
        <WebSection
          eyebrow="UPCOMING"
          title="Reserved & ready"
          align="left"
          maxWidth={1100}
          paddingVertical={40}
        >
          <View style={styles.upcomingGrid}>
            {upcoming.map((e) => (
              <TouchableOpacity
                key={e.id}
                onPress={() => router.push(`/event/${e.id}` as never)}
                style={styles.ticketRow}
              >
                <View style={styles.ticketDate}>
                  <Text style={styles.ticketDateMonth}>
                    {new Date(e.start_time).toLocaleDateString(undefined, { month: 'short' }).toUpperCase()}
                  </Text>
                  <Text style={styles.ticketDateDay}>
                    {new Date(e.start_time).getDate()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.ticketTitle}>{e.title}</Text>
                  <Text style={styles.ticketMeta}>
                    {e.venue_name} \u00B7 {new Date(e.start_time).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.4)" />
              </TouchableOpacity>
            ))}
          </View>
        </WebSection>
      )}

      {/* Past tickets (collapsed) */}
      {past.length > 0 && (
        <WebSection
          eyebrow="PAST EVENTS"
          title="Event history"
          align="left"
          maxWidth={1100}
          paddingVertical={40}
        >
          <View style={styles.upcomingGrid}>
            {past.map((e) => (
              <View key={e.id} style={[styles.ticketRow, { opacity: 0.6 }]}>
                <View style={styles.ticketDate}>
                  <Text style={styles.ticketDateMonth}>
                    {new Date(e.start_time).toLocaleDateString(undefined, { month: 'short' }).toUpperCase()}
                  </Text>
                  <Text style={styles.ticketDateDay}>
                    {new Date(e.start_time).getDate()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.ticketTitle}>{e.title}</Text>
                  <Text style={styles.ticketMeta}>{e.venue_name} \u00B7 Attended</Text>
                </View>
                <Ionicons name="checkmark-circle-outline" size={18} color="rgba(255,255,255,0.45)" />
              </View>
            ))}
          </View>
        </WebSection>
      )}

      {/* Footer CTA */}
      <WebSection align="center" paddingVertical={40} maxWidth={760}>
        <View style={styles.footerCta}>
          <Text style={styles.footerTitle}>Looking for what\u2019s next?</Text>
          <WebCTA label="Explore Events" href="/search" variant="primary" size="md" />
        </View>
      </WebSection>
    </WebShell>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    color: brand.cyanAccessible,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
    marginBottom: 6,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  sub: {
    color: 'rgba(255,255,255,0.62)',
    fontSize: 14,
  },
  grid: {
    flexDirection: 'row',
    gap: 24,
    alignItems: 'flex-start',
  },
  colMain: {
    flex: 1.2,
    gap: 18,
  },
  colSide: {
    flex: 1,
    gap: 16,
  },
  walletBtnRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  walletBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    minWidth: 200,
  },
  walletBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 18,
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  methodRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 10,
  },
  methodIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: 'rgba(123,77,255,0.20)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  methodBody: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
    lineHeight: 18,
  },
  donationCard: {
    backgroundColor: 'rgba(32,199,255,0.05)',
    borderColor: 'rgba(32,199,255,0.18)',
  },
  donationBody: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 13,
    lineHeight: 20,
  },
  upcomingGrid: {
    gap: 8,
  },
  ticketRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  ticketDate: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: 'rgba(123,77,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ticketDateMonth: {
    color: brand.cyanAccessible,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  ticketDateDay: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginTop: -2,
  },
  ticketTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  ticketMeta: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
  },
  footerCta: {
    alignItems: 'center',
    gap: 14,
    padding: 28,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  footerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
});
