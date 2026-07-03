/**
 * Payout Required to Publish
 * ══════════════════════════
 * Shown when a paid event tries to publish without payout setup.
 * Draft is preserved. Host can connect payouts or save draft.
 */
import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius } from '../../theme/hostTokens';
import { Text } from '../../components/ui';

export default function PayoutRequiredScreen() {
  const insets = useSafeAreaInsets();

  const handleConnectPayouts = () => {
    router.replace('/(host)/payout-settings');
  };

  const handleSaveDraft = () => {
    router.dismissAll();
    router.replace('/(host)/(tabs)/events');
  };

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={handleSaveDraft} style={s.closeBtn} activeOpacity={0.85}>
          <Ionicons name="close" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <View style={s.content}>
        {/* Icon */}
        <LinearGradient
          colors={['#F59E0B', '#EF4444']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.iconRing}
        >
          <View style={s.iconInner}>
            <Ionicons name="wallet-outline" size={36} color="#F59E0B" />
          </View>
        </LinearGradient>

        <Text style={s.title}>Connect payouts to publish paid events</Text>
        <Text style={s.body}>
          Your event draft is saved. Connect your payout account to start selling tickets and receiving payments.
        </Text>

        {/* Trust indicators */}
        <View style={s.trustRow}>
          <TrustItem icon="shield-checkmark-outline" text="Secure payout processing" />
          <TrustItem icon="time-outline" text="Payouts within 2-5 business days" />
          <TrustItem icon="lock-closed-outline" text="Your draft progress is preserved" />
        </View>
      </View>

      {/* CTAs */}
      <View style={[s.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity style={s.connectBtn} onPress={handleConnectPayouts} activeOpacity={0.88}>
          <Ionicons name="wallet" size={18} color={colors.bg} />
          <Text style={s.connectBtnText}>Connect payouts</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleSaveDraft} activeOpacity={0.82}>
          <Text style={s.saveDraftText}>Save draft for later</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function TrustItem({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={s.trustItem}>
      <Ionicons name={icon as never} size={16} color="rgba(255,255,255,0.45)" />
      <Text style={s.trustItemText}>{text}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: 16, paddingVertical: 12 },
  closeBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  iconRing: { width: 88, height: 88, borderRadius: 44, padding: 3, marginBottom: 28 },
  iconInner: {
    flex: 1, borderRadius: 41, backgroundColor: colors.bg,
    alignItems: 'center', justifyContent: 'center',
  },
  title: {
    fontSize: 24, fontWeight: '700', color: colors.textPrimary,
    textAlign: 'center', marginBottom: 14, lineHeight: 30,
  },
  body: {
    fontSize: 15, color: colors.textSecondary, textAlign: 'center',
    lineHeight: 22, maxWidth: 320, marginBottom: 32,
  },
  trustRow: { gap: 14, width: '100%' },
  trustItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  trustItemText: { fontSize: 14, color: 'rgba(255,255,255,0.55)' },
  footer: { paddingHorizontal: 24, gap: 16, alignItems: 'center' },
  connectBtn: {
    width: '100%', height: 56, borderRadius: radius.pill,
    backgroundColor: '#F59E0B', flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  connectBtnText: { fontSize: 17, fontWeight: '700', color: colors.bg },
  saveDraftText: { fontSize: 15, color: colors.textTertiary },
});
