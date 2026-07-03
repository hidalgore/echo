export type NotificationAudience =
  | 'attendee'
  | 'host'
  | 'circle_organizer'
  | 'circle_recipient'
  | 'nonprofit_donor'
  | 'nonprofit_host'
  | 'guest_web_user'
  | 'all';

export type NotificationChannel = 'push' | 'in_app' | 'email' | 'sms';
export type NotificationTone = 'calm' | 'urgent' | 'trust' | 'celebratory' | 'operational' | 'mission' | 'premium';

export type NotificationTrigger =
  | 'event_saved'
  | 'event_recommended'
  | 'ticket_purchased'
  | 'nfc_ready'
  | 'age_verification_needed'
  | 'age_verified'
  | 'circle_created'
  | 'circle_invite_received'
  | 'circle_member_waiting'
  | 'circle_member_paid'
  | 'circle_timer_15m'
  | 'circle_complete'
  | 'circle_closed'
  | 'event_7d'
  | 'event_72h'
  | 'event_24h'
  | 'event_3h'
  | 'doors_open'
  | 'event_live'
  | 'post_event'
  | 'saved_event_expiring'
  | 'donation_goal_50'
  | 'donation_goal_90'
  | 'donation_goal_reached'
  | 'donation_goal_progress'
  | 'donation_campaign_closeout'
  | 'host_publish_success'
  | 'host_sales_momentum'
  | 'host_sales_slowdown'
  | 'host_door_mode_ready'
  | 'host_closeout_ready'
  | 'host_payout_update'
  | 'host_promote_recommendation';

export type NotificationSegment =
  | 'new_user'
  | 'returning_attendee'
  | 'high_intent_saver'
  | 'ticket_holder'
  | 'circle_active'
  | 'circle_at_risk'
  | 'nonprofit_supporter'
  | 'verified_21'
  | 'needs_age_verification'
  | 'host_active'
  | 'host_first_event'
  | 'host_nonprofit'
  | 'door_staff'
  | 'low_engagement'
  | 'fatigue_risk';

export type NotificationActionKind = 'open_route' | 'mark_read' | 'snooze' | 'dismiss' | 'share' | 'add_to_wallet' | 'promote' | 'open_circle';

export interface NotificationAction {
  label: string;
  kind: NotificationActionKind;
  route?: string;
  destructive?: boolean;
}

export interface NotificationCampaignRule {
  id: string;
  name: string;
  trigger: NotificationTrigger;
  audience: NotificationAudience;
  segments: NotificationSegment[];
  channels: NotificationChannel[];
  title: string;
  body: string;
  tone: NotificationTone;
  priority: 1 | 2 | 3 | 4 | 5;
  lifecycleStage: 'discover' | 'checkout' | 'wallet' | 'circle' | 'entry' | 'post_event' | 'host_ops' | 'donation';
  quietHoursSafe: boolean;
  requiresAction?: boolean;
  route?: string;
  actions?: NotificationAction[];
  suppressIf?: string[];
  maxPerEvent?: number;
  minHoursSinceLast?: number;
  fatigueCost: number;
}

export interface NotificationUserPreferences {
  pushEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  eventReminders: boolean;
  circleUpdates: boolean;
  hostInsights: boolean;
  donationUpdates: boolean;
  marketingRecommendations: boolean;
}

export interface NotificationEngagementSignals {
  lastOpenedAt?: string;
  notificationsSentToday: number;
  notificationsSentThisWeek: number;
  dismissalsThisWeek: number;
  opensThisWeek: number;
  savedEvents: number;
  ticketsPurchased: number;
  circlesActive: number;
  donationInterestScore: number;
  hostUrgencyScore: number;
  localHour: number;
  batterySaver?: boolean;
  timezone?: string;
}

export interface NotificationDecisionContext {
  optedOut?: boolean;
  quietHours?: boolean;
  alreadyActed?: boolean;
  eventStartsAt?: string;
  userLocalHour?: number;
  segments?: NotificationSegment[];
  preferences?: Partial<NotificationUserPreferences>;
  signals?: Partial<NotificationEngagementSignals>;
  eventId?: string;
  circleId?: string;
  donationCampaignId?: string;
}

export interface NotificationDeliveryDecision {
  shouldSend: boolean;
  reason: string;
  channels: NotificationChannel[];
  priority: NotificationCampaignRule['priority'];
  score: number;
  fatigueRisk: 'low' | 'medium' | 'high';
  recommendedSendAt?: string;
  fallbackToInApp?: boolean;
}

export interface IntelligentNotification {
  id: string;
  campaignId: string;
  type: NotificationTrigger;
  audience: NotificationAudience;
  title: string;
  body: string;
  time: string;
  createdAt: string;
  read: boolean;
  priority: 1 | 2 | 3 | 4 | 5;
  tone: NotificationTone;
  lifecycleStage: NotificationCampaignRule['lifecycleStage'];
  route?: string;
  eventId?: string;
  circleId?: string;
  donationCampaignId?: string;
  actions?: NotificationAction[];
  channels: NotificationChannel[];
  aiReason?: string;
}

export interface NotificationAnalyticsEvent {
  id: string;
  notificationId: string;
  campaignId: string;
  action: 'sent' | 'opened' | 'dismissed' | 'snoozed' | 'converted' | 'suppressed';
  createdAt: string;
  reason?: string;
}

export interface HostNotificationRecommendation {
  id: string;
  title: string;
  body: string;
  recommendedAction: string;
  score: number;
  route?: string;
}
