import React, { useState } from 'react';
import { ScreenBackButton } from '../../components/shared/ScreenBackButton';
import { View, ScrollView, StyleSheet, TouchableOpacity, Switch, Alert, TextInput } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/tokens';
import { Text } from '../../components/ui';

export default function AccountScreen() {
  const insets = useSafeAreaInsets();

  const [name, setName] = useState('Sevon Telemaque');
  const [username, setUsername] = useState('@sevon');
  const [phone, setPhone] = useState('+1 (206) 555-0123');
  const content = (
    <>
      <Text style={st.sectionTitle}>PERSONAL INFO</Text>
      <TextInput style={st.input} value={name} onChangeText={setName} placeholder="Full name" placeholderTextColor="rgba(255,255,255,0.30)" />
      <TextInput style={st.input} value={username} onChangeText={setUsername} placeholder="@username" placeholderTextColor="rgba(255,255,255,0.30)" autoCapitalize="none" />
      <TextInput style={st.input} value="sevon@echo.app" editable={false} placeholder="Email" placeholderTextColor="rgba(255,255,255,0.30)" />
      <TextInput style={st.input} value={phone} onChangeText={setPhone} placeholder="Phone" placeholderTextColor="rgba(255,255,255,0.30)" keyboardType="phone-pad" />
      <TouchableOpacity style={st.saveBtn} onPress={() => { Alert.alert('Saved'); router.back(); }}><Text style={st.saveText}>Save Changes</Text></TouchableOpacity>
    </>
  );
  return (
    <View style={[st.root, { paddingTop: insets.top }]}>
      <View style={st.header}>
        <ScreenBackButton color="#FFF" />
        <Text style={st.headerTitle}>Account</Text>
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
