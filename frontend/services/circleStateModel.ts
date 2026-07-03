/**
 * Shared Circle State Model (Spec §12)
 * ═════════════════════════════════════
 * Derives counts, editability, timer state, display config, and Wallet priority
 * from a single EchoCircle. No screen may duplicate this logic.
 */
import type {
  EchoCircle, CircleDerivedCounts, EditabilityState,
  TimerState, CircleHubDisplay, WalletPriority, CircleEdgeInfo, CircleEdgeCase,
} from '../types/circle';

// ─── Derived Counts ──────────────────────────────────────────────────────

export function deriveCounts(circle: EchoCircle): CircleDerivedCounts {
  const m = circle.members;
  return {
    total: circle.totalTickets,
    claimed: m.filter(s => s.status === 'claimed').length,
    pending: m.filter(s => s.status === 'invited' || s.status === 'pending').length,
    open: m.filter(s => s.status === 'open').length,
    released: m.filter(s => s.status === 'released').length,
    expired: m.filter(s => s.status === 'expired').length,
    replaced: m.filter(s => s.status === 'replaced').length,
  };
}

// ─── Editability ─────────────────────────────────────────────────────────

export function deriveEditability(circle: EchoCircle): EditabilityState {
  if (circle.status === 'complete' || circle.status === 'closed') return 'resolved';

  const now = Date.now();
  const eventStart = new Date(circle.eventStartISO).getTime();
  const sixtyMinBefore = eventStart - 60 * 60 * 1000;

  if (now >= sixtyMinBefore) return 'event_locked';
  if (circle.secondsRemaining <= 0) return 'timer_expired';
  return 'editable';
}

// ─── Timer State ─────────────────────────────────────────────────────────

export function deriveTimerState(circle: EchoCircle): TimerState {
  if (circle.status === 'complete' || circle.status === 'closed') return 'not_applicable';
  if (circle.secondsRemaining <= 0) return 'expired';
  if (circle.secondsRemaining <= 300) return 'warning'; // ≤ 5 min
  return 'running';
}

// ─── Circle Status Derivation ────────────────────────────────────────────
// Given raw circle data, derive the canonical status from member state + timer.

export function deriveCircleStatus(circle: EchoCircle): EchoCircle['status'] {
  const counts = deriveCounts(circle);

  // All claimed → complete
  if (counts.claimed === circle.totalTickets) return 'complete';

  // Timer expired with open/pending spots → action_needed
  if (circle.secondsRemaining <= 0 && (counts.open > 0 || counts.pending > 0)) return 'action_needed';

  // All non-organizer slots released/expired → closed
  const nonOrg = circle.members.filter(m => !m.isOrganizer);
  const allResolved = nonOrg.every(m => m.status === 'released' || m.status === 'expired' || m.status === 'claimed');
  if (allResolved && counts.open === 0 && counts.pending === 0 && counts.claimed < circle.totalTickets) return 'closed';

  // Has at least one invite/pending → waiting
  if (counts.pending > 0) return 'waiting';

  // Just created, no invites yet → created
  return 'created';
}

// ─── Circle Hub Display (Spec §6 matrix) ────────────────────────────────

export function deriveHubDisplay(circle: EchoCircle): CircleHubDisplay {
  const counts = deriveCounts(circle);
  const editability = deriveEditability(circle);

  switch (circle.status) {
    case 'created':
      return {
        status: 'created',
        headline: 'Your Circle is live',
        subheadline: 'Invite friends to claim their spots',
        primaryCta: { label: 'Invite Friend', action: 'inviteMember' },
        secondaryCtas: [],
        visualPosture: 'pulse',
      };

    case 'waiting':
      return {
        status: 'waiting',
        headline: `${counts.claimed} of ${counts.total} spots claimed`,
        subheadline: `${counts.pending} still pending`,
        primaryCta: counts.open > 0
          ? { label: 'Invite Friend', action: 'inviteMember' }
          : { label: 'Remind', action: 'remindMember' },
        secondaryCtas: [
          ...(counts.pending > 0 ? [{ label: 'Remind', action: 'remindMember' }] : []),
        ],
        visualPosture: 'waiting',
      };

    case 'action_needed':
      return {
        status: 'action_needed',
        headline: 'Claim window ended',
        subheadline: 'Choose what to do with the remaining spots',
        primaryCta: { label: 'Cover Remaining', action: 'coverRemaining' },
        secondaryCtas: [
          { label: 'Release Spots', action: 'releaseRemaining' },
        ],
        visualPosture: 'urgent',
      };

    case 'complete':
      return {
        status: 'complete',
        headline: 'Circle complete',
        subheadline: "Everyone's in",
        primaryCta: { label: 'View Tickets', action: 'view_tickets' },
        secondaryCtas: [],
        visualPosture: 'stable',
      };

    case 'closed':
      return {
        status: 'closed',
        headline: 'Circle closed',
        subheadline: 'Unclaimed spots were released',
        primaryCta: { label: 'View Ticket', action: 'view_ticket' },
        secondaryCtas: [],
        visualPosture: 'receded',
      };
  }
}

// ─── Wallet Priority (Spec §7) ──────────────────────────────────────────

export function deriveWalletPriority(
  hasActiveTicket: boolean,
  circle: EchoCircle | null,
): WalletPriority {
  if (!circle) return hasActiveTicket ? 'active_ticket_hero' : 'default';

  const isCircleActive = circle.status === 'created' || circle.status === 'waiting' || circle.status === 'action_needed';

  if (hasActiveTicket && isCircleActive) return 'active_ticket_hero'; // Active ticket hero first, Circle in Progress next
  if (!hasActiveTicket && isCircleActive) return 'circle_hero';
  if (circle.status === 'complete') return 'circle_complete';
  if (circle.status === 'closed') return 'circle_closed';
  return 'default';
}

// ─── Edge State Resolver (Spec §11) ─────────────────────────────────────

export function resolveEdgeState(type: CircleEdgeCase): CircleEdgeInfo {
  const MAP: Record<CircleEdgeCase, CircleEdgeInfo> = {
    invalid_invite: {
      type: 'invalid_invite',
      headline: 'This invite is no longer available',
      body: 'The invite link may have expired or been replaced. Ask the organizer for a new one.',
      cta: { label: 'Go Back', action: 'dismiss' },
    },
    already_claimed: {
      type: 'already_claimed',
      headline: 'That spot has already been claimed',
      body: 'Another guest claimed this spot before you. Contact the organizer if you need a new invite.',
      cta: { label: 'Go Back', action: 'dismiss' },
    },
    guest_payment_failure: {
      type: 'guest_payment_failure',
      headline: 'Spot not claimed yet',
      body: 'Payment did not go through. The spot remains open. Try again or use a different payment method.',
      cta: { label: 'Try Again', action: 'retry_payment' },
    },
    organizer_edit_locked: {
      type: 'organizer_edit_locked',
      headline: "Circle can't be edited now",
      body: 'Event access takes priority now. Your Circle is no longer editable.',
      cta: { label: 'View Ticket', action: 'view_ticket' },
    },
    duplicate_claim: {
      type: 'duplicate_claim',
      headline: 'This ticket is already secured',
      body: "You've already claimed your spot in this Circle. Your ticket is in your Wallet.",
      cta: { label: 'View in Wallet', action: 'go_wallet' },
    },
    protected_reserved: {
      type: 'protected_reserved',
      headline: 'Your Circle spots are still held',
      body: 'General admission may be sold out, but your Circle-reserved spots remain protected until the claim window ends.',
    },
  };
  return MAP[type];
}

/** Format seconds as MM:SS */
export function formatTimer(seconds: number): string {
  if (seconds <= 0) return '00:00';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}
