/**
 * Event Cancellation Service — V3 Canonical
 * ═════════════════════════════════════════
 * Per Lock 2B: `cancelled` is the 6th lifecycle state. Hard transition + auto refund.
 * Per Lock 5C: Owner + Admin can cancel; refund applied per host's policy.
 * Per Lock 9C: RBAC matrix gates the action.
 *
 * This service computes refund amounts via refundPolicyEngine and emits the
 * cancellation transition. In Phase 1 it operates against in-memory state;
 * Phase 3 wires it to Supabase mutations + Stripe refund API.
 */

import type {
  CancellationRequest,
  CancellationResult,
  RefundPolicy,
  TeamRole,
} from '../types/v3';
import { STATE_TRANSITION_RBAC } from '../types/v3';
import { computeRefundAmount } from './refundPolicyEngine';

// ─── RBAC Check ─────────────────────────────────────────────────────────────

/** Lock 5C — only owner and admin can cancel */
export function canCancelEvent(role: TeamRole): boolean {
  return STATE_TRANSITION_RBAC.cancel.includes(role);
}

// ─── Cancellation Flow ──────────────────────────────────────────────────────

export type TicketHolder = {
  ticketId: string;
  userId: string;
  pricePaidCents: number;
  purchasedAt: string;
};

export type CancellationContext = {
  eventDate: string; // ISO
  cancellationDate: string; // ISO — defaults to now
  ticketHolders: TicketHolder[];
};

/**
 * Compute the full refund batch for an event cancellation.
 *
 * For each ticket holder, apply the host's refund policy snapshotted at publish time
 * based on `daysBefore = eventDate - cancellationDate`.
 *
 * Note: ECHO platform fee + processing fees are governed by `services/pricingEngine.ts`
 * and follow the existing canon (see fee model in `constants/config.ts`). This service
 * computes the buyer-facing refund only; downstream services handle fee absorption.
 */
export function computeRefundBatch(
  policy: RefundPolicy,
  ctx: CancellationContext,
): {
  refunds: Array<TicketHolder & { refundCents: number; refundPct: number }>;
  totalRefundedCents: number;
} {
  const refunds = ctx.ticketHolders.map((holder) => {
    const { refundAmountCents, refundPct } = computeRefundAmount(
      policy,
      holder.pricePaidCents,
      ctx.eventDate,
      ctx.cancellationDate,
    );
    return {
      ...holder,
      refundCents: refundAmountCents,
      refundPct,
    };
  });

  const totalRefundedCents = refunds.reduce((acc, r) => acc + r.refundCents, 0);
  return { refunds, totalRefundedCents };
}

// ─── Execution Entry Point ──────────────────────────────────────────────────

/**
 * Cancel an event.
 *
 * Phase 1: returns a computed CancellationResult; in-memory state is updated
 *          by the calling store.
 * Phase 3: wraps a Supabase RPC + Stripe refund API call inside a transaction.
 */
export async function cancelEvent(
  request: CancellationRequest,
  ctx: CancellationContext,
  callerRole: TeamRole,
): Promise<CancellationResult> {
  // ── RBAC ──
  if (!canCancelEvent(callerRole)) {
    throw new Error('Only Owner or Admin roles may cancel an event.');
  }

  // ── Compute refunds ──
  const { refunds, totalRefundedCents } = computeRefundBatch(
    request.refundPolicyAtPublish,
    ctx,
  );

  // Phase 3 will execute:
  //   - Supabase: UPDATE events SET state = 'cancelled' WHERE id = $eventId
  //   - Insert audit log entry (EchoAuditService stub)
  //   - For each refund: Stripe refund API call
  //   - Notification dispatch to affected ticket holders

  // Phase 1: return computed result for the calling store to apply locally
  const result: CancellationResult = {
    success: true,
    refundsIssued: refunds.length,
    totalRefundedAmount: totalRefundedCents / 100,
    totalRefundedCents,
    newState: 'cancelled',
  };

  return result;
}

// ─── Confirmation Copy Helper ───────────────────────────────────────────────

/**
 * Generate the "this will refund N attendees" warning copy for the
 * cancellation confirmation modal (Round 10+ UX detail).
 */
export function buildCancellationWarning(
  ticketHolderCount: number,
  totalRefundedAmount: number,
): string {
  const ticketsWord = ticketHolderCount === 1 ? '1 ticket holder' : `${ticketHolderCount} ticket holders`;
  const refundFormatted = totalRefundedAmount.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  });
  return `Cancelling will refund ${ticketsWord} a total of ${refundFormatted} per your refund policy. This cannot be undone.`;
}
