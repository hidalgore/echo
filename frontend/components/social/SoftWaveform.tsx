import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';

/**
 * SoftWaveform
 * ════════════
 * Apple-level ambient waveform — 5 thin bars with staggered, very slow opacity drift.
 * No bouncing, no aggressive motion. Purely a calm "proof of life" signal.
 *
 * Used in EnergyCard, EnergyPill, EnergyChip.
 */

interface SoftWaveformProps {
  /** 0..1 — amplitude/opacity ceiling */
  intensity: number;
  /** color for the bars */
  color: string;
  size?: 'sm' | 'md' | 'lg';
}

const SIZES = {
  sm: { barW: 2, gap: 2, heights: [4, 7, 10, 6, 3] },
  md: { barW: 2.5, gap: 3, heights: [6, 10, 14, 9, 5] },
  lg: { barW: 3, gap: 4, heights: [8, 14, 20, 13, 7] },
};

export function SoftWaveform({ intensity, color, size = 'md' }: SoftWaveformProps) {
  const cfg = SIZES[size];
  // 5 bars, each with its own slow phase
  const phase = [
    useSharedValue(0.45),
    useSharedValue(0.65),
    useSharedValue(0.55),
    useSharedValue(0.5),
    useSharedValue(0.4),
  ];

  useEffect(() => {
    const ceiling = Math.max(0.25, intensity);
    const floor = ceiling * 0.35;
    // Stagger each bar with different durations so they never look synced
    const durations = [2200, 2600, 2400, 2800, 2300];
    phase.forEach((sv, i) => {
      sv.value = withRepeat(
        withTiming(ceiling, { duration: durations[i], easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      );
      // Initialize at varying offsets via setTimeout staggering
      setTimeout(() => {
        sv.value = withRepeat(
          withTiming(floor, { duration: durations[i], easing: Easing.inOut(Easing.ease) }),
          -1,
          true,
        );
      }, i * 180);
    });
  }, [intensity]);

  const bar0 = useAnimatedStyle(() => ({ opacity: phase[0].value }));
  const bar1 = useAnimatedStyle(() => ({ opacity: phase[1].value }));
  const bar2 = useAnimatedStyle(() => ({ opacity: phase[2].value }));
  const bar3 = useAnimatedStyle(() => ({ opacity: phase[3].value }));
  const bar4 = useAnimatedStyle(() => ({ opacity: phase[4].value }));
  const styles = [bar0, bar1, bar2, bar3, bar4];

  return (
    <View style={[s.wrap, { gap: cfg.gap }]}>
      {cfg.heights.map((h, i) => (
        <Animated.View
          key={i}
          style={[
            { width: cfg.barW, height: h, borderRadius: cfg.barW / 2, backgroundColor: color },
            styles[i],
          ]}
        />
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center' },
});

export default SoftWaveform;
