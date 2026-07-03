/**
 * CircleWalletCard — Wallet Surface for Active Circle (Spec §7)
 * ═══════════════════════════════════════════════════════════════
 * State-driven card: shows Circle progress, timer, and primary action.
 * Tapping routes to Circle Hub.
 */
import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '../ui';
import type { EchoCircle, CircleStatus } from '../../types/circle';
import { deriveCounts, deriveHubDisplay, formatTimer } from '../../services/circleStateModel';

const STATE_CONFIG: Record<CircleStatus, { accent: string; icon: string; gradient: [string, string] }> = {
  created:       { accent: '#7B4DFF', icon: 'add-circle-outline',     gradient: ['rgba(123,77,255,0.14)', 'rgba(123,77,255,0.04)'] },
  waiting:       { accent: '#20C7FF', icon: 'time-outline',           gradient: ['rgba(32,199,255,0.14)', 'rgba(32,199,255,0.04)'] },
  action_needed: { accent: '#F59E0B', icon: 'alert-circle-outline',   gradient: ['rgba(245,158,11,0.14)', 'rgba(245,158,11,0.04)'] },
  complete:      { accent: '#10B981', icon: 'checkmark-circle',       gradient: ['rgba(16,185,129,0.14)', 'rgba(16,185,129,0.04)'] },
  closed:        { accent: '#6B7280', icon: 'close-circle-outline',   gradient: ['rgba(107,114,128,0.10)', 'rgba(107,114,128,0.04)'] },
};

type Props = {
  circle: EchoCircle;
  onPress: () => void;
};

export function CircleWalletCard({ circle, onPress }: Props) {
  const cfg = STATE_CONFIG[circle.status];
  const counts = deriveCounts(circle);
  const display = deriveHubDisplay(circle);
  const showTimer = circle.status !== 'complete' && circle.status !== 'closed' && circle.secondsRemaining > 0;

  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.85}>
      <LinearGradient
        colors={cfg.gradient as [string, string]}
        style={s.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <View style={s.row}>
        <View style={[s.iconWrap, { borderColor: `${cfg.accent}40` }]}>
          <Ionicons name={cfg.icon as never} size={20} color={cfg.accent} />
        </View>

        <View style={s.info}>
          <View style={s.topRow}>
            <Text style={s.label}>ECHO CIRCLE</Text>
            {showTimer && (
              <View style={s.timerBadge}>
                <Ionicons name="time-outline" size={12} color={circle.secondsRemaining <= 300 ? '#F59E0B' : 'rgba(255,255,255,0.45)'} />
                <Text style={[s.timerText, circle.secondsRemaining <= 300 && { color: '#F59E0B' }]}>
                  {formatTimer(circle.secondsRemaining)}
                </Text>
              </View>
            )}
          </View>
          <Text style={s.headline} numberOfLines={1}>{display.headline}</Text>
          <Text style={s.sub} numberOfLines={1}>{circle.eventTitle}</Text>

          {/* Mini progress bar */}
          <View style={s.progressBar}>
            <View style={[s.progressFill, { width: `${(counts.claimed / counts.total) * 100}%`, backgroundColor: cfg.accent }]} />
          </View>
          <Text style={s.progressText}>
            {counts.claimed} of {counts.total} claimed
          </Text>
        </View>

        <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.25)" />
      </View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  card: {
    borderRadius: 20, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(20,24,33,0.96)',
  },
  gradient: { ...StyleSheet.absoluteFillObject },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 16,
  },
  iconWrap: {
    width: 44, height: 44, borderRadius: 22,
    borderWidth: 1.5, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  info: { flex: 1, gap: 3 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, color: 'rgba(255,255,255,0.35)' },
  timerBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  timerText: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.45)' },
  headline: { fontSize: 15, fontWeight: '600', color: '#F5F7FB' },
  sub: { fontSize: 12, color: 'rgba(255,255,255,0.40)' },
  progressBar: { height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.06)', marginTop: 8 },
  progressFill: { height: '100%', borderRadius: 2 },
  progressText: { fontSize: 11, color: 'rgba(255,255,255,0.30)', marginTop: 4 },
});
