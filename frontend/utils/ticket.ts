
import type { EchoCircleStatus, Event, Ticket } from '../types';
import { CONFIG } from '../constants/config';

export function getMinutesUntilEvent(event: Event) {
  return Math.floor((new Date(event.start_time).getTime() - Date.now()) / 60000);
}

export function getMinutesUntilCircleClose(circle?: EchoCircleStatus | null) {
  if (!circle) return null;
  return Math.floor((new Date(circle.closes_at).getTime() - Date.now()) / 60000);
}

export function shouldCollapseCircle(event: Event) {
  return getMinutesUntilEvent(event) <= 60;
}

/**
 * Check if a ticket can be transferred.
 * Enforces: host policy (allow_transfers), BL-10 deadline (60 min), active status.
 */
export function isTransferAvailable(ticket: Ticket, event: Event) {
  // Host disabled transfers for this event
  if (event.allow_transfers === false) return false;
  // BL-10: canonical 60-minute deadline from CONFIG
  const deadlineMinutes = CONFIG.TRANSFER_DEADLINE_MINUTES;
  return getMinutesUntilEvent(event) > deadlineMinutes && ticket.status === 'active';
}

export function formatCountdown(minutes: number | null) {
  if (minutes === null) return '';
  if (minutes <= 0) return '0:00';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) return `${hours}:${String(mins).padStart(2, '0')}:00`;
  return `${String(mins).padStart(2, '0')}:00`;
}

export function getCircleSummaryLabel(circle?: EchoCircleStatus | null) {
  if (!circle) return null;
  const awaiting = circle.participants.filter((p) => p.status === 'awaiting').length;
  return awaiting > 0
    ? `Circle pending • ${awaiting} awaiting`
    : `Circle complete • ${circle.claimed_slots} of ${circle.total_slots} claimed`;
}
