/**
 * ECHO'd Experience — Reflection + Photos (3/5)
 * ══════════════════════════════════════════════
 * Optional written reflection (300 chars) + camera roll photos (3 max).
 */
import { useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, TextInput, Image, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/tokens';
import { Text } from '../../components/ui';
import { useEchodStore } from '../../stores/echodStore';
import { REFLECTION_MAX_LENGTH, MAX_PHOTOS } from '../../types/echod';

import { ScreenBackButton } from '../../components/shared/ScreenBackButton';
export default function EchodReflectionPhotos() {
  const insets = useSafeAreaInsets();
  const { ticketId, eventId } = useLocalSearchParams<{ ticketId: string; eventId: string }>();
  const { draft, setReflection, addPhoto, removePhoto } = useEchodStore();
  const [focused, setFocused] = useState(false);

  const handlePickPhoto = async () => {
    if (!draft || draft.photos.length >= MAX_PHOTOS) {
      Alert.alert('Limit reached', `You can attach up to ${MAX_PHOTOS} photos.`);
      return;
    }

    try {
      let ImagePicker: any = null;
      try { ImagePicker = require('expo-image-picker'); } catch {}

      if (!ImagePicker) {
        // Demo fallback
        addPhoto({
          id: `photo_${Date.now()}`,
          uri: `https://picsum.photos/seed/echod${draft.photos.length}/400/400`,
          status: 'pending_review',
          uploadedAt: new Date().toISOString(),
        });
        return;
      }

      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow photo access to add event photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets?.[0]) {
        addPhoto({
          id: `photo_${Date.now()}`,
          uri: result.assets[0].uri,
          status: 'pending_review',
          uploadedAt: new Date().toISOString(),
        });
      }
    } catch {
      Alert.alert('Error', 'Could not access photos. Please try again.');
    }
  };

  const handleContinue = () => {
    router.push({ pathname: '/echod/visibility', params: { ticketId, eventId } });
  };

  const charCount = draft?.reflection.length ?? 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <ScreenBackButton />
        <Text style={styles.headerLabel}>ECHO'd Experience</Text>
        <View style={styles.backBtnSpacer} />
      </View>

      {/* Progress 3/5 */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: '60%' }]} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Reflection */}
        <Text style={styles.sectionTitle}>Tell us more</Text>
        <Text style={styles.subText}>What stood out most about your night?</Text>

        <View style={[styles.inputWrap, focused && styles.inputWrapFocused]}>
          <TextInput
            style={styles.textInput}
            placeholder="Share a few thoughts about the atmosphere, entry, music, venue, or overall experience."
            placeholderTextColor="rgba(255,255,255,0.28)"
            value={draft?.reflection ?? ''}
            onChangeText={setReflection}
            maxLength={REFLECTION_MAX_LENGTH}
            multiline
            textAlignVertical="top"
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          />
          <Text style={styles.charCount}>{charCount} / {REFLECTION_MAX_LENGTH}</Text>
        </View>
        <Text style={styles.optionalLabel}>Optional</Text>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Photos */}
        <Text style={styles.sectionTitle}>Add a moment from the night</Text>
        <Text style={styles.subText}>You can attach up to {MAX_PHOTOS} photos from your verified event experience.</Text>

        <View style={styles.photoGrid}>
          {/* Existing photos */}
          {draft?.photos.map((photo) => (
            <View key={photo.id} style={styles.photoSlot}>
              <Image source={{ uri: photo.uri }} style={styles.photoImage} />
              <TouchableOpacity style={styles.photoRemove} onPress={() => removePhoto(photo.id)} activeOpacity={0.82}>
                <Ionicons name="close-circle" size={22} color="rgba(255,255,255,0.85)" />
              </TouchableOpacity>
            </View>
          ))}

          {/* Add slot */}
          {(draft?.photos.length ?? 0) < MAX_PHOTOS ? (
            <TouchableOpacity style={styles.addSlot} onPress={handlePickPhoto} activeOpacity={0.82}>
              <Ionicons name="add" size={28} color={colors.textMuted} />
              <Text style={styles.addSlotText}>Add</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <Text style={styles.photoCount}>{draft?.photos.length ?? 0}/{MAX_PHOTOS} selected</Text>
        <Text style={styles.photoHelper}>Photos may be reviewed before appearing publicly.</Text>
        <Text style={styles.optionalLabel}>Optional</Text>
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity style={styles.primaryBtn} onPress={handleContinue} activeOpacity={0.88}>
          <Text style={styles.primaryBtnText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const SLOT_SIZE = 100;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.04)' },
  backBtnSpacer: { width: 40 },
  headerLabel: { fontSize: 13, fontWeight: '600', color: colors.textMuted, letterSpacing: 0.8, textTransform: 'uppercase' },
  progressTrack: { height: 4, backgroundColor: 'rgba(255,255,255,0.08)', marginHorizontal: 20, borderRadius: 2, marginTop: 4 },
  progressFill: { height: 4, backgroundColor: 'rgba(255,255,255,0.45)', borderRadius: 2 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 28, paddingBottom: 24 },
  sectionTitle: { fontSize: 22, fontWeight: '700', color: colors.textHigh, marginBottom: 8 },
  subText: { fontSize: 14, color: 'rgba(255,255,255,0.55)', marginBottom: 20, lineHeight: 20 },
  inputWrap: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 16,
    minHeight: 140,
  },
  inputWrapFocused: { borderColor: 'rgba(255,255,255,0.20)' },
  textInput: {
    fontSize: 15,
    color: colors.textHigh,
    lineHeight: 22,
    flex: 1,
    minHeight: 90,
  },
  charCount: { fontSize: 12, color: colors.textMuted, textAlign: 'right', marginTop: 8 },
  optionalLabel: { fontSize: 13, color: colors.textMuted, marginTop: 8 },
  divider: { height: 1, backgroundColor: colors.hairline, marginVertical: 28 },
  photoGrid: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  photoSlot: { width: SLOT_SIZE, height: SLOT_SIZE, borderRadius: 16, overflow: 'hidden', position: 'relative' },
  photoImage: { width: SLOT_SIZE, height: SLOT_SIZE },
  photoRemove: { position: 'absolute', top: 4, right: 4 },
  addSlot: {
    width: SLOT_SIZE,
    height: SLOT_SIZE,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.10)',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  addSlotText: { fontSize: 12, color: colors.textMuted },
  photoCount: { fontSize: 13, color: colors.textMuted },
  photoHelper: { fontSize: 13, color: colors.textMuted, marginTop: 6, lineHeight: 18 },
  footer: { paddingHorizontal: 24, paddingTop: 12 },
  primaryBtn: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: { fontSize: 17, fontWeight: '700', color: colors.textHigh },
});
