/**
 * WebEventDetailPage — Web variant of the event detail screen.
 *
 * Rendered from app/event/[id].tsx when Platform.OS === 'web'.
 * Native event detail (mobile) is untouched.
 *
 * Locked v59 sections:
 * - Event media hero
 * - Title, date/time, venue
 * - Map preview placeholder
 * - Verified host badge
 * - Donation indicator (if present)
 * - Age badge if 18+/21+
 * - Ticket options
 * - ECHO Circle option (CTA, not full flow on web)
 * - "Reserve Access" CTA (NOT "Buy Ticket")
 * - Add to Calendar / Share CTAs
 * - Host card
 * - Trust strip
 * - Entry method info (NFC primary, QR fallback)
 */
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { brand } from '../../theme/brand';
import { WebShell } from './WebShell';
import { WebSection } from './WebSection';
import { WebCTA } from './WebCTA';
import { WebTrustStrip } from './WebTrustStrip';
import type { Event } from '../../types';

type Props = {
  event: Event;
};

export function WebEventDetailPage({ event }: Props) {
  const { width } = useWindowDimensions();
  const compact = width < 880;

  const dateLabel = new Date(event.start_time).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  const timeLabel = new Date(event.start_time).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
  const ageLabel = event.age_restriction ? `${event.age_restriction}+` : null;
  const startingPrice =
    event.ticket_types && event.ticket_types.length > 0
      ? Math.min(...event.ticket_types.map((t) => t.price)) / 100
      : null;
  const hasDonation = !!event.donation_campaign;

  return (
    <WebShell ambient>
      {/* Back link */}
      <WebSection align="left" paddingVertical={40} maxWidth={1100}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
          <Ionicons name="chevron-back" size={16} color="rgba(255,255,255,0.7)" />
          <Text style={styles.backLinkText}>All events</Text>
        </TouchableOpacity>
      </WebSection>

      {/* Hero two-col */}
      <WebSection align="left" paddingVertical={40} maxWidth={1100}>
        <View style={[styles.heroGrid, compact && { flexDirection: 'column' }]}>
          {/* Media */}
          <View style={[styles.mediaCol, compact && { width: '100%' }]}>
            <View style={styles.mediaWrap}>
              {event.image_url ? (
                <Image source={{ uri: event.image_url }} style={styles.mediaImg} />
              ) : (
                <View style={[styles.mediaImg, styles.mediaPlaceholder]} />
              )}
              {/* Badges over media */}
              <View style={styles.mediaBadgeRow}>
                {event.host_verified && (
                  <View style={styles.mediaBadge}>
                    <Ionicons name="shield-checkmark-outline" size={11} color="#FFFFFF" />
                    <Text style={styles.mediaBadgeText}>Verified host</Text>
                  </View>
                )}
                {ageLabel && (
                  <View style={[styles.mediaBadge, { backgroundColor: 'rgba(255,181,76,0.20)', borderColor: 'rgba(255,181,76,0.45)' }]}>
                    <Text style={styles.mediaBadgeText}>{ageLabel}</Text>
                  </View>
                )}
                {hasDonation && (
                  <View style={[styles.mediaBadge, { backgroundColor: 'rgba(32,199,255,0.16)', borderColor: 'rgba(32,199,255,0.40)' }]}>
                    <Ionicons name="heart-outline" size={11} color="#FFFFFF" />
                    <Text style={styles.mediaBadgeText}>Supports a cause</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Info */}
          <View style={[styles.infoCol, compact && { width: '100%' }]}>
            <Text style={styles.title}>{event.title}</Text>
            <View style={styles.metaRow}>
              <Ionicons name="calendar-outline" size={16} color="rgba(255,255,255,0.55)" />
              <Text style={styles.metaText}>{dateLabel} \u00B7 {timeLabel}</Text>
            </View>
            <View style={styles.metaRow}>
              <Ionicons name="location-outline" size={16} color="rgba(255,255,255,0.55)" />
              <Text style={styles.metaText}>{event.venue_name}</Text>
            </View>
            {event.venue_address && (
              <Text style={styles.address}>{event.venue_address}</Text>
            )}

            {/* CTA */}
            <View style={styles.ctaRow}>
              <TouchableOpacity
                onPress={() => router.push(`/checkout/${event.id}` as never)}
                style={styles.reserveBtn}
              >
                <Text style={styles.reserveBtnText}>Reserve Access</Text>
                {startingPrice !== null && (
                  <Text style={styles.reserveBtnPrice}>from ${startingPrice.toFixed(0)}</Text>
                )}
              </TouchableOpacity>
              <View style={styles.iconBtnRow}>
                <TouchableOpacity style={styles.iconBtn}>
                  <Ionicons name="calendar-outline" size={18} color="#FFFFFF" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconBtn}>
                  <Ionicons name="share-outline" size={18} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Mini map placeholder */}
            <View style={styles.mapPlaceholder}>
              <Ionicons name="map-outline" size={22} color="rgba(255,255,255,0.45)" />
              <Text style={styles.mapPlaceholderText}>{event.venue_name}</Text>
              <Text style={styles.mapPlaceholderSub}>{event.venue_address ?? 'Address shown on access pass'}</Text>
            </View>
          </View>
        </View>
      </WebSection>

      {/* Description + Tickets two-col */}
      <WebSection align="left" paddingVertical={40} maxWidth={1100}>
        <View style={[styles.bodyGrid, compact && { flexDirection: 'column' }]}>
          {/* Description */}
          <View style={[styles.descCol, compact && { width: '100%' }]}>
            <Text style={styles.sectionTitle}>About this event</Text>
            <Text style={styles.descText}>{event.description}</Text>

            {/* Host card */}
            <View style={styles.hostCard}>
              <View style={styles.hostAvatar}>
                <Ionicons name="person-outline" size={20} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.hostNameRow}>
                  <Text style={styles.hostName}>{event.host_name ?? 'Verified host'}</Text>
                  {event.host_verified && (
                    <Ionicons name="shield-checkmark" size={14} color={brand.cyanAccessible} />
                  )}
                </View>
                <Text style={styles.hostMeta}>Reviewed and verified by ECHO</Text>
              </View>
            </View>

            {hasDonation && event.donation_campaign && (
              <View style={styles.donationCard}>
                <View style={styles.donationHeader}>
                  <Ionicons name="heart-outline" size={18} color={brand.cyanAccessible} />
                  <Text style={styles.donationTitle}>{event.donation_campaign.causeTitle}</Text>
                </View>
                <Text style={styles.donationBody}>
                  {event.donation_campaign.causeDescription ?? 'This host has attached a nonprofit donation campaign. You can add a gift during checkout \u2014 entirely optional.'}
                </Text>
              </View>
            )}
          </View>

          {/* Tickets */}
          <View style={[styles.ticketsCol, compact && { width: '100%' }]}>
            <View style={styles.ticketsCard}>
              <Text style={styles.sectionTitle}>Tickets</Text>
              {(event.ticket_types ?? []).map((t) => (
                <View key={t.id} style={styles.ticketTier}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.tierName}>{t.name}</Text>
                    {t.description && <Text style={styles.tierDesc}>{t.description}</Text>}
                  </View>
                  <Text style={styles.tierPrice}>${(t.price / 100).toFixed(0)}</Text>
                </View>
              ))}
              {(!event.ticket_types || event.ticket_types.length === 0) && (
                <Text style={styles.muted}>Ticket tiers will be published soon.</Text>
              )}
              <TouchableOpacity
                onPress={() => router.push(`/checkout/${event.id}` as never)}
                style={styles.tierCta}
              >
                <Text style={styles.tierCtaText}>Reserve Access</Text>
              </TouchableOpacity>
            </View>

            {/* Circle option */}
            <View style={styles.circleCard}>
              <View style={styles.donationHeader}>
                <Ionicons name="people-outline" size={18} color={brand.cyanAccessible} />
                <Text style={styles.donationTitle}>Going as a group?</Text>
              </View>
              <Text style={styles.donationBody}>
                Start an ECHO Circle. You pay first, then invite up to 7 friends. Each pays their own way. 1-hour timer.
              </Text>
              <TouchableOpacity
                onPress={() => router.push(`/checkout/${event.id}` as never)}
                style={styles.circleBtn}
              >
                <Text style={styles.circleBtnText}>Start an ECHO Circle</Text>
                <Ionicons name="chevron-forward" size={14} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </WebSection>

      {/* Entry method */}
      <WebSection
        eyebrow="ENTRY METHOD"
        title="Tap to enter. QR if you need it."
        align="left"
        maxWidth={1100}
        paddingVertical={40}
      >
        <View style={[styles.entryGrid, compact && { flexDirection: 'column' }]}>
          <View style={styles.entryCard}>
            <View style={styles.entryIcon}>
              <Ionicons name="radio-outline" size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.entryTitle}>NFC tap \u2014 primary</Text>
            <Text style={styles.entryBody}>Hold your phone near the ECHO reader at the door. Works even with no signal.</Text>
          </View>
          <View style={styles.entryCard}>
            <View style={styles.entryIcon}>
              <Ionicons name="qr-code-outline" size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.entryTitle}>QR fallback</Text>
            <Text style={styles.entryBody}>If NFC isn\u2019t available, your access pass shows a verifiable QR code.</Text>
          </View>
          <View style={styles.entryCard}>
            <View style={styles.entryIcon}>
              <Ionicons name="card-outline" size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.entryTitle}>Wallet-ready</Text>
            <Text style={styles.entryBody}>Add your ECHO Access Pass to Apple or Google Wallet from your wallet page.</Text>
          </View>
        </View>
        <View style={{ height: 22 }} />
        <WebTrustStrip />
      </WebSection>

      {/* Final CTA */}
      <WebSection align="center" paddingVertical={40} maxWidth={760}>
        <View style={styles.footerCta}>
          <Text style={styles.footerTitle}>{event.title}</Text>
          <Text style={styles.footerSub}>{dateLabel} \u00B7 {event.venue_name}</Text>
          <WebCTA
            label="Reserve Access"
            href={`/checkout/${event.id}` as never}
            variant="primary"
            size="lg"
          />
        </View>
      </WebSection>
    </WebShell>
  );
}

const styles = StyleSheet.create({
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backLinkText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    fontWeight: '500',
  },
  heroGrid: {
    flexDirection: 'row',
    gap: 28,
    alignItems: 'flex-start',
  },
  mediaCol: { flex: 1 },
  infoCol: { flex: 1 },
  mediaWrap: {
    position: 'relative',
    borderRadius: 22,
    overflow: 'hidden',
  },
  mediaImg: {
    width: '100%',
    aspectRatio: 4 / 5,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  mediaPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaBadgeRow: {
    position: 'absolute',
    top: 14,
    left: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    maxWidth: '90%',
  },
  mediaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.20)',
  },
  mediaBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -0.6,
    marginBottom: 16,
    lineHeight: 42,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  metaText: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 15,
    fontWeight: '500',
  },
  address: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 13,
    marginLeft: 24,
    marginBottom: 14,
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 18,
    marginBottom: 18,
  },
  reserveBtn: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: brand.primary,
    borderRadius: 999,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reserveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  reserveBtnPrice: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 13,
    fontWeight: '600',
  },
  iconBtnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  iconBtn: {
    width: 50,
    height: 50,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapPlaceholder: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 22,
    alignItems: 'flex-start',
    gap: 4,
  },
  mapPlaceholderText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
  },
  mapPlaceholderSub: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
  },
  bodyGrid: {
    flexDirection: 'row',
    gap: 24,
    alignItems: 'flex-start',
  },
  descCol: { flex: 1.4 },
  ticketsCol: { flex: 1 },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginBottom: 14,
  },
  descText: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 15,
    lineHeight: 25,
    marginBottom: 24,
  },
  hostCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    marginBottom: 14,
  },
  hostAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(123,77,255,0.20)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hostNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  hostName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  hostMeta: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
  },
  donationCard: {
    backgroundColor: 'rgba(32,199,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(32,199,255,0.18)',
    borderRadius: 14,
    padding: 18,
  },
  donationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  donationTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  donationBody: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 13,
    lineHeight: 20,
  },
  ticketsCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 18,
    padding: 22,
    marginBottom: 14,
  },
  ticketTier: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  tierName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  tierDesc: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
  },
  tierPrice: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  muted: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 13,
    paddingVertical: 14,
  },
  tierCta: {
    backgroundColor: brand.primary,
    paddingVertical: 13,
    borderRadius: 999,
    alignItems: 'center',
    marginTop: 14,
  },
  tierCtaText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  circleCard: {
    backgroundColor: 'rgba(123,77,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(123,77,255,0.18)',
    borderRadius: 18,
    padding: 20,
  },
  circleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 14,
    paddingVertical: 11,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.20)',
  },
  circleBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  entryGrid: {
    flexDirection: 'row',
    gap: 14,
  },
  entryCard: {
    flex: 1,
    padding: 22,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
  },
  entryIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(123,77,255,0.20)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  entryTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  entryBody: {
    color: 'rgba(255,255,255,0.62)',
    fontSize: 13,
    lineHeight: 20,
  },
  footerCta: {
    alignItems: 'center',
    gap: 10,
    padding: 32,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  footerTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  footerSub: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 14,
    marginBottom: 14,
  },
});
