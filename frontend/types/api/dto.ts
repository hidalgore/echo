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
};

/** GET /v1/events/:eventId/inventory — fresh availability for the tier picker. */
export type EventInventoryDTO = {
  event_id: EchoId;
  tiers: TicketTierDTO[];
};

export type TicketDTO = {
  echo_id: EchoId;
  event_id: EchoId;
  tier_id: string;
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

export type CheckoutIntentDTO = {
  echo_id: EchoId;
  event_id: EchoId;
  status: 'requires_payment' | 'processing' | 'succeeded' | 'canceled' | 'requires_verification';
  subtotal_cents: number;
  fees_cents: number;
  tax_cents: number;
  donation_cents: number;
  total_cents: number;
  /** Set when age verification must complete before payment (locked gate) */
  age_verification_required: boolean;
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
