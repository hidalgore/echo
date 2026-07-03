/**
 * services/api/httpAdapters.ts
 * ════════════════════════════
 * Http port adapters — the live side of the bindPorts seam, riding apiCall
 * (bearer, envelope, 429/5xx retry, refresh-on-401 all live there). Ports are
 * DTO-typed at the boundary; domain mapping happens in the callers via
 * services/api/mappers.
 *
 * Phase 2 lands the first one (DiscoveryPort / S-03). Later phases add their
 * domain here and extend the binding in app/_layout.tsx — mock stays the
 * default for every unswapped domain.
 */

import type { Paged } from '../../types/api/shared';
import type { EventDTO, EventInventoryDTO } from '../../types/api/dto';
import type { DiscoveryPort } from './ports';
import { apiCall } from './apiClient';

export const httpDiscoveryPort: DiscoveryPort = {
  listEvents: (params) =>
    apiCall<Paged<EventDTO>>('events', {
      query: { cursor: params.cursor, limit: params.limit, city: params.city },
    }),

  getEvent: (eventId) => apiCall<EventDTO>('eventDetails', { params: { eventId } }),

  getInventory: (eventId) => apiCall<EventInventoryDTO>('eventInventory', { params: { eventId } }),

  saveEvent: (eventId) => apiCall<{ ok: true }>('saveEvent', { body: { event_id: eventId } }),

  unsaveEvent: (eventId) => apiCall<{ ok: true }>('unsaveEvent', { params: { eventId } }),

  listSavedEvents: (params) =>
    apiCall<Paged<EventDTO>>('savedEvents', {
      query: { cursor: params.cursor, limit: params.limit },
    }),
};
