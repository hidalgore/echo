/**
 * Transfer eligibility utilities — BL-10, BL-11, BL-12
 * ═════════════════════════════════════════════════════
 * BL-10: Transfers disabled 1 hour before event start.
 * BL-11: One-hop only (ticket transferred once).
 * BL-12: Unclaimed transfers auto-return after 24 hours (server-side).
 */

/** Milliseconds in 1 hour */
const ONE_HOUR_MS = 60 * 60 * 1000;

export type TransferEligibility = {
  canTransfer: boolean;
  reason?: string;
  /** Minutes until transfer window closes (undefined if already closed) */
  minutesRemaining?: number;
};

/**
 * Check if a ticket can be transferred based on BL-10 and BL-11.
 *
 * @param eventStartTime - ISO 8601 event start time
 * @param hasBeenTransferred - Whether this ticket was already transferred once (BL-11)
 * @param ticketStatus - Current ticket status
 */
export function getTransferEligibility(
  eventStartTime: string,
  hasBeenTransferred: boolean = false,
  ticketStatus: string = 'active',
): TransferEligibility {
  // Only active tickets can be transferred
  if (ticketStatus !== 'active') {
    return {
      canTransfer: false,
      reason: `This ticket is ${ticketStatus} and cannot be transferred.`,
    };
  }

  // BL-11: One-hop only
  if (hasBeenTransferred) {
    return {
      canTransfer: false,
      reason: 'This ticket has already been transferred once. Tickets can only be transferred one time.',
    };
  }

  // BL-10: 1 hour before event start
  const eventStart = new Date(eventStartTime).getTime();
  const now = Date.now();
  const cutoff = eventStart - ONE_HOUR_MS;
  const msRemaining = cutoff - now;

  if (msRemaining <= 0) {
    return {
      canTransfer: false,
      reason: 'Transfers close 1 hour before event start.',
    };
  }

  const minutesRemaining = Math.floor(msRemaining / (60 * 1000));

  // Warning when less than 2 hours remaining
  if (minutesRemaining <= 120) {
    return {
      canTransfer: true,
      reason: `Transfer window closes in ${minutesRemaining} minute${minutesRemaining !== 1 ? 's' : ''}.`,
      minutesRemaining,
    };
  }

  return { canTransfer: true, minutesRemaining };
}

/**
 * Format the transfer window message for UI display.
 */
export function formatTransferWindowMessage(eligibility: TransferEligibility): string {
  if (!eligibility.canTransfer) {
    return eligibility.reason || 'Transfer unavailable.';
  }
  if (eligibility.minutesRemaining && eligibility.minutesRemaining <= 120) {
    return eligibility.reason || '';
  }
  return 'Transfers close 1 hour before event start.';
}
