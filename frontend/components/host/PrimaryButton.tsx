/**
 * PrimaryButton
 * Premium CTA with subtle gradient accent. Supports loading + disabled states.
 * Min tap target: 44px. Calm press animation.
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  AccessibilityProps,
} from 'react-native';
import { colors, spacing, radius, typography, TAP_TARGET_MIN } from '../../theme/hostTokens';

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
} & AccessibilityProps;

export const PrimaryButton: React.FC<Props> = ({
  label,
  onPress,
  disabled = false,
  loading = false,
  style,
  ...a11yProps
}) => {
  const isInactive = disabled || loading;

  return (
    <TouchableOpacity
      style={[styles.button, isInactive && styles.disabled, style]}
      onPress={onPress}
      disabled={isInactive}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={a11yProps.accessibilityLabel || label}
      accessibilityState={{ disabled: isInactive, busy: loading }}
    >
      {loading ? (
        <ActivityIndicator color={colors.bg} size="small" />
      ) : (
        <Text style={[styles.label, isInactive && styles.labelDisabled]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.textPrimary,
    borderRadius: radius.md,
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.xl,
    minHeight: TAP_TARGET_MIN,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    backgroundColor: colors.surfaceHover,
    opacity: 0.5,
  },
  label: {
    ...typography.bodyLg,
    fontWeight: '600',
    color: colors.bg,
  },
  labelDisabled: {
    color: colors.textDisabled,
  },
});
