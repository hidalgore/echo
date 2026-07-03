import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '../ui';
import { useDynamicTheme } from '../../theme/dynamicTheme';
import { SoftWaveform } from './SoftWaveform';
import { getStateColor, getStateAccent } from './energyColors';
import {
  ENERGY_STATE_LABEL,
  GRAVITY_LABEL,
  type SocialEnergy,
} from '../../types/socialEnergy';

/**
 * EnergyCard
 * ══════════
 * Primary Social Energy surface for Event Detail.
 * Hierarchy: state title (large) + waveform + live pulse line + up to 2 gravity chips.
 * Visual: subtle gradient edge glow + state-tinted bg, calm Apple-level motion only.
 */

interface EnergyCardProps {
  energy: SocialEnergy;
  style?: ViewStyle;
}

export function EnergyCard({ energy, style }: EnergyCardProps) {
  const { colors: c } = useDynamicTheme();
  const accent = getStateAccent(energy.state);
  const tint = getStateColor(energy.state, 0.07);
  const edge = getStateColor(energy.state, 0.22);

  return (
    <LinearGradient
      colors={[edge, 'rgba(255,255,255,0.02)', edge]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[s.outer, style]}
    >
      <View style={[s.inner, { backgroundColor: c.bgCard }]}>
        {/* Subtle inner tint by state */}
        <View style={[s.tint, { backgroundColor: tint }]} pointerEvents="none" />

        <View style={s.headerRow}>
          <View style={{ flex: 1 }}>
            <Text variant="meta" style={[s.eyebrow, { color: c.textMuted }]}>SOCIAL ENERGY</Text>
            <Text style={[s.title, { color: c.text }]}>{ENERGY_STATE_LABEL[energy.state]}</Text>
          </View>
          <SoftWaveform intensity={energy.intensity} color={accent} size="lg" />
        </View>

        {energy.gravity.length > 0 ? (
          <View style={s.chipRow}>
            {energy.gravity.map((sig) => (
              <View key={sig} style={[s.chip, { backgroundColor: c.surface2, borderColor: c.hairline }]}>
                <View style={[s.chipDot, { backgroundColor: accent }]} />
                <Text style={[s.chipText, { color: c.textSecondary }]}>{GRAVITY_LABEL[sig]}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  outer: { borderRadius: 22, padding: 1.5 },
  inner: { borderRadius: 20.5, padding: 18, position: 'relative', overflow: 'hidden' },
  tint: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  eyebrow: { fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  title: { fontSize: 22, fontWeight: '900', letterSpacing: -0.3, marginTop: 4 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1 },
  chipDot: { width: 5, height: 5, borderRadius: 2.5 },
  chipText: { fontSize: 11.5, fontWeight: '700' },
});

export default EnergyCard;
