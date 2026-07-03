/**
 * services/api/apiClient.ts
 * ═════════════════════════
 * Thin transport seam (decision 5A). Wraps fetch with the locked error
 * envelope, idempotency-key header, bearer auth, and retry/backoff on 429/5xx.
 * No new dependency. The app injects config once; services call typed helpers.
 *
 * This is the ONLY place that talks to the network — services depend on ports
 * (see ports.ts), not on fetch, so mock↔http is a swap.
 */

import { API_STATUS, IDEMPOTENCY_HEADER, isRetryable } from '../../types/api/shared';
import type { ApiResult } from '../../types/api/shared';
import { ENDPOINTS, buildPath } from '../../types/api/endpoints';
import type { EndpointKey, EndpointDef } from '../../types/api/endpoints';

export type ApiClientConfig = {
  baseUrl: string;
  /** Returns a bearer token (or null for public/guest calls). */
  getAuthToken?: () => string | null | Promise<string | null>;
  maxRetries?: number;
};

let config: ApiClientConfig = { baseUrl: '', maxRetries: 2 };

export function configureApiClient(c: ApiClientConfig): void {
  config = { maxRetries: 2, ...c };
}

function backoffMs(attempt: number): number {
  // 250ms, 500ms, 1000ms … capped
  return Math.min(1000, 250 * 2 ** attempt);
}

async function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export type CallOptions = {
  params?: Record<string, string>;
  query?: Record<string, string | number | undefined>;
  body?: unknown;
  idempotencyKey?: string;
};

/** Typed call against a registered endpoint. */
export async function apiCall<T>(key: EndpointKey, opts: CallOptions = {}): Promise<ApiResult<T>> {
  const def: EndpointDef = ENDPOINTS[key];
  const path = buildPath(key, opts.params);
  const qs = opts.query
    ? '?' + Object.entries(opts.query).filter(([, v]) => v != null).map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join('&')
    : '';
  const url = `${config.baseUrl}${path}${qs}`;

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = config.getAuthToken ? await config.getAuthToken() : null;
  if (token) headers['Authorization'] = `Bearer ${token}`;

  if (def.idempotent) {
    if (!opts.idempotencyKey) {
      return { ok: false, status: API_STATUS.badRequest, error: { code: 'idempotency_key_required', message: `${key} requires an idempotency key` } };
    }
    headers[IDEMPOTENCY_HEADER] = opts.idempotencyKey;
  }

  const init: RequestInit = {
    method: def.method,
    headers,
    body: def.method === 'GET' || def.method === 'DELETE' ? undefined : JSON.stringify(opts.body ?? {}),
  };

  const maxRetries = config.maxRetries ?? 2;
  let attempt = 0;
  // Retry only idempotent-safe situations: GETs, or mutations carrying a key.
  const retrySafe = def.method === 'GET' || !!def.idempotent;

  while (true) {
    let status = 0;
    try {
      const res = await fetch(url, init);
      status = res.status;
      const text = await res.text();
      const json = text ? JSON.parse(text) : {};
      if (res.ok) return { ok: true, status, data: json as T };
      const error = (json as { error?: { code: string; message: string; details?: Record<string, unknown> } }).error
        ?? { code: `http_${status}`, message: res.statusText || 'Request failed' };
      if (retrySafe && isRetryable(status) && attempt < maxRetries) {
        await delay(backoffMs(attempt++));
        continue;
      }
      return { ok: false, status, error };
    } catch (e) {
      // Network/parse failure — treat as retryable for safe calls.
      if (retrySafe && attempt < maxRetries) { await delay(backoffMs(attempt++)); continue; }
      return { ok: false, status: status || 0, error: { code: 'network_error', message: e instanceof Error ? e.message : 'Network error' } };
    }
  }
}

/**
 * Generate an RFC4122 v4 UUID for idempotency keys (required by the Stripe
 * contract). Web crypto when available; non-crypto v4-shaped fallback for
 * environments without it (same convention as checkoutIntentService).
 */
export function newIdempotencyKey(): string {
  const g = globalThis as { crypto?: { randomUUID?: () => string } };
  if (g.crypto?.randomUUID) return g.crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
