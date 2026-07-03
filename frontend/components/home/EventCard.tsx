import React from 'react';
import { TouchableOpacity, StyleSheet, Image, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing } from '../../theme/tokens';
import { useDynamicTheme } from '../../theme/dynamicTheme';
import { Text, Card } from '../ui';
import { Event } from '../../types';
import { formatDate, formatPrice } from '../../utils/format';
import { getAgeLabel, getStartingPrice, isHappeningNow } from '../../utils/event';
import { useEventStore } from '../../stores/eventStore';
import { useTicketStore } from '../../stores/ticketStore';

interface EventCardProps {
  event: Event;
  size?: 'small' | 'large';
}

export function EventCard({ event, size = 'large' }: EventCardProps) {
  const { isSaved, toggleSaved, canSaveEvent } = useEventStore();
  const { hasPurchasedEvent } = useTicketStore();
  const price = getStartingPrice(event);
  const ageLabel = getAgeLabel(event.age_restriction);
  const purchased = hasPurchasedEvent(event.id);
  const saved = isSaved(event.id);
  const saveEnabled = canSaveEvent(event.id);
  const staticPosterUri = event.image_url || `https://picsum.photos/seed/${event.id}/400/240`;

  return (
    <TouchableOpacity onPress={() => router.push(`/event/${event.id}`)} activeOpacity={0.86}>
      <Card style={[styles.card, size === 'small' && styles.cardSmall]}>
        <Image source={{ uri: staticPosterUri }} style={[styles.image, size === 'small' && styles.imageSmall]} />

        <View style={styles.topBadges}>
          {isHappeningNow(event) && (
            <View style={[styles.badge, styles.liveBadge]}>
              <Text variant="caption" style={styles.liveText}>Happening now</Text>
            </View>
          )}
          {!!ageLabel && (
            <View style={[styles.badge, styles.ageBadge]}>
              <Text variant="caption" style={styles.ageText}>{ageLabel}</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, !saveEnabled && !saved && styles.saveBtnDisabled]}
          onPress={() => toggleSaved(event.id)}
          disabled={!saveEnabled && !saved}
        >
          <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={18} color={saved ? colors.accent : colors.text} />
        </TouchableOpacity>

        <View style={styles.content}>
          <Text variant="caption" color="accent">{formatDate(event.start_time)}</Text>
          <Text variant="eventTitle" numberOfLines={1} style={styles.title}>{event.title}</Text>
          <Text variant="meta" color="textMuted" numberOfLines={1}>{event.venue_name}</Text>
          <View style={styles.bottomRow}>
            <Text variant="label" style={styles.price}>{price === 0 ? 'Free' : formatPrice(price)}</Text>
            {purchased && <Text variant="caption" color="success">In Wallet</Text>}
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 16, marginBottom: 16, overflow: 'hidden', backgroundColor: colors.bgCard },
  cardSmall: { width: 220, marginHorizontal: 0, marginRight: 12 },
  image: { width: '100%', height: 176, backgroundColor: colors.surface2 },
  imageSmall: { height: 128 },
  content: { padding: 16 },
  title: { color: colors.text, marginTop: 4, marginBottom: 2 },
  price: { color: colors.text },
  bottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  topBadges: { position: 'absolute', top: 12, left: 12, flexDirection: 'row', gap: 8, zIndex: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: radii.pill, backgroundColor: colors.bgElevated },
  liveBadge: { backgroundColor: colors.echoBlueSoft },
  ageBadge: { backgroundColor: colors.warningSoft },
  liveText: { color: colors.echoBlue, fontWeight: '700' },
  ageText: { color: colors.warning, fontWeight: '700' },
  saveBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15,17,21,0.72)',
    zIndex: 2,
  },
  saveBtnDisabled: { opacity: 0.55 },
});
