/**
 * ECHO Insider Program — Native Profile Surface v1
 * Visible to all users at launch; invite-only before public launch.
 */
import React, { useMemo } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radii, spacing } from '../../theme/tokens';
import { Text } from '../../components/ui';
import { InsiderStatusCard, InsiderMissionCard, InsiderFeedbackForm } from '../../components/insider';
import { useInsiderStore } from '../../stores/insiderStore';
import { getWaitlistMessage } from '../../services/insiderQualificationService';

export default function InsiderScreen() {
  const insets = useSafeAreaInsets();
  const { profile, application, missions, missionVerification, ledger, updateApplication, submitApplication, submitFeedback, startMission, recordMissionSignal, submitMissionForVerification } = useInsiderStore();
  const outcomeMessage = useMemo(() => getWaitlistMessage(application.status, application.reasonCodes), [application.status, application.reasonCodes]);
  const approved = ['approved', 'founding_insider'].includes(profile.applicationStatus);

  return (
    <View style={styles.root}>
      <View style={[styles.nav, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.back} onPress={() => router.back()}><Ionicons name="chevron-back" size={22} color="#FFF" /></TouchableOpacity>
        <Text style={styles.navTitle}>ECHO Insider</Text>
        <View style={styles.back} />
      </View>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 48 }]} showsVerticalScrollIndicator={false}>
        <InsiderStatusCard profile={profile} application={application} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>APPLICATION ENGINE</Text>
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Curated approval, not open enrollment</Text>
            <Text style={styles.panelBody}>ECHO auto-scores applications for response quality, engagement, cohort diversity, future testing value, and reliability. Applicants not selected remain searchable for future opportunities.</Text>
            <Text style={styles.reason}>{outcomeMessage}</Text>
            <View style={styles.scoreGrid}>
              <Score label="Fit" value={application.qualificationScore} />
              <Score label="Diversity" value={application.diversityScore} />
              <Score label="Engagement" value={application.engagementScore} />
            </View>
            <InputButton label="Improve application answer" onPress={() => updateApplication({ whyJoin: 'I attend events regularly and want to help ECHO improve discovery, checkout, wallet passes, NFC access, accessibility, and host operations with clear feedback and visual evidence.' })} />
            <TouchableOpacity style={styles.primaryBtn} onPress={submitApplication} activeOpacity={0.86}>
              <Text style={styles.primaryText}>{application.submittedAt ? 'Re-score Application' : 'Submit Insider Application'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>VERIFICATION RULES</Text>
          <View style={styles.panel}>
            <Rule icon="shield-checkmark-outline" title="No checkbox rewards" body="Missions cannot be completed by tapping a button. ECHO waits for screen visits, feature events, feedback, and media evidence before credits unlock." />
            <Rule icon="analytics-outline" title="Background signals required" body="Wallet creation, Circle invites, Door scans, attendance check-ins, host confirmation, and Experience Recap completion are verified by platform events." />
            <Rule icon="camera-outline" title="Evidence improves trust" body="Photos, screenshots, and screen recordings strengthen feedback quality, but rewards still require matching activity signals." />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>REWARD RULES</Text>
          <View style={styles.panel}>
            <Rule icon="wallet-outline" title="Credits are controlled by ECHO" body="No fixed points-to-dollar conversion at launch. Redemption rules can adjust by budget, cohort, event type, and partner campaign." />
            <Rule icon="ticket-outline" title="Earn through real attendance" body="ECHO can reward trusted attendance, checkout participation, wallet use, and Experience Recap completion." />
            <Rule icon="storefront-outline" title="Hosts can award bonus credits" body="Approved hosts may issue event-specific bonus credits to trusted testers, launch ambassadors, and event support participants." />
            <Rule icon="gift-outline" title="Partner rewards ready" body="Future sponsor and partner rewards can sit beside ECHO credits without changing the core reputation system." />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>MISSIONS</Text>
          {missions.map((mission) => (
            <InsiderMissionCard
              key={mission.id}
              mission={mission}
              verification={missionVerification[mission.id]}
              onStart={() => startMission(mission.id)}
              onVerify={() => submitMissionForVerification(mission.id)}
              onMockSignal={(signal) => recordMissionSignal(mission.id, signal)}
            />
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>FEEDBACK HUB</Text>
          <InsiderFeedbackForm missions={missions} onSubmit={submitFeedback} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>RECENT REWARDS</Text>
          <View style={styles.panel}>
            {ledger.length === 0 ? <Text style={styles.empty}>Complete missions, submit useful feedback, attend eligible events, or receive host bonuses to build reputation and credits.</Text> : ledger.slice(0, 8).map((entry) => (
              <View key={entry.id} style={styles.ledgerRow}>
                <View style={styles.ledgerIcon}><Ionicons name="sparkles-outline" size={16} color={colors.pendingAmber} /></View>
                <View style={{ flex: 1 }}><Text style={styles.ledgerTitle}>{entry.title}</Text><Text style={styles.ledgerMeta}>{entry.source.replace('_', ' ')} • +{entry.reputation} rep</Text></View>
                <Text style={styles.ledgerCredits}>+{entry.credits}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function Score({ label, value }: { label: string; value: number }) {
  return <View style={styles.score}><Text style={styles.scoreValue}>{value}</Text><Text style={styles.scoreLabel}>{label}</Text></View>;
}

function Rule({ icon, title, body }: { icon: any; title: string; body: string }) {
  return <View style={styles.rule}><View style={styles.ruleIcon}><Ionicons name={icon} size={18} color={colors.echoBlue} /></View><View style={{ flex: 1 }}><Text style={styles.ruleTitle}>{title}</Text><Text style={styles.ruleBody}>{body}</Text></View></View>;
}

function InputButton({ label, onPress }: { label: string; onPress: () => void }) {
  return <TouchableOpacity style={styles.inputBtn} onPress={onPress}><Text style={styles.inputBtnText}>{label}</Text></TouchableOpacity>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  nav: { minHeight: 72, paddingHorizontal: 16, paddingBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  back: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  navTitle: { color: '#FFF', fontSize: 17, fontWeight: '900' },
  content: { padding: 20, gap: 20 },
  section: { gap: 10 },
  sectionTitle: { color: 'rgba(255,255,255,0.42)', fontSize: 11, fontWeight: '900', letterSpacing: 1.1 },
  panel: { borderRadius: radii.xl, padding: spacing.lg, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  panelTitle: { color: '#FFF', fontSize: 17, fontWeight: '900' },
  panelBody: { color: 'rgba(255,255,255,0.62)', fontSize: 13, lineHeight: 19, marginTop: 8 },
  reason: { color: 'rgba(255,255,255,0.76)', fontSize: 13, lineHeight: 19, marginTop: 12, padding: 12, borderRadius: 14, backgroundColor: 'rgba(32,199,255,0.08)', borderWidth: 1, borderColor: 'rgba(32,199,255,0.18)' },
  scoreGrid: { flexDirection: 'row', gap: 10, marginTop: 14 },
  score: { flex: 1, borderRadius: 16, padding: 12, backgroundColor: 'rgba(15,17,21,0.52)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  scoreValue: { color: '#FFF', fontSize: 19, fontWeight: '900' },
  scoreLabel: { color: 'rgba(255,255,255,0.45)', fontSize: 10, marginTop: 2, fontWeight: '850', textTransform: 'uppercase' },
  inputBtn: { marginTop: 14, minHeight: 44, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)' },
  inputBtnText: { color: '#FFF', fontSize: 13, fontWeight: '850' },
  primaryBtn: { marginTop: 10, minHeight: 48, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent },
  primaryText: { color: '#FFF', fontSize: 14, fontWeight: '900' },
  rule: { flexDirection: 'row', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  ruleIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(32,199,255,0.10)', alignItems: 'center', justifyContent: 'center' },
  ruleTitle: { color: '#FFF', fontSize: 14, fontWeight: '850' },
  ruleBody: { color: 'rgba(255,255,255,0.56)', fontSize: 12, lineHeight: 17, marginTop: 3 },
  empty: { color: 'rgba(255,255,255,0.55)', fontSize: 13, lineHeight: 19 },
  ledgerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  ledgerIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,180,92,0.10)', alignItems: 'center', justifyContent: 'center' },
  ledgerTitle: { color: '#FFF', fontSize: 13, fontWeight: '850' },
  ledgerMeta: { color: 'rgba(255,255,255,0.42)', fontSize: 11, marginTop: 2, textTransform: 'capitalize' },
  ledgerCredits: { color: colors.pendingAmber, fontSize: 13, fontWeight: '900' },
});
