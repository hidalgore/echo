import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/tokens';
import { Text } from '../ui';
import { Event } from '../../types';
import { formatDate, formatTime, formatPrice } from '../../utils/format';

interface SearchResultCardProps {
  event: Event;
}

export function SearchResultCard({ event }: SearchResultCardProps) {
  const lowestPrice = event.ticket_types?.[0]?.price || 0;

  const handlePress = () => {
    router.push(`/event/${event.id}`);
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.9}>
      <LinearGradient
        colors={['#10B981', '#20C7FF', '#7B4DFF', '#E63DAD', '#F59E0B']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBorder}
      >
        <View style={styles.cardInner}>
          {/* Image */}
          <Image
            source={{ uri: event.image_url || `https://picsum.photos/seed/${event.id}/200/200` }}
            style={styles.image}
            resizeMode="cover"
          />
          
          {/* Content */}
          <View style={styles.content}>
            <Text variant="meta" color="accent">
              {formatDate(event.start_time)} · {formatTime(event.start_time)}
            </Text>
            <Text variant="eventTitle" numberOfLines={2} style={{ marginTop: 4 }}>
              {event.title}
            </Text>
            <View style={styles.venueRow}>
              <Ionicons name="location-outline" size={14} color={colors.textMuted} />
              <Text variant="caption" color="textMuted" numberOfLines={1} style={{ marginLeft: 4, flex: 1 }}>
                {event.venue_name}
              </Text>
            </View>
            <Text variant="price" style={{ marginTop: 8 }}>
              {lowestPrice === 0 ? 'Free' : `From ${formatPrice(lowestPrice)}`}
            </Text>
          </View>
          
          {/* Chevron */}
          <View style={styles.chevron}>
            <Ionicons name="chevron-forward-outline" size={20} color={colors.textMuted} />
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  gradientBorder: {
    borderRadius: 16,
    padding: 2,
    marginBottom: 12,
  },
  cardInner: {
    flexDirection: 'row',
    backgroundColor: colors.bg,
    borderRadius: 14,
    overflow: 'hidden',
  },
  image: {
    width: 100,
    height: 100,
    backgroundColor: colors.surface2,
  },
  content: {
    flex: 1,
    padding: 12,
  },
  venueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  chevron: {
    justifyContent: 'center',
    paddingRight: 12,
  },
});

export default SearchResultCard;
