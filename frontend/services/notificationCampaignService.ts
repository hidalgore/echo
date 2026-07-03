import type {
  HostNotificationRecommendation,
  IntelligentNotification,
  NotificationAudience,
  NotificationCampaignRule,
  NotificationDecisionContext,
  NotificationDeliveryDecision,
  NotificationEngagementSignals,
  NotificationTrigger,
  NotificationUserPreferences,
} from '../types/notificationCampaign';

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationUserPreferences = {
  pushEnabled: true,
  emailEnabled: true,
  smsEnabled: false,
  quietHoursEnabled: true,
  quietHoursStart: '22:00',
  quietHoursEnd: '08:00',
  eventReminders: true,
  circleUpdates: true,
  hostInsights: true,
  donationUpdates: true,
  marketingRecommendations: true,
};

export const DEFAULT_ENGAGEMENT_SIGNALS: NotificationEngagementSignals = {
  notificationsSentToday: 1,
  notificationsSentThisWeek: 5,
  dismissalsThisWeek: 1,
  opensThisWeek: 4,
  savedEvents: 2,
  ticketsPurchased: 1,
  circlesActive: 1,
  donationInterestScore: 0.45,
  hostUrgencyScore: 0.62,
  localHour: new Date().getHours(),
};

export const ECHO_INTELLIGENT_NOTIFICATION_SYSTEM_V2: NotificationCampaignRule[] = [
  {
    id: 'attendee_ticket_ready_v2',
    name: 'Wallet ticket secured',
    trigger: 'ticket_purchased',
    audience: 'attendee',
    segments: ['ticket_holder'],
    channels: ['push', 'in_app', 'email'],
    title: 'Ticket secured',
    body: 'Your ECHO ticket is in Wallet. NFC access will be ready before doors open.',
    tone: 'trust',
    priority: 4,
    lifecycleStage: 'wallet',
    quietHoursSafe: true,
    route: '/(tabs)/wallet',
    actions: [{ label: 'Open Wallet', kind: 'open_route', route: '/(tabs)/wallet' }],
    maxPerEvent: 1,
    minHoursSinceLast: 1,
    fatigueCost: 1,
  },
  {
    id: 'attendee_age_gate_v2',
    name: 'Age verification needed',
    trigger: 'age_verification_needed',
    audience: 'attendee',
    segments: ['needs_age_verification', 'ticket_holder'],
    channels: ['push', 'in_app', 'email'],
    title: 'Verify before entry',
    body: 'This event requires age verification. Complete it before checkout or arrival to keep entry smooth.',
    tone: 'trust',
    priority: 5,
    lifecycleStage: 'checkout',
    quietHoursSafe: true,
    requiresAction: true,
    route: '/age-verification',
    actions: [{ label: 'Verify now', kind: 'open_route', route: '/age-verification' }],
    maxPerEvent: 2,
    minHoursSinceLast: 12,
    fatigueCost: 2,
  },
  {
    id: 'attendee_event_24h_v2',
    name: '24-hour entry readiness',
    trigger: 'event_24h',
    audience: 'attendee',
    segments: ['ticket_holder'],
    channels: ['push', 'in_app'],
    title: 'Tomorrow on ECHO',
    body: 'Your event is coming up. Check your Wallet for entry details, age status, and NFC readiness.',
    tone: 'calm',
    priority: 3,
    lifecycleStage: 'entry',
    quietHoursSafe: true,
    route: '/(tabs)/wallet',
    actions: [{ label: 'Check Wallet', kind: 'open_route', route: '/(tabs)/wallet' }],
    maxPerEvent: 1,
    minHoursSinceLast: 8,
    fatigueCost: 1,
  },
  {
    id: 'attendee_event_3h_v2',
    name: '3-hour entry prep',
    trigger: 'event_3h',
    audience: 'attendee',
    segments: ['ticket_holder'],
    channels: ['push', 'in_app'],
    title: 'Entry ready soon',
    body: 'Open Wallet before arrival. NFC is primary and QR is available only as backup.',
    tone: 'operational',
    priority: 4,
    lifecycleStage: 'entry',
    quietHoursSafe: false,
    route: '/(tabs)/wallet',
    maxPerEvent: 1,
    minHoursSinceLast: 4,
    fatigueCost: 2,
  },
  {
    id: 'attendee_doors_open_v2',
    name: 'Doors open',
    trigger: 'doors_open',
    audience: 'attendee',
    segments: ['ticket_holder'],
    channels: ['push', 'in_app'],
    title: 'Doors are open',
    body: 'Open Wallet and hold near the reader when you arrive. Your secure ECHO access is ready.',
    tone: 'operational',
    priority: 5,
    lifecycleStage: 'entry',
    quietHoursSafe: false,
    route: '/(tabs)/wallet',
    maxPerEvent: 1,
    minHoursSinceLast: 2,
    fatigueCost: 2,
  },
  {
    id: 'circle_invite_received_v2',
    name: 'Circle invite claim',
    trigger: 'circle_invite_received',
    audience: 'circle_recipient',
    segments: ['circle_active'],
    channels: ['push', 'sms', 'email', 'in_app'],
    title: 'You have a saved spot',
    body: 'Your spot is reserved. Claim and pay to secure your ticket before the Circle closes.',
    tone: 'trust',
    priority: 5,
    lifecycleStage: 'circle',
    quietHoursSafe: true,
    requiresAction: true,
    route: '/circle/invite',
    actions: [{ label: 'Claim spot', kind: 'open_circle', route: '/circle/invite' }],
    maxPerEvent: 2,
    minHoursSinceLast: 6,
    fatigueCost: 2,
  },
  {
    id: 'circle_timer_15m_v2',
    name: 'Circle at-risk reminder',
    trigger: 'circle_timer_15m',
    audience: 'circle_organizer',
    segments: ['circle_at_risk'],
    channels: ['push', 'in_app'],
    title: 'Circle closes soon',
    body: 'Some spots are still unpaid. Replace, remind, cover, or release remaining spots before time runs out.',
    tone: 'urgent',
    priority: 5,
    lifecycleStage: 'circle',
    quietHoursSafe: false,
    requiresAction: true,
    route: '/circle/[id]',
    actions: [{ label: 'Open Circle', kind: 'open_circle', route: '/circle/[id]' }],
    maxPerEvent: 1,
    minHoursSinceLast: 1,
    fatigueCost: 3,
  },
  {
    id: 'circle_complete_v2',
    name: 'Circle complete celebration',
    trigger: 'circle_complete',
    audience: 'circle_organizer',
    segments: ['circle_active'],
    channels: ['push', 'in_app'],
    title: 'Circle complete',
    body: 'Everyone secured their ticket. Your group is ready for entry.',
    tone: 'celebratory',
    priority: 3,
    lifecycleStage: 'circle',
    quietHoursSafe: true,
    route: '/(tabs)/wallet',
    maxPerEvent: 1,
    minHoursSinceLast: 1,
    fatigueCost: 1,
  },
  {
    id: 'host_publish_success_v2',
    name: 'Host publish success next actions',
    trigger: 'host_publish_success',
    audience: 'host',
    segments: ['host_active', 'host_first_event'],
    channels: ['in_app', 'push'],
    title: 'Event published',
    body: 'Your event is live. ECHO can help build a clean promotion sequence for social, saved-event reminders, and launch momentum.',
    tone: 'premium',
    priority: 3,
    lifecycleStage: 'host_ops',
    quietHoursSafe: true,
    route: '/(host)/promote',
    actions: [{ label: 'Promote event', kind: 'promote', route: '/(host)/promote' }],
    maxPerEvent: 1,
    minHoursSinceLast: 1,
    fatigueCost: 1,
  },
  {
    id: 'host_sales_momentum_v2',
    name: 'Sales momentum detected',
    trigger: 'host_sales_momentum',
    audience: 'host',
    segments: ['host_active'],
    channels: ['push', 'in_app'],
    title: 'Sales momentum detected',
    body: 'Interest is rising. This is a good time to post, remind saved users, or spotlight limited capacity.',
    tone: 'calm',
    priority: 3,
    lifecycleStage: 'host_ops',
    quietHoursSafe: true,
    route: '/(host)/promote',
    actions: [{ label: 'View recommendation', kind: 'promote', route: '/(host)/promote' }],
    maxPerEvent: 2,
    minHoursSinceLast: 8,
    fatigueCost: 1,
  },
  {
    id: 'host_sales_slowdown_v2',
    name: 'Sales slowdown action',
    trigger: 'host_sales_slowdown',
    audience: 'host',
    segments: ['host_active'],
    channels: ['in_app', 'push'],
    title: 'Sales slowed',
    body: 'ECHO recommends a focused reminder to saved users and a short social push using the event cover photo.',
    tone: 'operational',
    priority: 3,
    lifecycleStage: 'host_ops',
    quietHoursSafe: true,
    route: '/(host)/promote',
    maxPerEvent: 2,
    minHoursSinceLast: 12,
    fatigueCost: 1,
  },
  {
    id: 'host_door_ready_v2',
    name: 'Door Mode preflight',
    trigger: 'host_door_mode_ready',
    audience: 'host',
    segments: ['host_active', 'door_staff'],
    channels: ['push', 'in_app'],
    title: 'Door Mode unlocks soon',
    body: 'Door Mode becomes available 2 hours before start. Confirm passcode, brightness restore, and offline cache.',
    tone: 'operational',
    priority: 5,
    lifecycleStage: 'host_ops',
    quietHoursSafe: false,
    route: '/(host)/(tabs)/door',
    maxPerEvent: 1,
    minHoursSinceLast: 6,
    fatigueCost: 2,
  },
  {
    id: 'donation_goal_progress_v2',
    name: 'Nonprofit donation progress',
    trigger: 'donation_goal_progress',
    audience: 'nonprofit_donor',
    segments: ['nonprofit_supporter'],
    channels: ['in_app', 'email'],
    title: 'Campaign update',
    body: 'This verified nonprofit campaign is still accepting donations until event closeout.',
    tone: 'mission',
    priority: 2,
    lifecycleStage: 'donation',
    quietHoursSafe: true,
    route: '/(tabs)/wallet',
    maxPerEvent: 3,
    minHoursSinceLast: 24,
    fatigueCost: 1,
  },
  {
    id: 'donation_goal_reached_v2',
    name: 'Donation goal reached',
    trigger: 'donation_goal_reached',
    audience: 'nonprofit_donor',
    segments: ['nonprofit_supporter'],
    channels: ['in_app', 'email'],
    title: 'Goal reached',
    body: 'The campaign reached its goal and can continue accepting donations until event closeout.',
    tone: 'mission',
    priority: 2,
    lifecycleStage: 'donation',
    quietHoursSafe: true,
    route: '/(tabs)/wallet',
    maxPerEvent: 1,
    minHoursSinceLast: 12,
    fatigueCost: 1,
  },
  {
    id: 'host_closeout_ready_v2',
    name: 'Host closeout report ready',
    trigger: 'host_closeout_ready',
    audience: 'host',
    segments: ['host_active'],
    channels: ['push', 'in_app', 'email'],
    title: 'Closeout report ready',
    body: 'Attendance, denied attempts, payout status, and donation CSV exports are ready for review.',
    tone: 'operational',
    priority: 4,
    lifecycleStage: 'post_event',
    quietHoursSafe: true,
    route: '/(host)/recap',
    maxPerEvent: 1,
    minHoursSinceLast: 8,
    fatigueCost: 1,
  },
];

export const ECHO_NOTIFICATION_CAMPAIGN_V1 = ECHO_INTELLIGENT_NOTIFICATION_SYSTEM_V2;

export function getCampaignRulesForTrigger(trigger: NotificationTrigger): NotificationCampaignRule[] {
  return ECHO_INTELLIGENT_NOTIFICATION_SYSTEM_V2.filter((rule) => rule.trigger === trigger);
}

export function getCampaignRulesForAudience(audience: NotificationAudience): NotificationCampaignRule[] {
  return ECHO_INTELLIGENT_NOTIFICATION_SYSTEM_V2.filter((rule) => rule.audience === audience || rule.audience === 'all');
}

const parseHour = (hhmm?: string, fallback = 0) => {
  const raw = hhmm || '';
  const match = raw.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return fallback;
  return Math.min(Math.max(Number(match[1]), 0), 23);
};

export function isWithinQuietHours(preferences: Partial<NotificationUserPreferences> = {}, localHour = new Date().getHours()) {
  const merged = { ...DEFAULT_NOTIFICATION_PREFERENCES, ...preferences };
  if (!merged.quietHoursEnabled) return false;
  const start = parseHour(merged.quietHoursStart, 22);
  const end = parseHour(merged.quietHoursEnd, 8);
  if (start > end) return localHour >= start || localHour < end;
  return localHour >= start && localHour < end;
}

export function calculatePersonalizationScore(rule: NotificationCampaignRule, context: NotificationDecisionContext = {}) {
  const signals = { ...DEFAULT_ENGAGEMENT_SIGNALS, ...(context.signals || {}) };
  const contextSegments = new Set(context.segments || []);
  const segmentMatch = rule.segments.reduce((sum, segment) => sum + (contextSegments.has(segment) ? 0.12 : 0), 0);
  const intentBoost = Math.min(0.18, signals.savedEvents * 0.025 + signals.ticketsPurchased * 0.04 + signals.circlesActive * 0.04);
  const donationBoost = rule.lifecycleStage === 'donation' ? signals.donationInterestScore * 0.15 : 0;
  const hostBoost = rule.lifecycleStage === 'host_ops' ? signals.hostUrgencyScore * 0.16 : 0;
  const openRate = signals.opensThisWeek / Math.max(1, signals.notificationsSentThisWeek);
  const engagementBoost = Math.min(0.14, openRate * 0.12);
  const dismissalPenalty = Math.min(0.22, signals.dismissalsThisWeek * 0.05);
  const priority = rule.priority / 5;
  return Math.max(0, Math.min(1, 0.24 + priority * 0.22 + segmentMatch + intentBoost + donationBoost + hostBoost + engagementBoost - dismissalPenalty));
}

export function calculateFatigueRisk(rule: NotificationCampaignRule, context: NotificationDecisionContext = {}): 'low' | 'medium' | 'high' {
  const signals = { ...DEFAULT_ENGAGEMENT_SIGNALS, ...(context.signals || {}) };
  const fatigueLoad = signals.notificationsSentToday * 0.32 + signals.notificationsSentThisWeek * 0.08 + signals.dismissalsThisWeek * 0.28 + rule.fatigueCost * 0.18;
  if (fatigueLoad >= 3.2) return 'high';
  if (fatigueLoad >= 1.8) return 'medium';
  return 'low';
}

export function recommendSendTime(rule: NotificationCampaignRule, context: NotificationDecisionContext = {}) {
  const localHour = context.userLocalHour ?? context.signals?.localHour ?? new Date().getHours();
  const now = new Date();

  if (rule.priority >= 5 || ['doors_open', 'circle_timer_15m', 'host_door_mode_ready'].includes(rule.trigger)) {
    return now.toISOString();
  }

  if (isWithinQuietHours(context.preferences, localHour)) {
    const prefs = { ...DEFAULT_NOTIFICATION_PREFERENCES, ...(context.preferences || {}) };
    const send = new Date(now);
    const endHour = parseHour(prefs.quietHoursEnd, 8);
    send.setHours(endHour, 15, 0, 0);
    if (send <= now) send.setDate(send.getDate() + 1);
    return send.toISOString();
  }

  if (localHour < 9) {
    const send = new Date(now); send.setHours(9, 15, 0, 0); return send.toISOString();
  }
  if (localHour > 21) {
    const send = new Date(now); send.setDate(send.getDate() + 1); send.setHours(9, 15, 0, 0); return send.toISOString();
  }
  return now.toISOString();
}

export function decideNotificationDelivery(rule: NotificationCampaignRule, context: NotificationDecisionContext = {}): NotificationDeliveryDecision {
  const preferences = { ...DEFAULT_NOTIFICATION_PREFERENCES, ...(context.preferences || {}) };
  const localHour = context.userLocalHour ?? context.signals?.localHour ?? new Date().getHours();
  const quietHours = context.quietHours ?? isWithinQuietHours(preferences, localHour);
  const fatigueRisk = calculateFatigueRisk(rule, context);
  const score = calculatePersonalizationScore(rule, context);

  if (context.optedOut) return { shouldSend: false, reason: 'User opted out.', channels: [], priority: rule.priority, score, fatigueRisk };
  if (context.alreadyActed) return { shouldSend: false, reason: 'User already completed this action.', channels: [], priority: rule.priority, score, fatigueRisk };
  if (score < 0.28 && rule.priority < 4) return { shouldSend: false, reason: 'Personalization score too low for proactive delivery.', channels: ['in_app'], priority: rule.priority, score, fatigueRisk, fallbackToInApp: true };
  if (fatigueRisk === 'high' && rule.priority < 5) return { shouldSend: false, reason: 'Suppressed by fatigue control.', channels: ['in_app'], priority: rule.priority, score, fatigueRisk, fallbackToInApp: true };

  let channels = rule.channels.filter((channel) => {
    if (channel === 'push') return preferences.pushEnabled;
    if (channel === 'email') return preferences.emailEnabled;
    if (channel === 'sms') return preferences.smsEnabled;
    return true;
  });

  if (quietHours && !rule.quietHoursSafe && rule.priority < 5) {
    return { shouldSend: false, reason: 'Deferred by quiet hours.', channels: ['in_app'], priority: rule.priority, score, fatigueRisk, recommendedSendAt: recommendSendTime(rule, context), fallbackToInApp: true };
  }

  if (quietHours && !rule.quietHoursSafe && rule.priority >= 5) {
    channels = channels.filter((channel) => channel !== 'email' && channel !== 'sms');
  }

  if (!channels.includes('in_app')) channels.push('in_app');

  return { shouldSend: true, reason: 'Eligible after personalization, fatigue, quiet-hours, and preference checks.', channels, priority: rule.priority, score, fatigueRisk, recommendedSendAt: recommendSendTime(rule, context) };
}

export function buildNotificationFromRule(rule: NotificationCampaignRule, context: NotificationDecisionContext = {}): IntelligentNotification {
  const decision = decideNotificationDelivery(rule, context);
  return {
    id: `notif_${rule.id}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    campaignId: rule.id,
    type: rule.trigger,
    audience: rule.audience,
    title: rule.title,
    body: rule.body,
    time: 'Now',
    createdAt: new Date().toISOString(),
    read: false,
    priority: rule.priority,
    tone: rule.tone,
    lifecycleStage: rule.lifecycleStage,
    route: rule.route,
    eventId: context.eventId,
    circleId: context.circleId,
    donationCampaignId: context.donationCampaignId,
    actions: rule.actions,
    channels: decision.channels,
    aiReason: decision.reason,
  };
}

export function generateIntelligentNotifications(triggers: NotificationTrigger[], context: NotificationDecisionContext = {}) {
  return triggers.flatMap((trigger) => getCampaignRulesForTrigger(trigger).map((rule) => ({ rule, decision: decideNotificationDelivery(rule, context) })))
    .filter(({ decision }) => decision.shouldSend || decision.fallbackToInApp)
    .sort((a, b) => b.decision.priority - a.decision.priority || b.decision.score - a.decision.score)
    .map(({ rule }) => buildNotificationFromRule(rule, context));
}

export function getHostRecommendations(context: NotificationDecisionContext = {}): HostNotificationRecommendation[] {
  const hostRules = getCampaignRulesForAudience('host');
  return hostRules.map((rule) => ({ rule, decision: decideNotificationDelivery(rule, context) }))
    .filter(({ decision }) => decision.score >= 0.32 || decision.priority >= 4)
    .sort((a, b) => b.decision.score - a.decision.score)
    .slice(0, 5)
    .map(({ rule, decision }) => ({
      id: `rec_${rule.id}`,
      title: rule.title,
      body: rule.body,
      recommendedAction: rule.actions?.[0]?.label || 'Review',
      score: Math.round(decision.score * 100),
      route: rule.route,
    }));
}
