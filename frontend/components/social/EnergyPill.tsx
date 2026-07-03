import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Text } from '../ui';
import { SoftWaveform } from './SoftWaveform';
import { getStateAccent, getStateColor } from './energyColors';
import { ENERGY_STATE_LABEL, LIVE_PULSE_LABEL, type SocialEnergy } from '../../types/socialEnergy';

/**
 * EnergyPill
 * ══════════
 * Compact horizontal pill for event cards in home/trending/search.
 * Layout: tiny waveform · state label · live pulse (if present).
 *
 * Always single-line, never wraps. Designed to slot at the bottom of an event card
 * without competing with the title or CTA.
 */

interface EnergyPillProps {
  energy: SocialEnergy;
  style?: ViewStyle;
  /** On dark bg by default. Pass darkText for light backgrounds. */
  darkText?: boolean;
}

export function EnergyPill({ energy, style, darkText = false }: EnergyPillProps) {
  const accent = getStateAccent(energy.state);
  const bg = getStateColor(energy.state, 0.10);
  const border = getStateColor(energy.state, 0.20);
  const textColor = darkText ? '#15171C' : '#F5F7FB';
  const pulseColor = darkText ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.65)';

  return (
    <View style={[s.wrap, { backgroundColor: bg, borderColor: border }, style]}>
      <SoftWaveform intensity={energy.intensity} color={accent} size="sm" />
      <Text style={[s.label, { color: textColor }]} numberOfLines={1}>
        {ENERGY_STATE_LABEL[energy.state]}
        {energy.pulse ? (
          <Text style={{ color: pulseColor, fontWeight: '600' }}> · {LIVE_PULSE_LABEL[energy.pulse]}</Text>
        ) : null}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, alignSelf: 'flex-start' },
  label: { fontSize: 12, fontWeight: '800', letterSpacing: -0.1 },
});

export default EnergyPill;
