/**
 * CircleProgressRing — View-Based Arc (No SVG dependency)
 * ═══════════════════════════════════════════════════════
 * Uses clipped half-circle Views to render a circular progress arc.
 * Shows text inside (e.g. "1/2 secured") or checkmark when complete.
 * Supports both progress-based API and legacy member-based API.
 */
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../ui';
import { useDynamicTheme } from '../../theme/dynamicTheme';
import type { CircleMember } from '../../types/circle';

type ProgressProps = {
  progress: number;
  size?: number;
  strokeWidth?: number;
  isComplete?: boolean;
  centerText?: string;
  centerSubtext?: string;
};

type LegacyProps = {
  members: CircleMember[];
  size?: number;
  centerText?: string;
  centerSubtext?: string;
  animate?: boolean;
};

type Props = ProgressProps | LegacyProps;

function isProgressProps(p: Props): p is ProgressProps {
  return 'progress' in p;
}

// Arc colors for the gradient effect (approximated with segments)
const ARC_COLORS = ['#20C7FF', '#7B4DFF', '#A855F7', '#EC4899', '#F59E0B'];

export function CircleProgressRing(props: Props) {
  const { colors: c } = useDynamicTheme();
  let progress: number;
  let size: number;
  let strokeWidth: number;
  let isComplete: boolean;
  let centerText: string | undefined;
  let centerSubtext: string | undefined;

  if (isProgressProps(props)) {
    progress = props.progress;
    size = props.size ?? 120;
    strokeWidth = props.strokeWidth ?? 8;
    isComplete = props.isComplete ?? false;
    centerText = props.centerText;
    centerSubtext = props.centerSubtext;
  } else {
    const active = props.members.filter(m => m.status !== 'replaced');
    const claimed = active.filter(m => m.status === 'claimed').length;
    progress = active.length > 0 ? claimed / active.length : 0;
    size = props.size ?? 120;
    strokeWidth = 8;
    isComplete = progress >= 1;
    centerText = props.centerText;
    centerSubtext = props.centerSubtext;
  }

  const clampedProgress = Math.min(Math.max(progress, 0), 1);
  const degrees = clampedProgress * 360;
  const half = size / 2;
  const innerSize = size - strokeWidth * 2;

  // Pulse animation for active states
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (isComplete || progress <= 0) { pulseAnim.setValue(1); return; }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.02, duration: 2000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [isComplete, progress > 0]);

  // Pick color based on progress position
  const getArcColor = (deg: number): string => {
    const idx = Math.floor((deg / 360) * ARC_COLORS.length);
    return ARC_COLORS[Math.min(idx, ARC_COLORS.length - 1)];
  };

  const primaryColor = isComplete ? '#10B981' : getArcColor(degrees);

  return (
    <Animated.View style={[{ width: size, height: size, transform: [{ scale: pulseAnim }] }]}>
      {/* Background track */}
      <View style={[s.ring, { width: size, height: size, borderRadius: half, borderWidth: strokeWidth, borderColor: c.hairline }]} />

      {/* Progress arc — uses two half-circle clips */}
      {clampedProgress > 0 && (
        <View style={[s.arcWrap, { width: size, height: size }]}>
          {/* Right half (0-180°) */}
          <View style={[s.halfClip, { width: half, height: size, left: half }]}>
            <View
              style={[
                s.halfCircle,
                {
                  width: size, height: size, borderRadius: half,
                  borderWidth: strokeWidth, borderColor: primaryColor,
                  borderLeftColor: 'transparent', borderBottomColor: 'transparent',
                  left: -half,
                  transform: [{ rotate: `${Math.min(degrees, 180)}deg` }],
                },
              ]}
            />
          </View>

          {/* Left half (180-360°) — only render if > 180° */}
          {degrees > 180 && (
            <View style={[s.halfClip, { width: half, height: size, left: 0 }]}>
              <View
                style={[
                  s.halfCircle,
                  {
                    width: size, height: size, borderRadius: half,
                    borderWidth: strokeWidth, borderColor: getArcColor(degrees),
                    borderLeftColor: 'transparent', borderBottomColor: 'transparent',
                    left: 0,
                    transform: [{ rotate: `${degrees - 180}deg` }],
                  },
                ]}
              />
            </View>
          )}
        </View>
      )}

      {/* Inner circle (bg knockout) */}
      <View style={[s.inner, {
        width: innerSize, height: innerSize, borderRadius: innerSize / 2,
        top: strokeWidth, left: strokeWidth, backgroundColor: c.bg,
      }]} />

      {/* Center content */}
      <View style={s.center}>
        {isComplete ? (
          <Ionicons name="checkmark-circle" size={size * 0.4} color="#10B981" />
        ) : (
          <>
            {centerText && <Text style={[s.centerText, { fontSize: size * 0.18, color: c.text }]}>{centerText}</Text>}
            {centerSubtext && <Text style={[s.centerSubtext, { fontSize: size * 0.09, color: c.textLow }]}>{centerSubtext}</Text>}
          </>
        )}
      </View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  ring: { position: 'absolute' },
  arcWrap: { position: 'absolute', overflow: 'hidden' },
  halfClip: { position: 'absolute', overflow: 'hidden' },
  halfCircle: { position: 'absolute', top: 0 },
  inner: { position: 'absolute' },
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center', justifyContent: 'center',
  },
  centerText: { fontWeight: '700' },
  centerSubtext: { marginTop: 2 },
});
