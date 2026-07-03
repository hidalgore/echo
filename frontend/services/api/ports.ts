/**
 * services/api/ports.ts
 * ═════════════════════
 * Service "ports" (decision 1B folded into 1A). Each port is the interface a
 * screen depends on; the app binds either a mock adapter (today) or an http
 * adapter (apiClient-backed) at startup. This is the v55 "SWAP-POINT" seam made
 * explicit: mock → real is a one-line binding change, no screen edits.
 *
 * Ports are intentionally thin and DTO-typed at the boundary.
 */

import type { ApiResult, Paged, PageParams } from '../../types/api/shared';
import type {
  EventDTO, EventInventoryDTO, TicketDTO, CredentialDTO, CheckoutIntentDTO,
  DoorScanRequestDTO, DoorScanResultDTO, CircleDTO, RiskDecisionDTO,
} from '../../types/api/dto';

export type DiscoveryPort = {
  listEvents(params: PageParams & { city?: string }): Promise<ApiResult<Paged<EventDTO>>>;
  getEvent(eventId: string): Promise<ApiResult<EventDTO>>;
  /** Fresh per-tier availability for the tier picker (S-03 eventInventory). */
  getInventory(eventId: string): Promise<ApiResult<EventInventoryDTO>>;
  saveEvent(eventId: string): Promise<ApiResult<{ ok: true }>>;
  unsaveEvent(eventId: string): Promise<ApiResult<{ ok: true }>>;
  /** Phase 2 registry amendment (flagged in endpoints.ts). */
  listSavedEvents(params: PageParams): Promise<ApiResult<Paged<EventDTO>>>;
};

export type CheckoutPort = {
  createIntent(eventId: string, idempotencyKey: string): Promise<ApiResult<CheckoutIntentDTO>>;
  getIntent(id: string): Promise<ApiResult<CheckoutIntentDTO>>;
  confirmPayment(intentId: string, idempotencyKey: string): Promise<ApiResult<TicketDTO>>;
};

export type TicketPort = {
  getTicket(ticketId: string): Promise<ApiResult<TicketDTO>>;
  getCredential(ticketId: string): Promise<ApiResult<CredentialDTO>>;
  refreshCredential(ticketId: string): Promise<ApiResult<CredentialDTO>>;
};

export type DoorPort = {
  submitScan(req: DoorScanRequestDTO, idempotencyKey: string): Promise<ApiResult<DoorScanResultDTO>>;
  reconcile(ledger: DoorScanRequestDTO[], idempotencyKey: string): Promise<ApiResult<{ ok: true }>>;
};

export type CirclePort = {
  getCircle(circleId: string): Promise<ApiResult<CircleDTO>>;
  createCircle(eventId: string, idempotencyKey: string): Promise<ApiResult<CircleDTO>>;
  pay(circleId: string, idempotencyKey: string): Promise<ApiResult<{ ok: true }>>;
};

export type TrustPort = {
  /** Admin risk queue feed (admin-scoped). */
  listRiskDecisions(params: PageParams): Promise<ApiResult<Paged<RiskDecisionDTO>>>;
};

/** Central registry the app binds at startup (mock or http adapters). */
export type EchoPorts = {
  discovery: DiscoveryPort;
  checkout: CheckoutPort;
  ticket: TicketPort;
  door: DoorPort;
  circle: CirclePort;
  trust: TrustPort;
};

let bound: EchoPorts | null = null;

export function bindPorts(ports: EchoPorts): void { bound = ports; }

export function getPorts(): EchoPorts {
  if (!bound) throw new Error('ECHO ports not bound. Call bindPorts(mockPorts) or bindPorts(httpPorts) at startup.');
  return bound;
}
