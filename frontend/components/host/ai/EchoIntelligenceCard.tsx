import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadows } from '../../../theme/hostTokens';
import { Text } from '../../ui';

export type EchoIntelligenceState = {
  title?: string;
  insight: string;
  support?: string;
  cta: string;
  onPress?: () => void;
};

export function EchoIntelligenceCard({ title = 'ECHO Intelligence', insight, support, cta, onPress }: EchoIntelligenceState) {
  return (
    <View style={styles.wrap}>
      <LinearGradient colors={['rgba(32,199,255,0.16)', 'rgba(123,77,255,0.16)', 'rgba(230,61,173,0.12)']} style={styles.borderGlow} />
      <View style={styles.card}>
        <View>
          <View style={styles.eyebrowRow}>
            <Ionicons name="sparkles" size={12} color={colors.accentCyan} />
            <Text style={styles.eyebrow}>{title}</Text>
          </View>
          <Text style={styles.insight}>{insight}</Text>
          {support ? <Text style={styles.support}>{support}</Text> : null}
        </View>
        <TouchableOpacity style={styles.cta} activeOpacity={0.85} onPress={onPress}>
          <Text style={styles.ctaText}>{cta}</Text>
          <Ionicons name="arrow-forward" size={16} color={colors.bg} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
    borderRadius: radius.xl,
    overflow: 'hidden',
    ...shadows.card,
  },
  borderGlow: {
    ...StyleSheet.absoluteFillObject,
  },
  card: {
    margin: 1,
    borderRadius: radius.xl,
    backgroundColor: 'rgba(24,27,34,0.96)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 18,
    minHeight: 176,
    justifyContent: 'space-between',
  },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  eyebrow: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  insight: {
    color: colors.textPrimary,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginBottom: 8,
  },
  support: {
    color: colors.textTertiary,
    fontSize: 14,
    lineHeight: 20,
  },
  cta: {
    minHeight: 46,
    borderRadius: radius.pill,
    backgroundColor: colors.textPrimary,
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 18,
  },
  ctaText: {
    color: colors.bg,
    fontSize: 14,
    fontWeight: '700',
  },
});
