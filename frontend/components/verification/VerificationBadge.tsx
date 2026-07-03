/**
 * VerificationBadge — Profile card showing age verification status
 * Shows: status badge, age band, method used, date verified
 * Tap to start/retry verification
 */
import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii } from '../../theme/tokens';
import { Text } from '../ui';
import { useVerificationStore } from '../../stores/verificationStore';
import type { VerificationStatus } from '../../stores/verificationStore';

const STATUS_CONFIG: Record<VerificationStatus, { label: string; color: string; icon: string; bg: string }> = {
  unverified: { label: 'Not Verified', color: 'rgba(255,255,255,0.50)', icon: 'shield-outline', bg: 'rgba(255,255,255,0.05)' },
  skipped: { label: 'Skipped', color: '#F59E0B', icon: 'shield-outline', bg: 'rgba(245,158,11,0.08)' },
  pending_review: { label: 'Pending Review', color: '#20C7FF', icon: 'time-outline', bg: 'rgba(6,182,212,0.08)' },
  verifying: { label: 'Verifying...', color: '#818CF8', icon: 'sync-outline', bg: 'rgba(129,140,248,0.08)' },
  verified: { label: 'Verified', color: '#10B981', icon: 'shield-checkmark', bg: 'rgba(16,185,129,0.08)' },
  failed: { label: 'Failed', color: '#EF4444', icon: 'alert-circle-outline', bg: 'rgba(239,68,68,0.08)' },
};

export function VerificationBadge() {
  const { status, verifiedAgeBand, verifiedAt, method, isLocked, canRetry } = useVerificationStore();
  const config = STATUS_CONFIG[status];
  const showAction = status !== 'verified' && status !== 'verifying' && status !== 'pending_review';

  const handleTap = () => {
    if (status === 'verified') return;
    if (isLocked) return; // Contact support
    router.push('/verify/method');
  };

  const bandLabel = verifiedAgeBand === '21_plus' ? '21+' : verifiedAgeBand === '18_plus' ? '18+' : null;
  const methodLabel = method === 'government_id' ? 'Government ID' : method === 'digital_wallet' ? 'Digital Wallet' : null;
  const dateLabel = verifiedAt ? new Date(verifiedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : null;

  return (
    <TouchableOpacity
      style={[s.card, { borderColor: config.color + '25' }]}
      onPress={handleTap}
      activeOpacity={status === 'verified' ? 1 : 0.7}
      disabled={status === 'verifying' || status === 'pending_review'}
    >
      <View style={s.topRow}>
        <View style={[s.iconWrap, { backgroundColor: config.bg }]}>
          <Ionicons name={config.icon as never} size={20} color={config.color} />
        </View>
        <View style={s.content}>
          <View style={s.labelRow}>
            <Text style={[s.statusLabel, { color: config.color }]}>{config.label}</Text>
            {bandLabel && (
              <View style={[s.ageBadge, { borderColor: config.color + '40' }]}>
                <Text style={[s.ageBadgeText, { color: config.color }]}>{bandLabel}</Text>
              </View>
            )}
          </View>
          {status === 'verified' && methodLabel && (
            <Text style={s.meta}>{methodLabel} {dateLabel ? `\u00B7 ${dateLabel}` : ''}</Text>
          )}
          {status === 'failed' && !isLocked && (
            <Text style={s.meta}>Tap to retry ({3 - useVerificationStore.getState().attemptCount} attempts left)</Text>
          )}
          {isLocked && (
            <Text style={s.meta}>Contact support to verify</Text>
          )}
          {(status === 'unverified' || status === 'skipped') && (
            <Text style={s.meta}>Tap to verify your age</Text>
          )}
        </View>
        {showAction && !isLocked && (
          <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.30)" />
        )}
      </View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: radii.md, borderWidth: 1, padding: 16 },
  topRow: { flexDirection: 'row', alignItems: 'center' },
  iconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  content: { flex: 1 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusLabel: { fontSize: 15, fontWeight: '600' },
  ageBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1 },
  ageBadgeText: { fontSize: 11, fontWeight: '700' },
  meta: { fontSize: 12, color: 'rgba(255,255,255,0.40)', marginTop: 3 },
});
