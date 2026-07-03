import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Alert, Platform } from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, spacing, SCREEN_HORIZONTAL_PADDING } from '../../theme/hostTokens';
import { FlyerUploadCard } from '../../components/host/FlyerUploadCard';
import { PrimaryButton } from '../../components/host/PrimaryButton';

export default function FlyerUploadScreen() {
  const insets = useSafeAreaInsets();
  const [selectedUri, setSelectedUri] = useState<string | undefined>();

  const requestCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Camera access needed', 'Allow camera access to scan a still flyer.');
      return false;
    }
    return true;
  };

  const requestLibrary = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Photo access needed', 'Allow photo library access to upload a still flyer.');
      return false;
    }
    return true;
  };

  const handleTakePhoto = async () => {
    if (!(await requestCamera())) return;
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
      allowsEditing: true,
    });
    if (!result.canceled) setSelectedUri(result.assets[0]?.uri);
  };

  const handlePickImage = async () => {
    if (!(await requestLibrary())) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
      allowsEditing: true,
      selectionLimit: 1,
    });
    if (!result.canceled) setSelectedUri(result.assets[0]?.uri);
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}> 
      <StatusBar barStyle="light-content" />
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}><Text style={styles.backArrow}>{'\u2190'}</Text></TouchableOpacity>
      <View style={styles.content}>
        <Text style={styles.title}>Upload Flyer</Text>
        <Text style={styles.subtitle}>Upload a still flyer/photo for Home cards and flyer scanning. You can add a photo or video hero for the Event Details page later in Create Event.</Text>
        <FlyerUploadCard
          selectedUri={selectedUri}
          onTakePhoto={handleTakePhoto}
          onUploadImage={handlePickImage}
          onImportFromRoll={handlePickImage}
          onRemove={() => setSelectedUri(undefined)}
        />
        <View style={styles.tipBox}><Text style={styles.tipText}>{Platform.OS === 'web' ? 'Web mode uses OCR to read flyer text and prefill event details.' : 'Home and Wallet surfaces stay still-photo-first. Event Details can later use a host-selected photo or video.'}</Text></View>
        <View style={{ flex: 1 }} />
        {selectedUri && <PrimaryButton label="Continue" onPress={() => router.push({ pathname: '/(host)/flyer-processing', params: { flyerUri: selectedUri } })} style={{ marginBottom: 32 }} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  backBtn: { paddingHorizontal: SCREEN_HORIZONTAL_PADDING, paddingTop: 12, minWidth: 44, minHeight: 44, justifyContent: 'center' },
  backArrow: { fontSize: 24, color: colors.textSecondary },
  content: { flex: 1, paddingHorizontal: SCREEN_HORIZONTAL_PADDING, paddingTop: 24 },
  title: { ...typography.displayLg, color: colors.textPrimary, marginBottom: 8 },
  subtitle: { ...typography.bodyMd, color: colors.textTertiary, marginBottom: 24, lineHeight: 22 },
  tipBox: { marginTop: spacing.lg, padding: 14, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  tipText: { ...typography.bodySm, color: colors.textTertiary, lineHeight: 20 },
});
