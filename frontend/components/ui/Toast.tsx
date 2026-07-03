/**
 * ECHO Toast — Reusable notification toast
 * Slides down from top, auto-dismisses after duration.
 * Variants: success, error, info.
 */
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from './Text';

const { width: W } = Dimensions.get('window');

type Variant = 'success' | 'error' | 'info';

type Props = {
  message: string;
  visible: boolean;
  variant?: Variant;
  duration?: number;
  onDismiss: () => void;
};

const VARIANT_CONFIG: Record<Variant, { icon: string; color: string; bg: string; border: string }> = {
  success: { icon: 'checkmark-circle', color: '#10B981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.25)' },
  error: { icon: 'alert-circle', color: '#EF4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.25)' },
  info: { icon: 'information-circle', color: '#3B82F6', bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.25)' },
};

export function Toast({ message, visible, variant = 'success', duration = 2500, onDismiss }: Props) {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, tension: 80, friction: 12, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();

      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(translateY, { toValue: -100, duration: 250, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        ]).start(() => onDismiss());
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!visible) return null;

  const config = VARIANT_CONFIG[variant];

  return (
    <Animated.View style={[s.container, { top: insets.top + 8, opacity, transform: [{ translateY }] }]}>
      <View style={[s.toast, { backgroundColor: config.bg, borderColor: config.border }]}>
        <Ionicons name={config.icon as never} size={20} color={config.color} />
        <Text style={[s.message, { color: config.color }]}>{message}</Text>
      </View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 20,
    right: 20,
    zIndex: 9999,
    alignItems: 'center',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 16,
    borderWidth: 1,
    maxWidth: 400,
    width: '100%',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 12 },
      android: { elevation: 8 },
    }),
  },
  message: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
});
