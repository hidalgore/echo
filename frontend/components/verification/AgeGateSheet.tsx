/**
 * AgeGateSheet — Bottom sheet overlay (Image 1 reference)
 * Appears over event detail when unverified user views 18+/21+ event.
 * CTAs: Verify Now → starts flow, Continue Browsing → dismisses.
 * Trust badges: Secure · Private · One-time verification
 */
import React from 'react';
import { View, Modal, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radii } from '../../theme/tokens';
import { Text } from '../ui';

type Props = {
  visible: boolean;
  onClose: () => void;
  eventTitle: string;
  ageRequirement: 18 | 21;
  eventId: string;
  checkoutReturnParams?: Record<string, string | number | undefined>;
};

export function AgeGateSheet({ visible, onClose, eventTitle, ageRequirement, eventId, checkoutReturnParams }: Props) {
  const handleVerifyNow = () => {
    onClose();
    router.push({ pathname: '/verify/method', params: { eventTitle, ageRequirement: String(ageRequirement), eventId, returnTo: checkoutReturnParams ? '/checkout/restore' : `/event/${eventId}`, ...(checkoutReturnParams || {}) } });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={s.scrim} activeOpacity={1} onPress={onClose}>
        <View style={s.sheet}>
          <TouchableOpacity activeOpacity={1}>
            <View style={s.handle} />

            {/* Icon cluster */}
            <View style={s.iconRow}>
              <View style={s.shieldWrap}>
                <Ionicons name="shield-checkmark-outline" size={28} color="rgba(139,92,246,0.80)" />
              </View>
              <View style={[s.shieldWrap, { marginLeft: -8 }]}>
                <Ionicons name="id-card-outline" size={24} color="rgba(139,92,246,0.60)" />
              </View>
            </View>

            <Text style={s.title}>Verify your age to continue</Text>
            <Text style={s.subtitle}>
              This event requires age confirmation before checkout.
            </Text>
            <Text style={s.highlight}>
              Verify once to access all {ageRequirement}+ events on ECHO.
            </Text>

            {/* Verify Now CTA */}
            <TouchableOpacity style={s.verifyBtn} onPress={handleVerifyNow} activeOpacity={0.85}>
              <LinearGradient
                colors={['#7B4DFF', '#7C3AED', '#6D28D9']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={s.verifyGradient}
              >
                <Text style={s.verifyText}>Verify Now</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Continue Browsing */}
            <TouchableOpacity style={s.browseBtn} onPress={onClose} activeOpacity={0.7}>
              <Text style={s.browseText}>Continue Browsing</Text>
            </TouchableOpacity>

            {/* Trust badges */}
            <View style={s.trustRow}>
              {['Secure', 'Private', 'One-time verification'].map((label, i) => (
                <View key={i} style={s.trustBadge}>
                  <Ionicons name="checkmark-outline" size={12} color="rgba(139,92,246,0.70)" />
                  <Text style={s.trustLabel}>{label}</Text>
                </View>
              ))}
            </View>

            {/* Info note */}
            <View style={s.infoBox}>
              <Text style={s.infoText}>
                You'll be asked to scan a government ID and take a quick selfie.
              </Text>
            </View>

            {/* Footer */}
            <Text style={s.footer}>
              Secure verification powered by trusted identity technology.{'\n'}
              ECHO stores only what is necessary.
            </Text>
            <TouchableOpacity style={s.learnMore}>
              <Text style={s.learnMoreText}>How verification works</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const s = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#151820', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 24, paddingBottom: Platform.OS === 'ios' ? 44 : 24,
    borderWidth: 1, borderColor: 'rgba(139,92,246,0.15)', borderBottomWidth: 0,
  },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.15)', alignSelf: 'center', marginTop: 12, marginBottom: 24 },
  iconRow: { flexDirection: 'row', alignSelf: 'center', marginBottom: 20 },
  shieldWrap: { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(139,92,246,0.10)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(139,92,246,0.15)' },
  title: { fontSize: 22, fontWeight: '700', color: colors.text, textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 15, color: 'rgba(255,255,255,0.55)', textAlign: 'center', lineHeight: 22, marginBottom: 4 },
  highlight: { fontSize: 14, color: 'rgba(255,255,255,0.70)', textAlign: 'center', marginBottom: 20 },
  verifyBtn: { borderRadius: radii.md, overflow: 'hidden', marginBottom: 10 },
  verifyGradient: { paddingVertical: 16, alignItems: 'center', borderRadius: radii.md },
  verifyText: { fontSize: 17, fontWeight: '700', color: '#FFF', letterSpacing: 0.3 },
  browseBtn: { borderRadius: radii.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', paddingVertical: 14, alignItems: 'center', marginBottom: 16 },
  browseText: { fontSize: 16, fontWeight: '600', color: colors.text },
  trustRow: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 16 },
  trustBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  trustLabel: { fontSize: 12, color: 'rgba(255,255,255,0.50)' },
  infoBox: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: radii.sm, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', padding: 14, marginBottom: 16 },
  infoText: { fontSize: 13, color: 'rgba(255,255,255,0.50)', textAlign: 'center', lineHeight: 20 },
  footer: { fontSize: 12, color: 'rgba(255,255,255,0.35)', textAlign: 'center', lineHeight: 18, marginBottom: 8 },
  learnMore: { alignSelf: 'center', paddingVertical: 4 },
  learnMoreText: { fontSize: 13, fontWeight: '500', color: 'rgba(139,92,246,0.70)', textDecorationLine: 'underline' },
});
