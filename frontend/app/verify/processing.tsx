/**
 * Verifying Processing Screen (Image 2 left)
 * Animated shield with pulsing ring. "Verifying your identity..."
 * Auto-routes to /verify/result after mock 3s delay.
 * Trust badges: Encrypted · Private · One-time
 */
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, StatusBar, Animated, Dimensions } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/tokens';
import { Text } from '../../components/ui';
import { useVerificationStore } from '../../stores/verificationStore';
import { logEvent } from '../../services/logging';

const { width: W } = Dimensions.get('window');
const SHIELD_SIZE = W * 0.42;

export default function ProcessingScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ eventId?: string; returnTo?: string; qty?: string; quantity?: string; ticketTypeId?: string; selections?: string; eventTitle?: string; ageRequirement?: string }>();
  const { eventId } = params;
  const { setVerified, setFailed, canRetry, method } = useVerificationStore();

  const ringPulse = useRef(new Animated.Value(0.85)).current;
  const ringOpacity = useRef(new Animated.Value(0.4)).current;
  const shieldScale = useRef(new Animated.Value(0.9)).current;
  const shieldOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    logEvent('verification.processing', 'started', { eventId, method });

    // Shield fade in
    Animated.timing(shieldOpacity, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    Animated.spring(shieldScale, { toValue: 1, tension: 40, friction: 8, useNativeDriver: true }).start();

    // Ring pulse loop
    Animated.loop(Animated.sequence([
      Animated.parallel([
        Animated.timing(ringPulse, { toValue: 1.15, duration: 1200, useNativeDriver: true }),
        Animated.timing(ringOpacity, { toValue: 0.1, duration: 1200, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(ringPulse, { toValue: 0.85, duration: 1200, useNativeDriver: true }),
        Animated.timing(ringOpacity, { toValue: 0.4, duration: 1200, useNativeDriver: true }),
      ]),
    ])).start();

    // Mock verification — 3s then route to result
    // Digital wallet is faster (~1.5s), Gov ID is ~3s
    const delay = method === 'digital_wallet' ? 1500 : 3000;
    const timer = setTimeout(() => {
      // Mock: 85% success rate
      const success = Math.random() > 0.15;
      logEvent('verification.processing', 'completed', { eventId, method, success });
      if (success) {
        setVerified('21_plus');
      } else {
        setFailed();
      }
      router.replace({ pathname: '/verify/result', params });
    }, delay);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      <View style={s.header}>
        <Text style={s.headerTitle}>ECHO</Text>
      </View>

      <View style={s.center}>
        {/* Pulsing rings */}
        <Animated.View style={[s.ring, s.ringOuter, { opacity: ringOpacity, transform: [{ scale: ringPulse }] }]} />
        <Animated.View style={[s.ring, s.ringMid, { opacity: ringOpacity, transform: [{ scale: Animated.multiply(ringPulse, 0.9) }] }]} />

        {/* Shield icon */}
        <Animated.View style={[s.shieldWrap, { opacity: shieldOpacity, transform: [{ scale: shieldScale }] }]}>
          <Ionicons name="shield-outline" size={56} color="rgba(139,92,246,0.80)" />
        </Animated.View>
      </View>

      <Text style={s.title}>Verifying your identity...</Text>
      <Text style={s.subtitle}>This usually takes a few seconds</Text>

      <View style={s.footer}>
        <Text style={s.trustText}>Encrypted {'\u00B7'} Private {'\u00B7'} One-time</Text>
        <Text style={s.footerNote}>No data sold or stored beyond verification</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { alignItems: 'center', paddingVertical: 16 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.text, letterSpacing: 2 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: -60 },
  ring: { position: 'absolute', borderRadius: 999, borderWidth: 1.5, borderColor: 'rgba(139,92,246,0.30)' },
  ringOuter: { width: SHIELD_SIZE * 1.6, height: SHIELD_SIZE * 1.6 },
  ringMid: { width: SHIELD_SIZE * 1.3, height: SHIELD_SIZE * 1.3 },
  shieldWrap: {
    width: SHIELD_SIZE, height: SHIELD_SIZE, borderRadius: SHIELD_SIZE / 2,
    backgroundColor: 'rgba(139,92,246,0.08)', borderWidth: 1.5, borderColor: 'rgba(139,92,246,0.20)',
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 22, fontWeight: '700', color: colors.text, textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 15, color: 'rgba(255,255,255,0.50)', textAlign: 'center' },
  footer: { alignItems: 'center', paddingBottom: 60 },
  trustText: { fontSize: 14, fontWeight: '500', color: 'rgba(255,255,255,0.55)', marginBottom: 4 },
  footerNote: { fontSize: 12, color: 'rgba(255,255,255,0.30)' },
});
