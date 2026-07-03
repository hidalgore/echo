/**
 * AITitleSuggestions + AIDescriptionSuggestions
 * ═════════════════════════════════════════════
 * Inline AI helpers below title/description inputs.
 */
import React from 'react';
import { View, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../../ui';
import { useHostAIStore } from '../../../stores/hostAIStore';
import { AI_COLORS } from './aiStyles';
import type { DescriptionTone } from '../../../types/hostAI';

// ─── AITitleSuggestions ─────────────────────────────────────────────────────

export function AITitleSuggestions({ onSelect }: { onSelect: (title: string) => void }) {
  const { titleSuggestions, titlesLoading, fetchTitleSuggestions, clearTitles } = useHostAIStore();

  if (titlesLoading) {
    return (
      <View style={s.inlineWrap}>
        <ActivityIndicator size="small" color={AI_COLORS.sparkle} />
        <Text style={s.loadingText}>Generating suggestions...</Text>
      </View>
    );
  }

  if (titleSuggestions.length === 0) {
    return (
      <TouchableOpacity style={s.triggerBtn} onPress={() => fetchTitleSuggestions('')} activeOpacity={0.82}>
        <Ionicons name="sparkles" size={12} color={AI_COLORS.sparkle} />
        <Text style={s.triggerText}>Make this stronger</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={s.inlineWrap}>
      <View style={s.labelRow}>
        <Ionicons name="sparkles" size={12} color={AI_COLORS.sparkle} />
        <Text style={s.label}>AI Suggestions</Text>
        <TouchableOpacity onPress={clearTitles} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="close" size={14} color={AI_COLORS.textMuted} />
        </TouchableOpacity>
      </View>
      {titleSuggestions.map((sug) => (
        <TouchableOpacity key={sug.id} style={s.suggestionRow} onPress={() => onSelect(sug.text)} activeOpacity={0.82}>
          <Text style={s.suggestionText}>{sug.text}</Text>
          <Text style={s.useBtn}>Use</Text>
        </TouchableOpacity>
      ))}
      <TouchableOpacity style={s.refreshBtn} onPress={() => fetchTitleSuggestions('')} activeOpacity={0.82}>
        <Ionicons name="refresh" size={14} color={AI_COLORS.sparkle} />
        <Text style={s.refreshText}>Refresh</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── AIDescriptionSuggestions ───────────────────────────────────────────────

const TONE_LABELS: Record<DescriptionTone, string> = {
  concise: 'Concise',
  energetic: 'Energetic',
  premium: 'Premium',
};

export function AIDescriptionSuggestions({ onSelect }: { onSelect: (text: string) => void }) {
  const { descriptionOptions, descriptionsLoading, fetchDescriptionOptions, clearDescriptions } = useHostAIStore();

  if (descriptionsLoading) {
    return (
      <View style={s.inlineWrap}>
        <ActivityIndicator size="small" color={AI_COLORS.sparkle} />
        <Text style={s.loadingText}>Generating options...</Text>
      </View>
    );
  }

  if (descriptionOptions.length === 0) {
    return (
      <TouchableOpacity style={s.triggerBtn} onPress={() => fetchDescriptionOptions('')} activeOpacity={0.82}>
        <Ionicons name="sparkles" size={12} color={AI_COLORS.sparkle} />
        <Text style={s.triggerText}>Refine with AI</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={s.inlineWrap}>
      <View style={s.labelRow}>
        <Ionicons name="sparkles" size={12} color={AI_COLORS.sparkle} />
        <Text style={s.label}>AI Description Options</Text>
        <TouchableOpacity onPress={clearDescriptions} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="close" size={14} color={AI_COLORS.textMuted} />
        </TouchableOpacity>
      </View>
      {descriptionOptions.map((opt) => (
        <TouchableOpacity key={opt.tone} style={s.descOption} onPress={() => onSelect(opt.text)} activeOpacity={0.82}>
          <Text style={s.descToneLabel}>{TONE_LABELS[opt.tone]}</Text>
          <Text style={s.descPreview} numberOfLines={2}>{opt.text}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─── Shared styles ──────────────────────────────────────────────────────────

const s = StyleSheet.create({
  inlineWrap: { marginTop: 10, padding: 14, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  label: { flex: 1, fontSize: 11, fontWeight: '700', color: AI_COLORS.sparkle, letterSpacing: 1, textTransform: 'uppercase' },
  loadingText: { fontSize: 13, color: AI_COLORS.textMuted, marginLeft: 8 },
  triggerBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, alignSelf: 'flex-start', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 12, backgroundColor: 'rgba(32,199,255,0.08)' },
  triggerText: { fontSize: 12, fontWeight: '600', color: AI_COLORS.sparkle },
  suggestionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
  suggestionText: { flex: 1, fontSize: 14, color: AI_COLORS.textHigh, marginRight: 12 },
  useBtn: { fontSize: 12, fontWeight: '700', color: AI_COLORS.sparkle },
  refreshBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, alignSelf: 'center' },
  refreshText: { fontSize: 12, color: AI_COLORS.sparkle },
  descOption: { padding: 12, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', marginBottom: 8 },
  descToneLabel: { fontSize: 11, fontWeight: '700', color: AI_COLORS.sparkle, letterSpacing: 0.8, marginBottom: 6 },
  descPreview: { fontSize: 13, color: AI_COLORS.textMid, lineHeight: 18 },
});
