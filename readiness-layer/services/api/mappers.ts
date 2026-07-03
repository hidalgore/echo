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
import type { TicketDTO } from '../../types/api/dto';

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
      return 'checked_in';
    case 'expired':
      return 'expired';
    case 'revoked':
    case 'suspended':
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
