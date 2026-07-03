/**
 * ECHO WebTrustStrip — reusable inline trust badges row.
 * Used on event details, checkout, wallet, etc.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface TrustItem {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}

const DEFAULT_ITEMS: TrustItem[] = [
  { icon: 'shield-checkmark', label: 'Secure checkout' },
  { icon: 'checkmark-done', label: 'Verified host' },
  { icon: 'wallet', label: 'Wallet-ready pass' },
  { icon: 'flash', label: 'NFC + QR access' },
];

interface Props {
  items?: TrustItem[];
  size?: 'sm' | 'md';
}

export function WebTrustStrip({ items = DEFAULT_ITEMS, size = 'md' }: Props) {
  const px = size === 'sm' ? 10 : 12;
  const py = size === 'sm' ? 6 : 8;
  const fs = size === 'sm' ? 11 : 12;

  return (
    <View style={styles.row}>
      {items.map((item) => (
        <View
          key={item.label}
          style={[styles.badge, { paddingHorizontal: px, paddingVertical: py }]}
        >
          <Ionicons name={item.icon} size={fs + 2} color="rgba(255,255,255,0.85)" />
          <Text style={[styles.label, { fontSize: fs }]}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  label: { color: 'rgba(255,255,255,0.82)', fontWeight: '500' },
});

export default WebTrustStrip;
