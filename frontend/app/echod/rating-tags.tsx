/**
 * ECHO'd Experience — Rating + Tags (2/5)
 * ════════════════════════════════════════
 * Elevated pills for rating, multi-select positive/constructive tags.
 */
import { useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/tokens';
import { Text } from '../../components/ui';
import { useEchodStore } from '../../stores/echodStore';
import { ScreenBackButton } from '../../components/shared/ScreenBackButton';
import {
  RATING_LABELS,
  POSITIVE_TAGS,
  CONSTRUCTIVE_TAGS,
  type EchodRating,
  type EchodTag,
} from '../../types/echod';

const RATINGS: { value: EchodRating; label: string }[] = [
  { value: 1, label: 'Poor' },
  { value: 2, label: 'Fair' },
  { value: 3, label: 'Good' },
  { value: 4, label: 'Great' },
  { value: 5, label: 'Excellent' },
];

export default function EchodRatingTags() {
  const insets = useSafeAreaInsets();
  const { ticketId, eventId } = useLocalSearchParams<{ ticketId: string; eventId: string }>();
  const { draft, setRating, toggleTag } = useEchodStore();

  const handleContinue = () => {
    if (!draft?.rating) return;
    router.push({ pathname: '/echod/reflection-photos', params: { ticketId, eventId } });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <ScreenBackButton />
        <Text style={styles.headerLabel}>ECHO'd Experience</Text>
        <View style={styles.backBtnSpacer} />
      </View>

      {/* Progress 2/5 */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: '40%' }]} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Rating */}
        <Text style={styles.sectionTitle}>Rate your overall experience</Text>

        <View style={styles.pillRow}>
          {RATINGS.map(({ value, label }) => {
            const selected = draft?.rating === value;
            return (
              <TouchableOpacity
                key={value}
                onPress={() => setRating(value)}
                activeOpacity={0.82}
                style={[styles.pill, selected && styles.pillSelected]}
              >
                {selected ? (
                  <LinearGradient
                    colors={['#20C7FF', '#7B4DFF', '#E63DAD']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.pillGradientBorder}
                  >
                    <View style={styles.pillInner}>
                      <Text style={styles.pillTextSelected}>{label}</Text>
                    </View>
                  </LinearGradient>
                ) : (
                  <Text style={styles.pillText}>{label}</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.helperText}>Your feedback is tied to verified attendance.</Text>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Tags */}
        <Text style={styles.sectionTitle}>What stood out most?</Text>
        <Text style={styles.subText}>Select all that apply.</Text>

        {/* Positive */}
        <Text style={styles.tagGroupLabel}>Positive</Text>
        <View style={styles.tagGrid}>
          {POSITIVE_TAGS.map((tag) => {
            const active = draft?.tags.includes(tag);
            return (
              <TouchableOpacity
                key={tag}
                onPress={() => toggleTag(tag)}
                activeOpacity={0.82}
                style={[styles.tag, active && styles.tagActive]}
              >
                <Text style={[styles.tagText, active && styles.tagTextActive]}>{tag}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Constructive */}
        <Text style={styles.tagGroupLabel}>Constructive</Text>
        <View style={styles.tagGrid}>
          {CONSTRUCTIVE_TAGS.map((tag) => {
            const active = draft?.tags.includes(tag);
            return (
              <TouchableOpacity
                key={tag}
                onPress={() => toggleTag(tag)}
                activeOpacity={0.82}
                style={[styles.tag, active && styles.tagActive]}
              >
                <Text style={[styles.tagText, active && styles.tagTextActive]}>{tag}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={[styles.primaryBtn, !draft?.rating && styles.primaryBtnDisabled]}
          onPress={handleContinue}
          activeOpacity={0.88}
          disabled={!draft?.rating}
        >
          <Text style={[styles.primaryBtnText, !draft?.rating && styles.primaryBtnTextDisabled]}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

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
  sectionTitle: { fontSize: 22, fontWeight: '700', color: colors.textHigh, marginBottom: 20 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  pill: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  pillSelected: {
    padding: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  pillGradientBorder: {
    borderRadius: 24,
    padding: 2,
  },
  pillInner: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
    backgroundColor: colors.bg,
  },
  pillText: { fontSize: 15, fontWeight: '600', color: 'rgba(255,255,255,0.55)' },
  pillTextSelected: { fontSize: 15, fontWeight: '700', color: colors.textHigh },
  helperText: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
  divider: { height: 1, backgroundColor: colors.hairline, marginVertical: 28 },
  subText: { fontSize: 14, color: 'rgba(255,255,255,0.55)', marginTop: -12, marginBottom: 20 },
  tagGroupLabel: { fontSize: 14, fontWeight: '700', color: 'rgba(255,255,255,0.55)', letterSpacing: 0.4, marginBottom: 12, marginTop: 8 },
  tagGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  tag: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  tagActive: {
    backgroundColor: 'rgba(123,77,255,0.12)',
    borderColor: 'rgba(123,77,255,0.40)',
  },
  tagText: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.55)' },
  tagTextActive: { color: colors.textHigh },
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
  primaryBtnDisabled: { opacity: 0.4 },
  primaryBtnText: { fontSize: 17, fontWeight: '700', color: colors.textHigh },
  primaryBtnTextDisabled: { color: colors.textMuted },
});
