/**
 * types/api/shared.ts
 * ═══════════════════
 * Canonical wire models aligned to the LOCKED ECHO_API_Contracts_v1.0.
 * These are the single source of truth for transport shapes (decision 3A) —
 * domain types map TO/FROM these via the mappers in services/api/mappers.ts.
 *
 * Do not diverge from the locked doc without flagging the conflict first.
 */

export const API_VERSION = 'v1' as const;
export const API_BASE_PATH = '/v1' as const;

// ─── Identifiers (locked) ────────────────────────────────────────────────────
/** Internal immutable id — UUIDv7/ULID. */
export type EchoId = string;
/** Crockford Base32 w/ checksum — displayed only in Settings/Support. */
export type PublicId = string;

// ─── Standard error envelope (locked) ────────────────────────────────────────
export type ApiError = {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
};

/** Standard "no body" success. */
export type ApiOk = { ok: true };

/** Discriminated result wrapper used by the client. */
export type ApiResult<T> =
  | { ok: true; status: number; data: T }
  | { ok: false; status: number; error: ApiError['error'] };

// ─── Status codes (locked) ───────────────────────────────────────────────────
export const API_STATUS = {
  ok: 200, created: 201,
  badRequest: 400, unauthenticated: 401, unauthorized: 403,
  conflict: 409, rateLimited: 429,
} as const;

/** 429 + 5xx are retryable with backoff (locked guidance). */
export function isRetryable(status: number): boolean {
  return status === API_STATUS.rateLimited || status >= 500;
}

// ─── Shared enums (locked) ───────────────────────────────────────────────────

/** Locked Ticket Status wire enum. */
export type TicketStatusDTO = 'active' | 'checked_in' | 'expired' | 'revoked' | 'transferred';

/** Locked Age Badge — single source of truth across event/checkout/wallet/door. */
export type AgeBadgeDTO = 'none' | '18_plus' | '21_plus';

// ─── Idempotency & concurrency (locked) ──────────────────────────────────────
/** Required header on payment/transfer/refund/scan mutations. */
export const IDEMPOTENCY_HEADER = 'Idempotency-Key' as const;

export type Idempotent = { idempotencyKey: string };

// ─── Pagination (bot-defense caps live server-side; client honors limits) ────
export type PageParams = { cursor?: string; limit?: number };
export type Paged<T> = { items: T[]; nextCursor?: string };
