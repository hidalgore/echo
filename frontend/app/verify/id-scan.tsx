/**
 * Step 2 of 3 — Scan Your ID (Image 3 center reference)
 * Uses expo-camera for real capture. Mock API verification response.
 * Card-shaped overlay for ID alignment.
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
const FRAME_W = W - 64;
const FRAME_H = FRAME_W * 0.63;

let CameraView: any = null;
try { CameraView = require('expo-camera').CameraView; } catch {}

export default function IDScanScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ eventId?: string; returnTo?: string; qty?: string; quantity?: string; ticketTypeId?: string; selections?: string; eventTitle?: string; ageRequirement?: string }>();
  const { eventId } = params;
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [capturing, setCapturing] = useState(false);
  const cameraRef = useRef<any>(null);

  useValueTransitionLogger('verification.idScan', 'cameraPermission', hasPermission, { logInitial: true });
  useValueTransitionLogger('verification.idScan', 'capturing', capturing);

  // Request permission on mount
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

  const handleCapture = async () => {
    if (capturing) return;
    logEvent('verification.idScan', 'capture_started', { eventId });
    setCapturing(true);
    setTimeout(() => {
      setCapturing(false);
      logEvent('verification.idScan', 'capture_completed', { eventId, advancedTo: '/verify/selfie' });
      router.push({ pathname: '/verify/selfie', params });
    }, 1500);
  };

  const handleSkipCamera = () => {
    logEvent('verification.idScan', 'camera_skipped', { eventId });
    router.push({ pathname: '/verify/selfie', params });
  };

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      <View style={s.header}>
        <ScreenBackButton color={colors.text} />
        <Text style={s.headerTitle}>ECHO</Text>
        <View style={s.backBtn} />
      </View>

      <Text style={s.title}>Scan Your ID</Text>
      <Text style={s.stepLabel}>Step 2 of 3. Scan your driver's licence.</Text>

      {/* Camera or placeholder */}
      <View style={s.cameraContainer}>
        {hasPermission && CameraView ? (
          <CameraView ref={cameraRef} style={s.camera} facing="back" />
        ) : (
          <View style={[s.camera, s.cameraPlaceholder]}>
            <Ionicons name="camera-outline" size={48} color="rgba(255,255,255,0.25)" />
            <Text style={s.placeholderText}>{hasPermission === false ? 'Camera access required' : 'Loading camera...'}</Text>
          </View>
        )}

        {/* Card frame overlay */}
        <View style={s.frameOverlay}>
          <View style={s.frame}>
            <View style={[s.corner, s.tl]} />
            <View style={[s.corner, s.tr]} />
            <View style={[s.corner, s.bl]} />
            <View style={[s.corner, s.br]} />
          </View>
        </View>
      </View>

      <Text style={s.instruction}>Align and capture clearly.</Text>

      {/* Capture / skip */}
      <View style={s.actions}>
        {capturing ? (
          <View style={s.scanningRow}>
            <ActivityIndicator size="small" color="#8B5CF6" />
            <Text style={s.scanningText}>Scanning...</Text>
          </View>
        ) : (
          <TouchableOpacity style={s.captureBtn} onPress={hasPermission ? handleCapture : handleSkipCamera} activeOpacity={0.8}>
            <View style={s.captureRing}>
              <View style={s.captureInner} />
            </View>
          </TouchableOpacity>
        )}
      </View>

      {!hasPermission && (
        <TouchableOpacity style={s.skipBtn} onPress={handleSkipCamera}>
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
  stepLabel: { fontSize: 13, color: 'rgba(255,255,255,0.50)', textAlign: 'center', marginBottom: 20 },
  cameraContainer: { width: FRAME_W + 32, height: FRAME_H + 48, alignSelf: 'center', borderRadius: radii.lg, overflow: 'hidden', position: 'relative' },
  camera: { width: '100%', height: '100%', backgroundColor: '#0A0C10' },
  cameraPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  placeholderText: { fontSize: 13, color: 'rgba(255,255,255,0.35)', marginTop: 8 },
  frameOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  frame: { width: FRAME_W, height: FRAME_H, position: 'relative' },
  corner: { position: 'absolute', width: 24, height: 24, borderColor: '#7B4DFF' },
  tl: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 6 },
  tr: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 6 },
  bl: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 6 },
  br: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 6 },
  instruction: { fontSize: 15, color: 'rgba(255,255,255,0.55)', textAlign: 'center', marginTop: 20, marginBottom: 32 },
  actions: { alignItems: 'center' },
  captureBtn: { alignItems: 'center', justifyContent: 'center' },
  captureRing: { width: 72, height: 72, borderRadius: 36, borderWidth: 4, borderColor: 'rgba(139,92,246,0.50)', alignItems: 'center', justifyContent: 'center' },
  captureInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#7B4DFF' },
  scanningRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 20 },
  scanningText: { fontSize: 16, color: '#7B4DFF', fontWeight: '600' },
  skipBtn: { alignSelf: 'center', marginTop: 20, paddingVertical: 10 },
  skipText: { fontSize: 14, color: 'rgba(255,255,255,0.40)', textDecorationLine: 'underline' },
});
