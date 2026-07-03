import React, { useMemo } from 'react';
import { Animated, Dimensions, Modal, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, motion } from '../../theme/tokens';
import { useDynamicTheme } from '../../theme/dynamicTheme';
import { Text } from '../ui';
import { useNotificationStore } from '../../stores/notificationStore';
import type { IntelligentNotification } from '../../types/notificationCampaign';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const ICON_MAP: Record<IntelligentNotification['lifecycleStage'], keyof typeof Ionicons.glyphMap> = {
  discover: 'sparkles-outline',
  checkout: 'card-outline',
  wallet: 'wallet-outline',
  circle: 'people-outline',
  entry: 'radio-outline',
  post_event: 'bar-chart-outline',
  host_ops: 'speedometer-outline',
  donation: 'heart-outline',
};

interface NotificationSheetProps {
  visible: boolean;
  onClose: () => void;
}

export function NotificationSheet({ visible, onClose }: NotificationSheetProps) {
  const insets = useSafeAreaInsets();
  const { colors: c } = useDynamicTheme();
  const allNotifications = useNotificationStore((state) => state.notifications);
  const notifications = useMemo(() => allNotifications.filter((item) => item.audience !== 'host'), [allNotifications]);
  const markRead = useNotificationStore((state) => state.markRead);
  const dismiss = useNotificationStore((state) => state.dismiss);
  const markAllRead = useNotificationStore((state) => state.markAllRead);
  const clearAll = useNotificationStore((state) => state.clearAll);
  const recordAnalytics = useNotificationStore((state) => state.recordAnalytics);
  const slideAnim = React.useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  React.useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: visible ? 0 : SCREEN_HEIGHT,
      duration: visible ? motion.duration.sheetOpen : motion.duration.sheetClose,
      useNativeDriver: true,
    }).start();
  }, [visible, slideAnim]);

  const handleNotificationPress = (notification: IntelligentNotification) => {
    markRead(notification.id);
    recordAnalytics(notification.id, notification.campaignId, 'opened');
    onClose();
    if (notification.route) {
      setTimeout(() => router.push(notification.route as never), 260);
    }
  };

  const handleLongPress = (notification: IntelligentNotification) => {
    dismiss(notification.id);
    recordAnalytics(notification.id, notification.campaignId, 'dismissed');
  };

  const todayNotifications = notifications.filter((n) => !n.time.includes('Yesterday'));
  const earlierNotifications = notifications.filter((n) => n.time.includes('Yesterday'));
  const hasUnread = notifications.some((n) => !n.read);

  const renderNotification = (notif: IntelligentNotification) => (
    <TouchableOpacity
      key={notif.id}
      style={[styles.row, { borderBottomColor: c.hairline, backgroundColor: notif.read ? 'transparent' : c.unreadRowBg }, notif.read && styles.rowRead]}
      activeOpacity={0.7}
      onPress={() => handleNotificationPress(notif)}
      onLongPress={() => handleLongPress(notif)}
      delayLongPress={500}
    >
      <View style={[styles.iconContainer, { backgroundColor: c.surface2 }, notif.read && styles.iconContainerRead]}>
        <Ionicons name={ICON_MAP[notif.lifecycleStage]} size={20} color={notif.read ? c.textMuted : c.accent} />
      </View>
      <View style={styles.textContainer}>
        <Text variant="notifTitle" style={notif.read && styles.textRead}>{notif.title}</Text>
        <Text variant="notifBody" numberOfLines={2} style={notif.read && styles.textRead}>{notif.body}</Text>
        {notif.aiReason ? <Text variant="notifTime" color="textTertiary" numberOfLines={1}>{notif.aiReason}</Text> : null}
      </View>
      <View style={styles.rightSection}>
        <Text variant="notifTime" style={notif.read && styles.textRead}>{notif.time}</Text>
        <Ionicons name="chevron-forward-outline" size={16} color={notif.read ? c.textMuted : c.textMedium} style={{ marginTop: 4 }} />
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent presentationStyle="overFullScreen" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={[styles.backdrop, { backgroundColor: c.overlayDim }]} onPress={onClose} activeOpacity={1} />
        <Animated.View style={[styles.sheet, { height: Math.min(SCREEN_HEIGHT * 0.88, 720), paddingBottom: insets.bottom, transform: [{ translateY: slideAnim }] }]}>
          <View style={[styles.sheetInner, { backgroundColor: c.sheet }]}> 
            <View style={[styles.header, { paddingTop: 14, borderBottomColor: c.hairline }]}> 
              <View style={styles.headerLeft}>
                <Text variant="sheetTitle">Notifications</Text>
                {hasUnread && <View style={[styles.unreadDot, { backgroundColor: c.accent }]} />}
              </View>
              <View style={styles.headerRight}>
                {notifications.length > 0 && (
                  <TouchableOpacity onPress={markAllRead} style={styles.clearBtn}><Text variant="meta" color="textMuted">Read</Text></TouchableOpacity>
                )}
                {notifications.length > 0 && (
                  <TouchableOpacity onPress={clearAll} style={styles.clearBtn}><Text variant="meta" color="textMuted">Clear</Text></TouchableOpacity>
                )}
                <TouchableOpacity onPress={onClose} style={styles.closeBtn}><Ionicons name="close-outline" size={24} color={c.text} /></TouchableOpacity>
              </View>
            </View>

            <View style={[styles.hint, { backgroundColor: c.surface2, borderBottomColor: c.hairline }]}> 
              <Text variant="caption" color="textMuted">AI-personalized • Fatigue-aware • Long press to delete</Text>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              {notifications.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="notifications-off-outline" size={48} color={c.textMuted} />
                  <Text variant="meta" color="textMuted" style={{ marginTop: 16 }}>No notifications</Text>
                </View>
              ) : (
                <>
                  {todayNotifications.length > 0 && <View style={styles.group}><Text variant="groupLabel" style={styles.groupLabel}>TODAY</Text>{todayNotifications.map(renderNotification)}</View>}
                  {earlierNotifications.length > 0 && <View style={styles.group}><Text variant="groupLabel" style={styles.groupLabel}>EARLIER</Text>{earlierNotifications.map(renderNotification)}</View>}
                </>
              )}
              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.overlayDim },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.28, shadowRadius: 18, shadowOffset: { width: 0, height: -8 }, elevation: 18 },
  sheetInner: { flex: 1, backgroundColor: colors.sheet },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.hairline },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent },
  clearBtn: { paddingHorizontal: 10, paddingVertical: 8 },
  closeBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  hint: { alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.hairline, backgroundColor: colors.surface2 },
  content: { flex: 1 },
  group: { paddingTop: 16 },
  groupLabel: { paddingHorizontal: 16, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 16, paddingVertical: 12, minHeight: 60, borderBottomWidth: 1, borderBottomColor: colors.hairline, backgroundColor: colors.unreadRowBg },
  rowRead: { backgroundColor: 'transparent' },
  iconContainer: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.surface2, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  iconContainerRead: { opacity: 0.6 },
  textContainer: { flex: 1, marginRight: 12, gap: 3 },
  textRead: { color: colors.textMuted },
  rightSection: { alignItems: 'flex-end' },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
});

export default NotificationSheet;
