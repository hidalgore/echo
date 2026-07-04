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
  CheckoutIntentDTO, CircleDTO, ConfirmPaymentResponseDTO, CredentialDTO,
  DonationCampaignDTO, DoorOfflineBundleDTO, DoorReconcileResultDTO,
  DoorScanRequestDTO, DoorScanResultDTO, DoorSessionDTO, EventDTO,
  EventInventoryDTO, RiskDecisionDTO, TicketDTO, TicketTierDTO,
} from '../../types/api/dto';
import type { EchoPorts } from './ports';
import { toAgeBadge, toTicketStatus } from './mappers';

import { CONFIG } from '../../constants/config';
import type { Event, Ticket } from '../../types';
import type { NonprofitDonationCampaign } from '../../types/nonprofitDonation';
import { computeDonationProcessingFee } from '../donationCampaignService';
import type { EchoCircle } from '../../types/circle';
import { ENERGY_STATE_LABEL } from '../../types/socialEnergy';
import { getSocialEnergy } from '../socialEnergyService';
import { getMergedPublishedEvents } from '../eventRepository';
import {
  checkoutIntentService,
  type CheckoutIntent,
  type CheckoutIntentStatus,
} from '../checkoutIntentService';
import { canTierAccessZone } from '../accessControlService';
import { createFreshCircle } from '../circleMock';
import { deriveCounts } from '../circleStateModel';
import { buildRiskDecision, scoreToRiskAction, type RiskDecision } from '../botRiskService';
import { newIdempotencyKey } from './apiClient';
import { useEventStore } from '../../stores/eventStore';
import { useTicketStore } from '../../stores/ticketStore';
import { useCircleStore } from '../../stores/circleStore';
import { useHostProfileStore } from '../../stores/hostProfileStore';
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

function toTicketTierDTO(tier: Event['ticket_types'][number]): TicketTierDTO {
  return {
    echo_id: tier.id,
    name: tier.name,
    description: tier.description ?? '',
    // Domain prices are dollars; the wire is cents (locked rule).
    price_cents: Math.round(tier.price * 100),
    available: tier.available,
  };
}

function toDonationCampaignDTO(campaign: NonprofitDonationCampaign): DonationCampaignDTO {
  return {
    echo_id: campaign.id,
    nonprofit_name: campaign.nonprofitName,
    cause_title: campaign.causeTitle,
    cause_description: campaign.causeDescription,
    // Domain amounts are dollars; the wire is cents (locked rule).
    goal_cents: Math.round(campaign.goalAmount * 100),
    raised_cents: Math.round(campaign.raisedAmount * 100),
    donor_count: campaign.donorCount,
    suggested_amounts_cents: campaign.suggestedAmounts.map((amount) => Math.round(amount * 100)),
    // Derived progress states are display logic; the wire stores active|closed.
    status: campaign.status === 'closed' ? 'closed' : 'active',
  };
}

function toEventDTO(event: Event): EventDTO {
  const energy = getSocialEnergy(event);
  return {
    echo_id: event.id,
    // Real public_id (Crockford Base32 + checksum) is minted server-side in Phase 2.
    public_id: event.id,
    title: event.title,
    description: event.description,
    category: event.category,
    // The wire never serves drafts; a mock draft reads as announced.
    status: event.status && event.status !== 'draft' ? event.status : 'scheduled',
    venue_name: event.venue_name,
    venue_address: event.venue_address,
    starts_at: event.start_time,
    ends_at: event.end_time,
    image_url: event.image_url ?? '',
    is_featured: event.is_featured ?? false,
    host_name: event.host_name ?? '',
    host_verified: event.host_verified ?? false,
    age_badge: eventAgeBadge(event),
    // Social Energy doctrine: label + 0..1 intensity only, never raw counts.
    atmosphere_label: ENERGY_STATE_LABEL[energy.state],
    atmosphere_intensity: energy.intensity,
    tiers: event.ticket_types.map(toTicketTierDTO),
    donation_campaign: event.donation_campaign
      ? toDonationCampaignDTO(event.donation_campaign)
      : null,
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

function toCheckoutIntentDTO(
  intent: CheckoutIntent,
  event: Event | undefined,
  tierId?: string,
): CheckoutIntentDTO {
  const ageGateRequired = (event?.age_restriction ?? 0) > 0;
  const donationCents = intent.pricing.donation ?? 0;
  const donationFeeCents = donationCents > 0
    ? Math.round(computeDonationProcessingFee(donationCents / 100) * 100)
    : 0;
  return {
    echo_id: intent.intent_id,
    event_id: intent.event_id,
    tier_id: tierId ?? event?.ticket_types[0]?.id ?? '',
    quantity: intent.quantity,
    status: ageGateRequired && intent.status === 'requires_payment_method'
      ? 'requires_verification'
      : INTENT_STATUS_TO_DTO[intent.status],
    currency: intent.currency,
    subtotal_cents: intent.pricing.subtotal,
    fees_cents: intent.pricing.fees,
    tax_cents: intent.pricing.tax,
    donation_cents: donationCents,
    donation_fee_cents: donationFeeCents,
    total_cents: intent.pricing.total + donationFeeCents,
    age_verification_required: ageGateRequired,
    expires_at: intent.expires_at,
  };
}

function toTicketDTOFromDomain(ticket: Ticket): TicketDTO {
  const event = useEventStore.getState().getEventById(ticket.event_id);
  return {
    echo_id: ticket.id,
    event_id: ticket.event_id,
    tier_id: ticket.ticket_type_id,
    // Mock purchases keep one local record per purchase, so the record id
    // doubles as the intent linkage (Phase 4 amendment field).
    intent_id: ticket.id,
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

// Door sessions are provisioned server-side (Phase 5 management command);
// the mock materializes any requested id as a live main-entry session so the
// local-first door screen (which mints its own session ids) keeps working.
const mockDoorSessions = new Map<string, DoorSessionDTO>();

function mockDoorSession(sessionId: string): DoorSessionDTO {
  let session = mockDoorSessions.get(sessionId);
  if (!session) {
    session = {
      session_id: sessionId,
      event_id: '',
      label: 'Mock door',
      zone: 'main_entry',
      status: 'active',
      expires_at: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
      passcode_locked_until: null,
    };
    mockDoorSessions.set(sessionId, session);
  }
  return session;
}

function buildCredentialDTO(ticket: Ticket): CredentialDTO {
  // The mock plays the SERVER here: it fabricates a fresh short-lived
  // credential per call, mirroring the Phase 4 rotation contract. The old
  // accessPassService struct-assembly is gone with the service — the client
  // never mints tokens (locked rule); only this mock server-stand-in does.
  return {
    ticket_id: ticket.id,
    nfc_credential_id: ticket.nfc_credential ?? `nfc_mock_${ticket.id}`,
    qr_payload: `ECHO1.mock.${newIdempotencyKey()}`,
    validation_token: newIdempotencyKey(),
    expires_at: new Date(Date.now() + CONFIG.NFC_CREDENTIAL_ROTATE_INTERVAL_MS).toISOString(),
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

    async getInventory(eventId) {
      const event = await findEvent(eventId);
      if (!event) return notFound<EventInventoryDTO>('event', eventId);
      return ok({ event_id: event.id, tiers: event.ticket_types.map(toTicketTierDTO) });
    },

    async saveEvent(eventId) {
      const store = useEventStore.getState();
      if (!store.isSaved(eventId)) store.toggleSaved(eventId);
      return ok({ ok: true as const });
    },

    async unsaveEvent(eventId) {
      const store = useEventStore.getState();
      if (store.isSaved(eventId)) store.toggleSaved(eventId);
      return ok({ ok: true as const });
    },

    async listSavedEvents(params) {
      const page = paginate(useEventStore.getState().getSavedEvents(), params);
      return ok({ items: page.items.map(toEventDTO), nextCursor: page.nextCursor });
    },
  },

  checkout: {
    async createIntent(request, _idempotencyKey) {
      const event = await findEvent(request.event_id);
      if (!event) return notFound<CheckoutIntentDTO>('event', request.event_id);
      const tier = event.ticket_types.find((t) => t.id === request.ticket_type_id)
        ?? event.ticket_types[0];
      const intent = await checkoutIntentService.createCheckoutIntent({
        event_id: request.event_id,
        quantity: request.quantity,
        ticket_type_id: tier?.id,
        donation_cents: request.donation_cents,
        mock_subtotal_dollars: (tier?.price ?? 0) * request.quantity,
      });
      return ok(toCheckoutIntentDTO(intent, event, tier?.id), API_STATUS.created);
    },

    async getIntent(id) {
      const intent = await checkoutIntentService.getCheckoutIntent(id);
      const event = await findEvent(intent.event_id);
      return ok(toCheckoutIntentDTO(intent, event));
    },

    async confirmPayment(intentId, paymentMethod, idempotencyKey) {
      const response = await checkoutIntentService.confirmPayment({
        intent_id: intentId,
        payment_method: paymentMethod,
        idempotency_key: idempotencyKey,
      });
      if (response.status !== 'succeeded' || response.tickets.length === 0) {
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
      const issuedAt = new Date().toISOString();
      const tickets: TicketDTO[] = response.tickets.map((ticket) => ({
        echo_id: ticket.ticket_id,
        event_id: intent.event_id,
        tier_id: event?.ticket_types[0]?.id ?? 'general_admission',
        intent_id: intentId,
        status: 'active',
        age_badge: eventAgeBadge(event),
        issued_at: issuedAt,
      }));
      return ok<ConfirmPaymentResponseDTO>({ status: 'succeeded', tickets }, API_STATUS.created);
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

    async listWallet(params) {
      // Per-admission rows server-side; the mock store already holds one
      // record per purchase, so rows come back pre-grouped here.
      const page = paginate(useTicketStore.getState().tickets, params);
      return ok({ items: page.items.map(toTicketDTOFromDomain), nextCursor: page.nextCursor });
    },
  },

  door: {
    async getSession(sessionId) {
      return ok(mockDoorSession(sessionId));
    },

    async pauseSession(sessionId) {
      const session = mockDoorSession(sessionId);
      if (session.status !== 'closed') session.status = 'paused';
      return ok({ ...session });
    },

    async resumeSession(sessionId, passcode) {
      // Mirrors the server semantics: resume is passcode-gated. The mock
      // validates against the host's locally-stored Door Mode passcode.
      const session = mockDoorSession(sessionId);
      if (!useHostProfileStore.getState().verifyDoorModePasscode(passcode)) {
        return {
          ok: false,
          status: 403,
          error: { code: 'door_passcode_invalid', message: 'Incorrect passcode.' },
        };
      }
      if (session.status !== 'closed') session.status = 'active';
      return ok({ ...session });
    },

    async getOfflineBundle(sessionId) {
      const session = mockDoorSession(sessionId);
      const tickets = useTicketStore.getState().tickets
        .filter((ticket) => !session.event_id || ticket.event_id === session.event_id);
      const event = useEventStore.getState().getEventById(session.event_id);
      return ok<DoorOfflineBundleDTO>({
        format_version: 1,
        generated_at: new Date().toISOString(),
        session_id: session.session_id,
        event_id: session.event_id,
        zone: session.zone,
        signing_public_key_pem: '-----BEGIN PUBLIC KEY-----\nmock\n-----END PUBLIC KEY-----\n',
        qr_payload_prefix: 'ECHO1.',
        scan_leeway_seconds: 10,
        duplicate_window_seconds: 300,
        relaxations: ['rotating_nonce_freshness'],
        admissions: tickets.map((ticket) => ({
          ticket_id: ticket.id,
          nfc_credential_id: ticket.nfc_credential ?? null,
          status: toTicketStatus(ticket.access_status || ticket.status),
          tier_id: 'general_admission',
          age_badge: eventAgeBadge(event),
          authorized_zones: ['main_entry'],
        })),
      });
    },

    async submitScan(req: DoorScanRequestDTO, _idempotencyKey) {
      const ticket = req.ticket_id ? findTicket(req.ticket_id) : undefined;
      const event = ticket ? useEventStore.getState().getEventById(ticket.event_id) : undefined;
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
        age_badge: eventAgeBadge(event),
      });
    },

    async reconcile(ledger, _idempotencyKey) {
      // Offline ledgers reconcile to server truth in Phase 5; mock accepts all.
      return ok<DoorReconcileResultDTO>({
        ok: true,
        received: ledger.length,
        merged: ledger.length,
        replayed: 0,
        conflicts: 0,
        rejected: 0,
        results: ledger.map((entry) => ({
          scanned_at: entry.scanned_at,
          merged: true,
          approved: true,
          verification_state: 'verified',
        })),
      });
    },

    // Door purchases ride the same engine as user checkout — in the mock
    // exactly as on the server (locked rule: never a second checkout path).
    async createPurchaseIntent({ session_id: _session, ...request }, idempotencyKey) {
      return mockPorts.checkout.createIntent(request, idempotencyKey);
    },

    async confirmPurchase(request, idempotencyKey) {
      return mockPorts.checkout.confirmPayment(
        request.intent_id, request.payment_method, idempotencyKey,
      );
    },

    async getPurchaseIntent(intentId) {
      return mockPorts.checkout.getIntent(intentId);
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
