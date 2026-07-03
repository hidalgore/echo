/**
 * EclipseHero — cinematic "portal" motif for the Welcome beat (onboarding
 * reference, screen 1). A dark core with a bright gradient rim and slow orbital
 * rings. Decorative only: hidden from the a11y tree, and Reduce Motion swaps the
 * rotation/breathing for a static composition.
 */
import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, RadialGradient, Stop, LinearGradient as SvgLinearGradient } from 'react-native-svg';
import { useDynamicTheme } from '../../theme/dynamicTheme';
import { useReduceMotion } from './ReduceMotionFallback';

export function EclipseHero({ size = 200 }: { size?: number }) {
  const { colors: c } = useDynamicTheme();
  const reduceMotion = useReduceMotion();
  const spin = useRef(new Animated.Value(0)).current;
  const breathe = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (reduceMotion) return;
    const loopSpin = Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 26000, easing: Easing.linear, useNativeDriver: true })
    );
    const loopBreathe = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, { toValue: 1.04, duration: 2600, useNativeDriver: true }),
        Animated.timing(breathe, { toValue: 1, duration: 2600, useNativeDriver: true }),
      ])
    );
    loopSpin.start();
    loopBreathe.start();
    return () => { loopSpin.stop(); loopBreathe.stop(); };
  }, [reduceMotion]);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const cx = size / 2;

  return (
    <View
      style={[styles.wrap, { width: size, height: size }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Animated.View style={[StyleSheet.absoluteFill, !reduceMotion ? { transform: [{ rotate }] } : null]}>
        <Svg width={size} height={size}>
          <Ellipse cx={cx} cy={cx} rx={size * 0.46} ry={size * 0.20} stroke={c.hairlineStrong} strokeWidth={1} fill="none" opacity={0.5} />
          <Ellipse cx={cx} cy={cx} rx={size * 0.34} ry={size * 0.46} stroke={c.hairline} strokeWidth={1} fill="none" opacity={0.4} />
        </Svg>
      </Animated.View>

      <Animated.View style={!reduceMotion ? { transform: [{ scale: breathe }] } : undefined}>
        <Svg width={size} height={size}>
          <Defs>
            <RadialGradient id="core" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={c.bg} stopOpacity={1} />
              <Stop offset="78%" stopColor={c.bg} stopOpacity={1} />
              <Stop offset="100%" stopColor={c.bgElevated} stopOpacity={1} />
            </RadialGradient>
            <SvgLinearGradient id="rim" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={c.echoOrange ?? c.accent} />
              <Stop offset="50%" stopColor={c.accent} />
              <Stop offset="100%" stopColor={c.echoGold ?? c.accent} />
            </SvgLinearGradient>
          </Defs>
          <Circle cx={cx} cy={cx} r={size * 0.30} stroke="url(#rim)" strokeWidth={3} fill="url(#core)" />
          <Circle cx={cx} cy={cx} r={size * 0.30} stroke={c.accent} strokeWidth={1} fill="none" opacity={0.35} />
        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
});
