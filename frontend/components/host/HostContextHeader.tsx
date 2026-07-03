/**
 * HostContextHeader
 * Lightweight top context: "My Events" + subtitle counts + back-to-ECHO escape.
 * No heavy nav bar. Integrated into the page flow.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, typography, TAP_TARGET_MIN, SCREEN_HORIZONTAL_PADDING } from '../../theme/hostTokens';

type Props = {
  upcomingCount: number;
  liveCount: number;
  onBackToECHO: () => void;
};

export const HostContextHeader: React.FC<Props> = ({
  upcomingCount,
  liveCount,
  onBackToECHO,
}) => {
  const parts: string[] = [];
  if (upcomingCount > 0) parts.push(`${upcomingCount} upcoming`);
  if (liveCount > 0) parts.push(`${liveCount} live`);
  const subtitle = parts.length > 0 ? parts.join(' \u00B7 ') : 'No active events';

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <TouchableOpacity
          onPress={onBackToECHO}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Switch back to ECHO attendee mode"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.backArrow}>{'\u2190'}</Text>
          <Text style={styles.backLabel}>ECHO</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.center}>
        <Text style={styles.title}>My Events</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      <View style={styles.right}>
        <View style={styles.verifiedBadge}>
          <Text style={styles.verifiedText}>Host Verified</Text>
          <Text style={styles.checkmark}>{'\u2713'}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: SCREEN_HORIZONTAL_PADDING,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  left: {
    flex: 1,
    alignItems: 'flex-start',
  },
  center: {
    flex: 2,
    alignItems: 'center',
  },
  right: {
    flex: 1,
    alignItems: 'flex-end',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: TAP_TARGET_MIN,
    paddingRight: spacing.sm,
  },
  backArrow: {
    fontSize: 20,
    color: colors.textSecondary,
    marginRight: spacing.xs,
  },
  backLabel: {
    ...typography.bodySm,
    color: colors.textSecondary,
  },
  title: {
    ...typography.displayLg,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.bodySm,
    color: colors.textTertiary,
    marginTop: spacing.xxs,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  verifiedText: {
    ...typography.labelSm,
    color: colors.textTertiary,
    marginRight: spacing.xs,
  },
  checkmark: {
    fontSize: 12,
    color: colors.accentGreen,
  },
});
