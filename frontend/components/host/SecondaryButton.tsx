/**
 * SecondaryButton
 * Ghost/outline button for secondary actions. Matches ECHO premium dark UI.
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  ActivityIndicator,
} from 'react-native';
import { colors, spacing, radius, typography, TAP_TARGET_MIN } from '../../theme/hostTokens';

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'outline' | 'ghost';
  style?: ViewStyle;
};

export const SecondaryButton: React.FC<Props> = ({
  label,
  onPress,
  disabled = false,
  loading = false,
  variant = 'outline',
  style,
}) => {
  const isInactive = disabled || loading;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        variant === 'outline' && styles.outline,
        isInactive && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={isInactive}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isInactive }}
    >
      {loading ? (
        <ActivityIndicator color={colors.textSecondary} size="small" />
      ) : (
        <Text style={[styles.label, isInactive && styles.labelDisabled]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    minHeight: TAP_TARGET_MIN,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outline: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  disabled: {
    opacity: 0.4,
  },
  label: {
    ...typography.bodyMd,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  labelDisabled: {
    color: colors.textDisabled,
  },
});
