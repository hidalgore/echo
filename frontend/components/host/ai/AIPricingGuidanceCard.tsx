import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../../../theme/hostTokens';
import { Text } from '../../ui';

type Props = { recommendation: string; support: string; cta: string; onPress?: () => void };
export function AIPricingGuidanceCard({ recommendation, support, cta, onPress }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.row}><Ionicons name="analytics-outline" size={14} color={colors.accentAmber} /><Text style={styles.eyebrow}>Pricing Guidance</Text></View>
      <Text style={styles.recommendation}>{recommendation}</Text>
      <Text style={styles.support}>{support}</Text>
      <TouchableOpacity style={styles.cta} activeOpacity={0.85} onPress={onPress}><Text style={styles.ctaText}>{cta}</Text></TouchableOpacity>
    </View>
  );
}
const styles = StyleSheet.create({
  card: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: radius.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', padding: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  eyebrow: { color: colors.textSecondary, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.7 },
  recommendation: { color: colors.textPrimary, fontSize: 16, lineHeight: 22, fontWeight: '700', marginBottom: 8 },
  support: { color: colors.textTertiary, fontSize: 13, lineHeight: 18, marginBottom: 14 },
  cta: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: 'rgba(245,158,11,0.14)' },
  ctaText: { color: colors.accentAmber, fontSize: 13, fontWeight: '700' },
});
