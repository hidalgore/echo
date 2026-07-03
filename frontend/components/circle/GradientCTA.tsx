/**
 * GradientCTA — Shared Circle-flow action button
 * ════════════════════════════════════════════════
 * Cyan → Orange gradient, consistent across all ECHO Circle screens.
 * Usage: <GradientCTA label="Start ECHO Circle" onPress={fn} />
 */
import React from 'react';
import { useDynamicTheme } from '../../theme/dynamicTheme';
import { TouchableOpacity, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../ui';

type Props = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  icon?: string;
  /** Show chevron-forward on right (default true) */
  showArrow?: boolean;
  style?: ViewStyle;
};

export function GradientCTA({
  label, onPress, loading, disabled, icon, showArrow = true, style,
}: Props) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.88}
      style={[s.wrap, disabled && s.disabled, style]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <LinearGradient
        colors={['#20C7FF', '#7B4DFF', '#E8A030', '#F5A623']}
        locations={[0, 0.35, 0.75, 1]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={s.gradient}
      >
        {loading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <>
            {icon && <Ionicons name={icon as never} size={18} color="#FFF" style={{ marginRight: 6 }} />}
            <Text style={s.label}>{label}</Text>
            {showArrow && <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.85)" style={s.arrow} />}
          </>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  wrap: { borderRadius: 28, overflow: 'hidden' },
  disabled: { opacity: 0.4 },
  gradient: {
    height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 24, borderRadius: 28,
  },
  label: { color: '#FFF', fontSize: 18, fontWeight: '700', letterSpacing: 0.2 },
  arrow: { position: 'absolute', right: 24 },
});
