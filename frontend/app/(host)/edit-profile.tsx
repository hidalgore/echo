/**
 * Edit Host Profile
 * =================
 * Reads/writes from hostProfileStore (new activation system).
 * Fields: displayName, city, hostType, eventTypes.
 */
import React, { useState } from 'react';
import {
  View, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius } from '../../theme/hostTokens';
import { Text } from '../../components/ui';
import { ModeSwitchHeader } from '../../components/navigation/ModeSwitchHeader';
import { useHostProfileStore } from '../../stores/hostProfileStore';
import { EVENT_TYPE_OPTIONS, type HostType } from '../../types/hostProfile';

const HOST_TYPES: { value: HostType; label: string }[] = [
  { value: 'individual', label: 'Individual' },
  { value: 'business', label: 'Business' },
  { value: 'nonprofit', label: 'Nonprofit' },
  { value: 'venue', label: 'Venue' },
  { value: 'promoter', label: 'Promoter' },
];

export default function HostEditProfileScreen() {
  const insets = useSafeAreaInsets();
  const {
    profile,
    setDisplayName,
    setHostType,
    setCity,
    toggleEventType,
  } = useHostProfileStore();

  const [name, setName] = useState(profile.displayName);
  const [city, setCityLocal] = useState(profile.city);

  const hasChanges =
    name !== profile.displayName ||
    city !== profile.city;

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Display name cannot be empty.');
      return;
    }
    setDisplayName(name.trim());
    setCity(city.trim());
    router.back();
  };

  const handleDiscard = () => {
    if (hasChanges) {
      Alert.alert('Discard changes?', 'Your edits will not be saved.', [
        { text: 'Keep Editing', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => router.back() },
      ]);
    } else {
      router.back();
    }
  };

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <ModeSwitchHeader title="Edit Host Profile" topInset={0} showNotification showBack />

      <ScrollView
        contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Display Name */}
        <View style={s.fieldGroup}>
          <Text style={s.label}>Display Name</Text>
          <TextInput
            style={s.input}
            value={name}
            onChangeText={setName}
            placeholder="Your host or organization name"
            placeholderTextColor="rgba(255,255,255,0.25)"
            autoCorrect={false}
          />
        </View>

        {/* City */}
        <View style={s.fieldGroup}>
          <Text style={s.label}>City</Text>
          <TextInput
            style={s.input}
            value={city}
            onChangeText={setCityLocal}
            placeholder="Primary city for events"
            placeholderTextColor="rgba(255,255,255,0.25)"
            autoCorrect={false}
          />
        </View>

        {/* Host Type */}
        <View style={s.fieldGroup}>
          <Text style={s.label}>Host Type</Text>
          <View style={s.chipRow}>
            {HOST_TYPES.map((ht) => {
              const active = profile.hostType === ht.value;
              return (
                <TouchableOpacity
                  key={ht.value}
                  style={[s.chip, active && s.chipActive]}
                  onPress={() => setHostType(ht.value)}
                  activeOpacity={0.82}
                >
                  <Text style={[s.chipText, active && s.chipTextActive]}>{ht.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Event Types */}
        <View style={s.fieldGroup}>
          <Text style={s.label}>Event Types</Text>
          <Text style={s.sublabel}>Select the types of events you host</Text>
          <View style={s.chipRow}>
            {EVENT_TYPE_OPTIONS.map((et) => {
              const active = profile.eventTypes.includes(et);
              return (
                <TouchableOpacity
                  key={et}
                  style={[s.chip, active && s.chipActive]}
                  onPress={() => toggleEventType(et)}
                  activeOpacity={0.82}
                >
                  <Text style={[s.chipText, active && s.chipTextActive]}>{et}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Save / Cancel */}
        <View style={s.actions}>
          <TouchableOpacity
            style={[s.saveBtn, !name.trim() && s.saveBtnDisabled]}
            onPress={handleSave}
            activeOpacity={0.88}
            disabled={!name.trim()}
          >
            <Text style={s.saveBtnText}>Save Changes</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.cancelBtn} onPress={handleDiscard} activeOpacity={0.82}>
            <Text style={s.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, gap: 24 },
  fieldGroup: { gap: 8 },
  label: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.45)', letterSpacing: 0.4, textTransform: 'uppercase' },
  sublabel: { fontSize: 13, color: 'rgba(255,255,255,0.35)', marginTop: -4 },
  input: { minHeight: 52, borderRadius: radius.xl, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.03)', paddingHorizontal: 16, fontSize: 16, color: '#F5F7FB', fontWeight: '500' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  chipActive: { backgroundColor: 'rgba(32,199,255,0.12)', borderColor: 'rgba(32,199,255,0.30)' },
  chipText: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.55)' },
  chipTextActive: { color: '#20C7FF' },
  actions: { gap: 12, marginTop: 8 },
  saveBtn: { height: 52, borderRadius: 26, backgroundColor: '#20C7FF', alignItems: 'center', justifyContent: 'center' },
  saveBtnDisabled: { opacity: 0.35 },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: '#0F1115' },
  cancelBtn: { height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: 'rgba(255,255,255,0.55)' },
});
