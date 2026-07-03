import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Text } from '../ui';

type Props = {
  imageUrl?: string;
  title: string;
  venue: string;
  dateText: string;
  timeText: string;
  ageRestriction?: number | null;
};

export function EventSummaryCard({ imageUrl, title, venue, dateText, timeText, ageRestriction }: Props) {
  const hasAge = ageRestriction && ageRestriction > 0;
  return (
    <View style={s.card}>
      <Image
        source={{ uri: imageUrl || `https://picsum.photos/seed/${title}/200/240` }}
        style={s.thumb}
      />
      <View style={s.content}>
        <View style={s.titleRow}>
          <Text style={s.title} numberOfLines={1}>{title}</Text>
          {hasAge && (
            <View style={s.ageBadge}>
              <Text style={s.ageText}>{ageRestriction}+</Text>
            </View>
          )}
        </View>
        <Text style={s.venue} numberOfLines={1}>{venue}</Text>
        <Text style={s.datetime}>{dateText} {'\u00B7'} {timeText}</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 16,
    marginHorizontal: 20,
    minHeight: 112,
    alignItems: 'center',
  },
  thumb: { width: 72, height: 80, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.06)' },
  content: { flex: 1, marginLeft: 14 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 18, fontWeight: '600', color: '#FFFFFF', flex: 1, marginRight: 8 },
  venue: { fontSize: 14, fontWeight: '500', color: 'rgba(255,255,255,0.78)', marginTop: 4 },
  datetime: { fontSize: 13, color: 'rgba(255,255,255,0.70)', marginTop: 3 },
  ageBadge: {
    height: 24, paddingHorizontal: 10, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
  },
  ageText: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.80)' },
});
