/**
 * types/api/endpoints.ts
 * ══════════════════════
 * Typed registry of the LOCKED /v1 endpoints. One source of truth for paths +
 * methods + which mutations require an idempotency key. Path params are built
 * with the helpers so callers never hand-format URLs.
 */

export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

export type EndpointDef = {
  method: HttpMethod;
  path: string;
  /** Requires Idempotency-Key header (payments/transfers/refunds/scans). */
  idempotent?: boolean;
  /** Required auth scope (maps to RBAC where host/admin gated). */
  scope?: 'public' | 'guest' | 'user' | 'host' | 'door' | 'admin';
};

export const ENDPOINTS = {
  // S-01 auth / session
  authApple: { method: 'POST', path: '/v1/auth/apple', scope: 'public' },
  authGoogle: { method: 'POST', path: '/v1/auth/google', scope: 'public' },
  guestSession: { method: 'POST', path: '/v1/sessions/guest', scope: 'public' },
  publicConfig: { method: 'GET', path: '/v1/config/public', scope: 'public' },

  // S-02 me / FTUE / verification
  meFlags: { method: 'POST', path: '/v1/me/flags', scope: 'user' },
  me: { method: 'GET', path: '/v1/me', scope: 'user' },
  meUpdate: { method: 'PATCH', path: '/v1/me', scope: 'user' },
  verificationStart: { method: 'POST', path: '/v1/me/verification/start', scope: 'user' },
  verificationStatus: { method: 'GET', path: '/v1/me/verification/status', scope: 'user' },

  // S-03 discover
  events: { method: 'GET', path: '/v1/events', scope: 'public' },
  eventDetails: { method: 'GET', path: '/v1/events/:eventId', scope: 'public' },
  eventInventory: { method: 'GET', path: '/v1/events/:eventId/inventory', scope: 'public' },
  saveEvent: { method: 'POST', path: '/v1/saved-events', scope: 'user' },
  unsaveEvent: { method: 'DELETE', path: '/v1/saved-events/:eventId', scope: 'user' },

  // checkout / payments (idempotent)
  createCheckoutIntent: { method: 'POST', path: '/v1/checkout/intents', idempotent: true, scope: 'user' },
  checkoutIntent: { method: 'GET', path: '/v1/checkout/intents/:id', scope: 'user' },
  confirmPayment: { method: 'POST', path: '/v1/payments/confirm', idempotent: true, scope: 'user' },

  // tickets / credentials
  ticket: { method: 'GET', path: '/v1/tickets/:ticketId', scope: 'user' },
  ticketStatus: { method: 'GET', path: '/v1/tickets/:ticketId/status', scope: 'user' },
  ticketCredential: { method: 'GET', path: '/v1/tickets/:ticketId/credential', scope: 'user' },
  ticketRefresh: { method: 'POST', path: '/v1/tickets/:ticketId/refresh', scope: 'user' },
  ticketAppleWallet: { method: 'POST', path: '/v1/tickets/:ticketId/apple-wallet', scope: 'user' },
  wallet: { method: 'GET', path: '/v1/wallet', scope: 'user' },

  // circles
  createCircle: { method: 'POST', path: '/v1/circles', idempotent: true, scope: 'user' },
  circle: { method: 'GET', path: '/v1/circles/:circleId', scope: 'user' },
  circleInvites: { method: 'POST', path: '/v1/circles/:circleId/invites', scope: 'user' },
  circleJoin: { method: 'POST', path: '/v1/circles/:circleId/join', scope: 'user' },
  circlePayments: { method: 'POST', path: '/v1/circles/:circleId/payments', idempotent: true, scope: 'user' },
  circleReplace: { method: 'POST', path: '/v1/circles/:circleId/replace', scope: 'user' },

  // door mode
  doorSession: { method: 'GET', path: '/v1/door/sessions/:sessionId', scope: 'door' },
  doorOfflineBundle: { method: 'POST', path: '/v1/door/sessions/:sessionId/offline-bundle', scope: 'door' },
  doorScans: { method: 'POST', path: '/v1/door/scans', idempotent: true, scope: 'door' },
  doorReconcile: { method: 'POST', path: '/v1/door/reconcile', idempotent: true, scope: 'door' },
  doorPurchaseIntent: { method: 'POST', path: '/v1/door/purchase/intents', idempotent: true, scope: 'door' },
  doorPurchaseConfirm: { method: 'POST', path: '/v1/door/purchase/confirm', idempotent: true, scope: 'door' },
  doorPurchaseIntentStatus: { method: 'GET', path: '/v1/door/purchase/intents/:id', scope: 'door' },
} as const satisfies Record<string, EndpointDef>;

export type EndpointKey = keyof typeof ENDPOINTS;

/** Fill `:param` path segments. Throws if a required param is missing. */
export function buildPath(key: EndpointKey, params?: Record<string, string>): string {
  return ENDPOINTS[key].path.replace(/:([A-Za-z]+)/g, (_m, name: string) => {
    const v = params?.[name];
    if (v == null) throw new Error(`Missing path param "${name}" for endpoint ${key}`);
    return encodeURIComponent(v);
  });
}
