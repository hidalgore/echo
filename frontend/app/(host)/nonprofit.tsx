import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Switch, TextInput, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, SCREEN_HORIZONTAL_PADDING, typography } from '../../theme/hostTokens';
import { Text } from '../../components/ui';
import { useVerificationStore } from '../../stores/verificationStore';

import { ScreenBackButton } from '../../components/shared/ScreenBackButton';
export default function NonprofitScreen() {
  const insets = useSafeAreaInsets();
  const { nonprofitStatus, nonprofitName, setNonprofitStatus } = useVerificationStore();
  const [orgName, setOrgName] = useState(nonprofitName || 'Golden Futures Foundation');
  const [ein, setEin] = useState('91-XXXXXXX');
  const [lookupComplete, setLookupComplete] = useState(nonprofitStatus !== 'unverified');
  const [role, setRole] = useState<'Officer / Director' | 'Staff Member' | 'Authorized Volunteer'>('Officer / Director');
  const [causeSupport, setCauseSupport] = useState(true);

  const benefits = useMemo(() => [
    'Verified Nonprofit Badge',
    'Donation Support at Checkout',
    'Free Community Event Hosting',
    'Priority Support',
  ], []);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}> 
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <ScreenBackButton />
          <Text style={styles.headerTitle}>Verify Nonprofit</Text>
          <View style={styles.iconBtn} />
        </View>

        <View style={styles.stepRow}>
          {['Lookup', 'Confirm Role', 'Complete'].map((step, idx) => (
            <View key={step} style={styles.stepItem}>
              <View style={[styles.stepDot, idx <= (lookupComplete ? 1 : 0) && styles.stepDotActive]} />
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Organization Details</Text>
          <TextInput value={orgName} onChangeText={setOrgName} placeholder="Organization Name" placeholderTextColor={colors.textDisabled} style={styles.input} />
          <TextInput value={ein} onChangeText={setEin} placeholder="Employer Identification Number" placeholderTextColor={colors.textDisabled} style={styles.input} />
          <TouchableOpacity style={styles.primaryBtn} onPress={() => { setLookupComplete(true); setNonprofitStatus('provisional', orgName); }} activeOpacity={0.9}>
            <Text style={styles.primaryBtnText}>Find Organization</Text>
          </TouchableOpacity>
          <Text style={styles.helper}>We use your EIN to confirm the organization through official nonprofit registries. Your EIN is never shown publicly.</Text>
        </View>

        {lookupComplete && (
          <View style={styles.card}>
            <View style={styles.matchRow}><Text style={styles.sectionTitle}>Registry Match</Text><View style={styles.matchBadge}><Text style={styles.matchBadgeText}>Active Status</Text></View></View>
            <Text style={styles.matchTitle}>{orgName}</Text>
            <Text style={styles.helper}>501(c)(3) Public Charity · Washington State</Text>
            <Text style={[styles.sectionTitle, { marginTop: 18 }]}>Confirm your role</Text>
            {['Officer / Director', 'Staff Member', 'Authorized Volunteer'].map((option) => (
              <TouchableOpacity key={option} style={styles.roleRow} onPress={() => setRole(option as never)} activeOpacity={0.86}>
                <View style={[styles.radio, role === option && styles.radioActive]}>{role === option && <View style={styles.radioInner} />}</View>
                <Text style={styles.roleText}>{option}</Text>
              </TouchableOpacity>
            ))}
            <View style={styles.emailChip}><Ionicons name="mail-outline" size={14} color={colors.accentBlue} /><Text style={styles.emailText}>Verify using your organization email</Text></View>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Nonprofit Benefits on ECHO</Text>
          {benefits.map((benefit) => (
            <View key={benefit} style={styles.benefitRow}>
              <Ionicons name="checkmark-circle" size={16} color={colors.accentGreen} />
              <Text style={styles.benefitText}>{benefit}</Text>
            </View>
          ))}
          <View style={styles.causeSupportRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>Enable donation support at checkout</Text>
              <Text style={styles.helper}>Attendees can donate to your cause during event ticket purchase. Receipts show donations as a separate line item.</Text>
            </View>
            <Switch value={causeSupport} onValueChange={setCauseSupport} trackColor={{ false: 'rgba(255,255,255,0.14)', true: 'rgba(16,185,129,0.42)' }} thumbColor={causeSupport ? '#fff' : '#D1D1D6'} />
          </View>
        </View>

        <TouchableOpacity style={styles.primaryBtnLarge} onPress={() => { setNonprofitStatus('verified', orgName); router.back(); }} activeOpacity={0.92}>
          <Text style={styles.primaryBtnText}>{nonprofitStatus === 'verified' ? 'Nonprofit Verified' : 'Confirm Nonprofit Status'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  headerRow: { paddingHorizontal: SCREEN_HORIZONTAL_PADDING, paddingVertical: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...typography.displayMd, color: colors.textPrimary },
  stepRow: { paddingHorizontal: SCREEN_HORIZONTAL_PADDING, flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  stepItem: { alignItems: 'center', gap: 8, flex: 1 },
  stepDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.18)' },
  stepDotActive: { backgroundColor: colors.accentGreen },
  stepText: { ...typography.bodySm, color: colors.textTertiary },
  card: { marginHorizontal: SCREEN_HORIZONTAL_PADDING, marginBottom: 16, padding: 18, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSubtle },
  sectionTitle: { ...typography.label, color: colors.textTertiary, marginBottom: 12 },
  input: { height: 52, borderRadius: 14, borderWidth: 1, borderColor: colors.borderSubtle, backgroundColor: 'rgba(255,255,255,0.03)', paddingHorizontal: 14, color: colors.textPrimary, marginBottom: 12 },
  primaryBtn: { minHeight: 50, borderRadius: 14, backgroundColor: colors.textPrimary, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  primaryBtnLarge: { marginHorizontal: SCREEN_HORIZONTAL_PADDING, minHeight: 54, borderRadius: 16, backgroundColor: colors.textPrimary, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  primaryBtnText: { color: colors.bg, fontSize: 15, fontWeight: '700' },
  helper: { ...typography.bodySm, color: colors.textTertiary, marginTop: 10, lineHeight: 20 },
  matchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  matchBadge: { backgroundColor: 'rgba(16,185,129,0.12)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  matchBadgeText: { ...typography.labelSm, color: colors.accentGreen },
  matchTitle: { ...typography.bodyLg, color: colors.textPrimary, fontWeight: '700' },
  roleRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 1, borderColor: colors.borderFocus, alignItems: 'center', justifyContent: 'center' },
  radioActive: { backgroundColor: 'rgba(122,92,255,0.16)' },
  radioInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accentViolet },
  roleText: { ...typography.bodyMd, color: colors.textPrimary },
  emailChip: { marginTop: 14, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(59,130,246,0.12)', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  emailText: { ...typography.bodySm, color: colors.accentBlue },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7 },
  benefitText: { ...typography.bodyMd, color: colors.textPrimary },
  causeSupportRow: { marginTop: 18, flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  rowTitle: { ...typography.bodyMd, color: colors.textPrimary, fontWeight: '600' },
});
