/**
 * OnboardingHeroMotion — cinematic hero block with a Reduce-Motion fallback.
 * Animation is decorative only; all meaning lives in the text beneath it
 * (spec §19 "no critical information only shown in animation").
 */
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDynamicTheme } from '../../theme/dynamicTheme';
import { useReduceMotion } from './ReduceMotionFallback';

interface Props {
  icon?: keyof typeof Ionicons.glyphMap;
  size?: number;
}

export function OnboardingHeroMotion({ icon = 'sparkles-outline', size = 96 }: Props) {
  const { colors: c } = useDynamicTheme();
  const reduceMotion = useReduceMotion();
  const breathe = useRef(new Animated.Value(1)).current;
  const fade = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;

  useEffect(() => {
    if (reduceMotion) {
      fade.setValue(1);
      return;
    }
    Animated.timing(fade, { toValue: 1, duration: 420, useNativeDriver: true }).start();
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, { toValue: 1.04, duration: 2000, useNativeDriver: true }),
        Animated.timing(breathe, { toValue: 1, duration: 2000, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [reduceMotion]);

  return (
    <View style={styles.wrap} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Animated.View
        style={[
          styles.orb,
          { width: size, height: size, borderRadius: size / 2, backgroundColor: c.accentSoft, borderColor: c.accent, opacity: fade },
          !reduceMotion ? { transform: [{ scale: breathe }] } : null,
        ]}
      >
        <Ionicons name={icon} size={size * 0.42} color={c.accent} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  orb: { alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
});
