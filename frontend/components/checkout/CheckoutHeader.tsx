import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../ui';

type Props = { title?: string; onBack?: () => void };

export function CheckoutHeader({ title = 'Checkout', onBack }: Props) {
  return (
    <View style={s.row}>
      <TouchableOpacity style={s.btn} onPress={onBack || (() => router.back())} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons name="chevron-back" size={24} color="#F5F7FB" />
      </TouchableOpacity>
      <View style={s.center}><Text style={s.title}>{title}</Text></View>
      <View style={s.btn} />
    </View>
  );
}

const s = StyleSheet.create({
  row: { height: 44, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20 },
  btn: { width: 44, height: 44, justifyContent: 'center' },
  center: { flex: 1, alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '600', color: '#F5F7FB' },
});
