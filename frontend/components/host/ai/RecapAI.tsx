/**
 * Post-Event Recap AI Components
 * ═══════════════════════════════
 * AIRecapSummaryCard, WhatWorkedCard, WhatToImproveCard, NextEventRecommendationsCard
 */
import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../../ui';
import { AI_COLORS, aiCard } from './aiStyles';
import type { PostEventRecap } from '../../../types/hostAI';

// ─── AIRecapSummaryCard ─────────────────────────────────────────────────────

export function AIRecapSummaryCard({ summary }: { summary: PostEventRecap['summary'] }) {
  const toneIcon = summary.tone === 'strong' ? 'trending-up' : summary.tone === 'weak' ? 'trending-down' : 'analytics';
  const toneColor = summary.tone === 'strong' ? AI_COLORS.success : summary.tone === 'weak' ? AI_COLORS.warning : AI_COLORS.sparkle;

  return (
    <View style={aiCard.container}>
      <View style={aiCard.eyebrowRow}>
        <Ionicons name="sparkles" size={14} color={AI_COLORS.sparkle} />
        <Text style={aiCard.eyebrow}>ECHO Recap</Text>
      </View>
      <View style={s.summaryRow}>
        <Ionicons name={toneIcon as never} size={20} color={toneColor} style={s.toneIcon} />
        <Text style={s.narrative}>{summary.narrative}</Text>
      </View>
    </View>
  );
}

// ─── WhatWorkedCard ─────────────────────────────────────────────────────────

export function WhatWorkedCard({ bullets }: { bullets: PostEventRecap['whatWorked'] }) {
  if (bullets.length === 0) return null;

  return (
    <View style={aiCard.container}>
      <View style={s.sectionHeader}>
        <Ionicons name="checkmark-circle" size={18} color={AI_COLORS.success} />
        <Text style={aiCard.sectionTitle}>What worked</Text>
      </View>
      {bullets.map((b) => (
        <View key={b.id} style={aiCard.bulletRow}>
          <Ionicons name="chevron-forward" size={14} color={AI_COLORS.success} />
          <Text style={aiCard.bulletText}>{b.text}</Text>
        </View>
      ))}
    </View>
  );
}

// ─── WhatToImproveCard ──────────────────────────────────────────────────────

export function WhatToImproveCard({ bullets }: { bullets: PostEventRecap['whatToImprove'] }) {
  if (bullets.length === 0) return null;

  return (
    <View style={aiCard.container}>
      <View style={s.sectionHeader}>
        <Ionicons name="arrow-up-circle" size={18} color={AI_COLORS.warning} />
        <Text style={aiCard.sectionTitle}>What to improve</Text>
      </View>
      {bullets.map((b) => (
        <View key={b.id} style={aiCard.bulletRow}>
          <Ionicons name="chevron-forward" size={14} color={AI_COLORS.warning} />
          <Text style={aiCard.bulletText}>{b.text}</Text>
        </View>
      ))}
    </View>
  );
}

// ─── NextEventRecommendationsCard ───────────────────────────────────────────

export function NextEventRecommendationsCard({ recommendations }: { recommendations: PostEventRecap['recommendations'] }) {
  if (recommendations.length === 0) return null;

  return (
    <View style={aiCard.container}>
      <View style={s.sectionHeader}>
        <Ionicons name="bulb" size={18} color={AI_COLORS.sparkle} />
        <Text style={aiCard.sectionTitle}>Recommendations for next time</Text>
      </View>
      {recommendations.map((rec) => (
        <View key={rec.id} style={s.recRow}>
          <Text style={s.recCopy}>{rec.copy}</Text>
          <TouchableOpacity style={s.recCta} activeOpacity={0.82}>
            <Text style={s.recCtaText}>{rec.ctaLabel}</Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
}

// ─── RecapActionsRow ────────────────────────────────────────────────────────

export function RecapActionsRow({ onDuplicate, onShare, onBack }: { onDuplicate: () => void; onShare: () => void; onBack: () => void }) {
  return (
    <View style={s.actionsRow}>
      <RecapAction icon="copy-outline" label="Duplicate Event" onPress={onDuplicate} />
      <RecapAction icon="share-social-outline" label="Share Results" onPress={onShare} />
      <RecapAction icon="arrow-back-outline" label="Back to Overview" onPress={onBack} />
    </View>
  );
}

function RecapAction({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={s.actionBtn} onPress={onPress} activeOpacity={0.82}>
      <Ionicons name={icon as never} size={18} color={AI_COLORS.textMid} />
      <Text style={s.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  summaryRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  toneIcon: { marginTop: 2 },
  narrative: { flex: 1, fontSize: 15, color: AI_COLORS.textMid, lineHeight: 22 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  recRow: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
  recCopy: { fontSize: 14, color: AI_COLORS.textMid, lineHeight: 20, marginBottom: 10 },
  recCta: { alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 14, backgroundColor: 'rgba(32,199,255,0.10)', borderWidth: 1, borderColor: 'rgba(32,199,255,0.20)' },
  recCtaText: { fontSize: 12, fontWeight: '700', color: AI_COLORS.sparkle },
  actionsRow: { flexDirection: 'row', gap: 10, marginHorizontal: 16, marginTop: 8, marginBottom: 32 },
  actionBtn: { flex: 1, alignItems: 'center', gap: 6, paddingVertical: 16, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  actionLabel: { fontSize: 11, fontWeight: '600', color: AI_COLORS.textMid, textAlign: 'center' },
});
