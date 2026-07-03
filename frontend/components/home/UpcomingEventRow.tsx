import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { colors, radii } from '../../theme/tokens';
import { useDynamicTheme } from '../../theme/dynamicTheme';
import { Text } from '../ui';
import type { Event } from '../../types';

interface UpcomingEventRowProps {
  id: string;
  title: string;
  date: string;
  time: string;
  venue: string;
  price: string;
  imageUrl?: string;
  event?: Event;
  onPress: () => void;
}

export function UpcomingEventRow({
  title,
  date,
  time,
  venue,
  price,
  imageUrl,
  event,
  onPress,
}: UpcomingEventRowProps) {
  const staticPosterUri = imageUrl || event?.image_url || 'https://picsum.photos/seed/event/120/120';

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <Image
        source={{ uri: staticPosterUri }}
        style={styles.image}
      />
      <View style={styles.content}>
        <Text style={styles.dateLine}>{date} · {time}</Text>
        <Text style={styles.titleLine} numberOfLines={1}>{title}</Text>
        <Text style={styles.venueLine} numberOfLines={1}>{venue}</Text>
      </View>
      <View style={styles.priceWrap}>
        <Text variant="price">{price}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,            // was 12 → +2pt (~3% height increase)
    minHeight: 82,                  // ensures consistent card height
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  image: {
    width: 60,                      // was 56 → +4pt (~3% larger presence)
    height: 60,
    borderRadius: radii.sm + 2,
    backgroundColor: colors.surface2,
  },
  content: {
    flex: 1,
    marginLeft: 14,                 // was 12 → slight breathing room
  },
  dateLine: {
    fontSize: 13.5,                 // was 13 → +~2%
    fontWeight: '400',
    lineHeight: 18,
    color: colors.accent,
  },
  titleLine: {
    fontSize: 16.5,                 // was 16 → +~2%
    fontWeight: '600',
    lineHeight: 22,                 // was 21
    color: colors.text,
    marginTop: 2,
  },
  venueLine: {
    fontSize: 13.5,                 // was 13 → +~2%
    fontWeight: '400',
    lineHeight: 19,                 // was 18
    color: colors.textMedium,
    marginTop: 1,
  },
  priceWrap: {
    marginLeft: 12,
    minWidth: 44,                   // 44pt minimum tap target
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default UpcomingEventRow;
