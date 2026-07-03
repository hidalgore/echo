import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, SCREEN_HORIZONTAL_PADDING } from '../../theme/hostTokens';
import { SuggestionCard } from '../../components/host/SuggestionCard';
import { PrimaryButton } from '../../components/host/PrimaryButton';
import { mockAISuggestions, mockFlyerDraft } from '../../services/hostMock';
import type { AISuggestion } from '../../types/hostEvents';
import { useHostStore } from '../../stores/hostStore';
import { EVENT_DETAIL_VIDEO_MAX_SECONDS } from '../../constants/eventMedia';

export default function AIEnhanceScreen() {
  const insets = useSafeAreaInsets();
  const [suggestions, setSuggestions] = useState<AISuggestion[]>(mockAISuggestions);
  const activeDraft = useHostStore((s) => s.activeDraft);
  const draft = activeDraft || mockFlyerDraft;
  const accepted = suggestions.filter((s) => s.accepted).length;
  const hasStillFlyer = !!draft.flyerImage;
  const hasDetailsMedia = !!draft.eventDetailMediaUri;
  const score = Math.min(98, 82 + accepted * 4 + (hasStillFlyer ? 4 : 0) + (hasDetailsMedia ? 2 : 0));

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}> 
      <StatusBar barStyle="light-content" />
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}><Text style={styles.backArrow}>{'\u2190'}</Text></TouchableOpacity>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.scoreSection}>
          <Text style={styles.scoreLabel}>EVENT QUALITY</Text>
          <Text style={styles.scoreValue}>{score}%</Text>
          <Text style={styles.scoreReady}>{hasStillFlyer ? 'Static home flyer ready' : 'Add a still flyer'}</Text>
          <View style={styles.bar}><View style={[styles.barFill, { width: `${score}%` }]} /></View>
        </View>

        <View style={styles.directionCard}>
          <Text style={styles.directionTitle}>Media direction locked</Text>
          <Text style={styles.directionBody}>
            Home cards use a still photo only. Event Details can use a photo or video hero, with videos locked to 30 seconds max. ECHO Wallet and access surfaces stay static for trust and scan reliability.
          </Text>
          <View style={styles.directionRow}>
            <Text style={styles.directionLabel}>Home</Text>
            <Text style={styles.directionValue}>{hasStillFlyer ? 'Still photo' : 'Needs still photo'}</Text>
          </View>
          <View style={styles.directionRow}>
            <Text style={styles.directionLabel}>Event Details</Text>
            <Text style={styles.directionValue}>{draft.eventDetailMediaType === 'video' ? `Video hero (${EVENT_DETAIL_VIDEO_MAX_SECONDS}s max)` : hasDetailsMedia ? 'Photo hero' : 'Uses still photo'}</Text>
          </View>
        </View>

        <Text style={styles.sugTitle}>Suggestions</Text>
        {suggestions.map((s) => (
          <SuggestionCard
            key={s.id}
            suggestion={s}
            onAccept={(id) => setSuggestions((prev) => prev.map((x) => x.id === id ? { ...x, accepted: true } : x))}
            onEdit={() => {}}
          />
        ))}
      </ScrollView>
      <View style={styles.bottomBar}>
        <PrimaryButton label="Continue to Preview" onPress={() => router.push('/(host)/preview-edit')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  backBtn: { paddingHorizontal: SCREEN_HORIZONTAL_PADDING, paddingTop: 12, minWidth: 44, minHeight: 44, justifyContent: 'center' },
  backArrow: { fontSize: 24, color: colors.textSecondary },
  scrollContent: { paddingHorizontal: SCREEN_HORIZONTAL_PADDING, paddingBottom: 120 },
  scoreSection: { alignItems: 'center', paddingVertical: 24, marginBottom: 18 },
  scoreLabel: { fontSize: 13, fontWeight: '600', color: colors.textTertiary, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 8 },
  scoreValue: { fontSize: 48, fontWeight: '700', color: colors.textPrimary },
  scoreReady: { fontSize: 13, fontWeight: '600', color: colors.accentGreen, marginBottom: 20 },
  bar: { width: '80%', height: 4, backgroundColor: colors.border, borderRadius: 2, overflow: 'hidden' },
  barFill: { height: 4, backgroundColor: colors.accentGreen, borderRadius: 2 },
  directionCard: { backgroundColor: colors.surface, borderRadius: 18, borderWidth: 1, borderColor: colors.border, padding: 16, marginBottom: 22 },
  directionTitle: { ...typography.bodyMd, color: colors.textPrimary, fontWeight: '800', marginBottom: 8 },
  directionBody: { ...typography.bodySm, color: colors.textTertiary, lineHeight: 20, marginBottom: 14 },
  directionRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderTopWidth: 1, borderTopColor: colors.borderSubtle },
  directionLabel: { ...typography.bodySm, color: colors.textTertiary },
  directionValue: { ...typography.bodySm, color: colors.textPrimary, fontWeight: '700' },
  sugTitle: { fontSize: 17, fontWeight: '600', color: colors.textSecondary, marginBottom: 16 },
  bottomBar: { paddingHorizontal: SCREEN_HORIZONTAL_PADDING, paddingVertical: 16, paddingBottom: 32, backgroundColor: colors.bg, borderTopWidth: 1, borderTopColor: colors.borderSubtle },
});
