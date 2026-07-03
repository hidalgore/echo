/**
 * ECHO Profile — v15 Full Buildout
 * ═══════════════════════════════════
 * S-12 Canon: privacy, notifications, security, payments, support.
 * 8 full sections + "Your ECHO" (age verification + become a host).
 * Each section row navigates to a dedicated sub-screen.
 */
import React, { useMemo, useState } from 'react';
import {
  View, ScrollView, StyleSheet, TouchableOpacity, Image, Alert, Modal, TextInput, Platform, Animated,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radii, spacing } from '../../theme/tokens';
import { useDynamicTheme } from '../../theme/dynamicTheme';
import { AppearanceSheet } from '../../components/settings/AppearanceSheet';
import { ModeSwitchHeader } from '../../components/navigation/ModeSwitchHeader';
import { useEchoHeaderVisibility } from '../../components/navigation/useEchoHeaderVisibility';
import { Text } from '../../components/ui';
import { useAuthStore } from '../../stores/authStore';
import { useTicketStore } from '../../stores/ticketStore';
import { useEventStore } from '../../stores/eventStore';
import { useVerificationStore } from '../../stores/verificationStore';
import { useHostProfileStore } from '../../stores/hostProfileStore';
import { MOCK_USER } from '../../services/mock';
import { EchoWalletPassCard } from '../../components/wallet/EchoWalletPassCard';
import { AddToWalletSheet } from '../../components/wallet/AddToWalletSheet';
import { getAccessPassForUser } from '../../services/appleWalletPassService';

// ─── Types ───────────────────────────────────────────────────

type SectionRow = {
  key: string;
  icon: string;
  label: string;
  subtitle?: string;
  route: string;
  accent?: string;
  badge?: string;
  badgeColor?: string;
};

// ─── Component ───────────────────────────────────────────────

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout, deleteAccount } = useAuthStore();

  // Delete account modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [deleteStep, setDeleteStep] = useState<'confirm' | 'type'>('confirm');
  const [showAppearance, setShowAppearance] = useState(false);
  const [showAccessPass, setShowAccessPass] = useState(false);
  const [showAddToWalletSheet, setShowAddToWalletSheet] = useState(false);
  const { visible: headerVisible, onScroll: handleHeaderScroll, headerAnimatedStyle } = useEchoHeaderVisibility();
  const { preference: themePref } = useDynamicTheme();
  const { tickets } = useTicketStore();
  const getEventById = useEventStore((state) => state.getEventById);
  const { status: verifyStatus } = useVerificationStore();
  const { profile: hostProfile } = useHostProfileStore();

  const displayUser = user || MOCK_USER;
  const accessPass = useMemo(() => getAccessPassForUser(tickets, getEventById), [tickets, getEventById]);
  const eventsAttended = useMemo(() => tickets.filter(t => t.status === 'used').length, [tickets]);
  const activeTickets = useMemo(() => tickets.filter(t => t.status === 'active').length, [tickets]);

  const verifyLabel = verifyStatus === 'verified' ? 'Verified'
    : verifyStatus === 'pending_review' ? 'Pending'
    : verifyStatus === 'failed' ? 'Failed'
    : 'Not verified';

  const verifyBadgeColor = verifyStatus === 'verified' ? colors.paidGreen
    : verifyStatus === 'pending_review' ? colors.pendingAmber
    : 'rgba(255,255,255,0.40)';

  const hostAppLabel = hostProfile.hostAccessStatus === 'active' ? 'Host Active'
    : hostProfile.hostAccessStatus === 'in_progress' || hostProfile.hostAccessStatus === 'action_required' ? 'Continue Setup'
    : hostProfile.hostAccessStatus === 'restricted' ? 'Restricted'
    : 'Apply to Host';

  const hostAppBadgeColor = hostProfile.hostAccessStatus === 'active' ? colors.paidGreen
    : hostProfile.hostAccessStatus === 'in_progress' || hostProfile.hostAccessStatus === 'action_required' ? colors.pendingAmber
    : colors.accent;

  // ─── Section definitions ────────────────────────────────────

  const yourEchoRows: SectionRow[] = [
    {
      key: 'age-verify',
      icon: 'shield-checkmark-outline',
      label: 'Age Verification',
      subtitle: verifyLabel,
      route: '/verify/method',
      badge: verifyLabel,
      badgeColor: verifyBadgeColor,
    },
    {
      key: 'become-host',
      icon: 'storefront-outline',
      label: 'Become a Verified Host',
      subtitle: hostProfile.hostAccessStatus === 'active' ? 'You are a verified host' : 'Host events on ECHO',
      route: '/host-application',
      accent: colors.accent,
      badge: hostAppLabel,
      badgeColor: hostAppBadgeColor,
    },
    {
      key: 'echo-insider',
      icon: 'sparkles-outline',
      label: 'ECHO Insider',
      subtitle: 'Apply, view verified missions, rewards, and feedback impact',
      route: '/profile/insider',
      accent: colors.echoBlue,
      badge: 'Beta Access',
      badgeColor: colors.echoBlue,
    },
  ];

  const settingsSections: Array<{ title: string; rows: SectionRow[] }> = [
    {
      title: 'Account',
      rows: [
        { key: 'account', icon: 'person-outline', label: 'Account Details', subtitle: displayUser.email, route: '/profile/account' },
        { key: 'payment', icon: 'card-outline', label: 'Payment Methods', subtitle: 'Visa ****4242', route: '/profile/payment-methods' },
        { key: 'linked', icon: 'link-outline', label: 'Linked Accounts', subtitle: 'Apple, Google', route: '/profile/linked-accounts' },
      ],
    },
    {
      title: 'Preferences',
      rows: [
        { key: 'notif', icon: 'notifications-outline', label: 'Notifications', subtitle: 'Push, email, SMS', route: '/profile/notifications' },
        { key: 'privacy', icon: 'eye-off-outline', label: 'Privacy & Data', subtitle: 'Location, data export', route: '/profile/privacy' },
        { key: 'appearance', icon: 'contrast-outline', label: 'Appearance', subtitle: themePref === 'auto' ? 'Automatic' : themePref === 'light' ? 'Light' : 'Dark', route: '__appearance__' },
      ],
    },
    {
      title: 'Security',
      rows: [
        { key: 'security', icon: 'lock-closed-outline', label: 'Security', subtitle: 'Password, biometrics', route: '/profile/security' },
      ],
    },
    {
      title: 'Support',
      rows: [
        { key: 'support', icon: 'help-circle-outline', label: 'Help & Support', subtitle: 'FAQ, contact us', route: '/profile/support' },
      ],
    },
  ];

  const handleAddAccessPass = () => {
    setShowAddToWalletSheet(true);
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => {
        await logout();
        router.replace('/(auth)/sign-in');
      }},
    ]);
  };

  return (
    <View style={s.root}>
      <Animated.View style={headerAnimatedStyle} pointerEvents={headerVisible ? 'auto' : 'none'}>
        <ModeSwitchHeader title="Profile" topInset={insets.top} showNotification />
      </Animated.View>
      <ScrollView contentContainerStyle={[s.scrollContent, { paddingBottom: 150 + insets.bottom }]} showsVerticalScrollIndicator={false} onScroll={handleHeaderScroll} scrollEventThrottle={16}>

        {/* ── Profile Header ── */}
        <View style={s.header}>
          <View style={s.avatarWrap}>
            {displayUser.avatar_url ? (
              <Image source={{ uri: displayUser.avatar_url }} style={s.avatar} />
            ) : (
              <LinearGradient colors={[colors.accent, colors.echoBlue]} style={s.avatar}>
                <Text style={s.avatarInitial}>{(displayUser.name || 'U').charAt(0).toUpperCase()}</Text>
              </LinearGradient>
            )}
            <TouchableOpacity style={s.editAvatarBtn} onPress={() => router.push('/profile/account')}>
              <Ionicons name="camera-outline" size={14} color="#FFF" />
            </TouchableOpacity>
          </View>
          <Text style={s.displayName}>{displayUser.name || 'ECHO User'}</Text>
          <Text style={s.email}>{displayUser.email}</Text>

          {/* ── ECHO Wallet Card (above stats, below identity) ── */}
          <View style={s.walletCardSection}>
            <Text style={s.accessPassEyebrow}>ECHO ACCESS PASS</Text>
            <EchoWalletPassCard pass={accessPass} />
            <TouchableOpacity style={s.accessPassBtn} onPress={handleAddAccessPass} activeOpacity={0.86}>
              <Ionicons name="wallet-outline" size={17} color="#0F1115" />
              <Text style={s.accessPassBtnText}>{Platform.OS === 'ios' ? 'Add to Apple Wallet' : 'Add to Google Wallet'}</Text>
            </TouchableOpacity>
          </View>

          {/* Stats row */}
          <View style={s.statsRow}>
            <View style={s.statItem}>
              <Text style={s.statValue}>{activeTickets}</Text>
              <Text style={s.statLabel}>Active</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.statItem}>
              <Text style={s.statValue}>{eventsAttended}</Text>
              <Text style={s.statLabel}>Attended</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.statItem}>
              <Text style={s.statValue}>{verifyStatus === 'verified' ? 'Yes' : 'No'}</Text>
              <Text style={s.statLabel}>Verified</Text>
            </View>
          </View>
        </View>

        {/* ── Your ECHO section ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>YOUR ECHO</Text>
          <View style={s.card}>
            {yourEchoRows.map((row, i) => (
              <TouchableOpacity
                key={row.key}
                style={[s.row, i < yourEchoRows.length - 1 && s.rowBorder]}
                onPress={() => router.push(row.route as never)}
                activeOpacity={0.7}
              >
                <View style={[s.rowIcon, row.accent ? { backgroundColor: row.accent + '18' } : {}]}>
                  <Ionicons name={row.icon as never} size={20} color={row.accent || 'rgba(255,255,255,0.60)'} />
                </View>
                <View style={s.rowContent}>
                  <Text style={s.rowLabel}>{row.label}</Text>
                  {row.subtitle && <Text style={s.rowSub}>{row.subtitle}</Text>}
                </View>
                {row.badge && (
                  <View style={[s.badge, { backgroundColor: (row.badgeColor || colors.accent) + '18' }]}>
                    <Text style={[s.badgeText, { color: row.badgeColor || colors.accent }]}>{row.badge}</Text>
                  </View>
                )}
                <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.25)" />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Settings sections ── */}
        {settingsSections.map(section => (
          <View key={section.title} style={s.section}>
            <Text style={s.sectionTitle}>{section.title.toUpperCase()}</Text>
            <View style={s.card}>
              {section.rows.map((row, i) => (
                <TouchableOpacity
                  key={row.key}
                  style={[s.row, i < section.rows.length - 1 && s.rowBorder]}
                  onPress={() => row.route === '__appearance__' ? setShowAppearance(true) : router.push(row.route as never)}
                  activeOpacity={0.7}
                >
                  <View style={s.rowIcon}>
                    <Ionicons name={row.icon as never} size={20} color="rgba(255,255,255,0.60)" />
                  </View>
                  <View style={s.rowContent}>
                    <Text style={s.rowLabel}>{row.label}</Text>
                    {row.subtitle && <Text style={s.rowSub}>{row.subtitle}</Text>}
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.25)" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* ── Sign Out ── */}
        <TouchableOpacity style={s.signOutBtn} onPress={handleLogout} activeOpacity={0.7}>
          <Ionicons name="log-out-outline" size={18} color={colors.declinedRed} />
          <Text style={s.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={s.version}>ECHO v1.0.0</Text>

        {/* ── Delete Account — intentionally placed at the bottom ── */}
        <View style={s.deleteSection}>
          <Text style={s.deleteSectionTitle}>ACCOUNT REMOVAL</Text>
          <Text style={s.deleteSectionBody}>Scroll to the bottom any time to permanently delete your ECHO account.</Text>
          <TouchableOpacity
            style={s.deleteBtn}
            onPress={() => { setDeleteStep('confirm'); setDeleteInput(''); setShowDeleteModal(true); }}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={16} color="rgba(239,68,68,0.72)" />
            <Text style={s.deleteText}>Delete Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ── Delete Account Modal ── */}
      <Modal visible={showDeleteModal} transparent animationType="fade">
        <View style={s.deleteOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setShowDeleteModal(false)} />
          <View style={s.deleteCard}>
            {deleteStep === 'confirm' ? (
              <>
                <Ionicons name="warning-outline" size={32} color={colors.declinedRed} style={{ alignSelf: 'center', marginBottom: 12 }} />
                <Text style={s.deleteTitle}>Delete Your Account?</Text>
                <Text style={s.deleteBody}>
                  This action is permanent and cannot be undone. All of your data will be permanently deleted, including:{'\n\n'}
                  • Tickets and purchase history{'\n'}
                  • ECHO Circle memberships{'\n'}
                  • Wallet passes and transfers{'\n'}
                  • Profile and payment methods{'\n'}
                  • All personal information
                </Text>
                <View style={s.deleteActions}>
                  <TouchableOpacity style={s.deleteCancelBtn} onPress={() => setShowDeleteModal(false)}>
                    <Text style={s.deleteCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.deleteNextBtn} onPress={() => setDeleteStep('type')}>
                    <Text style={s.deleteNextText}>Continue</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <Text style={s.deleteTitle}>Confirm Deletion</Text>
                <Text style={s.deleteBody}>
                  Type <Text style={{ fontWeight: '800', color: colors.declinedRed }}>DELETE</Text> below to permanently delete your account.
                </Text>
                <TextInput
                  style={s.deleteInput}
                  value={deleteInput}
                  onChangeText={setDeleteInput}
                  placeholder="Type DELETE to confirm"
                  placeholderTextColor="rgba(255,255,255,0.25)"
                  autoCapitalize="characters"
                  autoCorrect={false}
                />
                <View style={s.deleteActions}>
                  <TouchableOpacity style={s.deleteCancelBtn} onPress={() => setShowDeleteModal(false)}>
                    <Text style={s.deleteCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[s.deleteConfirmBtn, deleteInput !== 'DELETE' && { opacity: 0.35 }]}
                    disabled={deleteInput !== 'DELETE'}
                    onPress={async () => {
                      setShowDeleteModal(false);
                      await deleteAccount();
                      router.replace('/(auth)/sign-in');
                    }}
                  >
                    <Text style={s.deleteConfirmText}>Delete Everything</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      <Modal visible={showAccessPass} transparent animationType="slide">
        <View style={s.passOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setShowAccessPass(false)} />
          <View style={s.passSheet}>
            <View style={s.passHandle} />
            <Text style={s.passTitle}>ECHO Access Pass</Text>
            <Text style={s.passBody}>Official ECHO card for wallet access. Apple Wallet and Google Wallet handoff should use this pass structure.</Text>
            <EchoWalletPassCard pass={accessPass} />
            <TouchableOpacity style={s.passPrimaryBtn} onPress={handleAddAccessPass}>
              <Text style={s.passPrimaryText}>Add to Wallet</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.passCloseBtn} onPress={() => setShowAccessPass(false)}>
              <Text style={s.passCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Appearance Sheet ── */}
      <AppearanceSheet visible={showAppearance} onClose={() => setShowAppearance(false)} />

      {/* ── Add to Wallet Sheet (premium replacement for Alert flow) ── */}
      <AddToWalletSheet
        visible={showAddToWalletSheet}
        pass={accessPass}
        onClose={() => setShowAddToWalletSheet(false)}
      />
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scrollContent: { paddingTop: 12 },
  // Header
  header: { alignItems: 'center', paddingHorizontal: 20, paddingBottom: 24 },
  avatarWrap: { position: 'relative', marginBottom: 12 },
  avatar: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontSize: 32, fontWeight: '700', color: '#FFF' },
  editAvatarBtn: {
    position: 'absolute', bottom: 0, right: -4,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: colors.bg,
  },
  displayName: { fontSize: 22, fontWeight: '700', color: '#FFF' },
  email: { fontSize: 14, color: 'rgba(255,255,255,0.50)', marginTop: 4 },
  statsRow: {
    flexDirection: 'row', alignItems: 'center', marginTop: 20,
    backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 16,
    paddingVertical: 14, paddingHorizontal: 24,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '700', color: '#FFF' },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  statDivider: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.08)' },
  walletCardSection: {
    alignSelf: 'stretch',
    marginTop: 20,
    gap: 12,
  },
  accessPassEyebrow: { fontSize: 10, fontWeight: '900', letterSpacing: 1, color: colors.echoBlue, marginBottom: 2 },
  accessPassBtn: { height: 48, borderRadius: 999, backgroundColor: '#F7F8FA', flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' },
  accessPassBtnText: { color: '#0F1115', fontSize: 14, fontWeight: '850' },
  // Sections
  section: { marginTop: 24, paddingHorizontal: 20 },
  sectionTitle: {
    fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.40)',
    letterSpacing: 1, marginBottom: 10, paddingLeft: 4,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 18,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', overflow: 'hidden',
  },
  row: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 16, gap: 14,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  rowIcon: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center',
  },
  rowContent: { flex: 1 },
  rowLabel: { fontSize: 15, fontWeight: '600', color: 'rgba(255,255,255,0.90)' },
  rowSub: { fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2 },
  badge: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginRight: 4,
  },
  badgeText: { fontSize: 11, fontWeight: '700' },
  // Sign out
  signOutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginTop: 32, marginHorizontal: 20, paddingVertical: 16,
    borderRadius: 16, borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.20)', backgroundColor: 'rgba(239,68,68,0.05)',
  },
  signOutText: { fontSize: 15, fontWeight: '600', color: colors.declinedRed },
  version: { textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.20)', marginTop: 16 },
  // Delete Account
  deleteSection: { marginTop: 34, marginHorizontal: 20, paddingTop: 22, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)', alignItems: 'center' },
  deleteSectionTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2, color: 'rgba(255,255,255,0.28)', marginBottom: 8 },
  deleteSectionBody: { fontSize: 12, lineHeight: 17, color: 'rgba(255,255,255,0.36)', textAlign: 'center', maxWidth: 280, marginBottom: 10 },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingVertical: 13, paddingHorizontal: 22, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(239,68,68,0.18)', backgroundColor: 'rgba(239,68,68,0.055)' },
  deleteText: { fontSize: 14, fontWeight: '700', color: 'rgba(239,68,68,0.76)' },
  // Delete Modal
  passOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.68)', justifyContent: 'flex-end' },
  passSheet: { backgroundColor: '#11141A', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 30, borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.10)' },
  passHandle: { alignSelf: 'center', width: 52, height: 4, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.18)', marginBottom: 16 },
  passTitle: { color: '#F7F8FA', fontSize: 22, fontWeight: '850' },
  passBody: { color: 'rgba(255,255,255,0.55)', fontSize: 13, lineHeight: 19, marginTop: 5, marginBottom: 14 },
  passPrimaryBtn: { height: 50, borderRadius: 999, backgroundColor: '#F7F8FA', alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  passPrimaryText: { color: '#0F1115', fontSize: 15, fontWeight: '850' },
  passCloseBtn: { height: 46, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  passCloseText: { color: 'rgba(255,255,255,0.55)', fontSize: 14, fontWeight: '700' },
  deleteOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.70)', justifyContent: 'center', paddingHorizontal: 24 },
  deleteCard: { backgroundColor: '#1A1D24', borderRadius: 20, padding: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  deleteTitle: { fontSize: 20, fontWeight: '700', color: '#F5F7FB', textAlign: 'center', marginBottom: 12 },
  deleteBody: { fontSize: 14, lineHeight: 21, color: 'rgba(255,255,255,0.60)', textAlign: 'center', marginBottom: 20 },
  deleteInput: {
    height: 50, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(239,68,68,0.30)',
    backgroundColor: 'rgba(255,255,255,0.04)', color: '#F5F7FB', fontSize: 18, fontWeight: '700',
    textAlign: 'center', letterSpacing: 4, marginBottom: 20,
  },
  deleteActions: { flexDirection: 'row', gap: 12 },
  deleteCancelBtn: { flex: 1, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  deleteCancelText: { fontSize: 15, fontWeight: '600', color: '#F5F7FB' },
  deleteNextBtn: { flex: 1, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(239,68,68,0.15)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.25)' },
  deleteNextText: { fontSize: 15, fontWeight: '600', color: colors.declinedRed },
  deleteConfirmBtn: { flex: 1, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.declinedRed },
  deleteConfirmText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
});
