/**
 * StatusBadge
 * Compact status indicator. Color + label. Never relies on color alone (has text).
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, radius, typography } from '../../theme/hostTokens';
import type { HostEventStatus, HealthLabel } from '../../types/hostEvents';

const STATUS_CONFIG: Record<HostEventStatus, { color: string; label: string }> = {
  // Legacy v59.3 states (kept for backward-compat during migration window)
  live: { color: colors.statusLive, label: 'LIVE' },
  upcoming: { color: colors.statusUpcoming, label: 'UPCOMING' },
  draft: { color: colors.statusDraft, label: 'DRAFT' },
  past: { color: colors.statusPast, label: 'PAST' },
  closed: { color: colors.statusClosed, label: 'CLOSED' },
  // V3 canonical states (R3) — mapped to nearest existing color token
  scheduled: { color: colors.statusUpcoming, label: 'SCHEDULED' },
  published: { color: colors.statusLive, label: 'LIVE' },
  paused: { color: colors.statusDraft, label: 'PAUSED' },
  ended: { color: colors.statusPast, label: 'ENDED' },
  cancelled: { color: colors.statusClosed, label: 'CANCELLED' },
};

const HEALTH_CONFIG: Record<HealthLabel, string> = {
  'Selling Well': colors.healthSellingWell,
  'Slow Sales': colors.healthSlowSales,
  'Near Capacity': colors.healthNearCapacity,
  Draft: colors.healthDraft,
  Completed: colors.healthCompleted,
};

type Props =
  | { variant: 'status'; status: HostEventStatus }
  | { variant: 'health'; healthLabel: HealthLabel };

export const StatusBadge: React.FC<Props> = (props) => {
  const isStatus = props.variant === 'status';
  const config = isStatus ? STATUS_CONFIG[props.status] : null;
  const healthColor = !isStatus ? HEALTH_CONFIG[props.healthLabel] : null;
  const label = isStatus ? config!.label : props.healthLabel;
  const dotColor = isStatus ? config!.color : healthColor!;

  return (
    <View
      style={[styles.container, { borderColor: dotColor + '30' }]}
      accessibilityRole="text"
      accessibilityLabel={`Status: ${label}`}
    >
      <View style={[styles.dot, { backgroundColor: dotColor }]} />
      <Text style={[styles.label, { color: dotColor }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: spacing.xs,
  },
  label: {
    ...typography.labelSm,
    textTransform: 'uppercase',
  },
});
