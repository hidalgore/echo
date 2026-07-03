/**
 * HOST Social Media & Promotion Settings
 * ═══════════════════════════════════════
 * Spec §3, §6 — Account linking, connection states, promotion defaults.
 */
import React, { useEffect, useState } from 'react';
import {
  View, ScrollView, StyleSheet, TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius } from '../../theme/hostTokens';
import { Text } from '../../components/ui';
import { ModeSwitchHeader } from '../../components/navigation/ModeSwitchHeader';
import { useSocialStore } from '../../stores/socialStore';
import type { SocialProvider, ConnectionStatus, SocialAccount } from '../../types/social';

const PROVIDERS: { key: SocialProvider; label: string; icon: string; color: string }[] = [
  { key: 'instagram', label: 'Instagram', icon: 'logo-instagram', color: '#E4405F' },
  { key: 'facebook', label: 'Facebook', icon: 'logo-facebook', color: '#1877F2' },
  { key: 'tiktok', label: 'TikTok', icon: 'logo-tiktok', color: '#010101' },
  { key: 'x', label: 'X', icon: 'logo-twitter', color: '#1DA1F2' },
];

const STATUS_LABELS: Record<ConnectionStatus, { label: string; color: string }> = {
  not_linked:             { label: 'Not linked',             color: 'rgba(255,255,255,0.35)' },
  connected:              { label: 'Connected',              color: '#10B981' },
  needs_reconnect:        { label: 'Needs reconnect',        color: '#F59E0B' },
  permission_incomplete:  { label: 'Permission incomplete',  color: '#F59E0B' },
  expired:                { label: 'Expired',                color: '#EF4444' },
  export_only:            { label: 'Export only',            color: '#6366F1' },
  audit_limited:          { label: 'Audit limited',          color: '#F59E0B' },
};

export default function SocialSettingsScreen() {
  const insets = useSafeAreaInsets();
  const { accounts, isLoading, loadAccounts, linkAccount, unlinkAccount, reconnectAccount } = useSocialStore();

  useEffect(() => { loadAccounts(); }, []);

  const getAccountForProvider = (provider: SocialProvider): SocialAccount | undefined =>
    accounts.find(a => a.provider === provider);

  const handleProviderAction = async (provider: SocialProvider) => {
    const existing = getAccountForProvider(provider);
    if (!existing) {
      await linkAccount(provider);
    } else if (existing.status === 'needs_reconnect' || existing.status === 'expired') {
      await reconnectAccount(existing.id);
    } else if (existing.status === 'connected' || existing.status === 'export_only') {
      Alert.alert(
        `Disconnect ${provider}?`,
        'You will need to reconnect to publish or export to this platform.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Disconnect', style: 'destructive', onPress: () => unlinkAccount(existing.id) },
        ],
      );
    }
  };

  return (
    <View style={s.container}>
      <ModeSwitchHeader title="Social & Promotion" showNotification showBack />
      <ScrollView
        contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 28 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Info banner */}
        <View style={s.infoBanner}>
          <Ionicons name="megaphone-outline" size={20} color={colors.accentCyan} />
          <Text style={s.infoText}>
            Link your social accounts to promote events directly from ECHO. Publish, export, or hand off to native apps.
          </Text>
        </View>

        {/* Account rows */}
        <Text style={s.sectionTitle}>Linked Accounts</Text>
        {isLoading ? (
          <ActivityIndicator color={colors.accentCyan} style={{ marginTop: 20 }} />
        ) : (
          PROVIDERS.map(({ key, label, icon, color }) => {
            const acct = getAccountForProvider(key);
            const statusInfo = acct ? STATUS_LABELS[acct.status] : STATUS_LABELS.not_linked;
            const actionLabel = !acct ? 'Link' : acct.status === 'needs_reconnect' || acct.status === 'expired' ? 'Reconnect' : 'Manage';

            return (
              <TouchableOpacity
                key={key}
                style={s.accountRow}
                onPress={() => handleProviderAction(key)}
                activeOpacity={0.82}
              >
                <View style={[s.providerIcon, { backgroundColor: `${color}18` }]}>
                  <Ionicons name={icon as never} size={22} color={color} />
                </View>
                <View style={s.accountInfo}>
                  <Text style={s.providerLabel}>{label}</Text>
                  {acct ? (
                    <Text style={s.handleText}>{acct.handle}</Text>
                  ) : null}
                  <View style={s.statusPill}>
                    <View style={[s.statusDot, { backgroundColor: statusInfo.color }]} />
                    <Text style={[s.statusText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
                  </View>
                </View>
                <Text style={s.actionLabel}>{actionLabel}</Text>
                <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.25)" />
              </TouchableOpacity>
            );
          })
        )}

        {/* Promotion Defaults */}
        <Text style={[s.sectionTitle, { marginTop: 32 }]}>Promotion Defaults</Text>
        <View style={s.defaultsCard}>
          <DefaultRow label="Default channels" value="Instagram, Facebook" />
          <DefaultRow label="Default formats" value="Post, Story" />
          <DefaultRow label="Caption style" value="Energetic" />
          <DefaultRow label="Include event link" value="Always" />
          <DefaultRow label="Include host handle" value="Yes" />
          <DefaultRow label="Save generated assets" value="On" />
          <DefaultRow label="Auto-preview before publish" value="On" last />
        </View>

        {/* Promotion History shortcut */}
        <TouchableOpacity
          style={s.historyRow}
          onPress={() => router.push('/(host)/promotion-history')}
          activeOpacity={0.82}
        >
          <Ionicons name="time-outline" size={20} color={colors.accentCyan} />
          <Text style={s.historyText}>View Promotion History</Text>
          <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.25)" style={{ marginLeft: 'auto' }} />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function DefaultRow({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[s.defaultRow, !last && s.defaultRowBorder]}>
      <Text style={s.defaultLabel}>{label}</Text>
      <Text style={s.defaultValue}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingHorizontal: 20, paddingTop: 8 },

  infoBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    padding: 16, borderRadius: radius.xl, marginBottom: 24,
    backgroundColor: 'rgba(32,199,255,0.06)', borderWidth: 1, borderColor: 'rgba(32,199,255,0.15)',
  },
  infoText: { flex: 1, color: 'rgba(255,255,255,0.60)', fontSize: 13, lineHeight: 20 },

  sectionTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '700', marginBottom: 14 },

  accountRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 16, borderRadius: radius.xl, marginBottom: 10,
    backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  providerIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  accountInfo: { flex: 1, gap: 2 },
  providerLabel: { color: colors.textPrimary, fontSize: 15, fontWeight: '600' },
  handleText: { color: 'rgba(255,255,255,0.45)', fontSize: 12 },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '600' },
  actionLabel: { color: colors.accentCyan, fontSize: 13, fontWeight: '700', marginRight: 4 },

  defaultsCard: {
    borderRadius: radius.xl, padding: 16,
    backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  defaultRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14,
  },
  defaultRowBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
  defaultLabel: { color: 'rgba(255,255,255,0.55)', fontSize: 14 },
  defaultValue: { color: colors.textPrimary, fontSize: 14, fontWeight: '600' },

  historyRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginTop: 24, padding: 16, borderRadius: radius.xl,
    backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  historyText: { color: colors.textPrimary, fontSize: 15, fontWeight: '600' },
});
