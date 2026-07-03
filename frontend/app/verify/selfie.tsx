/**
 * Step 3 of 3 — Selfie Verification (Image 3 right)
 * Front camera with circular face guide. "Hold Still..." indicator.
 */
import React, { useState, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, StatusBar, Dimensions, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radii } from '../../theme/tokens';
import { Text } from '../../components/ui';
import { logEvent, useValueTransitionLogger } from '../../services/logging';

import { ScreenBackButton } from '../../components/shared/ScreenBackButton';
const { width: W } = Dimensions.get('window');
const FACE_SIZE = W * 0.65;

let CameraView: any = null;
try { CameraView = require('expo-camera').CameraView; } catch {}

export default function SelfieScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ eventId?: string; returnTo?: string; qty?: string; quantity?: string; ticketTypeId?: string; selections?: string; eventTitle?: string; ageRequirement?: string }>();
  const { eventId } = params;
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [capturing, setCapturing] = useState(false);

  useValueTransitionLogger('verification.selfie', 'cameraPermission', hasPermission, { logInitial: true });
  useValueTransitionLogger('verification.selfie', 'capturing', capturing);

  React.useEffect(() => {
    (async () => {
      try {
        const { Camera } = require('expo-camera');
        const { status } = await Camera.requestCameraPermissionsAsync();
        setHasPermission(status === 'granted');
      } catch {
        setHasPermission(false);
      }
    })();
  }, []);

  const handleCapture = () => {
    if (capturing) return;
    logEvent('verification.selfie', 'capture_started', { eventId });
    setCapturing(true);
    setTimeout(() => {
      setCapturing(false);
      logEvent('verification.selfie', 'capture_completed', { eventId, advancedTo: '/verify/processing' });
      router.replace({ pathname: '/verify/processing', params });
    }, 2000);
  };

  const handleSkip = () => {
    logEvent('verification.selfie', 'camera_skipped', { eventId });
    router.replace({ pathname: '/verify/processing', params });
  };

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      <View style={s.header}>
        <ScreenBackButton color={colors.text} />
        <Text style={s.headerTitle}>ECHO</Text>
        <View style={s.backBtn} />
      </View>

      <Text style={s.title}>Selfie Verification</Text>
      <Text style={s.stepLabel}>Step 3 of 3. Verify your identity</Text>

      {/* Camera with circular face guide */}
      <View style={s.cameraWrap}>
        {hasPermission && CameraView ? (
          <CameraView style={s.camera} facing="front" />
        ) : (
          <View style={[s.camera, s.placeholder]}>
            <Ionicons name="person-outline" size={64} color="rgba(255,255,255,0.15)" />
          </View>
        )}
        {/* Face frame */}
        <View style={s.faceOverlay}>
          <View style={s.faceFrame} />
        </View>
      </View>

      <Text style={s.instruction}>Smile and follow the prompts.</Text>

      {/* Capture button or hold still */}
      <View style={s.actions}>
        {capturing ? (
          <View style={s.holdRow}>
            <View style={s.holdDot} />
            <Text style={s.holdText}>Hold Still...</Text>
          </View>
        ) : (
          <TouchableOpacity style={s.captureBtn} onPress={hasPermission ? handleCapture : handleSkip} activeOpacity={0.8}>
            <View style={s.captureRing}>
              <View style={s.captureInner} />
            </View>
          </TouchableOpacity>
        )}
      </View>

      {!hasPermission && (
        <TouchableOpacity style={s.skipBtn} onPress={handleSkip}>
          <Text style={s.skipText}>Continue without camera</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 8 },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.04)' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.text, letterSpacing: 2 },
  title: { fontSize: 24, fontWeight: '700', color: colors.text, textAlign: 'center', marginBottom: 4 },
  stepLabel: { fontSize: 13, color: 'rgba(255,255,255,0.50)', textAlign: 'center', marginBottom: 24 },
  cameraWrap: { width: FACE_SIZE + 32, height: FACE_SIZE + 64, alignSelf: 'center', borderRadius: radii.lg, overflow: 'hidden', position: 'relative' },
  camera: { width: '100%', height: '100%', backgroundColor: '#0A0C10' },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  faceOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  faceFrame: { width: FACE_SIZE * 0.75, height: FACE_SIZE * 0.95, borderRadius: FACE_SIZE * 0.38, borderWidth: 2.5, borderColor: 'rgba(139,92,246,0.50)' },
  instruction: { fontSize: 15, color: 'rgba(255,255,255,0.55)', textAlign: 'center', marginTop: 20, marginBottom: 32 },
  actions: { alignItems: 'center' },
  captureBtn: { alignItems: 'center', justifyContent: 'center' },
  captureRing: { width: 72, height: 72, borderRadius: 36, borderWidth: 4, borderColor: 'rgba(139,92,246,0.50)', alignItems: 'center', justifyContent: 'center' },
  captureInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#7B4DFF' },
  holdRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 20 },
  holdDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#EF4444' },
  holdText: { fontSize: 16, fontWeight: '600', color: 'rgba(255,255,255,0.70)' },
  skipBtn: { alignSelf: 'center', marginTop: 20, paddingVertical: 10 },
  skipText: { fontSize: 14, color: 'rgba(255,255,255,0.40)', textDecorationLine: 'underline' },
});
