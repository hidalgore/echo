/**
 * HostCapabilityBanner
 * ════════════════════
 * Inline warning banner shown at the top of HOST screens
 * when capabilities are limited (restricted, action_required, payout issues).
 * Does NOT show when fully active with no issues.
 */
import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../ui';
import { useModeStore } from '../../stores/modeStore';
import { useHostProfileStore } from '../../stores/hostProfileStore';

type BannerConfig = {
  icon: string;
  color: string;
  bg: string;
  border: string;
  title: string;
  body: string;
  ctaLabel?: string;
  ctaRoute?: string;
};

function getBannerConfig(
  hostAccessStatus: string,
  payoutStatus: string,
  capabilities: ReturnType<typeof useModeStore.getState>['capabilities'],
): BannerConfig | null {
  // Suspended — should be caught by _layout.tsx, but safety net
  if (hostAccessStatus === 'suspended') {
    return {
      icon: 'ban',
      color: '#EF4444',
      bg: 'rgba(239,68,68,0.06)',
      border: 'rgba(239,68,68,0.15)',
      title: 'HOST access suspended',
      body: 'Your HOST account has been suspended. Contact support for assistance.',
      ctaLabel: 'Contact Support',
      ctaRoute: '/(host)/support',
    };
  }

  // Restricted
  if (hostAccessStatus === 'restricted') {
    return {
      icon: 'alert-circle',
      color: '#F59E0B',
      bg: 'rgba(245,158,11,0.06)',
      border: 'rgba(245,158,11,0.15)',
      title: 'Limited HOST access',
      body: 'Some features are restricted while your account is under review. Free events and analytics remain available.',
      ctaLabel: 'View Details',
      ctaRoute: '/(host)/support',
    };
  }

  // Action required
  if (hostAccessStatus === 'action_required') {
    return {
      icon: 'information-circle',
      color: '#F59E0B',
      bg: 'rgba(245,158,11,0.06)',
      border: 'rgba(245,158,11,0.15)',
      title: 'Action required',
      body: 'Complete your HOST profile to unlock event publishing and door mode.',
      ctaLabel: 'Complete Setup',
      ctaRoute: '/host-application',
    };
  }

  // Payout not connected (active host but can't do paid events)
  if (hostAccessStatus === 'active' && payoutStatus !== 'connected' && !capabilities.canPublishPaidEvents) {
    return {
      icon: 'card-outline',
      color: '#20C7FF',
      bg: 'rgba(32,199,255,0.04)',
      border: 'rgba(32,199,255,0.12)',
      title: 'Connect payouts to sell tickets',
      body: 'Free events are live. Connect a payout method to publish paid events.',
      ctaLabel: 'Connect Payouts',
      ctaRoute: '/(host)/payout-settings',
    };
  }

  return null;
}

export function HostCapabilityBanner() {
  const { hostAccessStatus, capabilities } = useModeStore();
  const { payout } = useHostProfileStore();

  const config = getBannerConfig(hostAccessStatus, payout.payoutStatus, capabilities);

  if (!config) return null;

  return (
    <View style={[styles.banner, { backgroundColor: config.bg, borderColor: config.border }]}>
      <View style={styles.row}>
        <Ionicons name={config.icon as never} size={20} color={config.color} />
        <View style={styles.content}>
          <Text style={[styles.title, { color: config.color }]}>{config.title}</Text>
          <Text style={styles.body}>{config.body}</Text>
        </View>
      </View>
      {config.ctaLabel && config.ctaRoute && (
        <TouchableOpacity
          style={[styles.cta, { borderColor: config.border }]}
          onPress={() => router.push(config.ctaRoute as never)}
          activeOpacity={0.82}
        >
          <Text style={[styles.ctaText, { color: config.color }]}>{config.ctaLabel}</Text>
          <Ionicons name="chevron-forward" size={14} color={config.color} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  content: { flex: 1 },
  title: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  body: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.50)',
    lineHeight: 19,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  ctaText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
