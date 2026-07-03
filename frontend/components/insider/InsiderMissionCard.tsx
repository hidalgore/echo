import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing } from '../../theme/tokens';
import { Text } from '../ui';
import type { InsiderMission } from '../../types/insider';
import type { InsiderMissionVerificationState, InsiderVerificationSignal } from '../../services/insiderVerificationService';

export function InsiderMissionCard({
  mission,
  verification,
  onStart,
  onVerify,
  onMockSignal,
}: {
  mission: InsiderMission;
  verification?: InsiderMissionVerificationState;
  onStart: () => void;
  onVerify: () => void;
  onMockSignal?: (signal: InsiderVerificationSignal) => void;
}) {
  const verified = mission.status === 'verified';
  const inProgress = mission.status === 'in_progress' || mission.status === 'needs_evidence' || mission.status === 'pending_verification';
  const required = mission.requiredSignals ?? [];
  const collected = verification?.collectedSignals ?? [];
  const progress = required.length === 0 ? 0 : Math.round((required.filter((signal) => collected.includes(signal)).length / required.length) * 100);
  const missing = required.filter((signal) => !collected.includes(signal));

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={[styles.icon, verified && styles.iconDone, mission.status === 'needs_evidence' && styles.iconNeeds]}>
          <Ionicons name={verified ? 'checkmark-circle' : mission.status === 'needs_evidence' ? 'alert-circle-outline' : 'flag-outline'} size={20} color={verified ? colors.paidGreen : mission.status === 'needs_evidence' ? colors.pendingAmber : colors.echoBlue} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{mission.title}</Text>
          <Text style={styles.area}>{mission.featureArea} • {verified ? 'Verified' : inProgress ? 'Verification active' : 'Available'}</Text>
        </View>
        <View style={styles.reward}><Text style={styles.rewardText}>Unlocks +{mission.rewardCredits}</Text></View>
      </View>
      <Text style={styles.body}>{mission.description}</Text>

      <View style={styles.verifyBox}>
        <View style={styles.verifyHeader}>
          <Text style={styles.verifyTitle}>Background verification</Text>
          <Text style={styles.progress}>{progress}%</Text>
        </View>
        <Text style={styles.verifyBody}>Credits unlock only after ECHO confirms real activity signals and evidence. This prevents users from checking boxes just for rewards.</Text>
        {required.length > 0 && (
          <View style={styles.signalWrap}>
            {required.map((signal) => {
              const done = collected.includes(signal);
              return (
                <View key={signal} style={[styles.signalPill, done && styles.signalDone]}>
                  <Ionicons name={done ? 'checkmark' : 'ellipse-outline'} size={12} color={done ? colors.paidGreen : 'rgba(255,255,255,0.42)'} />
                  <Text style={[styles.signalText, done && styles.signalTextDone]}>{signal.replace(/_/g, ' ')}</Text>
                </View>
              );
            })}
          </View>
        )}
        {!!mission.verificationSummary && <Text style={styles.summary}>{mission.verificationSummary}</Text>}
        {missing.length > 0 && mission.status === 'needs_evidence' && <Text style={styles.missing}>Still needed: {missing.map((item) => item.replace(/_/g, ' ')).join(', ')}</Text>}
      </View>

      {onMockSignal && !verified && (
        <View style={styles.devRow}>
          <TouchableOpacity style={styles.devBtn} onPress={() => onMockSignal(required[0] ?? 'screen_visited')}><Text style={styles.devText}>Simulate Activity</Text></TouchableOpacity>
          <TouchableOpacity style={styles.devBtn} onPress={() => onMockSignal(required[1] ?? 'feature_event_completed')}><Text style={styles.devText}>Simulate Feature</Text></TouchableOpacity>
        </View>
      )}

      <TouchableOpacity disabled={verified} style={[styles.button, verified && { opacity: 0.45 }]} onPress={inProgress ? onVerify : onStart} activeOpacity={0.82}>
        <Text style={styles.buttonText}>{verified ? 'Reward Verified' : inProgress ? 'Submit for Verification' : 'Start Mission'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radii.lg, padding: spacing.md, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(32,199,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  iconDone: { backgroundColor: 'rgba(34,197,94,0.14)' },
  iconNeeds: { backgroundColor: 'rgba(255,180,92,0.12)' },
  title: { color: '#FFF', fontSize: 15, fontWeight: '850' },
  area: { color: 'rgba(255,255,255,0.45)', fontSize: 12, marginTop: 2 },
  reward: { borderRadius: 999, backgroundColor: 'rgba(255,180,92,0.12)', paddingHorizontal: 9, paddingVertical: 5 },
  rewardText: { color: colors.pendingAmber, fontSize: 11, fontWeight: '850' },
  body: { color: 'rgba(255,255,255,0.62)', fontSize: 13, lineHeight: 19, marginTop: 12 },
  verifyBox: { marginTop: 12, borderRadius: 16, padding: 12, backgroundColor: 'rgba(15,17,21,0.52)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  verifyHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  verifyTitle: { color: '#FFF', fontSize: 13, fontWeight: '900' },
  progress: { color: colors.echoBlue, fontSize: 12, fontWeight: '900' },
  verifyBody: { color: 'rgba(255,255,255,0.56)', fontSize: 12, lineHeight: 17, marginTop: 6 },
  signalWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  signalPill: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 6, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  signalDone: { backgroundColor: 'rgba(34,197,94,0.10)', borderColor: 'rgba(34,197,94,0.18)' },
  signalText: { color: 'rgba(255,255,255,0.50)', fontSize: 10, fontWeight: '800', textTransform: 'capitalize' },
  signalTextDone: { color: 'rgba(255,255,255,0.82)' },
  summary: { color: 'rgba(255,255,255,0.58)', fontSize: 12, lineHeight: 17, marginTop: 10 },
  missing: { color: colors.pendingAmber, fontSize: 12, lineHeight: 17, marginTop: 8 },
  devRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  devBtn: { flex: 1, minHeight: 36, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(32,199,255,0.08)', borderWidth: 1, borderColor: 'rgba(32,199,255,0.16)' },
  devText: { color: colors.echoBlue, fontSize: 11, fontWeight: '850' },
  button: { marginTop: 12, height: 42, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)' },
  buttonText: { color: '#FFF', fontSize: 13, fontWeight: '850' },
});
