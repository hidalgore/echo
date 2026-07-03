/**
 * ECHO Intelligent Notification & Engagement Store v2
 * ═════════════════════════════════════════════════════
 * Local-first store for demo/build validation. Production should hydrate from the
 * backend notification scheduler, delivery ledger, and analytics stream.
 */
import { create } from 'zustand';
import type {
  IntelligentNotification,
  NotificationAnalyticsEvent,
  NotificationTrigger,
  NotificationUserPreferences,
  NotificationEngagementSignals,
  NotificationDecisionContext,
} from '../types/notificationCampaign';
import {
  DEFAULT_ENGAGEMENT_SIGNALS,
  DEFAULT_NOTIFICATION_PREFERENCES,
  generateIntelligentNotifications,
  getHostRecommendations,
} from '../services/notificationCampaignService';

const seedContext: NotificationDecisionContext = {
  segments: ['ticket_holder', 'circle_active', 'host_active', 'nonprofit_supporter'],
  signals: DEFAULT_ENGAGEMENT_SIGNALS,
  preferences: DEFAULT_NOTIFICATION_PREFERENCES,
};


const localCampaignLedger = new Map<string, number>();

function shouldAcceptLocalNotification(notification: IntelligentNotification) {
  const key = `${notification.campaignId}:${notification.eventId || 'global'}:${notification.circleId || 'none'}:${notification.donationCampaignId || 'none'}`;
  const last = localCampaignLedger.get(key) || 0;
  const thirtyMinutes = 30 * 60 * 1000;
  if (Date.now() - last < thirtyMinutes) return false;
  localCampaignLedger.set(key, Date.now());
  return true;
}

const seededNotifications = generateIntelligentNotifications(
  ['ticket_purchased', 'event_24h', 'circle_complete', 'host_sales_momentum', 'donation_goal_progress'],
  seedContext,
).map((notification, index) => ({
  ...notification,
  id: `seed_notif_${index + 1}`,
  time: index === 0 ? '2m ago' : index === 1 ? '1h ago' : index === 2 ? 'Today' : 'Yesterday',
  read: index > 1,
}));

interface NotificationState {
  notifications: IntelligentNotification[];
  preferences: NotificationUserPreferences;
  signals: NotificationEngagementSignals;
  analytics: NotificationAnalyticsEvent[];
  unreadCount: number;
  hasUnread: () => boolean;
  markAllRead: () => void;
  markRead: (id: string) => void;
  dismiss: (id: string) => void;
  clearAll: () => void;
  setUnreadCount: (count: number) => void;
  decrementUnread: () => void;
  addUnread: (count?: number) => void;
  updatePreferences: (patch: Partial<NotificationUserPreferences>) => void;
  updateSignals: (patch: Partial<NotificationEngagementSignals>) => void;
  triggerCampaigns: (triggers: NotificationTrigger[], context?: NotificationDecisionContext) => IntelligentNotification[];
  recordAnalytics: (notificationId: string, campaignId: string, action: NotificationAnalyticsEvent['action'], reason?: string) => void;
  getHostRecommendations: () => ReturnType<typeof getHostRecommendations>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: seededNotifications,
  preferences: DEFAULT_NOTIFICATION_PREFERENCES,
  signals: DEFAULT_ENGAGEMENT_SIGNALS,
  analytics: [],
  unreadCount: seededNotifications.filter((notification) => !notification.read).length,

  hasUnread: () => get().unreadCount > 0,

  markAllRead: () => set((state) => ({
    notifications: state.notifications.map((notification) => ({ ...notification, read: true })),
    unreadCount: 0,
  })),

  markRead: (id) => set((state) => {
    const target = state.notifications.find((notification) => notification.id === id);
    return {
      notifications: state.notifications.map((notification) => notification.id === id ? { ...notification, read: true } : notification),
      unreadCount: target && !target.read ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
    };
  }),

  dismiss: (id) => set((state) => {
    const target = state.notifications.find((notification) => notification.id === id);
    return {
      notifications: state.notifications.filter((notification) => notification.id !== id),
      unreadCount: target && !target.read ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
    };
  }),

  clearAll: () => set({ notifications: [], unreadCount: 0 }),

  setUnreadCount: (count) => set({ unreadCount: Math.max(0, count) }),
  decrementUnread: () => set((state) => ({ unreadCount: Math.max(0, state.unreadCount - 1) })),
  addUnread: (count = 1) => set((state) => ({ unreadCount: state.unreadCount + count })),

  updatePreferences: (patch) => set((state) => ({ preferences: { ...state.preferences, ...patch } })),
  updateSignals: (patch) => set((state) => ({ signals: { ...state.signals, ...patch } })),

  triggerCampaigns: (triggers, context = {}) => {
    const state = get();
    const next = generateIntelligentNotifications(triggers, {
      ...context,
      preferences: { ...state.preferences, ...(context.preferences || {}) },
      signals: { ...state.signals, ...(context.signals || {}) },
    }).filter(shouldAcceptLocalNotification);
    if (next.length === 0) return [];
    set((current) => ({
      notifications: [...next, ...current.notifications].slice(0, 80),
      unreadCount: current.unreadCount + next.filter((notification) => !notification.read).length,
      signals: {
        ...current.signals,
        notificationsSentToday: current.signals.notificationsSentToday + next.length,
        notificationsSentThisWeek: current.signals.notificationsSentThisWeek + next.length,
      },
    }));
    next.forEach((notification) => get().recordAnalytics(notification.id, notification.campaignId, 'sent', notification.aiReason));
    return next;
  },

  recordAnalytics: (notificationId, campaignId, action, reason) => set((state) => ({
    analytics: [{
      id: `notif_analytics_${Date.now()}_${state.analytics.length + 1}`,
      notificationId,
      campaignId,
      action,
      reason,
      createdAt: new Date().toISOString(),
    }, ...state.analytics].slice(0, 100),
  })),

  getHostRecommendations: () => getHostRecommendations({ preferences: get().preferences, signals: get().signals, segments: ['host_active', 'host_first_event', 'host_nonprofit'] }),
}));
