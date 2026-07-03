import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, radius } from '../../../theme/hostTokens';
import { Text } from '../../ui';

export function AIRecapSummaryCard({ summary, onPress }: { summary: string; onPress?: () => void }) {
  return (
    <View style={styles.card}>
      <Text style={styles.header}>ECHO Recap</Text>
      <Text style={styles.body}>{summary}</Text>
      {onPress ? <TouchableOpacity style={styles.cta} onPress={onPress}><Text style={styles.ctaText}>Generate Improved Version</Text></TouchableOpacity> : null}
    </View>
  );
}
const styles = StyleSheet.create({
  card: { backgroundColor: 'rgba(24,27,34,0.96)', borderRadius: radius.xl, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', padding: 18 },
  header: { color: colors.textPrimary, fontSize: 18, fontWeight: '700', marginBottom: 10 },
  body: { color: colors.textSecondary, fontSize: 14, lineHeight: 20 },
  cta: { marginTop: 14, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: 'rgba(255,255,255,0.05)' },
  ctaText: { color: colors.textPrimary, fontSize: 13, fontWeight: '700' },
});
