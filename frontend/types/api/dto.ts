/**
 * types/api/dto.ts
 * ════════════════
 * Wire DTOs (decision 2A) — transport shapes distinct from domain types.
 * Aligned to the locked shared enums. Mappers in services/api/mappers.ts
 * translate between these and the package's domain models.
 */

import type { EchoId, PublicId, TicketStatusDTO, AgeBadgeDTO } from './shared';

// ─── S-01 / S-02 identity (Phase 1) ──────────────────────────────────────────

/** GET /v1/me and the `user` member of session responses. */
export type MeDTO = {
  echo_id: EchoId;
  public_id: PublicId;
  email: string | null;
  name: string;
  phone: string;
  avatar_url: string;
  flags: Record<string, boolean | number | string>;
  created_at: string; // ISO
};

/** Device descriptor sent with every session-issuing call. */
export type DeviceInDTO = {
  install_id: string;
  platform: 'ios' | 'android' | 'web';
  os_version?: string;
  model?: string;
  app_version?: string;
};

/** Response of /v1/auth/apple|google|refresh and /v1/sessions/guest. */
export type SessionDTO = {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number;
  refresh_token: string;
  user: MeDTO | null; // null for guest sessions
  is_new_user?: boolean; // login endpoints only
};

// ─── S-03 events / discovery (Phase 2) ───────────────────────────────────────
// ── Phase 2 AMENDMENT (flagged, needs registry lock sign-off) ────────────────
// v1.0 locked EventDTO at 7 fields; the locked discovery/detail UI renders
// description, category, image, venue address, end time, host identity,
// status, and per-tier name/price/availability (the tier picker). The
// DiscoveryPort swap is unimplementable against the 7-field shape, so it is
// extended here — same mechanism as the Phase 1 auth refresh/logout amendment.
// Social Energy doctrine held: label + 0..1 intensity only; capacity and sold
// counts are never wired.

/** Publish lifecycle as served. `draft` exists server-side but is never served. */
export type EventStatusDTO = 'scheduled' | 'on_sale' | 'live' | 'ended';

// ── Phase 3 AMENDMENT (flagged, needs registry lock sign-off) ────────────────
// Donation campaigns ride the event payload: the checkout/nonprofit UI renders
// campaign progress BEFORE any intent exists (DonationCard), so serving them
// through the intent is unimplementable. Progress only — donor identities are
// never wired. Stored statuses only; goal_reached/goal_exceeded are client
// display logic derived from the amounts.

export type DonationCampaignDTO = {
  echo_id: EchoId;
  nonprofit_name: string;
  cause_title: string;
  cause_description: string;
  goal_cents: number;
  raised_cents: number;
  donor_count: number;
  suggested_amounts_cents: number[];
  status: 'active' | 'closed';
};

export type TicketTierDTO = {
  echo_id: EchoId;
  name: string;
  description: string;
  price_cents: number;
  /**
   * Tickets still purchasable — exact remaining count (the locked tier picker
   * renders "N remaining"). Tier capacity and sold totals are never exposed.
   */
  available: number;
};

export type EventDTO = {
  echo_id: EchoId;
  public_id: PublicId;
  title: string;
  description: string;
  category: string;
  status: EventStatusDTO;
  venue_name: string;
  venue_address: string;
  starts_at: string; // ISO
  ends_at: string; // ISO
  image_url: string;
  is_featured: boolean;
  host_name: string;
  host_verified: boolean;
  age_badge: AgeBadgeDTO;
  // Social Energy doctrine: never expose raw counts; label + intensity only.
  atmosphere_label: string;
  /** 0..1 — drives glow/waveform amplitude. Never displayed as a number. */
  atmosphere_intensity: number;
  tiers: TicketTierDTO[];
  /** Phase 3 amendment: null for events without a campaign. */
  donation_campaign: DonationCampaignDTO | null;
};

/** GET /v1/events/:eventId/inventory — fresh availability for the tier picker. */
export type EventInventoryDTO = {
  event_id: EchoId;
  tiers: TicketTierDTO[];
};

// ── Phase 4 AMENDMENT (flagged, needs registry lock sign-off) ────────────────
// TicketDTO gains `intent_id`. GET /v1/wallet serves one row per admission
// (server truth — door scans validate individuals) while the locked wallet UI
// renders one card per *purchase*; intent linkage is what lets the client
// group per-admission rows back into purchase cards when hydrating across
// installs. Served by both /v1/wallet and the S-05 confirm response (one
// serializer, one shape).

export type TicketDTO = {
  echo_id: EchoId;
  event_id: EchoId;
  tier_id: string;
  /** Phase 4 amendment: the purchase (checkout intent) this admission belongs to. */
  intent_id: EchoId;
  status: TicketStatusDTO;
  age_badge: AgeBadgeDTO;
  issued_at: string;
};

/** Rotating credential (NFC primary, QR fallback) — short-lived, signed. */
export type CredentialDTO = {
  ticket_id: EchoId;
  nfc_credential_id?: string;
  qr_payload?: string;
  /** Server-signed token; client never mints these */
  validation_token: string;
  expires_at: string;
};

// ── Phase 3 AMENDMENT (flagged, needs registry lock sign-off) ────────────────
// CheckoutIntentDTO reconciled with the pre-ports locked S-05 intent shape
// (services/checkoutIntentService.ts): tier_id/quantity/currency/expires_at
// existed there and the checkout UI needs them (TTL countdown, per-tier
// rows); donation_fee_cents keeps the wire rows summing to total_cents (the
// donation carries its own processing fee — locked fee model). The request
// shapes below are the same locked client contract, wired for apiCall.

export type CreateCheckoutIntentRequestDTO = {
  event_id: EchoId;
  /** Omitted -> the event's first tier (matches the locked mock behavior). */
  ticket_type_id?: string;
  quantity: number;
  donation_cents?: number;
  currency?: 'USD';
  client_context?: { platform: 'web' | 'ios' | 'android'; locale: string };
};

export type PaymentMethodDTO = {
  type: 'card' | 'apple_pay' | 'google_pay';
  /** Stripe PaymentMethod id minted by the client SDK; server confirms. */
  token: string;
};

export type CheckoutIntentDTO = {
  echo_id: EchoId;
  event_id: EchoId;
  tier_id: string;
  quantity: number;
  status: 'requires_payment' | 'processing' | 'succeeded' | 'canceled' | 'requires_verification';
  currency: 'USD';
  subtotal_cents: number;
  fees_cents: number;
  tax_cents: number;
  donation_cents: number;
  donation_fee_cents: number;
  total_cents: number;
  /** Set when age verification must complete before payment (locked gate) */
  age_verification_required: boolean;
  /** Inventory-hold TTL; the hold releases server-side after this. */
  expires_at: string;
};

// ── Phase 3 AMENDMENT (flagged, needs registry lock sign-off) ────────────────
// v1.0 typed confirmPayment as a single TicketDTO; quantity>1 purchases are
// real (the locked "pay for all" flow) and the pre-ports locked S-05 confirm
// response already returned tickets[]. One row per admission — door scans
// (Phase 5) validate individuals.

export type ConfirmPaymentResponseDTO = {
  status: 'succeeded';
  tickets: TicketDTO[];
};

export type DoorScanRequestDTO = {
  session_id: EchoId;
  ticket_id?: EchoId;
  nfc_credential_id?: string;
  qr_payload?: string;
  scanned_at: string;
  /** Offline scans carry this; reconciled server-side to final truth */
  offline: boolean;
};

export type DoorScanResultDTO = {
  approved: boolean;
  ticket_status: TicketStatusDTO;
  verification_state: string; // maps to DoorVerificationState
  failure_reason?: string;
  tier_id: string;
  authorized_zones: string[];
};

export type CircleDTO = {
  echo_id: EchoId;
  event_id: EchoId;
  leader_id: EchoId;
  total_seats: number;
  claimed_seats: number;
  expires_at: string;
  status: 'open' | 'closing_soon' | 'expired' | 'complete';
};

export type RiskDecisionDTO = {
  echo_id: EchoId;
  subject_type: string;
  subject_id: string;
  score: number;
  action: string;
  reasons: string[];
  created_at: string;
};
