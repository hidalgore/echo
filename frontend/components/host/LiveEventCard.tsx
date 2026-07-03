/**
 * LiveEventCard
 * Visually dominant card for the active live event.
 * Shows checked-in / remaining, door breakdown, Door Mode CTA.
 * Highest visual prominence on HostEventsScreen.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, radius, typography, shadows, SCREEN_HORIZONTAL_PADDING } from '../../theme/hostTokens';
import { StatusBadge } from './StatusBadge';
import type { HostEvent, MoreMenuAction } from '../../types/hostEvents';

type Props = {
  event: HostEvent;
  onStartDoorMode: () => void;
  onEdit: () => void;
  onMore: (action: MoreMenuAction) => void;
};

export const LiveEventCard: React.FC<Props> = React.memo(
  ({ event, onStartDoorMode, onEdit, onMore }) => {
    const remaining = event.capacity - event.checkedIn;

    return (
      <View style={styles.card} accessibilityRole="button" accessibilityLabel={`Live event: ${event.title}`}>
        {/* Subtle live accent border */}
        <View style={styles.accentBorder} />

        <View style={styles.content}>
          {/* Header row */}
          <View style={styles.headerRow}>
            <StatusBadge variant="status" status="live" />
            <View style={styles.headerActions}>
              <TouchableOpacity
                onPress={onEdit}
                style={styles.actionBtn}
                accessibilityLabel="Edit event"
              >
                <Text style={styles.actionText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => onMore('view_guest_list')}
                style={styles.actionBtn}
                accessibilityLabel="More options"
              >
                <Text style={styles.moreIcon}>{'\u22EF'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Event info */}
          <Text style={styles.title}>{event.title}</Text>
          <Text style={styles.meta}>
            {event.venue} {'\u00B7'} {event.date} {'\u00B7'} {event.time}
          </Text>

          {/* Metrics row */}
          <View style={styles.metricsRow}>
            <View style={styles.metricBlock}>
              <Text style={styles.metricValue}>{event.checkedIn}</Text>
              <Text style={styles.metricLabel}>checked in</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricBlock}>
              <Text style={styles.metricValue}>{remaining}</Text>
              <Text style={styles.metricLabel}>remaining</Text>
            </View>
          </View>

          {/* Door breakdown */}
          {event.doorBreakdown && (
            <Text style={styles.doorBreakdown}>
              Main {event.doorBreakdown.main} {'\u00B7'} VIP {event.doorBreakdown.vip}{' '}
              {'\u00B7'} Back {event.doorBreakdown.back}
            </Text>
          )}

          {/* Capacity bar */}
          <View style={styles.capacityBarBg}>
            <View
              style={[
                styles.capacityBarFill,
                { width: `${Math.min((event.checkedIn / event.capacity) * 100, 100)}%` },
              ]}
            />
          </View>

          {/* Door Mode CTA */}
          <TouchableOpacity
            style={styles.doorModeBtn}
            onPress={onStartDoorMode}
            activeOpacity={0.8}
            accessibilityLabel="Start Door Mode"
          >
            <Text style={styles.doorModeBtnText}>Start Door Mode</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  card: {
    marginHorizontal: SCREEN_HORIZONTAL_PADDING,
    borderRadius: radius.base,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    ...shadows.card,
  },
  accentBorder: {
    height: 3,
    backgroundColor: colors.statusLive,
  },
  content: {
    padding: spacing.base,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  actionBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    ...typography.bodySm,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  moreIcon: {
    fontSize: 20,
    color: colors.textSecondary,
  },
  title: {
    ...typography.displayMd,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  meta: {
    ...typography.bodySm,
    color: colors.textTertiary,
    marginBottom: spacing.base,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  metricBlock: {
    alignItems: 'center',
    flex: 1,
  },
  metricValue: {
    ...typography.metric,
    color: colors.textPrimary,
  },
  metricLabel: {
    ...typography.labelSm,
    color: colors.textTertiary,
    marginTop: spacing.xxs,
  },
  metricDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.border,
  },
  doorBreakdown: {
    ...typography.bodySm,
    color: colors.textTertiary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  capacityBarBg: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    marginBottom: spacing.base,
    overflow: 'hidden',
  },
  capacityBarFill: {
    height: 4,
    backgroundColor: colors.statusLive,
    borderRadius: 2,
  },
  doorModeBtn: {
    backgroundColor: colors.statusLive,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  doorModeBtnText: {
    ...typography.bodyLg,
    fontWeight: '600',
    color: colors.bg,
  },
});
