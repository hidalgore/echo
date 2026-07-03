import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { EchoLineIcon, EchoLineIconName } from './EchoLineIcon';

interface GradientTabIconProps {
  name: any;
  focused?: boolean;
  color?: string;
  size?: number;
  notificationWaiting?: boolean;
  /**
   * v59.3 — Monotonic token. When this value increments, the icon plays a
   * 3-beat halo ring expansion. Only the wallet tab is expected to pass this.
   */
  pulseToken?: number;
}

const PLATE_SIZE = 42;
const ACTIVE_ICON_SIZE = 31;
const DEFAULT_ICON_SIZE = 27;
const ECHO_NAMES: EchoLineIconName[] = ['home', 'search', 'wallet', 'profile', 'notifications'];

function isEchoIconName(name: any): name is EchoLineIconName {
  return ECHO_NAMES.includes(name);
}

function FallbackIonIcon({ name, focused, color, size }: { name: any; focused: boolean; color?: string; size: number }) {
  return <Ionicons name={name} size={focused ? size + 2 : size} color={focused ? '#EDEBFF' : (color || 'rgba(255,255,255,0.52)')} />;
}

/**
 * Bookmark-add halo ring (Q5 = 5C, Q6 = 6B).
 * Renders 3 sequential beats, each: scale 0.55 → 1.65, opacity 0.55 → 0.
 * Driven by a monotonic pulseToken; every increment replays the sequence.
 */
function HaloPulse({ token }: { token: number }) {
  const scale = useRef(new Animated.Value(0.55)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }

    scale.setValue(0.55);
    opacity.setValue(0);

    const beat = () =>
      Animated.parallel([
        Animated.timing(scale, { toValue: 1.65, duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.sequence([
          Animated.timing(opacity, { toValue: 0.55, duration: 40, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0, duration: 240, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        ]),
      ]);

    const resetAnim = () =>
      Animated.parallel([
        Animated.timing(scale, { toValue: 0.55, duration: 0, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]);

    const gap = (ms: number) => Animated.delay(ms);

    Animated.sequence([
      beat(),
      gap(60),
      resetAnim(),
      beat(),
      gap(60),
      resetAnim(),
      beat(),
    ]).start();
  }, [token, scale, opacity]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.haloRing,
        {
          opacity,
          transform: [{ scale }],
        },
      ]}
    />
  );
}

export function GradientTabIcon({ name, focused = false, color, size = DEFAULT_ICON_SIZE, notificationWaiting = false, pulseToken }: GradientTabIconProps) {
  const echoName = isEchoIconName(name) ? name : null;
  const showPulse = typeof pulseToken === 'number';

  if (!focused) {
    return (
      <View style={styles.inactiveWrap}>
        {showPulse ? <HaloPulse token={pulseToken!} /> : null}
        {echoName ? (
          <EchoLineIcon name={echoName} state="default" size={size} notificationWaiting={notificationWaiting} />
        ) : (
          <FallbackIonIcon name={name} focused={false} color={color} size={size} />
        )}
      </View>
    );
  }

  return (
    <View style={styles.activeOuter}>
      {showPulse ? <HaloPulse token={pulseToken!} /> : null}
      {echoName ? (
        <EchoLineIcon name={echoName} state="active" size={ACTIVE_ICON_SIZE} notificationWaiting={notificationWaiting} />
      ) : (
        <FallbackIonIcon name={name} focused color={color} size={size} />
      )}
      <LinearGradient
        colors={['#20C7FF', '#7B4DFF', '#E63DAD']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.underline}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  inactiveWrap: {
    width: PLATE_SIZE,
    height: PLATE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.72,
  },
  activeOuter: {
    width: PLATE_SIZE,
    height: PLATE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ scale: 1.035 }],
  },
  haloRing: {
    position: 'absolute',
    width: PLATE_SIZE,
    height: PLATE_SIZE,
    borderRadius: PLATE_SIZE / 2,
    borderWidth: 2,
    borderColor: '#7B4DFF',
    backgroundColor: 'rgba(123,77,255,0.10)',
  },
  underline: {
    width: 20,
    height: 2.5,
    borderRadius: 999,
    marginTop: 2,
    opacity: 1,
  },
});

export default GradientTabIcon;
