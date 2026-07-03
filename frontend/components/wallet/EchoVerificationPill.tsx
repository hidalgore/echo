import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../ui';

export function EchoVerificationPill({ label = '21+ VERIFIED', tone = 'violet' }: { label?: string; tone?: 'violet' | 'green' | 'blue' }) {
  const color = tone === 'green' ? '#A7F3D0' : tone === 'blue' ? '#7DD3FC' : '#E238B8';
  return (
    <View style={[s.pill, { borderColor: `${color}55`, backgroundColor: `${color}16` }]}>
      <Ionicons name="shield-checkmark-outline" size={12} color={color} />
      <Text style={[s.text, { color }]}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  pill: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  text: { fontSize: 9.5, fontWeight: '900', letterSpacing: 0.7 },
});
