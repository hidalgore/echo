/**
 * FilterPills
 * Horizontal scroll of status filter pills. Active pill is visually distinct (white fill, dark text).
 */

import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { colors, spacing, radius, typography, TAP_TARGET_MIN, SCREEN_HORIZONTAL_PADDING } from '../../theme/hostTokens';

type PillOption = {
  key: string;
  label: string;
};

type Props = {
  options: PillOption[];
  activeKey: string;
  onSelect: (key: string) => void;
};

export const FilterPills: React.FC<Props> = ({ options, activeKey, onSelect }) => {
  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {options.map((option) => {
          const isActive = option.key === activeKey;
          return (
            <TouchableOpacity
              key={option.key}
              style={[styles.pill, isActive && styles.pillActive]}
              onPress={() => onSelect(option.key)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`Filter by ${option.label}`}
              accessibilityState={{ selected: isActive }}
            >
              <Text style={[styles.pillText, isActive && styles.pillTextActive]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

export const STATUS_FILTER_OPTIONS: PillOption[] = [
  { key: 'all', label: 'All' },
  { key: 'live', label: 'Live' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'draft', label: 'Draft' },
  { key: 'past', label: 'Past' },
];

const styles = StyleSheet.create({
  wrapper: {
    marginTop: spacing.md,
  },
  scrollContent: {
    paddingHorizontal: SCREEN_HORIZONTAL_PADDING,
    gap: spacing.sm,
  },
  pill: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.pillBg,
    minHeight: TAP_TARGET_MIN - 8,
    justifyContent: 'center',
  },
  pillActive: {
    backgroundColor: colors.pillActiveBg,
  },
  pillText: {
    ...typography.bodySm,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  pillTextActive: {
    color: colors.pillActiveText,
  },
});
