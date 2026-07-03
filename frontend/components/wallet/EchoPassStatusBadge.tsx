import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../ui';
import type { EchoWalletPassStatus } from '../../services/appleWalletPassService';

const BADGE: Record<EchoWalletPassStatus, { label: string; icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  ready: { label: 'ENTRY READY', icon: 'shield-checkmark-outline', color: '#A7F3D0' },
  scanning: { label: 'SCANNING', icon: 'radio-outline', color: '#8EC5FF' },
  checked_in: { label: 'CHECKED IN', icon: 'checkmark-circle-outline', color: '#A7F3D0' },
  offline_ready: { label: 'OFFLINE READY', icon: 'cloud-offline-outline', color: '#7DD3FC' },
  upcoming: { label: 'AVAILABLE SOON', icon: 'time-outline', color: '#FFC857' },
  expired: { label: 'EXPIRED', icon: 'close-circle-outline', color: '#FF5A63' },
  verification_required: { label: 'VERIFY AGE', icon: 'alert-circle-outline', color: '#FFC857' },
};

export function EchoPassStatusBadge({ status, compact = false }: { status: EchoWalletPassStatus; compact?: boolean }) {
  const config = BADGE[status];
  return (
    <View style={[s.badge, compact && s.badgeCompact, { borderColor: `${config.color}33`, backgroundColor: `${config.color}14` }]}>
      <Ionicons name={config.icon} size={compact ? 11 : 13} color={config.color} />
      <Text style={[s.text, compact && s.textCompact, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5 },
  badgeCompact: { paddingHorizontal: 7, paddingVertical: 3, gap: 4 },
  text: { fontSize: 10.5, fontWeight: '900', letterSpacing: 0.7 },
  textCompact: { fontSize: 8.5, letterSpacing: 0.5 },
});
