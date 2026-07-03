/**
 * ECHO — NFCAccessSection (v59.4, web)
 * ═════════════════════════════════════
 * NFC-first access story: Access Pass, wallet direction, tap pulse,
 * QR fallback, sub-500ms Door Mode validation, offline-ready,
 * duplicate prevention, 21+ verification, zone-based access — plus
 * the five Door Mode visual states.
 *
 * Motion: a single slow NFC pulse (RN Animated, native-driver-safe),
 * fully disabled under prefers-reduced-motion.
 */
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Text } from '../../ui/Text';
import { AccessStateChip, ACCESS_STATES } from '../AccessStateChip';
import { SectionShell } from './SectionShell';
import { useReducedMotionWeb } from '../../../hooks/useReducedMotionWeb';

const CAPABILITIES: { title: string; copy: string }[] = [
  { title: 'NFC-first, QR fallback', copy: 'Tap to enter with phone or card. QR stays available when NFC is not.' },
  { title: 'Wallet direction', copy: 'Access Pass built for Apple Wallet and Google Wallet from day one.' },
  { title: 'Designed for the door', copy: 'Door Mode validation targets under 500ms per scan.' },
  { title: 'Offline-ready validation', copy: 'The line keeps moving when the venue Wi-Fi does not.' },
  { title: 'Duplicate admission prevention', copy: 'One credential, one entry. Re-scans surface the original check-in.' },
  { title: 'Zone-based access', copy: 'VIP, GA, staff, backstage — each pass knows exactly where it works.' },
];

export function NFCAccessSection() {
  const { width } = useWindowDimensions();
  const isMobile = width < 900;
  const reducedMotion = useReducedMotionWeb();
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reducedMotion) {
      pulse.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.timing(pulse, {
        toValue: 1,
        duration: 2400,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [reducedMotion, pulse]);

  const ringScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.9] });
  const ringOpacity = pulse.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0.5, 0.15, 0] });

  return (
    <SectionShell
      nativeID="access"
      eyebrow="NFC-first access"
      title="Entry that reads in a tap"
      subtitle="The ECHO Access Pass lives where people already look — their wallet. At the door, Door Mode validates locally, online or off, and answers in well under a second."
      band
    >
      <View style={[styles.row, isMobile && styles.rowStacked]}>
        {/* Tap visual */}
        <View style={styles.tapPanel} accessible accessibilityLabel="Illustration: a phone tapping an ECHO reader, signal ring pulsing outward.">
          <View style={styles.tapStage}>
            {!reducedMotion ? (
              <Animated.View
                style={[styles.pulseRing, { transform: [{ scale: ringScale }], opacity: ringOpacity }]}
              />
            ) : null}
            <View style={styles.reader}>
              <View style={styles.readerRing} />
              <Text variant="caption" style={styles.readerLabel}>TAP TO ENTER</Text>
            </View>
            <View style={styles.phoneChip}>
              <View style={styles.phoneNotch} />
              <Text variant="caption" style={styles.phoneLabel}>Access Pass</Text>
            </View>
          </View>
          <View style={styles.latencyRow}>
            <Text variant="label" style={styles.latencyValue}>{'<500ms'}</Text>
            <Text variant="caption" style={styles.latencyCaption}>Door Mode validation target</Text>
          </View>
        </View>

        {/* Capability list */}
        <View style={styles.capList}>
          {CAPABILITIES.map((c) => (
            <View key={c.title} style={styles.capRow}>
              <View style={styles.capTick} />
              <View style={styles.capCopy}>
                <Text variant="label" style={styles.capTitle}>{c.title}</Text>
                <Text variant="bodySmall" style={styles.capBody}>{c.copy}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <Text variant="sectionTitle" accessibilityRole="header" style={styles.statesHeading}>
        Every scan resolves to a clear state
      </Text>
      <View style={styles.statesGrid}>
        {ACCESS_STATES.map((s) => (
          <AccessStateChip key={s} state={s} />
        ))}
      </View>
    </SectionShell>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 40, alignItems: 'stretch' },
  rowStacked: { flexDirection: 'column' },
  tapPanel: {
    flex: 1,
    minHeight: 320,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 24,
    overflow: 'hidden',
  },
  tapStage: { width: 200, height: 200, alignItems: 'center', justifyContent: 'center' },
  pulseRing: {
    position: 'absolute',
    width: 140, height: 140, borderRadius: 70,
    borderWidth: 2, borderColor: '#20C7FF',
  },
  reader: {
    width: 120, height: 120, borderRadius: 32,
    backgroundColor: '#11141A',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center', justifyContent: 'center', gap: 10,
  },
  readerRing: {
    width: 44, height: 32, borderRadius: 16,
    borderWidth: 3, borderColor: '#E63DAD',
  },
  readerLabel: { color: 'rgba(255,255,255,0.55)', letterSpacing: 1.5, fontSize: 9 },
  phoneChip: {
    position: 'absolute',
    right: 0, top: 4,
    width: 76, height: 132, borderRadius: 18,
    backgroundColor: '#181C24',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center', justifyContent: 'flex-end',
    paddingBottom: 12,
    transform: [{ rotate: '12deg' }],
  },
  phoneNotch: {
    position: 'absolute', top: 8,
    width: 26, height: 5, borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  phoneLabel: { color: 'rgba(255,255,255,0.66)', fontSize: 9 },
  latencyRow: { alignItems: 'center', gap: 4 },
  latencyValue: { color: '#34D399', fontSize: 22 },
  latencyCaption: { color: 'rgba(255,255,255,0.55)' },
  capList: { flex: 1, gap: 18, justifyContent: 'center' },
  capRow: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  capTick: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: '#7B4DFF', marginTop: 6,
  },
  capCopy: { flex: 1 },
  capTitle: { color: '#FFFFFF', marginBottom: 3, fontSize: 15 },
  capBody: { color: 'rgba(255,255,255,0.62)', lineHeight: 20 },
  statesHeading: { color: '#FFFFFF', marginTop: 56, marginBottom: 20 },
  statesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
});
