import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useDynamicTheme } from '../../theme/dynamicTheme';

/**
 * ScreenBackButton — Canonical ECHO back button
 * ══════════════════════════════════════════════
 * Single source of truth for back navigation across all screens.
 *
 * Spec:
 *   • 40×40 circular (borderRadius 20)
 *   • Subtle white surface tint (rgba(255,255,255,0.04))
 *   • Chevron-back at 22pt
 *   • 44pt minimum touch target via hitSlop (Apple HIG)
 *   • Caller is responsible for placement inside a SafeAreaView or for applying
 *     paddingTop: insets.top + N on the parent header row.
 *
 * Usage:
 *   <ScreenBackButton onPress={...} />        // defaults to router.back()
 *   <ScreenBackButton color="white" />        // override icon color
 *   <ScreenBackButton variant="floating" />   // adds shadow + brighter bg for hero overlays
 */

interface ScreenBackButtonProps {
  /** Override default router.back() */
  onPress?: () => void;
  /** Override icon color (defaults to c.text from theme) */
  color?: string;
  /** "default" sits on screen bg, "floating" adds shadow + brighter bg for over-image use */
  variant?: 'default' | 'floating';
  /** Override container style if you need positioning (rare) */
  style?: ViewStyle;
  /** Accessibility label, defaults to "Go back" */
  accessibilityLabel?: string;
}

export function ScreenBackButton({
  onPress,
  color,
  variant = 'default',
  style,
  accessibilityLabel = 'Go back',
}: ScreenBackButtonProps) {
  const { colors: c } = useDynamicTheme();
  const iconColor = color || c.text;

  const containerStyle =
    variant === 'floating'
      ? [s.btn, s.floating, style]
      : [s.btn, { backgroundColor: 'rgba(255,255,255,0.04)' }, style];

  return (
    <TouchableOpacity
      style={containerStyle}
      onPress={onPress || (() => router.back())}
      hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      activeOpacity={0.7}
    >
      <Ionicons name="chevron-back" size={22} color={iconColor} />
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  btn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  floating: {
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
});

export default ScreenBackButton;
