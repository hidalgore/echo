/**
 * Scheduled Publish Service
 * ═════════════════════════
 * Locked upgrade: a host can create + configure an event now, then schedule when
 * it becomes public and when sales start. Event setup may be complete before the
 * public launch date.
 */

import type {
  ScheduledPublishConfig,
  ScheduledPublishValidationCode,
  ScheduledPublishValidationResult,
} from '../types/v3';

function toMs(value?: string): number | null {
  if (!value) return null;
  const ms = Date.parse(value);
  return Number.isNaN(ms) ? null : ms;
}

export function validateScheduledPublish(config: ScheduledPublishConfig): ScheduledPublishValidationResult {
  const codes: ScheduledPublishValidationCode[] = [];
  const eventMs = toMs(config.eventDate);
  const publishMs = toMs(config.publishDate);
  const salesMs = toMs(config.salesStartDate);

  if (eventMs == null) codes.push('missing_event_date');
  if (publishMs == null) codes.push('missing_publish_date');
  if (salesMs == null) codes.push('missing_sales_start_date');

  if (eventMs != null && publishMs != null && publishMs > eventMs) codes.push('publish_after_event');
  if (eventMs != null && salesMs != null && salesMs > eventMs) codes.push('sales_after_event');

  const valid = codes.length === 0;
  return {
    valid,
    codes,
    hostMessage: valid
      ? 'Schedule ready. ECHO can save the event now and launch it on the selected date.'
      : buildScheduleMessage(codes),
  };
}

export function buildDefaultScheduledPublish(eventDate: string, now = new Date()): ScheduledPublishConfig {
  return {
    mode: 'schedule_public_launch',
    eventDate,
    publishDate: now.toISOString(),
    salesStartDate: now.toISOString(),
    publicLaunchLabel: 'Public launch',
    salesStartLabel: 'Ticket sales start',
    allowPresaleBeforePublicLaunch: true,
  };
}

export function shouldEventBePublic(config: ScheduledPublishConfig, now = new Date()): boolean {
  if (config.mode === 'publish_now') return true;
  const publishMs = toMs(config.publishDate);
  return publishMs != null && now.getTime() >= publishMs;
}

export function shouldSalesBeOpen(config: ScheduledPublishConfig, now = new Date()): boolean {
  const salesMs = toMs(config.salesStartDate);
  return salesMs != null && now.getTime() >= salesMs;
}

function buildScheduleMessage(codes: ScheduledPublishValidationCode[]): string {
  if (codes.includes('missing_event_date')) return 'Add the event date before scheduling launch.';
  if (codes.includes('missing_publish_date')) return 'Choose when this event becomes public.';
  if (codes.includes('missing_sales_start_date')) return 'Choose when ticket sales start.';
  if (codes.includes('publish_after_event')) return 'Public launch cannot happen after the event date.';
  if (codes.includes('sales_after_event')) return 'Ticket sales cannot start after the event date.';
  if (codes.includes('tier_sales_before_floor')) return 'Ticket tier sales cannot start before the event-level sales start date.';
  return 'Review the scheduled publish settings.';
}
