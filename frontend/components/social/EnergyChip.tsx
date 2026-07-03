import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Text } from '../ui';
import { SoftWaveform } from './SoftWaveform';
import { getStateAccent } from './energyColors';
import { ENERGY_STATE_LABEL, LIVE_PULSE_LABEL, type SocialEnergy } from '../../types/socialEnergy';

/**
 * EnergyChip
 * ══════════
 * Ultra-quiet inline variant for wallet ticket cards.
 * Just a waveform + tiny label. Sets anticipation without adding noise.
 *
 * Designed to sit on a dark ticket card (gradient bg).
 */

interface EnergyChipProps {
  energy: SocialEnergy;
  style?: ViewStyle;
}

export function EnergyChip({ energy, style }: EnergyChipProps) {
  const accent = getStateAccent(energy.state);
  // Live pulse takes priority when present (more relevant near event time)
  const label = energy.pulse ? LIVE_PULSE_LABEL[energy.pulse] : ENERGY_STATE_LABEL[energy.state];

  return (
    <View style={[s.wrap, style]}>
      <SoftWaveform intensity={energy.intensity} color={accent} size="sm" />
      <Text style={[s.label, { color: 'rgba(245,247,251,0.86)' }]} numberOfLines={1}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  label: { fontSize: 11.5, fontWeight: '700', letterSpacing: 0.1 },
});

export default EnergyChip;
