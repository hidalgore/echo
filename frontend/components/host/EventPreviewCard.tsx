/**
 * EventPreviewCard
 * Attendee-facing event preview. Updates live as fields change.
 * Shows flyer/cover, title, venue, date/time, price, capacity, age badge.
 */

import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { colors, spacing, radius, typography, shadows } from '../../theme/hostTokens';
import type { EventDraft } from '../../types/hostEvents';
import { EVENT_DETAIL_VIDEO_MAX_SECONDS } from '../../constants/eventMedia';

type Props = {
  draft: EventDraft;
};

export const EventPreviewCard: React.FC<Props> = ({ draft }) => {
  const ageColor =
    draft.ageRequirement === '21+' ? colors.accentMagenta
      : draft.ageRequirement === '18+' ? colors.accentAmber
      : colors.textTertiary;

  const visibilityLabel =
    draft.visibility === 'public' ? 'Public Event'
      : draft.visibility === 'private' ? 'Private Event'
      : 'Invite Only';


  return (
    <View style={styles.card}>
      <View style={styles.flyerArea}>
        {draft.flyerImage ? (
          <Image source={{ uri: draft.flyerImage }} style={styles.flyerMedia} resizeMode="cover" />
        ) : (
          <View style={styles.flyerEmpty}>
            <Text style={styles.flyerEmptyText}>No flyer uploaded</Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        {/* Title */}
        <Text style={styles.title} numberOfLines={2}>
          {draft.title || 'Untitled Event'}
        </Text>

        {/* Venue */}
        <Text style={styles.venue}>
          {draft.venue || 'Venue not set'}
        </Text>

        {/* Date + time */}
        <Text style={styles.datetime}>
          {draft.date || 'Date not set'}
          {draft.startTime ? ` \u00B7 ${draft.startTime}` : ''}
        </Text>

        {/* Price + capacity row */}
        <View style={styles.metaRow}>
          {draft.price > 0 && (
            <Text style={styles.price}>${draft.price}</Text>
          )}
          {draft.capacity > 0 && (
            <Text style={styles.capacity}>
              {draft.price > 0 ? ' \u00B7 ' : ''}
              {draft.capacity} tickets
            </Text>
          )}
        </View>

        {/* Bottom row: age + visibility */}
        <View style={styles.bottomRow}>
          {draft.ageRequirement !== 'All Ages' && (
            <View style={[styles.ageBadge, { borderColor: ageColor + '40' }]}>
              <Text style={[styles.ageText, { color: ageColor }]}>
                {draft.ageRequirement} Event
              </Text>
            </View>
          )}
          <View style={styles.visibilityBadge}>
            <Text style={styles.visibilityText}>{visibilityLabel}</Text>
          </View>
        </View>
      </View>

      {/* Support note */}
      <View style={styles.noteRow}>
        <Text style={styles.noteText}>Home uses the still flyer. Event Details uses {draft.eventDetailMediaType === 'video' ? `your uploaded video (${EVENT_DETAIL_VIDEO_MAX_SECONDS}s max)` : 'the selected photo'}.</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.base,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    ...shadows.card,
  },
  flyerArea: {
    height: 180,
    backgroundColor: colors.surfaceElevated,
  },
  flyerImagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  flyerMedia: { width: '100%', height: '100%' },
  flyerPlaceholderText: {
    ...typography.bodySm,
    color: colors.textTertiary,
  },
  flyerEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flyerEmptyText: {
    ...typography.bodySm,
    color: colors.textDisabled,
  },
  content: {
    padding: spacing.base,
  },
  title: {
    ...typography.displayMd,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  venue: {
    ...typography.bodyMd,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  datetime: {
    ...typography.bodySm,
    color: colors.textTertiary,
    marginBottom: spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  price: {
    ...typography.metricSm,
    color: colors.textPrimary,
  },
  capacity: {
    ...typography.bodySm,
    color: colors.textTertiary,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  ageBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  ageText: {
    ...typography.labelSm,
  },
  visibilityBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.pill,
    backgroundColor: colors.badgeBg,
  },
  visibilityText: {
    ...typography.labelSm,
    color: colors.textTertiary,
  },
  noteRow: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    alignItems: 'center',
  },
  noteText: {
    ...typography.bodySm,
    color: colors.textTertiary,
    fontStyle: 'italic',
  },
});
