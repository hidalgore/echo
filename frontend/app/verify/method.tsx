/**
 * Step 1 of 3 — Choose verification method
 * Image 3 left reference: Gov ID (~30s), Digital Wallet (~10s), Verify during checkout (defer)
 */
import React from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radii } from '../../theme/tokens';
import { Text } from '../../components/ui';
import { useVerificationStore } from '../../stores/verificationStore';
import { logEvent } from '../../services/logging';

import { ScreenBackButton } from '../../components/shared/ScreenBackButton';
export default function VerifyMethodScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ eventTitle?: string; ageRequirement?: string; eventId?: string; returnTo?: string; qty?: string; quantity?: string; ticketTypeId?: string; selections?: string }>();
  const { eventTitle, ageRequirement, eventId } = params;
  const returnParams = { eventTitle, ageRequirement, eventId, returnTo: params.returnTo, qty: params.qty, quantity: params.quantity, ticketTypeId: params.ticketTypeId, selections: params.selections };
  const { startVerification, skipVerification } = useVerificationStore();

  const handleGovId = () => {
    logEvent('verification.method', 'method_selected', { method: 'government_id', eventId, ageRequirement });
    startVerification('government_id');
    router.push({ pathname: '/verify/id-scan', params: returnParams });
  };

  const handleDigitalWallet = () => {
    logEvent('verification.method', 'method_selected', { method: 'digital_wallet', eventId, ageRequirement });
    startVerification('digital_wallet');
    router.push({ pathname: '/verify/processing', params: returnParams });
  };

  const handleDefer = () => {
    logEvent('verification.method', 'verification_deferred', { eventId, ageRequirement });
    skipVerification();
    if (params.returnTo === '/checkout/restore' && eventId) {
      router.replace({ pathname: '/event/[id]', params: { id: eventId } });
    } else {
      router.back();
    }
  };

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      {/* Header */}
      <View style={s.header}>
        <ScreenBackButton color={colors.text} />
        <Text style={s.headerTitle}>ECHO</Text>
        <View style={s.backBtn} />
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <Text style={s.title}>Age Verification</Text>
        {eventTitle && (
          <Text style={s.eventContext}>{eventTitle} {'\u00B7'} {ageRequirement || '21'}+ Event</Text>
        )}

        <Text style={s.stepLabel}>Step 1 of 3. Choose verification method</Text>

        {/* Government ID */}
        <TouchableOpacity style={s.methodCard} onPress={handleGovId} activeOpacity={0.8}>
          <View style={s.methodIcon}>
            <Ionicons name="id-card-outline" size={22} color="rgba(255,255,255,0.70)" />
          </View>
          <View style={s.methodContent}>
            <Text style={s.methodTitle}>Government ID</Text>
            <Text style={s.methodSub}>Scan driver's license or passport</Text>
            <Text style={s.methodTime}>~30 seconds</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.25)" />
        </TouchableOpacity>

        {/* Digital Wallet */}
        <TouchableOpacity style={s.methodCard} onPress={handleDigitalWallet} activeOpacity={0.8}>
          <View style={s.methodIcon}>
            <Ionicons name="wallet-outline" size={22} color="rgba(255,255,255,0.70)" />
          </View>
          <View style={s.methodContent}>
            <Text style={s.methodTitle}>Digital wallet / verified identity</Text>
            <Text style={s.methodSub}>Via Apple Wallet or identity apps</Text>
            <View style={s.recRow}>
              <View style={s.recBadge}><Text style={s.recText}>Recommended</Text></View>
              <Text style={s.methodTime}>~10 seconds</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.25)" />
        </TouchableOpacity>

        {/* Defer */}
        <TouchableOpacity style={[s.methodCard, s.methodCardDim]} onPress={handleDefer} activeOpacity={0.8}>
          <View style={s.methodIcon}>
            <Ionicons name="time-outline" size={22} color="rgba(255,255,255,0.45)" />
          </View>
          <View style={s.methodContent}>
            <Text style={[s.methodTitle, { color: 'rgba(255,255,255,0.55)' }]}>Verify during checkout</Text>
            <Text style={s.methodSub}>Only if required</Text>
          </View>
        </TouchableOpacity>

        {/* Trust footer */}
        <View style={s.trustRow}>
          <Ionicons name="lock-closed-outline" size={14} color="rgba(139,92,246,0.60)" />
          <Text style={s.trustText}>Secure {'\u00B7'} Private {'\u00B7'} One time verification</Text>
        </View>
        <Text style={s.disclaimer}>Verification methods may vary by region and provider.</Text>
        <TouchableOpacity style={s.learnBtn}>
          <Text style={s.learnText}>How verification works</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 8 },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.04)' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.text, letterSpacing: 2 },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },
  title: { fontSize: 26, fontWeight: '700', color: colors.text, marginBottom: 8 },
  eventContext: { fontSize: 14, color: 'rgba(255,255,255,0.55)', marginBottom: 20 },
  stepLabel: { fontSize: 13, fontWeight: '600', color: '#7B4DFF', marginBottom: 20 },
  methodCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: radii.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', padding: 16, marginBottom: 12, minHeight: 80 },
  methodCardDim: { borderColor: 'rgba(255,255,255,0.05)', backgroundColor: 'rgba(255,255,255,0.02)' },
  methodIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  methodContent: { flex: 1 },
  methodTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 2 },
  methodSub: { fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 2 },
  methodTime: { fontSize: 12, color: 'rgba(255,255,255,0.35)' },
  recRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  recBadge: { backgroundColor: 'rgba(139,92,246,0.15)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  recText: { fontSize: 10, fontWeight: '700', color: '#7B4DFF', letterSpacing: 0.3 },
  trustRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 24, marginBottom: 12 },
  trustText: { fontSize: 13, color: 'rgba(255,255,255,0.45)' },
  disclaimer: { fontSize: 12, color: 'rgba(255,255,255,0.30)', textAlign: 'center', marginBottom: 12 },
  learnBtn: { alignSelf: 'center' },
  learnText: { fontSize: 13, fontWeight: '500', color: 'rgba(139,92,246,0.70)', textDecorationLine: 'underline' },
});
