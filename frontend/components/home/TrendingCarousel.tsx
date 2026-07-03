/**
 * TrendingCarousel — compact horizontal rail
 * Matches the approved light Home screen Trending section.
 */
import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { TrendingEventCard } from './TrendingEventCard';
import { Event } from '../../types';

interface TrendingCarouselProps {
  events: Event[];
  savedIds?: string[];
  onToggleSaved?: (eventId: string) => void;
}

export function TrendingCarousel({ events = [], savedIds = [], onToggleSaved }: TrendingCarouselProps) {
  const validEvents = events.filter((event) => event && event.id);

  if (validEvents.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
      decelerationRate="fast"
    >
      {validEvents.map((event, index) => (
        <TrendingEventCard
          key={event.id}
          event={event}
          saved={savedIds.indexOf(event.id) >= 0}
          onToggleSaved={onToggleSaved}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
});

export default TrendingCarousel;
