/**
 * PromotionReadyCard
 * ══════════════════
 * Shown on the Create Event review step.
 * Surfaces promotion readiness status and share/promo suggestions
 * once the event listing is ready to publish.
 */
import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../../ui';
import { AI_COLORS, aiCard } from './aiStyles';

interface PromotionReadyCardProps {
  /** Event has a cover image */
  hasImage: boolean;
  /** Event has a description */
  hasDescription: boolean;
  /** Ticketing is fully configured */
  ticketingComplete: boolean;
  /** Event title is set */
  hasTitle: boolean;
  /** Callback when "Generate promo copy" tapped */
  onGeneratePromo?: () => void;
  /** Callback when "Preview share card" tapped */
  onPreviewShare?: () => void;
}

type ReadinessLevel = 'ready' | 'almost' | 'needs_work';

function getReadiness(props: PromotionReadyCardProps): {
  level: ReadinessLevel;
  score: number;
  total: number;
  missing: string[];
} {
  const checks = [
    { ok: props.hasTitle, label: 'Event title' },
    { ok: props.hasDescription, label: 'Description' },
    { ok: props.hasImage, label: 'Cover image' },
    { ok: props.ticketingComplete, label: 'Ticketing' },
  ];
  const score = checks.filter((c) => c.ok).length;
  const missing = checks.filter((c) => !c.ok).map((c) => c.label);
  const level: ReadinessLevel =
    score === checks.length ? 'ready' : score >= 3 ? 'almost' : 'needs_work';
  return { level, score, total: checks.length, missing };
}

const LEVEL_CONFIG: Record<ReadinessLevel, { color: string; icon: string; label: string; message: string }> = {
  ready: {
    color: AI_COLORS.success,
    icon: 'checkmark-circle',
    label: 'PROMOTION READY',
    message: 'Your listing is strong. Share it now to maximize early ticket sales.',
  },
  almost: {
    color: AI_COLORS.warning,
    icon: 'alert-circle',
    label: 'ALMOST READY',
    message: 'Your listing will perform better with a few additions before sharing.',
  },
  needs_work: {
    color: AI_COLORS.danger,
    icon: 'close-circle',
    label: 'NEEDS ATTENTION',
    message: 'Complete the missing items below to create a shareable listing.',
  },
};

export function PromotionReadyCard(props: PromotionReadyCardProps) {
  const { level, score, total, missing } = getReadiness(props);
  const config = LEVEL_CONFIG[level];

  return (
    <View style={aiCard.container}>
      {/* Eyebrow */}
      <View style={aiCard.eyebrowRow}>
        <Ionicons name="megaphone" size={13} color={AI_COLORS.eyebrow} />
        <Text style={aiCard.eyebrow}>ECHO Intelligence</Text>
      </View>

      {/* Status row */}
      <View style={styles.statusRow}>
        <Ionicons name={config.icon as never} size={20} color={config.color} />
        <View style={styles.statusContent}>
          <Text style={[styles.statusLabel, { color: config.color }]}>{config.label}</Text>
          <Text style={styles.scoreText}>
            {score}/{total} listing signals complete
          </Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${(score / total) * 100}%`, backgroundColor: config.color }]} />
      </View>

      {/* Message */}
      <Text style={aiCard.supportLine}>{config.message}</Text>

      {/* Missing items */}
      {missing.length > 0 && (
        <View style={styles.missingWrap}>
          {missing.map((item) => (
            <View key={item} style={styles.missingRow}>
              <Ionicons name="ellipse-outline" size={12} color={AI_COLORS.textMuted} />
              <Text style={styles.missingText}>{item}</Text>
            </View>
          ))}
        </View>
      )}

      {/* CTAs — only show when promotion-ready or almost */}
      {level !== 'needs_work' && (
        <View style={styles.ctaRow}>
          {props.onGeneratePromo && (
            <TouchableOpacity style={styles.ctaBtn} onPress={props.onGeneratePromo} activeOpacity={0.82}>
              <Ionicons name="sparkles" size={14} color="#20C7FF" />
              <Text style={styles.ctaText}>Generate promo copy</Text>
            </TouchableOpacity>
          )}
          {props.onPreviewShare && (
            <TouchableOpacity style={styles.secondaryBtn} onPress={props.onPreviewShare} activeOpacity={0.82}>
              <Ionicons name="share-outline" size={14} color={AI_COLORS.textMid} />
              <Text style={styles.secondaryText}>Preview share card</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  statusContent: { flex: 1 },
  statusLabel: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  scoreText: {
    fontSize: 14,
    color: AI_COLORS.textMid,
    marginTop: 2,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginBottom: 14,
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
  },
  missingWrap: {
    marginBottom: 16,
    gap: 8,
  },
  missingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  missingText: {
    fontSize: 13,
    color: AI_COLORS.textMuted,
  },
  ctaRow: {
    gap: 10,
  },
  ctaBtn: {
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(32,199,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(32,199,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  ctaText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#20C7FF',
  },
  secondaryBtn: {
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  secondaryText: {
    fontSize: 13,
    color: AI_COLORS.textMuted,
  },
});
