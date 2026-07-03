/**
 * Onboarding entry — Splash / Brand Reveal (spec §9.1).
 * Resolves launch source, hydrates onboarding state, then routes to the
 * correct flow. Never traps the user on splash.
 */
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Text } from '../../components/ui';
import { useDynamicTheme } from '../../theme/dynamicTheme';
import { LaunchSourceResolver } from '../../components/onboarding/LaunchSourceResolver';
import { useReduceMotion } from '../../components/onboarding/ReduceMotionFallback';
import { useOnboardingStore } from '../../stores/onboardingStore';
import { resolveInitialOnboardingRoute } from '../../services/onboarding/onboardingRoutes';
import { ONBOARDING_COPY } from '../../services/onboarding/onboardingCopy';

export default function OnboardingSplash() {
  const { colors: c } = useDynamicTheme();
  const reduceMotion = useReduceMotion();
  const initialize = useOnboardingStore((s) => s.initialize);
  const fade = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;

  useEffect(() => {
    if (!reduceMotion) {
      Animated.timing(fade, { toValue: 1, duration: 420, useNativeDriver: true }).start();
    }
    let active = true;
    (async () => {
      try {
        await initialize();
        if (!active) return;
        const target = resolveInitialOnboardingRoute(useOnboardingStore.getState().state);
        setTimeout(() => {
          if (active) router.replace(target as any);
        }, reduceMotion ? 200 : 900);
      } catch {
        // Never trap the user on the splash if hydration fails.
        if (active) router.replace('/onboarding/welcome' as any);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      <LaunchSourceResolver />
      <Animated.View style={{ opacity: fade, alignItems: 'center' }}>
        <Text variant="display" style={styles.wordmark}>{ONBOARDING_COPY.splash.wordmark}</Text>
        <Text variant="body" color="textMedium" style={styles.tagline}>{ONBOARDING_COPY.splash.tagline}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  wordmark: { letterSpacing: 4 },
  tagline: { marginTop: 10 },
});
