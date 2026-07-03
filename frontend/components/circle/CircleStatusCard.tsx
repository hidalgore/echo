/**
 * CircleStatusCard — Glowing status surface for Circle states
 * ════════════════════════════════════════════════════════════
 * Orange/amber glow border with progress ring + state-dependent content.
 * States: created | waiting | action_needed | complete | closed
 */
import React from 'react';
import { useDynamicTheme } from '../../theme/dynamicTheme';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../ui';
import { CircleProgressRing } from './CircleProgressRing';

type CircleState = 'created' | 'waiting' | 'action_needed' | 'complete' | 'closed';

type Props = {
  state: CircleState;
  secured: number;
  total: number;
  /** e.g. "58:13 remaining" */
  timerLabel?: string;
  /** Status pill label override */
  statusLabel?: string;
  /** Body text below the main stat */
  bodyText?: string;
  /** Optional action button */
  actionLabel?: string;
  onAction?: () => void;
  /** Inline member previews (for complete state) */
  children?: React.ReactNode;
};

const STATE_CONFIG: Record<CircleState, {
  pillLabel: string; pillColor: string; pillBg: string;
  borderColors: [string, string, string, string];
}> = {
  created: {
    pillLabel: 'Circle created', pillColor: '#10B981', pillBg: 'rgba(16,185,129,0.12)',
    borderColors: ['rgba(32,199,255,0.50)', 'rgba(123,77,255,0.50)', 'rgba(236,72,153,0.40)', 'rgba(245,158,11,0.50)'],
  },
  waiting: {
    pillLabel: 'Waiting', pillColor: '#F59E0B', pillBg: 'rgba(245,158,11,0.12)',
    borderColors: ['rgba(32,199,255,0.40)', 'rgba(123,77,255,0.40)', 'rgba(245,158,11,0.55)', 'rgba(245,158,11,0.45)'],
  },
  action_needed: {
    pillLabel: 'Action needed', pillColor: '#EF4444', pillBg: 'rgba(239,68,68,0.12)',
    borderColors: ['rgba(239,68,68,0.50)', 'rgba(245,158,11,0.50)', 'rgba(239,68,68,0.40)', 'rgba(245,158,11,0.40)'],
  },
  complete: {
    pillLabel: 'Complete', pillColor: '#10B981', pillBg: 'rgba(16,185,129,0.12)',
    borderColors: ['rgba(32,199,255,0.40)', 'rgba(123,77,255,0.40)', 'rgba(236,72,153,0.35)', 'rgba(245,158,11,0.45)'],
  },
  closed: {
    pillLabel: 'Closed', pillColor: '#6B7280', pillBg: 'rgba(107,114,128,0.12)',
    borderColors: ['rgba(107,114,128,0.30)', 'rgba(107,114,128,0.20)', 'rgba(107,114,128,0.20)', 'rgba(107,114,128,0.25)'],
  },
};

export function CircleStatusCard({
  state, secured, total, timerLabel, statusLabel, bodyText,
  actionLabel, onAction, children,
}: Props) {
    const { colors: c, isDark } = useDynamicTheme();
  const config = STATE_CONFIG[state];
  const progress = total > 0 ? secured / total : 0;
  const isComplete = state === 'complete';

  return (
    <LinearGradient
      colors={config.borderColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={s.border}
    >
      <View style={[s.inner, { backgroundColor: c.bg }]}>
        {/* Top section: ring + info */}
        <View style={s.topRow}>
          {/* Progress ring */}
          <View style={s.ringWrap}>
            <CircleProgressRing
              progress={progress}
              size={120}
              strokeWidth={8}
              isComplete={isComplete}
              centerText={isComplete ? undefined : `${secured} / ${total}`}
              centerSubtext={isComplete ? undefined : 'secured'}
            />
          </View>

          {/* Status info */}
          <View style={s.infoColumn}>
            {/* Status pill */}
            <View style={[s.statusPill, { backgroundColor: config.pillBg }]}>
              <Text style={[s.statusPillText, { color: config.pillColor }]}>
                {statusLabel || config.pillLabel}
              </Text>
            </View>

            {/* Headline */}
            {isComplete ? (
              <Text style={[s.headline, { color: c.text }]}>{secured} of {total} secured</Text>
            ) : state === 'created' ? (
              <>
                <Text style={[s.headline, { color: c.text }]}>ECHO Circle</Text>
                <Text style={[s.secureStat, { color: c.textLow }]}>
                  <Text style={{ color: '#10B981', fontWeight: '700' }}>{secured}</Text> of {total} secured
                </Text>
              </>
            ) : (
              <Text style={[s.headline, { color: c.text }]}>{secured} of {total} tickets claimed</Text>
            )}

            {/* Timer */}
            {timerLabel && (
              <View style={s.timerRow}>
                <Ionicons name="time-outline" size={16} color={c.textMuted} />
                <Text style={[s.timerText, { color: c.textMuted }]}>{timerLabel}</Text>
              </View>
            )}

            {/* Body text */}
            {bodyText && <Text style={[s.bodyText, { color: c.textLow }]}>{bodyText}</Text>}

            {/* Action button */}
            {actionLabel && onAction && (
              <TouchableOpacity style={s.actionBtn} onPress={onAction} activeOpacity={0.85}>
                <Text style={s.actionBtnText}>{actionLabel}</Text>
                <Ionicons name="chevron-forward" size={16} color="#FFF" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Children (member rows, wallet link, etc.) */}
        {children}
      </View>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  border: { borderRadius: 24, padding: 1.5 },
  inner: {
    borderRadius: 22.5, backgroundColor: '#0F1115',
    padding: 20, gap: 16,
  },
  topRow: { flexDirection: 'row', gap: 16 },
  ringWrap: { alignItems: 'center', justifyContent: 'center' },
  infoColumn: { flex: 1, gap: 6, justifyContent: 'center' },
  statusPill: {
    alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10,
  },
  statusPillText: { fontSize: 13, fontWeight: '700' },
  headline: { color: '#F7F8FA', fontSize: 22, fontWeight: '700', lineHeight: 28 },
  secureStat: { color: 'rgba(255,255,255,0.55)', fontSize: 16 },
  timerRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  timerText: { color: 'rgba(255,255,255,0.55)', fontSize: 14 },
  bodyText: { color: 'rgba(255,255,255,0.50)', fontSize: 14, lineHeight: 20 },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    marginTop: 6, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 14,
    backgroundColor: 'rgba(245,158,11,0.18)',
  },
  actionBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
