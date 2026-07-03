/**
 * EchoPassDemoCard — interactive Demo ECHO Pass (spec §9.5).
 * Tap/hold runs a demo scan: idle -> scanning -> granted. Clearly labeled
 * "Demo ECHO Pass" so it can never be mistaken for a real ticket. Haptics route
 * through the dependency-free feedback service (no-op if no adapter wired).
 * Reduce Motion: skips the lift/pulse and shows a static step state instead.
 */
import { useRef, useState } from 'react';
import { Animated, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../ui';
import { useDynamicTheme } from '../../theme/dynamicTheme';
import { radii } from '../../theme/tokens';
import { playNfcFeedback } from '../../services/feedbackService';
import { EchoDiscDemo, type DiscPhase } from './EchoDiscDemo';
import { useReduceMotion } from './ReduceMotionFallback';
import { DEMO_PASS } from '../../services/onboarding/onboardingMockData';
import { ONBOARDING_COPY } from '../../services/onboarding/onboardingCopy';

interface Props {
  nfcSupported: boolean;
  onSuccess: () => void;
}

export function EchoPassDemoCard({ nfcSupported, onSuccess }: Props) {
  const { colors: c } = useDynamicTheme();
  const reduceMotion = useReduceMotion();
  const [phase, setPhase] = useState<DiscPhase>('idle');
  const lift = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;
  const copy = ONBOARDING_COPY.accessDemo;

  const runDemo = () => {
    if (phase !== 'idle') return;
    setPhase('scanning');
    playNfcFeedback('tap_detected');

    if (!reduceMotion) {
      Animated.timing(lift, { toValue: 1, duration: 260, useNativeDriver: true }).start();
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.06, duration: 600, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    }

    setTimeout(() => {
      pulse.stopAnimation();
      setPhase('granted');
      playNfcFeedback('granted');
      onSuccess();
    }, reduceMotion ? 350 : 1100);
  };

  const translateY = lift.interpolate({ inputRange: [0, 1], outputRange: [0, -10] });

  return (
    <View style={styles.wrap}>
      <Animated.View style={!reduceMotion ? { transform: [{ scale: pulse }] } : undefined}>
        <EchoDiscDemo phase={phase} />
      </Animated.View>

      <Animated.View
        style={[
          styles.pass,
          { backgroundColor: c.cardBg, borderColor: phase === 'granted' ? c.success : c.hairline },
          !reduceMotion ? { transform: [{ translateY }] } : null,
        ]}
      >
        <View style={styles.passHeader}>
          <View style={[styles.demoBadge, { backgroundColor: c.warningSoft }]}>
            <Text variant="caption" style={{ color: c.warning }}>{DEMO_PASS.label}</Text>
          </View>
          <Ionicons
            name={nfcSupported ? 'radio-outline' : 'qr-code-outline'}
            size={18}
            color={c.textLow}
          />
        </View>
        <Text variant="eventTitle" style={styles.holder}>{DEMO_PASS.holderName}</Text>
        <Text variant="caption" color="textMedium">{DEMO_PASS.accessId}</Text>

        {phase === 'granted' ? (
          <View style={styles.successRow}>
            <Ionicons name="checkmark-circle" size={18} color={c.success} />
            <Text variant="actionText" style={{ color: c.success }}>{copy.success}</Text>
          </View>
        ) : null}
      </Animated.View>

      <TouchableOpacity
        onPress={runDemo}
        disabled={phase !== 'idle'}
        accessibilityRole="button"
        accessibilityLabel={`${DEMO_PASS.label}. ${phase === 'granted' ? copy.success : copy.prompt}`}
        style={[styles.tapBtn, { borderColor: c.hairline }]}
        activeOpacity={0.85}
      >
        <Text variant="actionText" color={phase === 'idle' ? 'accent' : 'textMedium'}>
          {phase === 'granted' ? copy.final : phase === 'scanning' ? 'Scanning\u2026' : copy.prompt}
        </Text>
      </TouchableOpacity>

      {!nfcSupported ? (
        <Text variant="caption" color="textMedium" style={styles.qrNote}>{copy.qrFallback}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 18 },
  pass: { width: '100%', borderWidth: 1, borderRadius: radii.xl, padding: 18, gap: 6 },
  passHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  demoBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radii.pill },
  holder: { marginTop: 6 },
  successRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  tapBtn: { minHeight: 44, paddingHorizontal: 24, borderWidth: 1, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center' },
  qrNote: { textAlign: 'center' },
});
