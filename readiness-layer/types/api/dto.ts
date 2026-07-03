/**
 * types/api/dto.ts
 * ════════════════
 * Wire DTOs (decision 2A) — transport shapes distinct from domain types.
 * Aligned to the locked shared enums. Mappers in services/api/mappers.ts
 * translate between these and the package's domain models.
 */

import type { EchoId, PublicId, TicketStatusDTO, AgeBadgeDTO } from './shared';

export type EventDTO = {
  echo_id: EchoId;
  public_id: PublicId;
  title: string;
  venue_name: string;
  starts_at: string; // ISO
  age_badge: AgeBadgeDTO;
  // Social Energy doctrine: never expose raw counts; public floor only.
  atmosphere_label: string;
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
