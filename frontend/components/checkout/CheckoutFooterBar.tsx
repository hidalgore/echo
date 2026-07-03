import React from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../ui';

type Props = {
  ctaLabel: string;
  helperText?: string;
  onPressCTA: () => void;
  loading?: boolean;
  disabled?: boolean;
};

export function CheckoutFooterBar({ ctaLabel, helperText, onPressCTA, loading, disabled }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[s.container, { paddingBottom: insets.bottom + 12 }]}>
      {/* Top fade */}
      <LinearGradient
        colors={['transparent', 'rgba(15,17,21,0.95)', '#0F1115']}
        style={s.fade}
        pointerEvents="none"
      />

      <TouchableOpacity
        style={[s.btn, disabled && s.btnDisabled]}
        onPress={onPressCTA}
        activeOpacity={0.85}
        disabled={loading || disabled}
      >
        <LinearGradient
          colors={['#3B82F6', '#2563EB']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={s.btnGradient}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text style={s.btnText}>{ctaLabel}</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>

      {helperText && (
        <Text style={s.helper}>{helperText}</Text>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: '#0F1115',
  },
  fade: {
    position: 'absolute',
    top: -40,
    left: 0,
    right: 0,
    height: 40,
  },
  btn: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  btnDisabled: { opacity: 0.5 },
  btnGradient: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  btnText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  helper: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.45)',
    textAlign: 'center',
    marginTop: 8,
  },
});
