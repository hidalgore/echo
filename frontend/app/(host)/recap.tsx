import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../../theme/hostTokens';
import { Text } from '../../components/ui';
import { AIRecapSummaryCard } from '../../components/host/ai/AIRecapSummaryCard';

import { ScreenBackButton } from '../../components/shared/ScreenBackButton';
const worked = ['Final-week demand was strong', 'Check-in flow remained smooth', 'Ticket pricing supported healthy sell-through'];
const improve = ['Earlier promotion could improve sell-through', 'Event details could better highlight lineup value', 'Door setup should be opened earlier before arrivals'];
const next = [
  { copy: 'Launch promotion 2 days earlier to improve early awareness.', cta: 'Generate Promo Plan' },
  { copy: 'Use a clearer event title to improve listing conversion.', cta: 'Create Better Title' },
  { copy: 'Reuse this event format with minor improvements.', cta: 'Duplicate Event' },
];

export default function HostRecapScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ScreenBackButton />
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Post-event recap</Text>
          <Text style={styles.subtitle}>Midnight Pulse · Friday Night at Nova</Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Metric label="Tickets sold" value="182" />
          <Metric label="Attendance" value="74%" />
          <Metric label="Gross revenue" value="$7,240" />
          <Metric label="Top sales window" value="Final 48h" />
        </View>
        <AIRecapSummaryCard summary="This event performed well, with strong final-week momentum and healthy attendance. Sales accelerated in the last 48 hours, while early conversion started softer than expected." />
        <BulletCard title="What worked" bullets={worked} />
        <BulletCard title="What to improve" bullets={improve} />
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Recommendations for next time</Text>
          {next.map((item) => (
            <View key={item.copy} style={styles.recommendationRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.body}>{item.copy}</Text>
              </View>
              <TouchableOpacity style={styles.cta} activeOpacity={0.85}><Text style={styles.ctaText}>{item.cta}</Text></TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <View style={styles.metric}><Text style={styles.metricLabel}>{label}</Text><Text style={styles.metricValue}>{value}</Text></View>;
}

function BulletCard({ title, bullets }: { title: string; bullets: string[] }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      <View style={{ gap: 10 }}>
        {bullets.map((b) => (
          <View key={b} style={styles.bulletRow}><View style={styles.dot} /><Text style={styles.body}>{b}</Text></View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 54, paddingHorizontal: 20, paddingBottom: 14, gap: 12 },
  backBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.04)', alignItems: 'center', justifyContent: 'center' },
  title: { color: colors.textPrimary, fontSize: 24, fontWeight: '700' },
  subtitle: { color: colors.textTertiary, fontSize: 14, marginTop: 4 },
  content: { padding: 20, gap: 14 },
  hero: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  metric: { width: '47%', padding: 16, borderRadius: radius.xl, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  metricLabel: { color: colors.textTertiary, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 8 },
  metricValue: { color: colors.textPrimary, fontSize: 20, fontWeight: '700' },
  card: { backgroundColor: 'rgba(24,27,34,0.96)', borderRadius: radius.xl, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', padding: 18 },
  cardTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '700', marginBottom: 12 },
  bulletRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  dot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: colors.accentCyan, marginTop: 6 },
  body: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, flex: 1 },
  recommendationRow: { gap: 10, paddingVertical: 10 },
  cta: { alignSelf: 'flex-start', marginTop: 10, paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: 'rgba(255,255,255,0.05)' },
  ctaText: { color: colors.textPrimary, fontSize: 13, fontWeight: '700' },
});
