import React, { useEffect, useState } from 'react';
import { ScreenBackButton } from '../../components/shared/ScreenBackButton';
import { View, ScrollView, StyleSheet, TouchableOpacity, Switch, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/tokens';
import { Text } from '../../components/ui';
import { DEFAULT_ECHO_AI_PREFERENCES, EchoAIPreferences, getEchoAIPreferences, resetEchoEventInterests, saveEchoAIPreferences } from '../../services/echoAIPreferences';

export default function PrivacyScreen() {
  const insets = useSafeAreaInsets();

  const [location, setLocation] = useState(true);
  const [visible, setVisible] = useState(true);
  const [aiPrefs, setAiPrefs] = useState<EchoAIPreferences>(DEFAULT_ECHO_AI_PREFERENCES);

  useEffect(() => {
    void getEchoAIPreferences().then(setAiPrefs);
  }, []);

  const updateAiPref = (patch: Partial<EchoAIPreferences>) => {
    const next = { ...aiPrefs, ...patch };
    setAiPrefs(next);
    void saveEchoAIPreferences(next);
  };

  const handleResetInterests = () => {
    Alert.alert(
      'Reset ECHO interests?',
      'Picked for You will restart from broad nearby, trending, verified, community, and donation-enabled events.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => void resetEchoEventInterests().then(setAiPrefs),
        },
      ],
    );
  };

  return (
    <View style={[st.root, { paddingTop: insets.top }]}> 
      <View style={st.header}>
        <ScreenBackButton color="#FFF" />
        <Text style={st.headerTitle}>Privacy & Data</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
        <Text style={st.sectionTitle}>PRIVACY</Text>
        <View style={st.card}>
          <View style={st.row}><Text style={st.rowLabel}>Location Sharing</Text><Switch value={location} onValueChange={setLocation} trackColor={{ true: colors.accent }} /></View>
          <View style={[st.row, { borderBottomWidth: 0 }]}><Text style={st.rowLabel}>Profile Visible</Text><Switch value={visible} onValueChange={setVisible} trackColor={{ true: colors.accent }} /></View>
        </View>

        <Text style={st.sectionTitle}>ECHO AI PREFERENCES</Text>
        <View style={st.card}>
          <View style={st.row}>
            <View style={st.rowCopy}>
              <Text style={st.rowLabel}>Personalized Picks</Text>
              <Text style={st.rowHint}>Allow Picked for You to tailor events to your taste.</Text>
            </View>
            <Switch value={aiPrefs.personalizedPicks} onValueChange={(value) => updateAiPref({ personalizedPicks: value })} trackColor={{ true: colors.accent }} />
          </View>
          <View style={st.row}>
            <View style={st.rowCopy}>
              <Text style={st.rowLabel}>Use Viewing Activity</Text>
              <Text style={st.rowHint}>Use clicks, saves, and respectful browsing signals. Raw pause timing is never shown.</Text>
            </View>
            <Switch value={aiPrefs.useViewingActivity} onValueChange={(value) => updateAiPref({ useViewingActivity: value })} trackColor={{ true: colors.accent }} />
          </View>
          <View style={st.row}>
            <View style={st.rowCopy}>
              <Text style={st.rowLabel}>Use Location for Nearby Events</Text>
              <Text style={st.rowHint}>Help ECHO prioritize relevant events in your area.</Text>
            </View>
            <Switch value={aiPrefs.useLocationForNearby} onValueChange={(value) => updateAiPref({ useLocationForNearby: value })} trackColor={{ true: colors.accent }} />
          </View>
          <TouchableOpacity style={[st.row, { borderBottomWidth: 0 }]} onPress={handleResetInterests} activeOpacity={0.82}>
            <View style={st.rowCopy}>
              <Text style={st.rowLabel}>Reset Event Interests</Text>
              <Text style={st.rowHint}>{aiPrefs.eventInterestsResetAt ? `Last reset ${new Date(aiPrefs.eventInterestsResetAt).toLocaleDateString()}` : 'Start recommendations fresh.'}</Text>
            </View>
            <Ionicons name="refresh-outline" size={19} color="rgba(255,255,255,0.46)" />
          </TouchableOpacity>
        </View>

        <Text style={st.sectionTitle}>YOUR DATA</Text>
        <View style={st.card}>
          <TouchableOpacity style={[st.row, { borderBottomWidth: 0 }]} onPress={() => Alert.alert('Export', 'Data export ready within 30 days per GDPR.')}><Text style={st.rowLabel}>Request Data Export</Text><Ionicons name="download-outline" size={18} color="rgba(255,255,255,0.40)" /></TouchableOpacity>
        </View>
        <TouchableOpacity style={st.dangerBtn} onPress={() => Alert.alert('Delete Account', 'This is permanent. Contact support@echo.app.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Contact Support' }])}><Text style={st.dangerText}>Delete Account</Text></TouchableOpacity>
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
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14, paddingVertical: 16, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  rowCopy: { flex: 1, paddingRight: 8 },
  rowLabel: { fontSize: 15, fontWeight: '500', color: 'rgba(255,255,255,0.85)' },
  rowHint: { marginTop: 4, fontSize: 12.5, lineHeight: 17, color: 'rgba(255,255,255,0.46)' },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.40)', letterSpacing: 1, marginBottom: 10, marginTop: 8 },
  dangerBtn: { marginTop: 24, paddingVertical: 16, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(239,68,68,0.20)', backgroundColor: 'rgba(239,68,68,0.05)', alignItems: 'center' },
  dangerText: { fontSize: 15, fontWeight: '600', color: '#EF4444' },
});
