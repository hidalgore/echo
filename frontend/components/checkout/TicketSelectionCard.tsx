import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../ui';

type Props = {
  ticketType: string;
  unitPrice: number;
  quantity: number;
  min?: number;
  max?: number;
  onIncrement: () => void;
  onDecrement: () => void;
};

const fmt = (n: number) => `$${n.toFixed(2)}`;

export function TicketSelectionCard({ ticketType, unitPrice, quantity, min = 1, max = 10, onIncrement, onDecrement }: Props) {
  return (
    <View style={s.card}>
      <View style={s.left}>
        <Text style={s.type}>{ticketType}</Text>
        <Text style={s.price}>{fmt(unitPrice)}</Text>
      </View>
      <View style={s.stepper}>
        <TouchableOpacity style={[s.stepBtn, quantity <= min && s.stepDisabled]} onPress={onDecrement} disabled={quantity <= min} activeOpacity={0.7}>
          <Ionicons name="remove" size={18} color={quantity <= min ? 'rgba(255,255,255,0.20)' : '#FFFFFF'} />
        </TouchableOpacity>
        <View style={s.countWrap}>
          <Text style={s.count}>{quantity}</Text>
        </View>
        <TouchableOpacity style={[s.stepBtn, quantity >= max && s.stepDisabled]} onPress={onIncrement} disabled={quantity >= max} activeOpacity={0.7}>
          <Ionicons name="add" size={18} color={quantity >= max ? 'rgba(255,255,255,0.20)' : '#FFFFFF'} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 24,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 20, paddingHorizontal: 18, marginHorizontal: 20, minHeight: 94,
  },
  left: {},
  type: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  price: { fontSize: 14, color: 'rgba(255,255,255,0.60)', marginTop: 4 },
  stepper: { flexDirection: 'row', alignItems: 'center', height: 44, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', overflow: 'hidden' },
  stepBtn: { width: 40, height: 44, alignItems: 'center', justifyContent: 'center' },
  stepDisabled: { opacity: 0.4 },
  countWrap: { width: 36, height: 44, alignItems: 'center', justifyContent: 'center', borderLeftWidth: 1, borderRightWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  count: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
});
