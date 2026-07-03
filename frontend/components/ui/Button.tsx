import React, { ReactNode, useRef } from 'react';
import { TouchableOpacity, StyleSheet, ActivityIndicator, View, ViewStyle, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radii, motion, sizes } from '../../theme/tokens';
import { Text } from './Text';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export function Button({ title, onPress, variant = 'primary', loading, disabled, style, leftIcon, rightIcon }: ButtonProps) {
  const scaleAnim = useRef(new Animated.Value(motion.tapScale.up)).current;
  const isPrimary = variant === 'primary';
  
  const handlePressIn = () => {
    Animated.timing(scaleAnim, {
      toValue: motion.tapScale.down,
      duration: motion.duration.tap,
      useNativeDriver: true,
    }).start();
  };
  
  const handlePressOut = () => {
    Animated.timing(scaleAnim, {
      toValue: motion.tapScale.up,
      duration: motion.duration.tap,
      useNativeDriver: true,
    }).start();
  };

  const content = loading ? (
    <ActivityIndicator color={isPrimary ? '#FFFFFF' : colors.accent} size="small" />
  ) : (
    <View style={styles.contentRow}>
      {leftIcon ? <View style={styles.iconSlot}>{leftIcon}</View> : null}
      <Text variant="actionText" style={{ color: isPrimary ? '#FFFFFF' : colors.accent }}>
        {title}
      </Text>
      {rightIcon ? <View style={styles.iconSlot}>{rightIcon}</View> : null}
    </View>
  );

  return (
    <Animated.View style={[styles.shadowWrap, isPrimary && styles.primaryShadow, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        style={[styles.base, !isPrimary && styles[variant], (disabled || loading) && styles.disabled, style]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={1}
      >
        {isPrimary ? (
          <LinearGradient
            colors={['#20C7FF', '#7B4DFF', '#E63DAD', '#FFB45C']}
            start={{ x: 0, y: 1 }}
            end={{ x: 1, y: 0 }}
            style={styles.primaryFill}
          >
            <View style={styles.primaryGlass}>{content}</View>
          </LinearGradient>
        ) : content}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  shadowWrap: {
    borderRadius: radii.md,
  },
  primaryShadow: {
    shadowColor: '#7B4DFF',
    shadowOpacity: 0.24,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  base: { 
    borderRadius: radii.md,
    alignItems: 'center', 
    minHeight: sizes.minTouchTarget,
    overflow: 'hidden',
  },
  primary: {},
  primaryFill: {
    width: '100%',
    minHeight: sizes.minTouchTarget,
    padding: 1.1,
    borderRadius: radii.md,
  },
  primaryGlass: {
    flex: 1,
    minHeight: sizes.minTouchTarget - 2,
    paddingVertical: 15,
    paddingHorizontal: 24,
    borderRadius: radii.md - 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  secondary: { paddingVertical: 16, paddingHorizontal: 24, backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)' },
  outline: { paddingVertical: 16, paddingHorizontal: 24, backgroundColor: 'rgba(255,255,255,0.025)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)' },
  ghost: { paddingVertical: 16, paddingHorizontal: 24, backgroundColor: 'transparent' },
  disabled: { opacity: 0.5 },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  iconSlot: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
