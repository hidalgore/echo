/**
 * ECHO — FinalCTASection (v59.4, web)
 * ════════════════════════════════════
 * Cinematic closing call to action.
 * Primary CTA is LOCKED copy: "Start Hosting".
 */
import React from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '../../ui/Text';
import { Button } from '../../ui/Button';

interface FinalCTASectionProps {
  onStartHosting?: () => void;
  onExploreAccess?: () => void;
}

export function FinalCTASection({ onStartHosting, onExploreAccess }: FinalCTASectionProps) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  return (
    <View style={styles.band} nativeID="cta">
      <View style={[styles.container, { paddingVertical: isMobile ? 80 : 128 }]}>
        <LinearGradient
          colors={['rgba(32,199,255,0.10)', 'rgba(123,77,255,0.12)', 'rgba(230,61,173,0.10)', 'rgba(15,17,21,0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.glow}
          pointerEvents="none"
        />
        <Text
          variant="display"
          accessibilityRole="header"
          style={[styles.headline, isMobile && styles.headlineMobile]}
        >
          Make access part of the experience.
        </Text>
        <Text variant="body" style={styles.copy}>
          From discovery to Door Mode, ECHO gives hosts and guests a cleaner way to create, enter, and remember events.
        </Text>
        <View style={[styles.ctaRow, isMobile && styles.ctaRowStacked]}>
          <Button title="Start Hosting" variant="primary" onPress={onStartHosting ?? (() => {})} />
          <Button title="Explore ECHO Access" variant="outline" onPress={onExploreAccess ?? (() => {})} />
        </View>
        <Text variant="caption" style={styles.brandLine}>
          Premium access for modern events.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  band: { width: '100%', backgroundColor: '#0F1115' },
  container: {
    width: '100%',
    maxWidth: 880,
    alignSelf: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 24,
  },
  glow: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 48,
  },
  headline: {
    color: '#FFFFFF',
    textAlign: 'center',
  },
  headlineMobile: { fontSize: 34, lineHeight: 42 },
  copy: {
    color: 'rgba(255,255,255,0.72)',
    textAlign: 'center',
    fontSize: 17,
    lineHeight: 26,
    maxWidth: 640,
  },
  ctaRow: { flexDirection: 'row', gap: 14, marginTop: 8 },
  ctaRowStacked: { flexDirection: 'column', alignSelf: 'stretch' },
  brandLine: {
    color: 'rgba(255,255,255,0.40)',
    letterSpacing: 1.5,
    marginTop: 16,
  },
});
