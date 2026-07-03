/**
 * ECHO — WebEventCard (v59.4, web)
 * ═════════════════════════════════
 * Compact event card for website rails. Fields per spec: title, date,
 * time, venue, city, price, age requirement, category, host, verified
 * indicator, primary recommendation reason where relevant.
 */
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../ui/Text';
import type { WebMockEvent } from '../../types/pickedForYou';

interface WebEventCardProps {
  event: WebMockEvent;
  reasonLabel?: string;
  onPress?: () => void;
}

function formatDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export function WebEventCard({ event, reasonLabel, onPress }: WebEventCardProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${event.title}, ${formatDate(event.date)} at ${event.time}, ${event.venue}, ${event.city}. ${event.price}.`}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      {reasonLabel ? (
        <View style={styles.reasonPill}>
          <Text variant="caption" numberOfLines={1} style={styles.reasonText}>{reasonLabel}</Text>
        </View>
      ) : null}

      <View style={styles.artwork}>
        <Text variant="label" style={styles.artworkCategory}>{event.category}</Text>
      </View>

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text variant="eventTitle" numberOfLines={2} style={styles.title}>
            {event.title}
          </Text>
          {event.ageRequirement === '21+' ? (
            <View style={styles.agePill}>
              <Text variant="caption" style={styles.ageText}>21+</Text>
            </View>
          ) : null}
        </View>

        <Text variant="meta" numberOfLines={1} style={styles.meta}>
          {formatDate(event.date)} - {event.time}
        </Text>
        <Text variant="meta" numberOfLines={1} style={styles.meta}>
          {event.venue} - {event.city}
        </Text>

        <View style={styles.footerRow}>
          <Text variant="price" style={styles.price}>{event.price}</Text>
          <View style={styles.hostWrap}>
            {event.verified ? <View style={styles.verifiedDot} /> : null}
            <Text variant="caption" numberOfLines={1} style={styles.host}>
              {event.verified ? 'Verified Host - ' : ''}{event.host}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 280,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardPressed: { opacity: 0.85 },
  reasonPill: {
    position: 'absolute',
    top: 12, left: 12, zIndex: 2,
    maxWidth: 256,
    backgroundColor: 'rgba(15,17,21,0.80)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  reasonText: { color: '#FFFFFF', fontSize: 11 },
  artwork: {
    height: 132,
    backgroundColor: '#181C24',
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
    padding: 12,
  },
  artworkCategory: {
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontSize: 11,
  },
  body: { padding: 14 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 6 },
  title: { color: '#FFFFFF', flex: 1, lineHeight: 22, minHeight: 22 },
  agePill: {
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.24)',
    borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2,
  },
  ageText: { color: 'rgba(255,255,255,0.78)', fontSize: 11 },
  meta: { color: 'rgba(255,255,255,0.60)', marginBottom: 2 },
  footerRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginTop: 10, gap: 8,
  },
  price: { color: '#FFFFFF', flexShrink: 0 },
  hostWrap: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
  verifiedDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#34D399' },
  host: { color: 'rgba(255,255,255,0.55)', fontSize: 11, flexShrink: 1 },
});
