import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { UpcomingEventRow } from './UpcomingEventRow';
import { Event } from '../../types';
import { formatDate, formatTime, formatPrice } from '../../utils/format';
import { colors } from '../../theme/tokens';
import { useDynamicTheme } from '../../theme/dynamicTheme';
import { Text } from '../ui';

interface UpcomingListProps {
  events: Event[];
  initialLimit?: number;
}

export function UpcomingList({ events, initialLimit = 6 }: UpcomingListProps) {
  const [showAll, setShowAll] = useState(false);

  const handleEventPress = (id: string) => {
    router.push(`/event/${id}`);
  };

  const visibleEvents = showAll ? events : events.slice(0, initialLimit);
  const hasMore = events.length > initialLimit && !showAll;
  const remaining = events.length - initialLimit;

  return (
    <View style={styles.container}>
      {visibleEvents.map((event, index) => (
        <UpcomingEventRow
          key={event.id}
          id={event.id}
          title={event.title}
          date={formatDate(event.start_time)}
          time={formatTime(event.start_time)}
          venue={event.venue_name}
          price={event.ticket_types[0]?.price === 0 ? 'Free' : formatPrice(event.ticket_types[0]?.price || 0)}
          imageUrl={event.image_url}
          event={event}
          onPress={() => handleEventPress(event.id)}
        />
      ))}

      {hasMore && (
        <TouchableOpacity style={styles.seeMoreBtn} onPress={() => setShowAll(true)} activeOpacity={0.7}>
          <Text style={styles.seeMoreText}>See More</Text>
          <Text style={styles.seeMoreCount}>{remaining} more events</Text>
          <Ionicons name="chevron-down" size={14} color={colors.textMuted} />
        </TouchableOpacity>
      )}

      {events.length === 0 && (
        <View style={styles.emptyState}>
          <Ionicons name="calendar-outline" size={32} color="rgba(255,255,255,0.15)" />
          <Text style={styles.emptyText}>No events match this filter</Text>
          <Text style={styles.emptySubtext}>Try a different date or category</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16 },
  seeMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    marginTop: 4,
  },
  seeMoreText: { fontSize: 14, fontWeight: '600', color: colors.accent },
  seeMoreCount: { fontSize: 13, color: colors.textMuted },
  emptyState: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyText: { fontSize: 16, fontWeight: '600', color: 'rgba(255,255,255,0.45)' },
  emptySubtext: { fontSize: 13, color: 'rgba(255,255,255,0.30)' },
});
