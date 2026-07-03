import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Card, Text } from '../ui';
import { colors, radii, spacing } from '../../theme/tokens';
import { useNotificationStore } from '../../stores/notificationStore';
import type { IntelligentNotification } from '../../types/notificationCampaign';

const toneIcon: Record<IntelligentNotification['tone'], keyof typeof Ionicons.glyphMap> = {
  calm: 'notifications-outline',
  urgent: 'alert-circle-outline',
  trust: 'shield-checkmark-outline',
  celebratory: 'sparkles-outline',
  operational: 'radio-outline',
  mission: 'heart-outline',
  premium: 'diamond-outline',
};

const stageLabel: Record<IntelligentNotification['lifecycleStage'], string> = {
  discover: 'Discover',
  checkout: 'Checkout',
  wallet: 'Wallet',
  circle: 'Circle',
  entry: 'Entry',
  post_event: 'Post Event',
  host_ops: 'Host Ops',
  donation: 'Impact',
};

function NotificationRow({ item, hostMode = false }: { item: IntelligentNotification; hostMode?: boolean }) {
  const markRead = useNotificationStore((state) => state.markRead);
  const dismiss = useNotificationStore((state) => state.dismiss);
  const recordAnalytics = useNotificationStore((state) => state.recordAnalytics);

  const open = () => {
    markRead(item.id);
    recordAnalytics(item.id, item.campaignId, 'opened');
    if (item.route) router.push(item.route as never);
  };

  const remove = () => {
    dismiss(item.id);
    recordAnalytics(item.id, item.campaignId, 'dismissed');
  };

  return (
    <TouchableOpacity activeOpacity={0.82} onPress={open} onLongPress={remove}>
      <Card style={[styles.notificationCard, !item.read && styles.unreadCard]}>
        <View style={styles.rowTop}>
          <View style={[styles.iconWrap, item.priority >= 5 && styles.urgentIconWrap]}>
            <Ionicons name={toneIcon[item.tone]} size={18} color={item.priority >= 5 ? colors.warning : colors.echoBlueAccessible} />
          </View>
          <View style={styles.rowText}>
            <View style={styles.titleRow}>
              <Text variant="body" style={styles.notificationTitle}>{item.title}</Text>
              {!item.read && <View style={styles.unreadDot} />}
            </View>
            <Text variant="bodySmall" color="textMuted" style={styles.notificationBody}>{item.body}</Text>
          </View>
        </View>
        <View style={styles.metaRow}>
          <Text variant="caption" color="textTertiary">{stageLabel[item.lifecycleStage]} • {item.time}</Text>
          <Text variant="caption" color="textTertiary">P{item.priority}</Text>
        </View>
        {hostMode && item.aiReason ? (
          <View style={styles.aiReasonPill}>
            <Ionicons name="sparkles-outline" size={12} color={colors.echoBlueAccessible} />
            <Text variant="caption" color="textMuted" style={{ flex: 1 }}>{item.aiReason}</Text>
          </View>
        ) : null}
      </Card>
    </TouchableOpacity>
  );
}

export function IntelligentNotificationCenter({ hostMode = false }: { hostMode?: boolean }) {
  const notifications = useNotificationStore((state) => state.notifications);
  const markAllRead = useNotificationStore((state) => state.markAllRead);
  const clearAll = useNotificationStore((state) => state.clearAll);
  const triggerCampaigns = useNotificationStore((state) => state.triggerCampaigns);
  // Subscribe to the primitive inputs only; recompute the derived list with useMemo.
  // Calling state.getHostRecommendations() inside the selector returns a fresh array
  // every render (it ends with .map().filter().sort().slice()), which makes the
  // useSyncExternalStore reference check fail every commit and triggers an
  // infinite render loop ("Maximum update depth exceeded").
  const preferences = useNotificationStore((state) => state.preferences);
  const signals = useNotificationStore((state) => state.signals);
  const recommendations = React.useMemo(
    () => (hostMode ? useNotificationStore.getState().getHostRecommendations() : []),
    [hostMode, preferences, signals],
  );
  const visible = hostMode ? notifications.filter((item) => item.audience === 'host' || item.lifecycleStage === 'host_ops' || item.audience === 'nonprofit_host') : notifications.filter((item) => item.audience !== 'host');

  const runDemoCampaign = () => {
    triggerCampaigns(hostMode ? ['host_sales_slowdown', 'host_door_mode_ready', 'host_closeout_ready'] : ['event_3h', 'doors_open', 'circle_timer_15m'], {
      segments: hostMode ? ['host_active', 'door_staff'] : ['ticket_holder', 'circle_at_risk'],
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Card style={styles.heroCard}>
        <View style={styles.heroTop}>
          <View>
            <Text variant="label" color="textMuted">INTELLIGENT ENGAGEMENT V2</Text>
            <Text variant="title" style={styles.heroTitle}>{hostMode ? 'Host command alerts' : 'Personalized event updates'}</Text>
          </View>
          <View style={styles.scorePill}>
            <Ionicons name="pulse-outline" size={14} color={colors.success} />
            <Text variant="caption" color="textMuted">AI Live</Text>
          </View>
        </View>
        <Text variant="bodySmall" color="textMuted" style={styles.heroBody}>
          Send-time optimization, fatigue control, quiet-hours suppression, Circle timing, donation campaign updates, and access-state reminders are active.
        </Text>
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionPill} onPress={runDemoCampaign}><Text variant="caption">Run demo triggers</Text></TouchableOpacity>
          <TouchableOpacity style={styles.actionPill} onPress={markAllRead}><Text variant="caption">Mark read</Text></TouchableOpacity>
          <TouchableOpacity style={styles.actionPill} onPress={clearAll}><Text variant="caption">Clear</Text></TouchableOpacity>
        </View>
      </Card>

      {hostMode && recommendations.length ? (
        <View style={styles.section}>
          <Text variant="label" color="textMuted" style={styles.sectionLabel}>Host recommendations</Text>
          {recommendations.map((rec) => (
            <Card key={rec.id} style={styles.recommendationCard}>
              <View style={styles.titleRow}>
                <Text variant="body" style={styles.notificationTitle}>{rec.title}</Text>
                <Text variant="caption" color="accent">{rec.score}%</Text>
              </View>
              <Text variant="bodySmall" color="textMuted" style={styles.notificationBody}>{rec.body}</Text>
              <Text variant="caption" color="textTertiary">Recommended: {rec.recommendedAction}</Text>
            </Card>
          ))}
        </View>
      ) : null}

      <View style={styles.section}>
        <Text variant="label" color="textMuted" style={styles.sectionLabel}>{hostMode ? 'Host inbox' : 'Your inbox'}</Text>
        {visible.length ? visible.map((item) => <NotificationRow key={item.id} item={item} hostMode={hostMode} />) : (
          <Card style={styles.emptyCard}>
            <Ionicons name="checkmark-circle-outline" size={24} color={colors.success} />
            <Text variant="body" style={styles.notificationTitle}>All clear</Text>
            <Text variant="bodySmall" color="textMuted" style={styles.notificationBody}>No active intelligent notifications.</Text>
          </Card>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.screenPaddingX, gap: 14, paddingBottom: 56 },
  heroCard: { padding: 16, borderRadius: radii.xl, backgroundColor: colors.bgCard },
  heroTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  heroTitle: { marginTop: 4, color: colors.text },
  heroBody: { marginTop: 10, lineHeight: 18 },
  scorePill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 7, borderRadius: radii.pill, backgroundColor: colors.successSoft },
  actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  actionPill: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: radii.pill, backgroundColor: colors.surface3, borderWidth: 1, borderColor: colors.hairline },
  section: { gap: 10 },
  sectionLabel: { marginTop: 4 },
  notificationCard: { padding: 14, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.hairline },
  unreadCard: { borderColor: 'rgba(32,199,255,0.34)', backgroundColor: 'rgba(32,199,255,0.055)' },
  rowTop: { flexDirection: 'row', gap: 12 },
  iconWrap: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.echoBlueSoft },
  urgentIconWrap: { backgroundColor: colors.warningSoft },
  rowText: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  notificationTitle: { color: colors.text, fontWeight: '700' },
  notificationBody: { marginTop: 6 },
  unreadDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.echoBlueAccessible },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.hairline },
  aiReasonPill: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, padding: 10, borderRadius: radii.md, backgroundColor: colors.surface2 },
  recommendationCard: { padding: 14, borderRadius: radii.lg, backgroundColor: colors.bgCard2 },
  emptyCard: { padding: 20, alignItems: 'center', gap: 8 },
});
