/**
 * Analytics Service
 * ═════════════════
 * Centralized event tracking for ECHO host funnel and consumer flows.
 * Mock implementation — logs to console in dev, will integrate with
 * Mixpanel/Amplitude/Segment in production.
 *
 * Taxonomy follows ECHO_Analytics_Taxonomy_v1_0.
 */
import { Platform } from 'react-native';

// ─── Event Types ────────────────────────────────────────────────────────────

export type AnalyticsEvent =
  // Host activation funnel
  | 'host_activation_started'
  | 'host_activation_step_viewed'
  | 'host_activation_step_completed'
  | 'host_activation_completed'
  | 'host_activation_abandoned'
  // Event creation funnel
  | 'event_create_started'
  | 'event_create_step_viewed'
  | 'event_create_step_completed'
  | 'event_create_draft_saved'
  | 'event_create_published'
  | 'event_create_abandoned'
  | 'event_duplicated'
  // AI interactions
  | 'ai_title_suggestion_used'
  | 'ai_title_suggestion_refreshed'
  | 'ai_description_generated'
  | 'ai_pricing_guidance_viewed'
  | 'ai_promo_copy_generated'
  | 'ai_readiness_panel_viewed'
  | 'ai_clarity_warning_shown'
  // Payout funnel
  | 'payout_setup_started'
  | 'payout_setup_completed'
  | 'payout_setup_abandoned'
  // Door mode
  | 'door_mode_opened'
  | 'door_scan_success'
  | 'door_scan_failed'
  | 'door_manual_checkin'
  // Mode switching
  | 'mode_switched'
  | 'mode_switch_blocked'
  // Consumer funnel
  | 'event_viewed'
  | 'event_purchase_started'
  | 'event_purchase_completed'
  | 'event_purchase_abandoned'
  | 'circle_created'
  | 'circle_invite_sent'
  | 'ticket_transferred'
  | 'echod_feedback_started'
  | 'echod_feedback_submitted'
  // Navigation
  | 'screen_viewed'
  | 'tab_switched';

export type AnalyticsProperties = Record<string, string | number | boolean | undefined>;

// ─── Core tracker ───────────────────────────────────────────────────────────

class AnalyticsTracker {
  private enabled = __DEV__;
  private queue: Array<{ event: AnalyticsEvent; properties: AnalyticsProperties; timestamp: string }> = [];
  private userProperties: Record<string, string | number | boolean> = {};

  /**
   * Track an event with optional properties.
   */
  track(event: AnalyticsEvent, properties: AnalyticsProperties = {}) {
    const entry = {
      event,
      properties: {
        ...properties,
        platform: Platform.OS,
        timestamp: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    };

    this.queue.push(entry);

    if (__DEV__) {
      console.log(`[Analytics] ${event}`, properties);
    }

    // In production: flush to analytics provider
    // this.flush();
  }

  /**
   * Set persistent user properties (mode, host status, etc.)
   */
  setUserProperties(props: Record<string, string | number | boolean>) {
    this.userProperties = { ...this.userProperties, ...props };
    if (__DEV__) {
      console.log('[Analytics] User properties updated:', props);
    }
  }

  /**
   * Identify user (called on auth).
   */
  identify(userId: string) {
    this.setUserProperties({ userId });
    if (__DEV__) {
      console.log(`[Analytics] Identified: ${userId}`);
    }
  }

  /**
   * Reset on logout.
   */
  reset() {
    this.userProperties = {};
    this.queue = [];
    if (__DEV__) {
      console.log('[Analytics] Reset');
    }
  }

  /**
   * Get queued events (for debugging / testing).
   */
  getQueue() {
    return [...this.queue];
  }

  /**
   * Flush queue to provider (stub).
   */
  private flush() {
    if (this.queue.length === 0) return;
    // Production: batch send to Mixpanel/Amplitude/Segment
    // const batch = this.queue.splice(0, this.queue.length);
    // await fetch(ANALYTICS_ENDPOINT, { method: 'POST', body: JSON.stringify(batch) });
  }
}

// ─── Singleton export ───────────────────────────────────────────────────────

export const analytics = new AnalyticsTracker();

// ─── Convenience helpers for host funnel ────────────────────────────────────

export const hostAnalytics = {
  activationStarted: () =>
    analytics.track('host_activation_started'),

  activationStepViewed: (step: string) =>
    analytics.track('host_activation_step_viewed', { step }),

  activationStepCompleted: (step: string) =>
    analytics.track('host_activation_step_completed', { step }),

  activationCompleted: (result: string) =>
    analytics.track('host_activation_completed', { result }),

  activationAbandoned: (lastStep: string) =>
    analytics.track('host_activation_abandoned', { lastStep }),

  eventCreateStarted: (source: 'manual' | 'flyer' | 'paste' | 'duplicate') =>
    analytics.track('event_create_started', { source }),

  eventCreateStepViewed: (step: string) =>
    analytics.track('event_create_step_viewed', { step }),

  eventCreateStepCompleted: (step: string) =>
    analytics.track('event_create_step_completed', { step }),

  eventPublished: (ticketingModel: string, tierCount: number) =>
    analytics.track('event_create_published', { ticketingModel, tierCount }),

  eventDuplicated: (sourceEventId: string) =>
    analytics.track('event_duplicated', { sourceEventId }),

  aiTitleUsed: (index: number) =>
    analytics.track('ai_title_suggestion_used', { index }),

  aiDescriptionGenerated: (tone: string) =>
    analytics.track('ai_description_generated', { tone }),

  payoutSetupStarted: () =>
    analytics.track('payout_setup_started'),

  payoutSetupCompleted: (provider: string) =>
    analytics.track('payout_setup_completed', { provider }),

  doorModeOpened: (eventId: string) =>
    analytics.track('door_mode_opened', { eventId }),

  doorScanResult: (success: boolean, method: 'nfc' | 'qr') =>
    analytics.track(success ? 'door_scan_success' : 'door_scan_failed', { method }),

  modeSwitched: (from: string, to: string) =>
    analytics.track('mode_switched', { from, to }),

  modeSwitchBlocked: (reason: string) =>
    analytics.track('mode_switch_blocked', { reason }),

  screenViewed: (screen: string) =>
    analytics.track('screen_viewed', { screen }),
};
