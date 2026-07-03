/**
 * Host Mode — Route Guard + Outer Stack
 * ══════════════════════════════════════
 * Checks canAccessHostMode before rendering HOST screens.
 * If not authorized, shows inline lock screen with Activate HOST CTA.
 */
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/tokens';
import { Text } from '../../components/ui';
import { useModeStore } from '../../stores/modeStore';

export default function HostLayout() {
  const insets = useSafeAreaInsets();
  const { capabilities, hostAccessStatus } = useModeStore();

  // ── Route guard: block if HOST not accessible ──
  if (!capabilities.canAccessHostMode) {
    return (
      <View style={[styles.lockScreen, { paddingTop: insets.top }]}>
        {/* Back to ECHO */}
        <TouchableOpacity style={styles.backBtn} onPress={() => router.replace('/(tabs)')}>
          <Ionicons name="chevron-back" size={22} color={colors.textHigh} />
        </TouchableOpacity>

        <View style={styles.lockContent}>
          {/* Lock icon with gradient ring */}
          <LinearGradient
            colors={['#20C7FF', '#7B4DFF', '#E63DAD']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.lockRing}
          >
            <View style={styles.lockRingInner}>
              <Ionicons name="lock-closed" size={32} color="rgba(255,255,255,0.70)" />
            </View>
          </LinearGradient>

          <Text style={styles.lockTitle}>HOST mode is locked</Text>
          <Text style={styles.lockBody}>
            {hostAccessStatus === 'suspended'
              ? 'Your HOST access has been suspended. Contact support for assistance.'
              : 'Activate HOST to create events, sell tickets, and manage entry on ECHO.'}
          </Text>

          {hostAccessStatus !== 'suspended' && (
            <TouchableOpacity
              style={styles.activateBtn}
              onPress={() => router.replace('/host-application')}
              activeOpacity={0.88}
            >
              <Ionicons name="flash" size={18} color="#0F1115" />
              <Text style={styles.activateBtnText}>Activate HOST</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity onPress={() => router.replace('/(tabs)')} activeOpacity={0.82}>
            <Text style={styles.backLink}>Back to ECHO</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Authorized: render HOST screens ──
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="create" />
      <Stack.Screen name="event-detail" />
      <Stack.Screen name="flyer-upload" />
      <Stack.Screen name="flyer-processing" options={{ gestureEnabled: false }} />
      <Stack.Screen name="scan-error" />
      <Stack.Screen name="ai-enhance" />
      <Stack.Screen name="preview-edit" />
      <Stack.Screen name="publish" options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="success" options={{ gestureEnabled: false }} />
      <Stack.Screen name="nonprofit" />
      <Stack.Screen name="recap" />
      <Stack.Screen name="payout-required" options={{ animation: 'slide_from_bottom', gestureEnabled: false }} />
      <Stack.Screen name="web-handoff" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="edit-profile" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="passcode" />
      <Stack.Screen name="payout-settings" />
      <Stack.Screen name="support" />
      <Stack.Screen name="social-settings" />
      <Stack.Screen name="promote" />
      <Stack.Screen name="promotion-history" />
    </Stack>
  );
}

const styles = StyleSheet.create({
  lockScreen: { flex: 1, backgroundColor: '#0F1115' },
  backBtn: {
    width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)', marginLeft: 16, marginTop: 12,
  },
  lockContent: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  lockRing: { width: 96, height: 96, borderRadius: 48, padding: 3, marginBottom: 32 },
  lockRingInner: {
    flex: 1, borderRadius: 45, backgroundColor: '#0F1115',
    alignItems: 'center', justifyContent: 'center',
  },
  lockTitle: { fontSize: 26, fontWeight: '700', color: '#F5F7FB', textAlign: 'center', marginBottom: 12 },
  lockBody: { fontSize: 16, color: 'rgba(255,255,255,0.55)', textAlign: 'center', lineHeight: 24, maxWidth: 300, marginBottom: 32 },
  activateBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    height: 56, paddingHorizontal: 28, borderRadius: 28,
    backgroundColor: '#20C7FF',
  },
  activateBtnText: { fontSize: 17, fontWeight: '700', color: '#0F1115' },
  backLink: { fontSize: 15, color: 'rgba(255,255,255,0.38)', marginTop: 20 },
});
