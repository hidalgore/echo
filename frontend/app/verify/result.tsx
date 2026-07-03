/**
 * Verification Result Screen
 * Verified: green shield, "Age Verified", Continue CTA → back to event
 * Failed: red shield, "Verification Failed", Retry / Choose Another Option / Contact Support
 * 3 retry attempts then locked.
 */
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, StatusBar, Animated, Linking } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radii } from '../../theme/tokens';
import { Text } from '../../components/ui';
import { useVerificationStore } from '../../stores/verificationStore';
import { logEvent, useValueTransitionLogger } from '../../services/logging';
import { saveMockAgeVerification } from '../../services/ageVerificationPersistence';

export default function VerifyResultScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ eventId?: string; returnTo?: string; qty?: string; quantity?: string; ticketTypeId?: string; selections?: string; eventTitle?: string; ageRequirement?: string }>();
  const { eventId } = params;
  const { status, verifiedAgeBand, isLocked, canRetry, resetToUnverified, attemptCount } = useVerificationStore();

  useValueTransitionLogger('verification.result', 'status', status, { logInitial: true });

  const isVerified = status === 'verified';
  const shieldScale = useRef(new Animated.Value(0.5)).current;
  const contentFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(shieldScale, { toValue: 1, tension: 80, friction: 6, useNativeDriver: true }),
      Animated.timing(contentFade, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleContinue = () => {
    logEvent('verification.result', 'continue_pressed', { eventId, status, verifiedAgeBand });
    if (status === 'verified') {
      void saveMockAgeVerification(verifiedAgeBand === '21_plus' ? '21+' : '18+');
    }
    if (params.returnTo === '/checkout/restore' && eventId) {
      const qty = Number.parseInt(params.qty || params.quantity || '1', 10) || 1;
      const pathname = qty >= 2 ? '/checkout/choose-payment' : '/checkout/single-checkout';
      router.replace({ pathname, params: { eventId, qty: String(qty), quantity: String(qty), ticketTypeId: params.ticketTypeId, selections: params.selections } });
    } else if (eventId) {
      router.replace(`/event/${eventId}`);
    } else {
      router.replace('/(tabs)');
    }
  };

  const handleRetry = () => {
    logEvent('verification.result', 'retry_pressed', { eventId, attemptCount });
    resetToUnverified();
    router.replace({ pathname: '/verify/method', params });
  };

  const handleChooseAnother = () => {
    logEvent('verification.result', 'choose_another_pressed', { eventId, attemptCount });
    resetToUnverified();
    router.replace({ pathname: '/verify/method', params });
  };

  const handleContactSupport = () => {
    logEvent('verification.result', 'contact_support_pressed', { eventId, status, isLocked, attemptCount });
    Linking.openURL('mailto:support@getechoaccess.com?subject=Age%20Verification%20Help');
  };

  const bandLabel = verifiedAgeBand === '21_plus' ? '21+' : '18+';

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      <View style={s.header}>
        <Text style={s.headerTitle}>ECHO</Text>
      </View>

      {isVerified ? (
        /* ═══ VERIFIED STATE ═══ */
        <View style={s.center}>
          <Animated.Text style={[s.title, s.titleGreen, { opacity: contentFade }]}>
            Age Verified
          </Animated.Text>
          <Animated.Text style={[s.subtitle, { opacity: contentFade }]}>
            You're all set!
          </Animated.Text>

          {/* Green shield */}
          <Animated.View style={[s.shieldWrap, s.shieldGreen, { transform: [{ scale: shieldScale }] }]}>
            <Ionicons name="checkmark" size={56} color="#10B981" />
          </Animated.View>

          <Animated.View style={{ opacity: contentFade, width: '100%', paddingHorizontal: 24 }}>
            <Text style={s.accessNote}>You can now access {bandLabel} events.</Text>

            <TouchableOpacity style={s.continueBtn} onPress={handleContinue} activeOpacity={0.8}>
              <Text style={s.continueBtnText}>Continue</Text>
            </TouchableOpacity>

            <Text style={s.profileNote}>Added to your ECHO profile</Text>
            <Text style={s.enjoyNote}>Securely verified. Enjoy the event!</Text>
          </Animated.View>
        </View>
      ) : (
        /* ═══ FAILED STATE ═══ */
        <View style={s.center}>
          <Animated.Text style={[s.title, s.titleRed, { opacity: contentFade }]}>
            Verification Failed
          </Animated.Text>

          {/* Red shield */}
          <Animated.View style={[s.shieldWrap, s.shieldRed, { transform: [{ scale: shieldScale }] }]}>
            <Ionicons name="alert" size={48} color="#EF4444" />
          </Animated.View>

          <Animated.View style={{ opacity: contentFade, width: '100%', paddingHorizontal: 24 }}>
            <Text style={s.failReason}>We couldn't verify your ID.</Text>
            <Text style={s.failSub}>
              {isLocked
                ? 'Maximum attempts reached. Please contact support.'
                : `Try again or use another method. (${3 - attemptCount} attempt${3 - attemptCount !== 1 ? 's' : ''} remaining)`
              }
            </Text>

            {!isLocked && canRetry() ? (
              <>
                <TouchableOpacity style={s.retryBtn} onPress={handleRetry} activeOpacity={0.85}>
                  <LinearGradient
                    colors={['#EF4444', '#DC2626']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={s.retryGradient}
                  >
                    <Text style={s.retryText}>Retry</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity style={s.altBtn} onPress={handleChooseAnother} activeOpacity={0.7}>
                  <Text style={s.altBtnText}>Choose Another Option</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity style={s.supportBtn} onPress={handleContactSupport} activeOpacity={0.8}>
                <Ionicons name="chatbubble-ellipses-outline" size={18} color="#FFF" />
                <Text style={s.supportText}>Contact Support</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={s.helpRow} onPress={handleContactSupport}>
              <Text style={s.helpText}>Need help? </Text>
              <Text style={s.helpLink}>Contact support</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { alignItems: 'center', paddingVertical: 16 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.text, letterSpacing: 2 },
  center: { flex: 1, alignItems: 'center', paddingTop: 20 },
  title: { fontSize: 28, fontWeight: '700', textAlign: 'center', marginBottom: 4 },
  titleGreen: { color: colors.text },
  titleRed: { color: colors.text },
  subtitle: { fontSize: 16, color: 'rgba(255,255,255,0.60)', marginBottom: 28 },

  // Shields
  shieldWrap: { width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center', marginBottom: 28 },
  shieldGreen: { backgroundColor: 'rgba(16,185,129,0.12)', borderWidth: 2, borderColor: 'rgba(16,185,129,0.30)' },
  shieldRed: { backgroundColor: 'rgba(239,68,68,0.10)', borderWidth: 2, borderColor: 'rgba(239,68,68,0.25)' },

  // Verified
  accessNote: { fontSize: 16, color: 'rgba(255,255,255,0.65)', textAlign: 'center', marginBottom: 24 },
  continueBtn: { backgroundColor: 'rgba(255,255,255,0.10)', borderRadius: radii.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', paddingVertical: 16, alignItems: 'center', marginBottom: 20 },
  continueBtnText: { fontSize: 17, fontWeight: '600', color: colors.text },
  profileNote: { fontSize: 13, color: 'rgba(255,255,255,0.40)', textAlign: 'center', marginBottom: 4 },
  enjoyNote: { fontSize: 14, color: 'rgba(255,255,255,0.50)', textAlign: 'center' },

  // Failed
  failReason: { fontSize: 17, fontWeight: '600', color: 'rgba(255,255,255,0.80)', textAlign: 'center', marginBottom: 4 },
  failSub: { fontSize: 14, color: 'rgba(255,255,255,0.45)', textAlign: 'center', marginBottom: 24 },
  retryBtn: { borderRadius: radii.md, overflow: 'hidden', marginBottom: 10 },
  retryGradient: { paddingVertical: 16, alignItems: 'center', borderRadius: radii.md },
  retryText: { fontSize: 17, fontWeight: '700', color: '#FFF' },
  altBtn: { borderRadius: radii.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', paddingVertical: 14, alignItems: 'center', marginBottom: 20 },
  altBtnText: { fontSize: 16, fontWeight: '600', color: colors.text },
  supportBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'rgba(239,68,68,0.15)', borderRadius: radii.md, borderWidth: 1, borderColor: 'rgba(239,68,68,0.25)', paddingVertical: 16, marginBottom: 20 },
  supportText: { fontSize: 16, fontWeight: '600', color: '#FFF' },
  helpRow: { flexDirection: 'row', alignSelf: 'center' },
  helpText: { fontSize: 13, color: 'rgba(255,255,255,0.40)' },
  helpLink: { fontSize: 13, color: 'rgba(139,92,246,0.70)', textDecorationLine: 'underline' },
});
