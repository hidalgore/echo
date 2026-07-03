/**
 * services/api/mappers.ts
 * ═══════════════════════
 * Domain ↔ wire DTO mappers (decision 2A/3A). The wire enums are the locked
 * truth; these functions reconcile the package's domain shapes to them.
 *
 * Status reconciliation (locked Ticket Status: active | checked_in | expired |
 * revoked | transferred):
 *   - AccessPass.status 'issued'/'valid'  → 'active'
 *   - 'validated'/'checked_in'            → 'checked_in'
 *   - 'expired'                           → 'expired'
 *   - 'revoked'/'suspended'               → 'revoked'
 *   - 'transferred'                       → 'transferred'
 */

import type { AgeBadgeDTO, TicketStatusDTO } from '../../types/api/shared';
import type { DonationCampaignDTO, EventDTO, TicketDTO, TicketTierDTO } from '../../types/api/dto';
import type { Event, TicketType } from '../../types';
import type { NonprofitDonationCampaign } from '../../types/nonprofitDonation';

// ─── Age badge (locked single source of truth) ───────────────────────────────

/** Domain age requirement → locked Age Badge. */
export function toAgeBadge(input: { age18Plus?: boolean; age21Plus?: boolean }): AgeBadgeDTO {
  if (input.age21Plus) return '21_plus';
  if (input.age18Plus) return '18_plus';
  return 'none';
}

export function fromAgeBadge(badge: AgeBadgeDTO): { age18Plus: boolean; age21Plus: boolean } {
  return { age18Plus: badge !== 'none', age21Plus: badge === '21_plus' };
}

// ─── Ticket status (locked) ──────────────────────────────────────────────────

/** Domain pass/credential status → locked TicketStatusDTO. */
export function toTicketStatus(domainStatus: string): TicketStatusDTO {
  switch (domainStatus) {
    case 'issued':
    case 'valid':
    case 'active':
      return 'active';
    case 'validated':
    case 'checked_in':
    case 'used':
      return 'checked_in';
    case 'expired':
      return 'expired';
    case 'revoked':
    case 'suspended':
    case 'refunded':
      return 'revoked';
    case 'transferred':
      return 'transferred';
    default:
      return 'active';
  }
}

// ─── Ticket DTO assembly ─────────────────────────────────────────────────────

export function toTicketDTO(domain: {
  echoId: string; eventId: string; tierId: string; status: string;
  age18Plus?: boolean; age21Plus?: boolean; issuedAt: string;
}): TicketDTO {
  return {
    echo_id: domain.echoId,
    event_id: domain.eventId,
    tier_id: domain.tierId,
    status: toTicketStatus(domain.status),
    age_badge: toAgeBadge({ age18Plus: domain.age18Plus, age21Plus: domain.age21Plus }),
    issued_at: domain.issuedAt,
  };
}

// ─── Event DTO → domain (Phase 2 / W4 discovery swap) ────────────────────────

export function fromTicketTierDTO(tier: TicketTierDTO): TicketType {
  return {
    id: tier.echo_id,
    name: tier.name,
    // Domain prices are dollars; the wire is cents (locked rule).
    price: tier.price_cents / 100,
    available: tier.available,
    description: tier.description || undefined,
  };
}

/** Phase 3: wire campaign (cents, stored statuses) → domain campaign
 *  (dollars). Host-config booleans the wire deliberately omits get the
 *  corpus defaults; derived progress statuses are computed by
 *  donationCampaignService at render time. */
export function fromDonationCampaignDTO(dto: DonationCampaignDTO): NonprofitDonationCampaign {
  return {
    id: dto.echo_id,
    nonprofitName: dto.nonprofit_name,
    causeTitle: dto.cause_title,
    causeDescription: dto.cause_description,
    goalAmount: dto.goal_cents / 100,
    raisedAmount: dto.raised_cents / 100,
    donorCount: dto.donor_count,
    suggestedAmounts: dto.suggested_amounts_cents.map((cents) => cents / 100),
    publicPageEnabled: true,
    allowPublicNameOptIn: true,
    closesAtEventCloseout: true,
    status: dto.status,
  };
}

/**
 * Wire event → domain Event for the discovery surfaces. Fields the S-03 wire
 * does not carry stay client defaults until their owning phase lands:
 * detail_media_* (Phase 7 host uploads), refund/transfer policy flags
 * (Phase 8 transfers; refund snapshots are server-side). Social Energy
 * display keeps deriving client-side from the same event signals (the served
 * label + intensity are the doctrine contract, not yet a rendered input).
 */
export function fromEventDTO(dto: EventDTO): Event {
  const age = fromAgeBadge(dto.age_badge);
  return {
    id: dto.echo_id,
    title: dto.title,
    description: dto.description,
    venue_name: dto.venue_name,
    venue_address: dto.venue_address,
    start_time: dto.starts_at,
    end_time: dto.ends_at,
    image_url: dto.image_url || undefined,
    category: dto.category,
    is_featured: dto.is_featured,
    host_name: dto.host_name || undefined,
    host_verified: dto.host_verified,
    ticket_types: dto.tiers.map(fromTicketTierDTO),
    status: dto.status,
    age_restriction: age.age21Plus ? 21 : age.age18Plus ? 18 : null,
    donation_campaign: dto.donation_campaign
      ? fromDonationCampaignDTO(dto.donation_campaign)
      : null,
  };
}
