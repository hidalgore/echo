/**
 * services/api/mockAdapters.ts
 * ════════════════════════════
 * `mockPorts` — the EchoPorts implementation backed by the existing mock
 * services. Bound at startup (`bindPorts(mockPorts)`) so every screen that
 * later migrates to `getPorts()` runs against the same mock data it uses
 * today. Swapped for `httpPorts` domain-by-domain in Phases 2–6.
 *
 * Adapters translate domain shapes → wire DTOs via services/api/mappers.
 * The idempotency keys the ports carry are enforced client-side by apiClient
 * for http adapters; the mock adapters accept and ignore them (server-side
 * persistence/replay is backend Phase 0/3 work).
 */

import { API_STATUS } from '../../types/api/shared';
import type { ApiResult, Paged, PageParams } from '../../types/api/shared';
import type {
  CheckoutIntentDTO, CircleDTO, CredentialDTO, DoorScanRequestDTO,
  DoorScanResultDTO, EventDTO, RiskDecisionDTO, TicketDTO,
} from '../../types/api/dto';
import type { EchoPorts } from './ports';
import { toAgeBadge, toTicketStatus } from './mappers';

import { CONFIG } from '../../constants/config';
import type { Event, Ticket } from '../../types';
import type { EchoCircle } from '../../types/circle';
import { ENERGY_STATE_LABEL } from '../../types/socialEnergy';
import { getSocialEnergy } from '../socialEnergyService';
import { getMergedPublishedEvents } from '../eventRepository';
import {
  checkoutIntentService,
  type CheckoutIntent,
  type CheckoutIntentStatus,
} from '../checkoutIntentService';
import { createAccessPass, buildSignedCredential } from '../accessPassService';
import { canTierAccessZone } from '../accessControlService';
import { createFreshCircle } from '../circleMock';
import { deriveCounts } from '../circleStateModel';
import { buildRiskDecision, scoreToRiskAction, type RiskDecision } from '../botRiskService';
import { newIdempotencyKey } from './apiClient';
import { useEventStore } from '../../stores/eventStore';
import { useTicketStore } from '../../stores/ticketStore';
import { useCircleStore } from '../../stores/circleStore';
import { formatDate, formatTime } from '../../utils/format';

// ─── Result helpers ──────────────────────────────────────────────────────────

function ok<T>(data: T, status: number = API_STATUS.ok): ApiResult<T> {
  return { ok: true, status, data };
}

function notFound<T>(entity: string, id: string): ApiResult<T> {
  return { ok: false, status: 404, error: { code: 'not_found', message: `${entity} ${id} not found` } };
}

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

/** Index-based cursor pagination over an in-memory list (mock only). */
function paginate<T>(items: T[], params: PageParams): Paged<T> {
  const start = Math.max(0, Number.parseInt(params.cursor ?? '0', 10) || 0);
  const limit = Math.min(Math.max(params.limit ?? DEFAULT_PAGE_SIZE, 1), MAX_PAGE_SIZE);
  const end = start + limit;
  return {
    items: items.slice(start, end),
    nextCursor: end < items.length ? String(end) : undefined,
  };
}

// ─── Domain → DTO mapping ────────────────────────────────────────────────────

function eventAgeBadge(event: Event | undefined) {
  const restriction = event?.age_restriction ?? 0;
  return toAgeBadge({ age18Plus: restriction >= 18, age21Plus: restriction >= 21 });
}

function toEventDTO(event: Event): EventDTO {
  return {
    echo_id: event.id,
    // Real public_id (Crockford Base32 + checksum) is minted server-side in Phase 2.
    public_id: event.id,
    title: event.title,
    venue_name: event.venue_name,
    starts_at: event.start_time,
    age_badge: eventAgeBadge(event),
    // Social Energy doctrine: label only, never raw counts.
    atmosphere_label: ENERGY_STATE_LABEL[getSocialEnergy(event).state],
  };
}

const INTENT_STATUS_TO_DTO: Record<CheckoutIntentStatus, CheckoutIntentDTO['status']> = {
  requires_payment_method: 'requires_payment',
  requires_confirmation: 'requires_payment',
  processing: 'processing',
  succeeded: 'succeeded',
  canceled: 'canceled',
  expired: 'canceled',
};

function toCheckoutIntentDTO(intent: CheckoutIntent, event: Event | undefined): CheckoutIntentDTO {
  const ageGateRequired = (event?.age_restriction ?? 0) > 0;
  return {
    echo_id: intent.intent_id,
    event_id: intent.event_id,
    status: ageGateRequired && intent.status === 'requires_payment_method'
      ? 'requires_verification'
      : INTENT_STATUS_TO_DTO[intent.status],
    subtotal_cents: intent.pricing.subtotal,
    fees_cents: intent.pricing.fees,
    tax_cents: intent.pricing.tax,
    donation_cents: intent.pricing.donation ?? 0,
    total_cents: intent.pricing.total,
    age_verification_required: ageGateRequired,
  };
}

function toTicketDTOFromDomain(ticket: Ticket): TicketDTO {
  const event = useEventStore.getState().getEventById(ticket.event_id);
  return {
    echo_id: ticket.id,
    event_id: ticket.event_id,
    tier_id: ticket.ticket_type_id,
    status: toTicketStatus(ticket.access_status || ticket.status),
    age_badge: eventAgeBadge(event),
    issued_at: ticket.purchased_at,
  };
}

function toCircleDTO(circle: EchoCircle): CircleDTO {
  const statusMap: Record<EchoCircle['status'], CircleDTO['status']> = {
    created: 'open',
    waiting: 'open',
    action_needed: 'closing_soon',
    complete: 'complete',
    closed: 'expired',
  };
  return {
    echo_id: circle.id,
    event_id: circle.eventId,
    leader_id: circle.organizerId,
    total_seats: circle.totalTickets,
    claimed_seats: deriveCounts(circle).claimed,
    expires_at: circle.expiresAt,
    status: statusMap[circle.status],
  };
}

function toRiskDecisionDTO(decision: RiskDecision, index: number): RiskDecisionDTO {
  return {
    echo_id: `risk_${index + 1}`,
    subject_type: decision.subjectType,
    subject_id: decision.subjectId,
    score: decision.score,
    action: decision.action,
    reasons: decision.reasons,
    created_at: decision.timestamp,
  };
}

// ─── Shared lookups ──────────────────────────────────────────────────────────

async function findEvent(eventId: string): Promise<Event | undefined> {
  const events = await getMergedPublishedEvents();
  return events.find((event) => event.id === eventId)
    ?? useEventStore.getState().getEventById(eventId);
}

function findTicket(ticketId: string): Ticket | undefined {
  return useTicketStore.getState().getTicketById(ticketId);
}

function buildCredentialDTO(ticket: Ticket): CredentialDTO {
  // Exercise the same mock services the wallet uses today; the server-signed
  // rotating credential replaces this in Phase 4 (client never mints tokens).
  const pass = createAccessPass({
    id: `ap_${ticket.id}`,
    attendeeId: ticket.user_id,
    eventId: ticket.event_id,
    tierId: 'general_admission',
    permissions: ['main_entry'],
  });
  const credential = buildSignedCredential({
    credentialId: `cred_${ticket.id}`,
    accessPass: pass,
    type: ticket.nfc_credential ? 'nfc_credential' : 'qr_fallback',
    validationToken: newIdempotencyKey(),
    signature: 'sig_mock',
    expiresAt: new Date(Date.now() + CONFIG.NFC_CREDENTIAL_ROTATE_INTERVAL_MS).toISOString(),
  });
  return {
    ticket_id: ticket.id,
    nfc_credential_id: ticket.nfc_credential,
    qr_payload: ticket.qr_code,
    validation_token: credential.validationToken,
    expires_at: credential.expiresAt ?? new Date(Date.now() + CONFIG.NFC_CREDENTIAL_ROTATE_INTERVAL_MS).toISOString(),
  };
}

// ─── Mock risk feed (admin trust console) ────────────────────────────────────

const MOCK_RISK_FEED: RiskDecision[] = [
  buildRiskDecision({ subjectType: 'checkout', subjectId: 'ci_mock_9001', score: 88, reasons: ['velocity_checkout', 'multi_account_device'], action: scoreToRiskAction(88) }),
  buildRiskDecision({ subjectType: 'user', subjectId: 'usr_mock_3042', score: 55, reasons: ['disposable_email'], action: scoreToRiskAction(55) }),
  buildRiskDecision({ subjectType: 'scanner', subjectId: 'scn_mock_17', score: 12, reasons: [], action: scoreToRiskAction(12) }),
  buildRiskDecision({ subjectType: 'transfer', subjectId: 'tr_mock_208', score: 71, reasons: ['duplicate_nfc_tap'], action: scoreToRiskAction(71) }),
];

// ─── The ports ───────────────────────────────────────────────────────────────

export const mockPorts: EchoPorts = {
  discovery: {
    async listEvents(params) {
      const events = await getMergedPublishedEvents();
      const page = paginate(events, params);
      return ok({ items: page.items.map(toEventDTO), nextCursor: page.nextCursor });
    },

    async getEvent(eventId) {
      const event = await findEvent(eventId);
      if (!event) return notFound<EventDTO>('event', eventId);
      return ok(toEventDTO(event));
    },

    async saveEvent(eventId) {
      const store = useEventStore.getState();
      if (!store.isSaved(eventId)) store.toggleSaved(eventId);
      return ok({ ok: true as const });
    },
  },

  checkout: {
    async createIntent(eventId, _idempotencyKey) {
      const event = await findEvent(eventId);
      if (!event) return notFound<CheckoutIntentDTO>('event', eventId);
      const intent = await checkoutIntentService.createCheckoutIntent({
        event_id: eventId,
        quantity: 1,
        ticket_type_id: event.ticket_types[0]?.id,
        mock_subtotal_dollars: event.ticket_types[0]?.price ?? 0,
      });
      return ok(toCheckoutIntentDTO(intent, event), API_STATUS.created);
    },

    async getIntent(id) {
      const intent = await checkoutIntentService.getCheckoutIntent(id);
      const event = await findEvent(intent.event_id);
      return ok(toCheckoutIntentDTO(intent, event));
    },

    async confirmPayment(intentId, idempotencyKey) {
      const response = await checkoutIntentService.confirmPayment({
        intent_id: intentId,
        payment_method: { type: 'card', token: 'tok_mock_visa' },
        idempotency_key: idempotencyKey,
      });
      const confirmed = response.tickets[0];
      if (response.status !== 'succeeded' || !confirmed) {
        return {
          ok: false,
          status: API_STATUS.badRequest,
          error: {
            code: response.error_code ?? 'payment_failed',
            message: response.error_message ?? 'Payment could not be confirmed.',
          },
        };
      }
      const intent = await checkoutIntentService.getCheckoutIntent(intentId);
      const event = await findEvent(intent.event_id);
      return ok<TicketDTO>({
        echo_id: confirmed.ticket_id,
        event_id: intent.event_id,
        tier_id: event?.ticket_types[0]?.id ?? 'general_admission',
        status: 'active',
        age_badge: eventAgeBadge(event),
        issued_at: new Date().toISOString(),
      }, API_STATUS.created);
    },
  },

  ticket: {
    async getTicket(ticketId) {
      const ticket = findTicket(ticketId);
      if (!ticket) return notFound<TicketDTO>('ticket', ticketId);
      return ok(toTicketDTOFromDomain(ticket));
    },

    async getCredential(ticketId) {
      const ticket = findTicket(ticketId);
      if (!ticket) return notFound<CredentialDTO>('ticket', ticketId);
      return ok(buildCredentialDTO(ticket));
    },

    async refreshCredential(ticketId) {
      const ticket = findTicket(ticketId);
      if (!ticket) return notFound<CredentialDTO>('ticket', ticketId);
      // Each refresh mints a new short-lived token (mock of the 30s rotation).
      return ok(buildCredentialDTO(ticket));
    },
  },

  door: {
    async submitScan(req: DoorScanRequestDTO, _idempotencyKey) {
      const ticket = req.ticket_id ? findTicket(req.ticket_id) : undefined;
      const usable = !!ticket
        && (ticket.access_status || ticket.status) === 'active'
        && ticket.payment_status !== 'refunded';
      const tierId = 'general_admission';
      const zoneAuthorized = canTierAccessZone(tierId, 'main_entry');
      const approved = usable && zoneAuthorized;
      return ok<DoorScanResultDTO>({
        approved,
        ticket_status: ticket ? toTicketStatus(ticket.access_status || ticket.status) : 'revoked',
        verification_state: approved ? 'verified' : 'denied',
        failure_reason: approved ? undefined : (ticket ? 'pass_not_usable' : 'pass_not_found'),
        tier_id: tierId,
        authorized_zones: zoneAuthorized ? ['main_entry'] : [],
      });
    },

    async reconcile(_ledger, _idempotencyKey) {
      // Offline ledgers reconcile to server truth in Phase 5; mock accepts all.
      return ok({ ok: true as const });
    },
  },

  circle: {
    async getCircle(circleId) {
      const circle = useCircleStore.getState().circle;
      if (!circle || circle.id !== circleId) return notFound<CircleDTO>('circle', circleId);
      return ok(toCircleDTO(circle));
    },

    async createCircle(eventId, _idempotencyKey) {
      const event = await findEvent(eventId);
      if (!event) return notFound<CircleDTO>('event', eventId);
      const circle = createFreshCircle({
        circleId: `cir_${Date.now()}`,
        eventId: event.id,
        eventTitle: event.title,
        eventDate: formatDate(event.start_time),
        eventTime: formatTime(event.start_time),
        eventVenue: event.venue_name,
        eventImageUrl: event.image_url,
        eventStartISO: event.start_time,
        totalTickets: CONFIG.CIRCLE_MIN_TICKETS,
        pricePerTicket: event.ticket_types[0]?.price ?? 0,
      });
      useCircleStore.getState().createCircle(circle);
      return ok(toCircleDTO(circle), API_STATUS.created);
    },

    async pay(circleId, _idempotencyKey) {
      const store = useCircleStore.getState();
      const circle = store.circle;
      if (!circle || circle.id !== circleId) return notFound<{ ok: true }>('circle', circleId);
      const claimable = circle.members.find(
        (member) => member.status === 'invited' || member.status === 'pending' || member.status === 'open',
      );
      if (claimable) store.claimSpot(claimable.id);
      return ok({ ok: true as const });
    },
  },

  trust: {
    async listRiskDecisions(params) {
      const page = paginate(MOCK_RISK_FEED, params);
      return ok({
        items: page.items.map((decision, i) => toRiskDecisionDTO(decision, i)),
        nextCursor: page.nextCursor,
      });
    },
  },
};
