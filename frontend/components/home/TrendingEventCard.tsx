/**
 * TrendingEventCard — ECHO Home v1.1 Light Reference Match
 * ═══════════════════════════════════════════════════════════
 * Compact image-first cards like the approved light Home screen:
 * square rounded image, floating save icon, title/venue/time/price below.
 */
import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useDynamicTheme } from '../../theme/dynamicTheme';
import { Text } from '../ui';
import { Event } from '../../types';
import { formatDate, formatTime, formatPrice } from '../../utils/format';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = Math.floor((SCREEN_WIDTH - 56) / 3);
const IMAGE_SIZE = CARD_WIDTH;

interface TrendingEventCardProps {
  event: Event;
  saved?: boolean;
  onToggleSaved?: (eventId: string) => void;
}

export function TrendingEventCard({ event, saved = false, onToggleSaved }: TrendingEventCardProps) {
  const { colors: c, isDark } = useDynamicTheme();

  if (!event) return null;

  const ticketTypes = event.ticket_types || [];
  const lowestPrice = ticketTypes.length > 0 ? ticketTypes[0].price : 0;
  const priceLabel = lowestPrice === 0 ? 'Free' : formatPrice(lowestPrice);

  const handlePress = () => {
    router.push(`/event/${event.id}`);
  };

  const handleSavePress = () => {
    if (onToggleSaved) onToggleSaved(event.id);
  };

  const staticPosterUri = event.image_url || `https://picsum.photos/seed/${event.id}/500/500`;

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.88}
      style={styles.card}
      accessibilityRole="button"
      accessibilityLabel={`${event.title}, ${event.venue_name}, ${priceLabel}`}
    >
      <View
        style={[
          styles.imageShell,
          {
            backgroundColor: c.surface2,
            borderColor: isDark ? c.hairline : 'rgba(17,24,39,0.07)',
            shadowColor: isDark ? '#000' : '#111827',
            shadowOpacity: isDark ? 0.18 : 0.08,
          },
        ]}
      >
        <Image
          source={{ uri: staticPosterUri }}
          style={styles.image}
          resizeMode="cover"
        />

        <TouchableOpacity
          onPress={handleSavePress}
          activeOpacity={0.78}
          style={[
            styles.saveButton,
            {
              backgroundColor: isDark ? 'rgba(15,17,21,0.82)' : 'rgba(255,255,255,0.92)',
              borderColor: isDark ? 'rgba(255,255,255,0.14)' : 'rgba(17,24,39,0.08)',
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={saved ? 'Remove saved event' : 'Save event'}
        >
          <Ionicons
            name={saved ? 'bookmark' : 'bookmark-outline'}
            size={19}
            color={saved ? c.accent : c.text}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.meta}>
        <Text style={[styles.title, { color: c.text }]} numberOfLines={1}>
          {event.title}
        </Text>
        <Text style={[styles.venue, { color: c.textSecondary }]} numberOfLines={1}>
          {event.venue_name}  •  {cityFromAddress(event.venue_address)}
        </Text>
        <Text style={[styles.time, { color: c.textSecondary }]} numberOfLines={1}>
          {formatDate(event.start_time)}  •  {formatTime(event.start_time)}
        </Text>
        <Text style={[styles.price, { color: c.accent }]} numberOfLines={1}>
          {priceLabel}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function cityFromAddress(address?: string) {
  if (!address) return 'Seattle, WA';
  const parts = address.split(',').map((item) => item.trim()).filter(Boolean);
  if (parts.length >= 2) return `${parts[parts.length - 2]}, ${parts[parts.length - 1]}`;
  return parts[0] || 'Seattle, WA';
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    marginRight: 18,
  },
  imageShell: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  saveButton: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: {
    paddingTop: 10,
  },
  title: {
    fontSize: 15.5,
    lineHeight: 20,
    fontWeight: '850',
    letterSpacing: -0.2,
  },
  venue: {
    marginTop: 4,
    fontSize: 12.5,
    lineHeight: 17,
    fontWeight: '600',
  },
  time: {
    marginTop: 2,
    fontSize: 12.5,
    lineHeight: 17,
    fontWeight: '600',
  },
  price: {
    marginTop: 7,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '900',
  },
});

export default TrendingEventCard;
