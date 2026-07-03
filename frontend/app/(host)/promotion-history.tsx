/**
 * HOST Promotion History
 * ══════════════════════
 * Spec §10 — Per-event promotion records: platform, format, publish mode, status.
 */
import React, { useEffect } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius } from '../../theme/hostTokens';
import { Text } from '../../components/ui';
import { ModeSwitchHeader } from '../../components/navigation/ModeSwitchHeader';
import { useSocialStore } from '../../stores/socialStore';
import type { SocialProvider, PromoFormat, PublishMode, PromoPackageStatus } from '../../types/social';

const PROVIDER_ICON: Record<SocialProvider, { icon: string; color: string }> = {
  instagram: { icon: 'logo-instagram', color: '#E4405F' },
  facebook:  { icon: 'logo-facebook',  color: '#1877F2' },
  tiktok:    { icon: 'logo-tiktok',    color: '#FFFFFF' },
  x:         { icon: 'logo-twitter',   color: '#1DA1F2' },
};

const STATUS_STYLE: Record<PromoPackageStatus, { label: string; color: string }> = {
  draft:      { label: 'Draft',      color: 'rgba(255,255,255,0.35)' },
  ready:      { label: 'Ready',      color: '#F59E0B' },
  publishing: { label: 'Publishing', color: '#20C7FF' },
  published:  { label: 'Published',  color: '#10B981' },
  failed:     { label: 'Failed',     color: '#EF4444' },
  exported:   { label: 'Exported',   color: '#6366F1' },
};

export default function PromotionHistoryScreen() {
  const insets = useSafeAreaInsets();
  const { history, loadHistory } = useSocialStore();

  useEffect(() => { loadHistory(); }, []);

  const formatRelativeDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <View style={s.container}>
      <ModeSwitchHeader title="Promotion History" showNotification showBack />
      <ScrollView
        contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 28 }]}
        showsVerticalScrollIndicator={false}
      >
        {history.length === 0 ? (
          <View style={s.emptyState}>
            <Ionicons name="megaphone-outline" size={40} color="rgba(255,255,255,0.18)" />
            <Text style={s.emptyTitle}>No promotions yet</Text>
            <Text style={s.emptyBody}>
              When you promote an event, a record will appear here with platform, format, and outcome.
            </Text>
          </View>
        ) : (
          history.map((item) => {
            const provMeta = PROVIDER_ICON[item.platform];
            const statusMeta = STATUS_STYLE[item.status];
            return (
              <View key={item.id} style={s.historyCard}>
                <View style={s.cardTop}>
                  {item.asset_thumbnail ? (
                    <Image source={{ uri: item.asset_thumbnail }} style={s.thumbnail} />
                  ) : (
                    <View style={[s.thumbnail, s.thumbPlaceholder]}>
                      <Ionicons name="image-outline" size={20} color="rgba(255,255,255,0.20)" />
                    </View>
                  )}
                  <View style={s.cardInfo}>
                    <Text style={s.eventTitle} numberOfLines={1}>{item.event_title}</Text>
                    <View style={s.metaRow}>
                      <Ionicons name={provMeta.icon as never} size={14} color={provMeta.color} />
                      <Text style={s.formatText}>{item.format}</Text>
                      <Text style={s.dotSep}>·</Text>
                      <Text style={s.modeText}>
                        {item.publish_mode === 'direct' ? 'Direct publish' : item.publish_mode === 'export' ? 'Exported' : 'Shared'}
                      </Text>
                    </View>
                    <Text style={s.dateText}>{formatRelativeDate(item.published_at)}</Text>
                  </View>
                  <View style={[s.statusBadge, { backgroundColor: `${statusMeta.color}18` }]}>
                    <Text style={[s.statusText, { color: statusMeta.color }]}>{statusMeta.label}</Text>
                  </View>
                </View>

                {/* Re-promote shortcut */}
                <TouchableOpacity
                  style={s.repromoteBtn}
                  onPress={() => router.push({ pathname: '/(host)/promote', params: { eventId: item.event_id } })}
                  activeOpacity={0.82}
                >
                  <Ionicons name="refresh-outline" size={14} color={colors.accentCyan} />
                  <Text style={s.repromoteText}>Re-promote</Text>
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingHorizontal: 20, paddingTop: 8 },

  emptyState: {
    alignItems: 'center', gap: 12, padding: 40, borderRadius: radius.xl,
    backgroundColor: 'rgba(255,255,255,0.02)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    marginTop: 20,
  },
  emptyTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '700' },
  emptyBody: { color: 'rgba(255,255,255,0.40)', fontSize: 14, lineHeight: 21, textAlign: 'center' },

  historyCard: {
    borderRadius: radius.xl, padding: 16, marginBottom: 12,
    backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  thumbnail: { width: 52, height: 52, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)' },
  thumbPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  cardInfo: { flex: 1, gap: 3 },
  eventTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: '700' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  formatText: { color: 'rgba(255,255,255,0.55)', fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  dotSep: { color: 'rgba(255,255,255,0.20)', fontSize: 12 },
  modeText: { color: 'rgba(255,255,255,0.40)', fontSize: 12 },
  dateText: { color: 'rgba(255,255,255,0.30)', fontSize: 11 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '700' },

  repromoteBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    marginTop: 12, paddingVertical: 10, borderRadius: 12,
    backgroundColor: 'rgba(32,199,255,0.06)', borderWidth: 1, borderColor: 'rgba(32,199,255,0.12)',
  },
  repromoteText: { color: colors.accentCyan, fontSize: 13, fontWeight: '600' },
});
