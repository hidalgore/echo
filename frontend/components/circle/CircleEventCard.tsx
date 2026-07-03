/**
 * CircleEventCard — Shared event summary for Circle screens
 * ══════════════════════════════════════════════════════════
 * Shows event image, title, venue, date/time, ticket/spot count.
 * Consistent layout across all 4 Circle flow screens.
 */
import React from 'react';
import { useDynamicTheme } from '../../theme/dynamicTheme';
import { View, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../ui';

type Props = {
  imageUrl?: string;
  title: string;
  venue: string;
  city?: string;
  dateLabel: string;
  /** e.g. "2 tickets" or "2 spots total" */
  countLabel: string;
  countIcon?: string;
};

export function CircleEventCard({
  imageUrl, title, venue, city, dateLabel, countLabel, countIcon = 'ticket-outline',
}: Props) {
  const { colors: c } = useDynamicTheme();
  const venueText = city ? `${venue} · ${city}` : venue;

  return (
    <View style={[s.card, { backgroundColor: c.surface2, borderColor: c.hairline }]}>
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={s.image} />
      ) : (
        <View style={[s.image, s.imagePlaceholder]}>
          <Ionicons name="image-outline" size={28} color={c.textDisabled} />
        </View>
      )}
      <View style={s.info}>
        <Text style={[s.title, { color: c.text }]} numberOfLines={2}>{title}</Text>
        <Text style={[s.venue, { color: c.textMuted }]}>{venueText}</Text>
        <View style={s.metaRow}>
          <Ionicons name="calendar-outline" size={16} color={c.textMuted} />
          <Text style={[s.metaText, { color: c.textMuted }]}>{dateLabel}</Text>
        </View>
        <View style={s.metaRow}>
          <Ionicons name={countIcon as never} size={16} color={c.textMuted} />
          <Text style={[s.metaText, { color: c.textMuted }]}>{countLabel}</Text>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    flexDirection: 'row', gap: 16, padding: 16,
    borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
  },
  image: { width: 96, height: 112, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.05)' },
  imagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1, justifyContent: 'center', gap: 4 },
  title: { color: '#F7F8FA', fontSize: 19, fontWeight: '700', lineHeight: 25 },
  venue: { color: 'rgba(255,255,255,0.66)', fontSize: 15, lineHeight: 20 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  metaText: { color: 'rgba(255,255,255,0.66)', fontSize: 14, lineHeight: 19 },
});
