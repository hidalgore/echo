import React, { useState } from 'react';
import { ScreenBackButton } from '../../components/shared/ScreenBackButton';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/tokens';
import { Text } from '../../components/ui';

export default function PaymentMethodsScreen() {
  const insets = useSafeAreaInsets();

  const methods = [{ id: '1', type: 'Visa', last4: '4242', def: true }, { id: '2', type: 'Apple Pay', last4: '', def: false }];
  const content = (
    <>
      <Text style={st.sectionTitle}>SAVED METHODS</Text>
      <View style={st.card}>
        {methods.map((m, i) => (
          <View key={m.id} style={[st.row, i === methods.length - 1 && { borderBottomWidth: 0 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Ionicons name={m.type === 'Apple Pay' ? 'logo-apple' : 'card-outline'} size={20} color="rgba(255,255,255,0.60)" />
              <Text style={st.rowLabel}>{m.type}{m.last4 ? ` ****${m.last4}` : ''}</Text>
            </View>
            {m.def && <Text style={{ fontSize: 12, fontWeight: '600', color: colors.paidGreen }}>Default</Text>}
          </View>
        ))}
      </View>
      <TouchableOpacity style={st.saveBtn} onPress={() => router.push({ pathname: '/checkout/single-checkout', params: { eventId: 'evt_demo_payment_setup', qty: '1', paymentSetup: 'true' } })}><Text style={st.saveText}>Add Payment Method</Text></TouchableOpacity>
    </>
  );
  return (
    <View style={[st.root, { paddingTop: insets.top }]}>
      <View style={st.header}>
        <ScreenBackButton color="#FFF" />
        <Text style={st.headerTitle}>Payment Methods</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
        {content}
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { height: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#FFF' },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },
  card: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', overflow: 'hidden', marginBottom: 20 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  rowLabel: { fontSize: 15, fontWeight: '500', color: 'rgba(255,255,255,0.85)' },
  rowValue: { fontSize: 14, color: 'rgba(255,255,255,0.50)' },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.40)', letterSpacing: 1, marginBottom: 10, marginTop: 8 },
  input: { height: 50, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', backgroundColor: 'rgba(255,255,255,0.04)', paddingHorizontal: 16, fontSize: 15, color: '#FFF', marginBottom: 12 },
  dangerBtn: { marginTop: 24, paddingVertical: 16, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(239,68,68,0.20)', backgroundColor: 'rgba(239,68,68,0.05)', alignItems: 'center' },
  dangerText: { fontSize: 15, fontWeight: '600', color: '#EF4444' },
  saveBtn: { marginTop: 20, height: 52, borderRadius: 16, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  saveText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
});
