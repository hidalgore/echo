import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radii, spacing } from '../../theme/tokens';
import { Text } from '../ui';
import type { InsiderProfile, InsiderApplication } from '../../types/insider';

const statusLabel: Record<string, string> = {
  not_started: 'Apply to ECHO Insider',
  draft: 'Application Draft',
  submitted: 'Submitted',
  founding_insider: 'Founding Insider',
  approved: 'Approved',
  priority_waitlist: 'Priority Waitlist',
  cohort_waitlist: 'Cohort Waitlist',
  future_opportunity_pool: 'Future Opportunity Pool',
  inactive_application: 'Inactive Application',
};

export function InsiderStatusCard({ profile, application }: { profile: InsiderProfile; application: InsiderApplication }) {
  const approved = ['founding_insider', 'approved'].includes(profile.applicationStatus);
  return (
    <LinearGradient colors={['rgba(32,199,255,0.20)', 'rgba(123,77,255,0.16)', 'rgba(255,180,92,0.10)']} style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.iconWrap}><Ionicons name="sparkles-outline" size={20} color="#FFF" /></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrow}>ECHO INSIDER</Text>
          <Text style={styles.title}>{statusLabel[profile.applicationStatus] ?? 'ECHO Insider'}</Text>
        </View>
        <View style={styles.pill}><Text style={styles.pillText}>{profile.tier.replace('_', ' ')}</Text></View>
      </View>
      <Text style={styles.body}>{approved ? 'Missions, rewards, and visual feedback tools are unlocked.' : 'Invite-only before public launch. Visible to all users at launch with curated approval and waitlist placement.'}</Text>
      <View style={styles.metricRow}>
        <Metric label="Reputation" value={profile.reputation.toLocaleString()} />
        <Metric label="Credits" value={profile.echoCredits.toLocaleString()} />
        <Metric label="Missions" value={String(profile.completedMissions)} />
      </View>
      <Text style={styles.note}>No fixed points-to-dollar conversion. Credits are controlled by ECHO redemption rules to protect launch economics.</Text>
    </LinearGradient>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <View style={styles.metric}><Text style={styles.metricValue}>{value}</Text><Text style={styles.metricLabel}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  card: { borderRadius: radii.xl, padding: spacing.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', overflow: 'hidden' },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.10)', alignItems: 'center', justifyContent: 'center' },
  eyebrow: { fontSize: 10, fontWeight: '900', color: colors.echoBlue, letterSpacing: 1.1 },
  title: { fontSize: 22, fontWeight: '900', color: '#FFF', marginTop: 2 },
  pill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: 'rgba(255,255,255,0.10)' },
  pillText: { color: '#FFF', fontSize: 11, fontWeight: '800', textTransform: 'capitalize' },
  body: { color: 'rgba(255,255,255,0.74)', fontSize: 14, lineHeight: 20, marginTop: 16 },
  metricRow: { flexDirection: 'row', gap: 10, marginTop: 18 },
  metric: { flex: 1, borderRadius: 16, backgroundColor: 'rgba(15,17,21,0.42)', padding: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  metricValue: { color: '#FFF', fontSize: 18, fontWeight: '900' },
  metricLabel: { color: 'rgba(255,255,255,0.48)', fontSize: 10, fontWeight: '800', letterSpacing: 0.6, marginTop: 2, textTransform: 'uppercase' },
  note: { color: 'rgba(255,255,255,0.50)', fontSize: 11, lineHeight: 16, marginTop: 14 },
});
