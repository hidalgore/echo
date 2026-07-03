import React, { useState } from 'react';
import { ScreenBackButton } from '../../components/shared/ScreenBackButton';
import { View, ScrollView, StyleSheet, TouchableOpacity, Switch, Alert, TextInput } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/tokens';
import { Text } from '../../components/ui';

export default function SecurityScreen() {
  const insets = useSafeAreaInsets();

  const [biometric, setBiometric] = useState(true);
  const content = (
    <>
      <Text style={st.sectionTitle}>AUTHENTICATION</Text>
      <View style={st.card}>
        <TouchableOpacity style={st.row} onPress={() => Alert.alert('Password', 'Reset link sent to your email.')}><Text style={st.rowLabel}>Change Password</Text><Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.25)" /></TouchableOpacity>
        <View style={[st.row, { borderBottomWidth: 0 }]}><Text style={st.rowLabel}>Face ID / Biometric</Text><Switch value={biometric} onValueChange={setBiometric} trackColor={{ true: colors.accent }} /></View>
      </View>
      <Text style={st.sectionTitle}>SESSIONS</Text>
      <View style={st.card}>
        <View style={[st.row, { borderBottomWidth: 0 }]}>
          <View><Text style={st.rowLabel}>This Device</Text><Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.40)', marginTop: 2 }}>iPhone 15 Pro {String.fromCharCode(183)} Seattle, WA</Text></View>
          <Text style={{ fontSize: 12, fontWeight: '600', color: colors.paidGreen }}>Active</Text>
        </View>
      </View>
    </>
  );
  return (
    <View style={[st.root, { paddingTop: insets.top }]}>
      <View style={st.header}>
        <ScreenBackButton color="#FFF" />
        <Text style={st.headerTitle}>Security</Text>
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
