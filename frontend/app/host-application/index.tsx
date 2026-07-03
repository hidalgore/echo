/**
 * Host Activation Flow
 * ════════════════════
 * 4-step instant activation: intro → basics → verification → terms → result.
 * Autosaves on every field update. No ECHO team approval needed.
 */
import React, { useState, useMemo } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/tokens';
import { Text } from '../../components/ui';
import { useHostProfileStore } from '../../stores/hostProfileStore';
import { HOST_TYPE_LABELS, EVENT_TYPE_OPTIONS, ACTIVATION_STEP_ORDER, type HostType } from '../../types/hostProfile';
import { hostAnalytics } from '../../services/analytics';

const CITY_OPTIONS = [
  'Seattle, WA', 'Los Angeles, CA', 'New York, NY', 'Chicago, IL',
  'Miami, FL', 'Atlanta, GA', 'Houston, TX', 'Dallas, TX',
  'San Francisco, CA', 'Portland, OR', 'Denver, CO', 'Nashville, TN',
  'Austin, TX', 'Phoenix, AZ', 'Las Vegas, NV', 'Philadelphia, PA',
];

export default function HostActivationScreen() {
  const insets = useSafeAreaInsets();
  const store = useHostProfileStore();
  const { profile, activationStep, activationResult, missingFields, emailVerified, phoneVerified } = store;
  const [citySearch, setCitySearch] = useState('');

  React.useEffect(() => {
    if (profile.hostAccessStatus === 'not_started') store.startActivation();
  }, []);

  const progress = useMemo(() => {
    const idx = ACTIVATION_STEP_ORDER.indexOf(activationStep);
    return ((idx + 1) / ACTIVATION_STEP_ORDER.length) * 100;
  }, [activationStep]);

  const handleNext = () => {
    const idx = ACTIVATION_STEP_ORDER.indexOf(activationStep);
    if (activationStep === 'basics' && store.shouldSkipVerification()) {
      store.setActivationStep('terms'); return;
    }
    if (idx < ACTIVATION_STEP_ORDER.length - 1) store.setActivationStep(ACTIVATION_STEP_ORDER[idx + 1]);
  };

  const handleBack = () => {
    const idx = ACTIVATION_STEP_ORDER.indexOf(activationStep);
    if (idx > 0) {
      if (activationStep === 'terms' && store.shouldSkipVerification()) { store.setActivationStep('basics'); return; }
      store.setActivationStep(ACTIVATION_STEP_ORDER[idx - 1]);
    } else router.back();
  };

  const handleActivate = () => { store.runActivation(); };

  const handleResultAction = (action: string) => {
    switch (action) {
      case 'overview': router.dismissAll(); router.replace('/(host)/(tabs)/overview'); break;
      case 'create': router.dismissAll(); router.replace('/(host)/create'); break;
      case 'resolve':
        store.setActivationStep(!emailVerified || !phoneVerified ? 'verification' : 'basics');
        break;
      default: router.dismissAll(); router.replace('/(tabs)'); break;
    }
  };

  if (activationResult) {
    return (
      <View style={[s.container, { paddingTop: insets.top }]}>
        <View style={s.resultWrap}>
          {activationResult === 'active' ? (
            <>
              <LinearGradient colors={['#20C7FF', '#7B4DFF', '#E63DAD']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.resultRing}>
                <View style={s.resultRingInner}><Ionicons name="checkmark" size={40} color="#FFFFFF" /></View>
              </LinearGradient>
              <Text style={s.resultTitle}>You're ready to host</Text>
              <Text style={s.resultBody}>Your HOST profile is active and ready for event creation.</Text>
            </>
          ) : activationResult === 'action_required' ? (
            <>
              <Ionicons name="alert-circle" size={56} color="#F59E0B" style={{ marginBottom: 24 }} />
              <Text style={s.resultTitle}>Almost there</Text>
              <Text style={s.resultBody}>Complete these steps to activate HOST:</Text>
              <View style={s.missingList}>
                {missingFields.map((f) => (
                  <View key={f} style={s.missingRow}>
                    <Ionicons name="ellipse-outline" size={14} color="#F59E0B" />
                    <Text style={s.missingText}>{f}</Text>
                  </View>
                ))}
              </View>
            </>
          ) : (
            <>
              <Ionicons name="lock-closed" size={56} color={colors.textMuted} style={{ marginBottom: 24 }} />
              <Text style={s.resultTitle}>{activationResult === 'restricted' ? 'HOST access is limited' : 'HOST access unavailable'}</Text>
              <Text style={s.resultBody}>{activationResult === 'restricted' ? 'Additional checks needed before full hosting.' : 'Your account cannot access HOST mode.'}</Text>
            </>
          )}
        </View>
        <View style={[s.footer, { paddingBottom: insets.bottom + 16 }]}>
          {activationResult === 'active' ? (
            <>
              <TouchableOpacity style={s.primaryBtn} onPress={() => handleResultAction('create')} activeOpacity={0.88}>
                <Text style={s.primaryBtnText}>Create your first event</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleResultAction('overview')}><Text style={s.skipText}>Go to HOST Overview</Text></TouchableOpacity>
            </>
          ) : activationResult === 'action_required' ? (
            <>
              <TouchableOpacity style={s.primaryBtn} onPress={() => handleResultAction('resolve')} activeOpacity={0.88}>
                <Text style={s.primaryBtnText}>Resolve now</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleResultAction('back')}><Text style={s.skipText}>Back to ECHO</Text></TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity onPress={() => handleResultAction('back')}><Text style={s.skipText}>Back to ECHO</Text></TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <TouchableOpacity onPress={handleBack} style={s.backBtn}>
          <Ionicons name={activationStep === 'intro' ? 'close' : 'chevron-back'} size={22} color={colors.textHigh} />
        </TouchableOpacity>
        <Text style={s.headerLabel}>Become a Host</Text>
        <View style={{ width: 40 }} />
      </View>
      <View style={s.progressTrack}><View style={[s.progressFill, { width: `${progress}%` }]} /></View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {activationStep === 'intro' && (
          <View style={s.step}>
            <View style={{ alignItems: 'center', marginBottom: 32 }}>
              <LinearGradient colors={['#20C7FF', '#7B4DFF', '#E63DAD']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.introRing}>
                <View style={s.introRingInner}><Ionicons name="flash" size={32} color={colors.textHigh} /></View>
              </LinearGradient>
            </View>
            <Text style={s.stepTitle}>Become a Host</Text>
            <Text style={s.stepBody}>Create events, sell tickets, manage entry, and track performance on ECHO.</Text>
            {[{ i: 'rocket-outline', t: 'Create in minutes' }, { i: 'shield-checkmark-outline', t: 'Sell securely' }, { i: 'scan-outline', t: 'Run smooth entry' }].map(({ i, t }) => (
              <View key={t} style={s.benefitRow}><Ionicons name={i as never} size={20} color="#20C7FF" /><Text style={s.benefitText}>{t}</Text></View>
            ))}
          </View>
        )}

        {activationStep === 'basics' && (
          <View style={s.step}>
            <Text style={s.stepTitle}>Host basics</Text>
            <Text style={s.stepBody}>Tell us about your hosting.</Text>
            <Text style={s.fieldLabel}>Display name</Text>
            <TextInput style={s.input} value={profile.displayName} onChangeText={store.setDisplayName} placeholder="Your host or organization name" placeholderTextColor="rgba(255,255,255,0.28)" autoCapitalize="words" />
            <Text style={s.fieldLabel}>Host type</Text>
            <View style={s.chipGrid}>
              {(Object.entries(HOST_TYPE_LABELS) as [HostType, string][]).map(([k, l]) => (
                <TouchableOpacity key={k} style={[s.chip, profile.hostType === k && s.chipSel]} onPress={() => store.setHostType(k)} activeOpacity={0.82}>
                  <Text style={[s.chipText, profile.hostType === k && s.chipTextSel]}>{l}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={s.fieldLabel}>City</Text>
            {profile.city ? (
              <TouchableOpacity style={s.selCity} onPress={() => store.setCity('')}>
                <Ionicons name="location" size={16} color="#20C7FF" /><Text style={s.selCityText}>{profile.city}</Text><Ionicons name="close-circle" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            ) : (
              <>
                <TextInput style={s.input} value={citySearch} onChangeText={setCitySearch} placeholder="Search your city" placeholderTextColor="rgba(255,255,255,0.28)" />
                {(citySearch.trim() ? CITY_OPTIONS.filter(c => c.toLowerCase().includes(citySearch.toLowerCase())) : CITY_OPTIONS).slice(0, 6).map(c => (
                  <TouchableOpacity key={c} style={s.cityRow} onPress={() => { store.setCity(c); setCitySearch(''); }}>
                    <Ionicons name="location-outline" size={14} color={colors.textMuted} /><Text style={s.cityRowText}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </>
            )}
            <Text style={s.fieldLabel}>Event types you produce</Text>
            <View style={s.chipGrid}>
              {EVENT_TYPE_OPTIONS.map(t => (
                <TouchableOpacity key={t} style={[s.chip, profile.eventTypes.includes(t) && s.chipSel]} onPress={() => store.toggleEventType(t)} activeOpacity={0.82}>
                  <Text style={[s.chipText, profile.eventTypes.includes(t) && s.chipTextSel]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {activationStep === 'verification' && (
          <View style={s.step}>
            <Text style={s.stepTitle}>Verify your identity</Text>
            <Text style={s.stepBody}>Confirm your contact info to activate HOST.</Text>
            {[{ label: 'Email', done: emailVerified, icon: 'mail-outline', action: () => {} }, { label: 'Phone', done: phoneVerified, icon: 'call-outline', action: () => store.setPhoneVerified(true) }].map(({ label, done, icon, action }) => (
              <View key={label} style={s.verifyRow}>
                <View style={[s.verifyIcon, done && s.verifyIconDone]}><Ionicons name={done ? 'checkmark' : icon as never} size={18} color={done ? '#10B981' : colors.textMuted} /></View>
                <View style={{ flex: 1 }}><Text style={s.verifyTitle}>{label}</Text><Text style={s.verifyStatus}>{done ? 'Verified' : 'Not verified'}</Text></View>
                {done ? <Ionicons name="checkmark-circle" size={22} color="#10B981" /> : <TouchableOpacity style={s.verifyBtn} onPress={action}><Text style={s.verifyBtnText}>Verify</Text></TouchableOpacity>}
              </View>
            ))}
          </View>
        )}

        {activationStep === 'terms' && <TermsStep accepted={profile.termsAccepted} onAccept={store.acceptTerms} />}
      </ScrollView>

      <View style={[s.footer, { paddingBottom: insets.bottom + 16 }]}>
        {activationStep === 'terms' ? (
          <TouchableOpacity style={[s.primaryBtn, !store.canAdvanceFromStep('terms') && s.btnDisabled]} onPress={handleActivate} activeOpacity={0.88} disabled={!store.canAdvanceFromStep('terms')}>
            <Text style={s.primaryBtnText}>Activate HOST</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[s.primaryBtn, activationStep !== 'intro' && !store.canAdvanceFromStep(activationStep) && s.btnDisabled]} onPress={handleNext} activeOpacity={0.88} disabled={activationStep !== 'intro' && !store.canAdvanceFromStep(activationStep)}>
            <Text style={s.primaryBtnText}>Continue</Text>
          </TouchableOpacity>
        )}
        {activationStep === 'intro' && <TouchableOpacity onPress={() => router.back()}><Text style={s.skipText}>Not now</Text></TouchableOpacity>}
      </View>
    </View>
  );
}

function TermsStep({ accepted, onAccept }: { accepted: boolean; onAccept: () => void }) {
  const [checks, setChecks] = useState({ terms: false, authorized: false, standards: false });
  const allChecked = checks.terms && checks.authorized && checks.standards;
  React.useEffect(() => { if (allChecked && !accepted) onAccept(); }, [allChecked]);
  const toggle = (k: keyof typeof checks) => setChecks(p => ({ ...p, [k]: !p[k] }));

  return (
    <View style={s.step}>
      <Text style={s.stepTitle}>Accept terms</Text>
      <Text style={s.stepBody}>Review and accept to activate your HOST profile.</Text>
      {([
        { key: 'terms' as const, label: 'I agree to Host Terms of Service' },
        { key: 'authorized' as const, label: 'I confirm I am authorized to organize events I publish' },
        { key: 'standards' as const, label: 'I agree to platform standards and payout requirements' },
      ]).map(({ key, label }) => (
        <TouchableOpacity key={key} style={s.checkRow} onPress={() => toggle(key)} activeOpacity={0.82}>
          <View style={[s.checkbox, checks[key] && s.checkboxChecked]}>{checks[key] && <Ionicons name="checkmark" size={14} color="#0F1115" />}</View>
          <Text style={s.checkLabel}>{label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.04)' },
  headerLabel: { fontSize: 16, fontWeight: '700', color: colors.textHigh },
  progressTrack: { height: 4, backgroundColor: 'rgba(255,255,255,0.08)', marginHorizontal: 20, borderRadius: 2, marginTop: 4 },
  progressFill: { height: 4, backgroundColor: '#20C7FF', borderRadius: 2 },
  step: { paddingHorizontal: 24, paddingTop: 32 },
  stepTitle: { fontSize: 28, fontWeight: '700', color: colors.textHigh, marginBottom: 8 },
  stepBody: { fontSize: 16, color: 'rgba(255,255,255,0.55)', lineHeight: 24, marginBottom: 28 },
  footer: { paddingHorizontal: 24, gap: 14, alignItems: 'center', paddingTop: 12 },
  primaryBtn: { width: '100%', height: 56, borderRadius: 28, backgroundColor: '#20C7FF', alignItems: 'center', justifyContent: 'center' },
  btnDisabled: { backgroundColor: 'rgba(32,199,255,0.25)' },
  primaryBtnText: { fontSize: 17, fontWeight: '700', color: '#0F1115' },
  skipText: { fontSize: 15, color: colors.textMuted },
  introRing: { width: 88, height: 88, borderRadius: 44, padding: 3 },
  introRingInner: { flex: 1, borderRadius: 41, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 18 },
  benefitText: { fontSize: 16, fontWeight: '600', color: colors.textHigh },
  fieldLabel: { fontSize: 14, fontWeight: '700', color: 'rgba(255,255,255,0.55)', letterSpacing: 0.4, marginBottom: 10, marginTop: 20 },
  input: { height: 52, borderRadius: 16, paddingHorizontal: 16, fontSize: 16, color: colors.textHigh, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  chipSel: { backgroundColor: 'rgba(32,199,255,0.12)', borderColor: 'rgba(32,199,255,0.40)' },
  chipText: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.55)' },
  chipTextSel: { color: '#20C7FF' },
  selCity: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14, borderRadius: 16, backgroundColor: 'rgba(32,199,255,0.08)', borderWidth: 1, borderColor: 'rgba(32,199,255,0.25)' },
  selCityText: { flex: 1, fontSize: 16, fontWeight: '600', color: colors.textHigh },
  cityRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 8 },
  cityRowText: { fontSize: 15, color: 'rgba(255,255,255,0.70)' },
  verifyRow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', marginBottom: 14 },
  verifyIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
  verifyIconDone: { backgroundColor: 'rgba(16,185,129,0.12)' },
  verifyTitle: { fontSize: 16, fontWeight: '700', color: colors.textHigh },
  verifyStatus: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  verifyBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16, backgroundColor: 'rgba(32,199,255,0.15)' },
  verifyBtnText: { fontSize: 13, fontWeight: '700', color: '#20C7FF' },
  checkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, marginBottom: 20 },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  checkboxChecked: { backgroundColor: '#20C7FF', borderColor: '#20C7FF' },
  checkLabel: { flex: 1, fontSize: 15, color: 'rgba(255,255,255,0.75)', lineHeight: 22 },
  resultWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  resultRing: { width: 96, height: 96, borderRadius: 48, padding: 3, marginBottom: 32 },
  resultRingInner: { flex: 1, borderRadius: 45, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  resultTitle: { fontSize: 28, fontWeight: '700', color: colors.textHigh, textAlign: 'center', marginBottom: 12 },
  resultBody: { fontSize: 16, color: 'rgba(255,255,255,0.55)', textAlign: 'center', lineHeight: 24, maxWidth: 320 },
  missingList: { gap: 12, marginTop: 24, width: '100%' },
  missingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  missingText: { fontSize: 15, color: '#F59E0B' },
});
