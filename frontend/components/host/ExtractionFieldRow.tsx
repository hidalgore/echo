/**
 * ExtractionFieldRow
 * Shows parsed extraction fields with status: detected ✓ / uncertain ? / missing ✗
 * Not color-alone: always has text + icon.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, radius, typography } from '../../theme/hostTokens';
import type { ExtractionField } from '../../types/hostEvents';

type Props = {
  field: ExtractionField;
};

const STATUS_DISPLAY = {
  detected: { icon: '\u2713', color: colors.accentGreen, label: 'Detected' },
  uncertain: { icon: '?', color: colors.accentAmber, label: 'Uncertain' },
  missing: { icon: '\u2717', color: colors.accentRed, label: 'Not detected' },
};

export const ExtractionFieldRow: React.FC<Props> = ({ field }) => {
  const display = STATUS_DISPLAY[field.status];

  return (
    <View
      style={styles.row}
      accessibilityLabel={`${field.label}: ${field.value || 'not detected'}, status: ${display.label}`}
    >
      <View style={styles.left}>
        <Text style={styles.label}>{field.label}</Text>
        <Text style={[styles.value, !field.value && styles.valueMissing]}>
          {field.value || 'Not detected'}
        </Text>
      </View>

      <View style={[styles.statusBadge, { borderColor: display.color + '40' }]}>
        <Text style={[styles.statusIcon, { color: display.color }]}>{display.icon}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  left: {
    flex: 1,
    marginRight: spacing.base,
  },
  label: {
    ...typography.labelSm,
    color: colors.textTertiary,
    marginBottom: spacing.xxs,
  },
  value: {
    ...typography.bodyMd,
    color: colors.textPrimary,
  },
  valueMissing: {
    color: colors.textDisabled,
    fontStyle: 'italic',
  },
  statusBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusIcon: {
    fontSize: 14,
    fontWeight: '700',
  },
});
