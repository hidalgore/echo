import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../ui';
import { EchoWalletPassCard } from './EchoWalletPassCard';
import { createAccessPassMock, createEventPassMock, type EchoWalletPassStatus } from '../../services/appleWalletPassService';

const STATES: EchoWalletPassStatus[] = ['ready', 'scanning', 'checked_in', 'offline_ready', 'upcoming', 'expired', 'verification_required'];

export function EchoPassStateDemo() {
  return (
    <View style={s.wrap}>
      <Text style={s.title}>Pass States</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.row}>
        {STATES.map((status) => (
          <View key={status} style={s.cardWrap}>
            <Text style={s.stateLabel}>{status.replace('_', ' ').toUpperCase()}</Text>
            <EchoWalletPassCard pass={status === 'ready' ? createAccessPassMock(status) : createEventPassMock(status)} compact />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { marginTop: 20 },
  title: { color: '#F5F6FA', fontSize: 14, fontWeight: '900', letterSpacing: 1, marginBottom: 10 },
  row: { gap: 12, paddingRight: 20 },
  cardWrap: { width: 230 },
  stateLabel: { color: '#A7A9B3', fontSize: 10, fontWeight: '900', letterSpacing: 0.8, marginBottom: 8 },
});
