import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ModeSwitchHeader } from '../../../components/navigation/ModeSwitchHeader';
import { Text } from '../../../components/ui';
import { AppearanceSheet } from '../../../components/settings/AppearanceSheet';
import { colors, radius } from '../../../theme/hostTokens';
import { useDynamicTheme } from '../../../theme/dynamicTheme';
import { useHostProfileStore } from '../../../stores/hostProfileStore';
import { HOST_TYPE_LABELS, type EchoDiskSlot } from '../../../types/hostProfile';

const items = [
  { label: 'Edit Host Profile', icon: 'person-outline', href: '/(host)/edit-profile' },
  { label: 'Social & Promotion', icon: 'megaphone-outline', href: '/(host)/social-settings' },
  { label: 'Payout Settings', icon: 'card-outline', href: '/(host)/payout-settings' },
  { label: 'Door Mode Passcode', icon: 'keypad-outline', href: '__door_passcode__' },
  { label: 'Appearance', icon: 'contrast-outline', href: '__appearance__' },
  { label: 'Support', icon: 'help-circle-outline', href: '/(host)/support' },
];

export default function HostProfileScreen() {
  const insets = useSafeAreaInsets();
  const { profile, payout, primaryDisk, backupDisk, doorModePasscode, hydrate, registerEchoDisk, verifyEchoDisk, clearEchoDisk, setDoorModePasscode, clearDoorModePasscode } = useHostProfileStore();
  const { preference: themePref } = useDynamicTheme();
  const displayName = profile.displayName || 'ECHO Host';
  const hostType = profile.hostType ? HOST_TYPE_LABELS[profile.hostType] : 'Host';
  const city = profile.city || '';
  const payoutConnected = payout.payoutStatus === 'connected';
  const [editingSlot, setEditingSlot] = useState<'primary' | 'backup' | null>(null);
  const [serial, setSerial] = useState('');
  const [nickname, setNickname] = useState('');
  const [showAppearance, setShowAppearance] = useState(false);
  const [showDoorPasscode, setShowDoorPasscode] = useState(false);
  const [doorPasscodeInput, setDoorPasscodeInput] = useState('');

  useEffect(() => { void hydrate(); }, [hydrate]);

  const openDiskEditor = (disk: EchoDiskSlot) => {
    setEditingSlot(disk.slotId);
    setSerial(disk.serialNumber);
    setNickname(disk.nickname);
  };

  const saveDisk = () => {
    if (!editingSlot || !serial.trim()) {
      Alert.alert('Serial required', 'Enter the Echo Disk serial number saved for this host account.');
      return;
    }
    registerEchoDisk(editingSlot, { serialNumber: serial, nickname });
    verifyEchoDisk(editingSlot);
    setEditingSlot(null);
  };

  const diskCards = useMemo(() => [primaryDisk, backupDisk], [primaryDisk, backupDisk]);

  return (
    <View style={styles.container}>
      <ModeSwitchHeader title="Profile" showNotification />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <View style={styles.avatarWrap}><Ionicons name="person" size={28} color={colors.textTertiary} /></View>
            <View style={styles.heroInfo}>
              <Text style={styles.name}>{displayName}</Text>
              <Text style={styles.meta}>{[city, hostType].filter(Boolean).join(' · ')}</Text>
            </View>
          </View>
          <View style={styles.statusRow}>
            <Badge tone="green" text="HOST Active" icon="checkmark-circle" />
            <Badge tone={payoutConnected ? 'green' : 'amber'} text={payoutConnected ? 'Payouts connected' : 'Payouts needed'} icon={payoutConnected ? 'checkmark-circle' : 'alert-circle'} />
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Echo Disk</Text>
              <Text style={styles.sectionBody}>Register hardware here once. Door Mode only verifies and starts fast.</Text>
            </View>
          </View>
          {diskCards.map((disk) => {
            const hasSerial = !!disk.serialNumber;
            const statusColor = disk.status === 'verified' ? '#10B981' : hasSerial ? '#20C7FF' : colors.textTertiary;
            const statusLabel = disk.status === 'verified' ? 'Verified' : hasSerial ? 'Registered' : 'Not added';
            return (
              <View key={disk.slotId} style={styles.diskCard}>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={styles.diskTitle}>{disk.nickname || (disk.slotId === 'primary' ? 'Main Door Disk' : 'Backup Door Disk')}</Text>
                  <Text style={styles.diskSerial}>{hasSerial ? disk.serialNumber : 'No serial saved yet'}</Text>
                  <Text style={[styles.diskStatus, { color: statusColor }]}>{statusLabel}{disk.lastVerifiedAt ? ` · ${new Date(disk.lastVerifiedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ''}</Text>
                </View>
                <View style={styles.diskActions}>
                  <TouchableOpacity style={styles.diskActionBtn} onPress={() => openDiskEditor(disk)}><Text style={styles.diskActionText}>{hasSerial ? 'Edit' : 'Add'}</Text></TouchableOpacity>
                  {hasSerial ? <TouchableOpacity style={styles.diskActionBtn} onPress={() => verifyEchoDisk(disk.slotId)}><Text style={styles.diskActionText}>Test</Text></TouchableOpacity> : null}
                  {hasSerial ? <TouchableOpacity style={styles.diskActionBtn} onPress={() => clearEchoDisk(disk.slotId)}><Text style={[styles.diskActionText, { color: '#F87171' }]}>Clear</Text></TouchableOpacity> : null}
                </View>
              </View>
            );
          })}
        </View>

        {items.map((item) => (
          <TouchableOpacity key={item.label} style={styles.item} onPress={() => item.href === '__appearance__' ? setShowAppearance(true) : item.href === '__door_passcode__' ? (setDoorPasscodeInput(''), setShowDoorPasscode(true)) : item.href && router.push(item.href as never)} activeOpacity={0.85}>
            <Ionicons name={item.icon as never} size={18} color={colors.textSecondary} />
            <Text style={styles.itemText}>{item.label}</Text>
            {item.href === '__appearance__' && (
              <Text style={{ fontSize: 13, color: colors.textTertiary, marginRight: 4 }}>
                {themePref === 'auto' ? 'Auto' : themePref === 'light' ? 'Light' : 'Dark'}
              </Text>
            )}
            {item.href === '__door_passcode__' && (
              <Text style={{ fontSize: 13, color: doorModePasscode ? '#10B981' : colors.textTertiary, marginRight: 4 }}>
                {doorModePasscode ? 'Set' : 'Not set'}
              </Text>
            )}
            <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Modal visible={!!editingSlot} transparent animationType="fade" onRequestClose={() => setEditingSlot(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{editingSlot === 'backup' ? 'Backup Echo Disk' : 'Main Echo Disk'}</Text>
            <Text style={styles.modalBody}>Save the serial here so Door Mode can verify quickly before scanning.</Text>
            <TextInput value={nickname} onChangeText={setNickname} placeholder="Device nickname" placeholderTextColor="rgba(255,255,255,0.28)" style={styles.input} />
            <TextInput value={serial} onChangeText={setSerial} placeholder="Serial number" autoCapitalize="characters" placeholderTextColor="rgba(255,255,255,0.28)" style={styles.input} />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.secondaryBtn} onPress={() => setEditingSlot(null)}><Text style={styles.secondaryBtnText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={styles.primaryBtn} onPress={saveDisk}><Text style={styles.primaryBtnText}>Save Disk</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showDoorPasscode} transparent animationType="fade" onRequestClose={() => setShowDoorPasscode(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Door Mode Passcode</Text>
            <Text style={styles.modalBody}>This 6-digit passcode is required to resume Door Mode after pausing. Share it only with trusted door staff.</Text>
            <TextInput
              value={doorPasscodeInput}
              onChangeText={setDoorPasscodeInput}
              placeholder={doorModePasscode ? 'Enter new 6-digit passcode' : 'Create 6-digit passcode'}
              keyboardType="number-pad"
              secureTextEntry
              maxLength={6}
              placeholderTextColor="rgba(255,255,255,0.28)"
              style={styles.input}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.secondaryBtn} onPress={() => setShowDoorPasscode(false)}><Text style={styles.secondaryBtnText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => {
                  if (!/^\d{6}$/.test(doorPasscodeInput.trim())) {
                    Alert.alert('Passcode required', 'Use exactly 6 digits for Door Mode.');
                    return;
                  }
                  setDoorModePasscode(doorPasscodeInput.trim());
                  setShowDoorPasscode(false);
                }}
              >
                <Text style={styles.primaryBtnText}>{doorModePasscode ? 'Update' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
            {doorModePasscode ? (
              <TouchableOpacity
                style={styles.clearPasscodeBtn}
                onPress={() => {
                  clearDoorModePasscode();
                  setDoorPasscodeInput('');
                  setShowDoorPasscode(false);
                }}
              >
                <Text style={styles.clearPasscodeText}>Clear Door Passcode</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </Modal>

      {/* ── Appearance Sheet ── */}
      <AppearanceSheet visible={showAppearance} onClose={() => setShowAppearance(false)} />
    </View>
  );
}

function Badge({ tone, text, icon }: { tone: 'green' | 'amber'; text: string; icon: any }) {
  const color = tone === 'green' ? '#10B981' : '#F59E0B';
  return (
    <View style={[styles.statusBadge, { borderColor: `${color}40` }]}>
      <Ionicons name={icon} size={14} color={color} />
      <Text style={[styles.statusText, { color }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, gap: 12 },
  hero: { backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', borderRadius: radius.xl, padding: 18, marginBottom: 4 },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 14 },
  avatarWrap: { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
  heroInfo: { flex: 1 },
  name: { color: colors.textPrimary, fontSize: 22, fontWeight: '700', marginBottom: 4 },
  meta: { color: colors.textSecondary, fontSize: 14 },
  statusRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1, backgroundColor: 'rgba(255,255,255,0.02)' },
  statusText: { fontSize: 12, fontWeight: '600' },
  sectionCard: { backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', borderRadius: radius.xl, padding: 18, gap: 14 },
  sectionHeader: { marginBottom: 2 },
  sectionTitle: { color: colors.textPrimary, fontSize: 17, fontWeight: '700', marginBottom: 4 },
  sectionBody: { color: colors.textSecondary, fontSize: 13, lineHeight: 18 },
  diskCard: { borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', backgroundColor: 'rgba(255,255,255,0.025)', padding: 14, flexDirection: 'row', gap: 12 },
  diskTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: '700' },
  diskSerial: { color: colors.textSecondary, fontSize: 13 },
  diskStatus: { fontSize: 12, fontWeight: '600' },
  diskActions: { justifyContent: 'center', gap: 8 },
  diskActionBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  diskActionText: { color: colors.textPrimary, fontSize: 12, fontWeight: '600' },
  item: { backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', borderRadius: radius.xl, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 12 },
  itemText: { color: colors.textPrimary, fontSize: 15, fontWeight: '600', flex: 1 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modalCard: { width: '100%', borderRadius: 24, backgroundColor: '#151821', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', padding: 20, gap: 12 },
  modalTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '700' },
  modalBody: { color: colors.textSecondary, fontSize: 13, lineHeight: 18 },
  input: { minHeight: 50, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.03)', paddingHorizontal: 16, color: colors.textPrimary },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 6 },
  primaryBtn: { flex: 1, minHeight: 48, borderRadius: 24, backgroundColor: colors.accentCyan, alignItems: 'center', justifyContent: 'center' },
  primaryBtnText: { color: colors.bg, fontWeight: '700' },
  secondaryBtn: { flex: 1, minHeight: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  secondaryBtnText: { color: colors.textPrimary, fontWeight: '600' },
  clearPasscodeBtn: { alignItems: 'center', paddingTop: 14 },
  clearPasscodeText: { color: '#F87171', fontSize: 13, fontWeight: '700' },
});
