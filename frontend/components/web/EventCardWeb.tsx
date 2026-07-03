/**
 * ECHO EventCardWeb — editorial premium event card.
 * Used in homepage featured grid, search rows, related events.
 */
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { brand } from '../../theme/brand';
import type { Event } from '../../types';
import { getWebTicketPriceLabel } from '../../services/webPlatformMock';

interface Props {
  event: Event;
  /** large: hero card with bigger image / tall layout. */
  size?: 'sm' | 'md' | 'lg';
}

const formatDateShort = (iso: string): string => {
  try {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }).format(new Date(iso));
  } catch {
    return '';
  }
};

const formatTime = (iso: string): string => {
  try {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return '';
  }
};

export function EventCardWeb({ event, size = 'md' }: Props) {
  const aspectRatio = size === 'lg' ? 4 / 5 : size === 'sm' ? 4 / 3 : 5 / 6;
  const hasDonation = !!event.donation_campaign;
  const ageBadge =
    event.age_restriction === 21
      ? '21+'
      : event.age_restriction === 18
      ? '18+'
      : null;

  const go = () => router.push(`/event/${event.id}` as never);

  return (
    <TouchableOpacity activeOpacity={0.92} onPress={go} style={styles.card}>
      <View style={[styles.imageWrap, { aspectRatio }]}>
        {event.image_url ? (
          <Image source={{ uri: event.image_url }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.image, styles.fallback]} />
        )}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.78)']}
          style={styles.scrim}
          locations={[0.45, 1]}
        />

        {/* Top-left badges */}
        <View style={styles.topBadgeRow}>
          {event.host_verified && (
            <View style={styles.badge}>
              <Ionicons name="checkmark-circle" size={12} color={brand.cyan} />
              <Text style={styles.badgeText}>Verified host</Text>
            </View>
          )}
          {ageBadge && (
            <View style={[styles.badge, styles.badgeAge]}>
              <Text style={styles.badgeAgeText}>{ageBadge}</Text>
            </View>
          )}
          {hasDonation && (
            <View style={styles.badge}>
              <Ionicons name="heart" size={11} color={brand.magenta} />
              <Text style={styles.badgeText}>Donation</Text>
            </View>
          )}
        </View>

        {/* Bottom text */}
        <View style={styles.bottomBlock}>
          <Text style={styles.dateText}>
            {formatDateShort(event.start_time)} · {formatTime(event.start_time)}
          </Text>
          <Text style={[styles.titleText, size === 'lg' && styles.titleLg]} numberOfLines={2}>
            {event.title}
          </Text>
          <View style={styles.metaRow}>
            <Text style={styles.metaText} numberOfLines={1}>
              {event.venue_name}
            </Text>
            <Text style={styles.priceText}>{getWebTicketPriceLabel(event)}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: '#0E0E12',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  imageWrap: { width: '100%', position: 'relative' },
  image: { width: '100%', height: '100%', backgroundColor: '#1A1A20' },
  fallback: { backgroundColor: '#1A1A20' },
  scrim: { ...StyleSheet.absoluteFillObject },
  topBadgeRow: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(8,8,10,0.72)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  badgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '600', letterSpacing: 0.2 },
  badgeAge: { backgroundColor: 'rgba(255,122,26,0.92)', borderColor: 'rgba(255,122,26,0.4)' },
  badgeAgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700', letterSpacing: 0.4 },
  bottomBlock: { position: 'absolute', left: 16, right: 16, bottom: 16 },
  dateText: { color: 'rgba(255,255,255,0.78)', fontSize: 11, fontWeight: '600', letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 6 },
  titleText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700', letterSpacing: -0.2, lineHeight: 22 },
  titleLg: { fontSize: 22, lineHeight: 26 },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, gap: 8 },
  metaText: { color: 'rgba(255,255,255,0.65)', fontSize: 12, flex: 1 },
  priceText: { color: brand.cyanAccessible, fontSize: 12, fontWeight: '700' },
});

export default EventCardWeb;
