/**
 * SectionLabel
 * Uppercase section divider label for grouped event lists.
 */

import React from 'react';
import { Text, StyleSheet, View } from 'react-native';
import { colors, spacing, typography, SCREEN_HORIZONTAL_PADDING } from '../../theme/hostTokens';

type SectionLabelProps = { label: string };

export const SectionLabel: React.FC<SectionLabelProps> = ({ label }) => (
  <View style={styles.sectionContainer}>
    <Text style={styles.sectionText} accessibilityRole="header">
      {label}
    </Text>
  </View>
);

/**
 * MetricPill
 * Compact inline metric badge (e.g., "72 / 150", "$9,820").
 */
type MetricPillProps = {
  label: string;
  color?: string;
};

export const MetricPill: React.FC<MetricPillProps> = ({
  label,
  color = colors.textSecondary,
}) => (
  <View style={styles.metricContainer}>
    <Text style={[styles.metricText, { color }]}>{label}</Text>
  </View>
);

/**
 * FloatingCreateButton
 * Bottom-right FAB for event creation. Always visible above content.
 */
import { TouchableOpacity } from 'react-native';
import { radius, shadows, TAP_TARGET_MIN } from '../../theme/hostTokens';

type FloatingCreateButtonProps = {
  onPress: () => void;
};

export const FloatingCreateButton: React.FC<FloatingCreateButtonProps> = ({ onPress }) => (
  <TouchableOpacity
    style={styles.fab}
    onPress={onPress}
    activeOpacity={0.85}
    accessibilityRole="button"
    accessibilityLabel="Create new event"
  >
    <Text style={styles.fabIcon}>+</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  // SectionLabel
  sectionContainer: {
    paddingHorizontal: SCREEN_HORIZONTAL_PADDING,
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
  },
  sectionText: {
    ...typography.label,
    color: colors.textTertiary,
    letterSpacing: 1.2,
  },
  // MetricPill
  metricContainer: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.pill,
    backgroundColor: colors.badgeBg,
    alignSelf: 'flex-start',
  },
  metricText: {
    ...typography.labelSm,
  },
  // FloatingCreateButton
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.textPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.elevated,
    zIndex: 100,
  },
  fabIcon: {
    fontSize: 28,
    fontWeight: '300',
    color: colors.bg,
    marginTop: -2,
  },
});
