/**
 * HostEventCard
 * Standard event card for upcoming events.
 * Shows ticket progress, projected attendance, health label, edit + more actions.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, radius, typography, shadows, SCREEN_HORIZONTAL_PADDING } from '../../theme/hostTokens';
import { StatusBadge } from './StatusBadge';
import type { HostEvent, MoreMenuAction } from '../../types/hostEvents';

type Props = {
  event: HostEvent;
  onEdit: () => void;
  onView: () => void;
  onMore: (action: MoreMenuAction) => void;
};

export const HostEventCard: React.FC<Props> = React.memo(
  ({ event, onEdit, onView, onMore }) => {
    const progress = event.capacity > 0
      ? Math.min((event.ticketsSold / event.capacity) * 100, 100)
      : 0;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={onView}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={`${event.title} at ${event.venue}, ${event.date}`}
      >
        {/* Flyer thumbnail placeholder */}
        <View style={styles.flyerPlaceholder}>
          <Text style={styles.flyerText}>{event.title.charAt(0)}</Text>
        </View>

        <View style={styles.content}>
          {/* Top row: title + more */}
          <View style={styles.topRow}>
            <Text style={styles.title} numberOfLines={1}>{event.title}</Text>
            <TouchableOpacity
              onPress={() => onMore('edit')}
              style={styles.moreBtn}
              accessibilityLabel="More options"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.moreIcon}>{'\u22EF'}</Text>
            </TouchableOpacity>
          </View>

          {/* Venue + datetime */}
          <Text style={styles.meta}>
            {event.venue} {'\u00B7'} {event.date} {'\u00B7'} {event.time}
          </Text>

          {/* Ticket progress */}
          <View style={styles.progressRow}>
            <Text style={styles.progressText}>
              {event.ticketsSold} / {event.capacity}
            </Text>
            {event.projectedGuests && (
              <Text style={styles.projectedText}>
                Projected {event.projectedGuests} guests
              </Text>
            )}
          </View>

          {/* Progress bar */}
          <View style={styles.barBg}>
            <View style={[styles.barFill, { width: `${progress}%` }]} />
          </View>

          {/* Bottom row: health label + edit */}
          <View style={styles.bottomRow}>
            {event.healthLabel && event.healthLabel !== 'Draft' && (
              <StatusBadge variant="health" healthLabel={event.healthLabel} />
            )}
            <TouchableOpacity
              onPress={onEdit}
              style={styles.editBtn}
              accessibilityLabel="Edit event"
            >
              <Text style={styles.editText}>Edit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  }
);

const styles = StyleSheet.create({
  card: {
    marginHorizontal: SCREEN_HORIZONTAL_PADDING,
    borderRadius: radius.base,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    overflow: 'hidden',
    ...shadows.card,
  },
  flyerPlaceholder: {
    width: 72,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flyerText: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textTertiary,
  },
  content: {
    flex: 1,
    padding: spacing.base,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xxs,
  },
  title: {
    ...typography.bodyLg,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.sm,
  },
  moreBtn: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreIcon: {
    fontSize: 18,
    color: colors.textTertiary,
  },
  meta: {
    ...typography.bodySm,
    color: colors.textTertiary,
    marginBottom: spacing.md,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  progressText: {
    ...typography.metricSm,
    color: colors.textSecondary,
  },
  projectedText: {
    ...typography.bodySm,
    color: colors.textTertiary,
  },
  barBg: {
    height: 3,
    backgroundColor: colors.border,
    borderRadius: 1.5,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  barFill: {
    height: 3,
    backgroundColor: colors.accentBlue,
    borderRadius: 1.5,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  editBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    minHeight: 36,
    justifyContent: 'center',
  },
  editText: {
    ...typography.bodySm,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
