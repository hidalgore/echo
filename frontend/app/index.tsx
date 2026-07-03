import { useEffect, useRef } from 'react';
import { View, StyleSheet, Image, Animated, Dimensions, Platform } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../stores/authStore';
import { EchoPublicWebsite } from '../components/web/EchoPublicWebsite';

const { width: W } = Dimensions.get('window');

export default function SplashScreen() {
  // ── Web ──────────────────────────────────────────────────────────────
  // The web root (/) renders the canonical public ECHO website homepage.
  // Native (iOS / Android) keeps the existing splash → auth flow below.
  // Locked behavior (v58/v59): see docs/ECHO_WEB_ROOT_LOAD_FIX_V58.md and
  // docs/ECHO_WEBSITE_V59_FULL_WEB_BUILD_LOCK.md.
  if (Platform.OS === 'web') {
    return <EchoPublicWebsite />;
  }

  const { isAuthenticated, isLoading } = useAuthStore();
  const logoFade = useRef(new Animated.Value(0)).current;
  const screenFade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(logoFade, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => {
        Animated.timing(screenFade, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
          if (isAuthenticated) {
            router.replace('/(tabs)');
          } else {
            const authState2 = useAuthStore.getState();
            // First run -> state-aware onboarding group; returning users -> sign-in.
            router.replace(authState2.hasSeenIntro ? '/(auth)/sign-in' : '/onboarding');
          }
        });
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, isLoading]);

  return (
    <Animated.View style={[s.root, { opacity: screenFade }]}>
      <Animated.Image
        source={require('../assets/images/echo_wordmark.png')}
        style={[s.wordmark, { opacity: logoFade }]}
        resizeMode="contain"
      />
    </Animated.View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000000', alignItems: 'center', justifyContent: 'center' },
  wordmark: { width: W * 0.72, height: W * 0.72 / 3.45 },
});
