/**
 * ECHO Checkout Intent Service
 * ════════════════════════════
 * Implements the LOCKED S-05 Checkout (<3 Tickets) v1 API contract from
 * `ECHO_Engineering_Spec_v1.0_100p.pdf`.
 *
 * Endpoints (per locked contract):
 *   POST /v1/checkout/intents       — Create/refresh intent
 *   POST /v1/payments/confirm       — Confirm payment for intent
 *   GET  /v1/checkout/intents/{id}  — Fetch intent status
 *
 * Behavior:
 *   - When CONFIG.MOCK_MODE is true (current), all calls short-circuit to
 *     locally fabricated responses that match the locked response schemas
 *     exactly. This lets the UI exercise the full happy path on the web
 *     build with no backend wired.
 *   - When CONFIG.MOCK_MODE is false, all calls hit the real apiRequest()
 *     layer against CONFIG.API_BASE_URL.
 *
 * Pricing values in the intent.pricing block are LOCKED to be in **cents**
 * per the engineering spec (subtotal: 12000 = $120.00). The local mock
 * computes pricing in dollars via pricingEngine.computeCheckoutFees() and
 * scales to cents for the response, so the swap to a real backend changes
 * nothing about the UI's pricing math.
 *
 * SWAP-POINT: set CONFIG.MOCK_MODE = false and point CONFIG.API_BASE_URL
 * at the real ECHO API host. No call sites need to change.
 *
 * Stripe is the locked PCI processor (per ECHO_Payment_System_Doctrine).
 * The `payment_method.token` field in confirmPayment() carries the Stripe
 * PaymentMethod id or Apple Pay token issued by the platform-specific
 * collection layer (Stripe Elements on web, native Stripe SDK on iOS/Android).
 */
import { CONFIG } from '../constants/config';
import { apiRequest } from './apiClient';
import { computeCheckoutFees } from './pricingEngine';

// ── Types matching the LOCKED S-05 API schema ───────────────────────────

export type CheckoutIntentStatus =
  | 'requires_payment_method'
  | 'requires_confirmation'
  | 'processing'
  | 'succeeded'
  | 'canceled'
  | 'expired';

export interface CheckoutIntentPricing {
  /** All values in cents. */
  subtotal: number;
  fees: number;
  tax: number;
  total: number;
  /** Optional donation amount in cents, if attached. */
  donation?: number;
}

export interface CheckoutIntent {
  intent_id: string;
  status: CheckoutIntentStatus;
  /** ISO timestamp at which an unconfirmed intent expires (inventory hold released). */
  expires_at: string;
  pricing: CheckoutIntentPricing;
  /** Echoed back from request for client-side trust signals. */
  event_id: string;
  quantity: number;
  currency: 'USD';
}

export interface CreateCheckoutIntentRequest {
  event_id: string;
  quantity: number;
  /** Ticket tier id selected by the buyer. */
  ticket_type_id?: string;
  /** Optional donation amount in cents. */
  donation_cents?: number;
  /** Pricing subtotal in dollars, used for mock-mode pricing only. */
  mock_subtotal_dollars?: number;
  currency?: 'USD';
  client_context?: {
    platform: 'web' | 'ios' | 'android';
    locale: string;
  };
}

export type PaymentMethodType = 'card' | 'apple_pay' | 'google_pay';

export interface ConfirmPaymentRequest {
  intent_id: string;
  payment_method: {
    type: PaymentMethodType;
    /** Stripe PaymentMethod id, Apple Pay token, or Google Pay token. */
    token: string;
  };
  idempotency_key: string;
}

export interface ConfirmedTicket {
  ticket_id: string;
  status: 'active';
}

export interface ConfirmPaymentResponse {
  status: 'succeeded' | 'requires_action' | 'failed';
  tickets: ConfirmedTicket[];
  wallet_updated: boolean;
  /** Set when status is 'failed'. Maps to one of the locked error codes. */
  error_code?:
    | 'card_declined'
    | 'insufficient_funds'
    | 'expired_card'
    | 'inventory_changed'
    | 'rate_limited'
    | 'unknown';
  error_message?: string;
}

// ── Endpoints (locked) ──────────────────────────────────────────────────

const ENDPOINT_CREATE_INTENT = '/v1/checkout/intents';
const ENDPOINT_CONFIRM_PAYMENT = '/v1/payments/confirm';
const ENDPOINT_FETCH_INTENT = (id: string) => `/v1/checkout/intents/${id}`;

// ── Mock helpers ────────────────────────────────────────────────────────

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

function fabricateMockIntent(req: CreateCheckoutIntentRequest): CheckoutIntent {
  const subtotalDollars = Math.max(0, req.mock_subtotal_dollars ?? 0);
  const fees = computeCheckoutFees(subtotalDollars, false);
  const donationCents = req.donation_cents ?? 0;

  return {
    intent_id: `ci_mock_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    status: 'requires_payment_method',
    expires_at: new Date(Date.now() + 1000 * 60 * 8).toISOString(),
    pricing: {
      subtotal: Math.round(fees.subtotal * 100),
      fees: Math.round(fees.serviceFee * 100),
      tax: Math.round(fees.tax * 100),
      total: Math.round(fees.total * 100) + donationCents,
      donation: donationCents > 0 ? donationCents : undefined,
    },
    event_id: req.event_id,
    quantity: req.quantity,
    currency: 'USD',
  };
}

function fabricateMockConfirmation(req: ConfirmPaymentRequest): ConfirmPaymentResponse {
  // Mock declines for any token containing the literal "decline" — useful for QA.
  if (req.payment_method.token.includes('decline')) {
    return {
      status: 'failed',
      tickets: [],
      wallet_updated: false,
      error_code: 'card_declined',
      error_message: 'Your card was declined. Please try another payment method.',
    };
  }
  return {
    status: 'succeeded',
    tickets: [
      {
        ticket_id: `tkt_mock_${Date.now()}`,
        status: 'active',
      },
    ],
    wallet_updated: true,
  };
}

// ── Public API ──────────────────────────────────────────────────────────

/**
 * Create or refresh a checkout intent. Matches POST /v1/checkout/intents.
 * Returns the locked intent envelope, including pricing in cents.
 */
export async function createCheckoutIntent(
  req: CreateCheckoutIntentRequest,
): Promise<CheckoutIntent> {
  if (!CONFIG.MOCK_MODE) {
    return apiRequest<CheckoutIntent>(ENDPOINT_CREATE_INTENT, {
      method: 'POST',
      body: JSON.stringify({
        event_id: req.event_id,
        quantity: req.quantity,
        ticket_type_id: req.ticket_type_id,
        donation_cents: req.donation_cents,
        currency: req.currency ?? 'USD',
        client_context: req.client_context,
      }),
    });
  }
  await delay(180);
  return fabricateMockIntent(req);
}

/**
 * Confirm a checkout intent. Matches POST /v1/payments/confirm.
 * Idempotency key is REQUIRED per the locked contract.
 */
export async function confirmPayment(
  req: ConfirmPaymentRequest,
): Promise<ConfirmPaymentResponse> {
  if (!req.idempotency_key) {
    throw new Error('confirmPayment requires an idempotency_key (locked S-05 rule)');
  }
  if (!CONFIG.MOCK_MODE) {
    return apiRequest<ConfirmPaymentResponse>(ENDPOINT_CONFIRM_PAYMENT, {
      method: 'POST',
      body: JSON.stringify(req),
      headers: { 'Idempotency-Key': req.idempotency_key },
    });
  }
  await delay(640);
  return fabricateMockConfirmation(req);
}

/**
 * Fetch the latest state of a checkout intent. Matches GET /v1/checkout/intents/{id}.
 * Used to poll an intent that's transitioned to 'processing' or for 3DS recovery.
 */
export async function getCheckoutIntent(intentId: string): Promise<CheckoutIntent> {
  if (!CONFIG.MOCK_MODE) {
    return apiRequest<CheckoutIntent>(ENDPOINT_FETCH_INTENT(intentId));
  }
  await delay(120);
  return {
    intent_id: intentId,
    status: 'requires_payment_method',
    expires_at: new Date(Date.now() + 1000 * 60 * 8).toISOString(),
    pricing: { subtotal: 0, fees: 0, tax: 0, total: 0 },
    event_id: 'evt_mock',
    quantity: 1,
    currency: 'USD',
  };
}

// ── Idempotency key helper ──────────────────────────────────────────────

/**
 * Generate an RFC4122-ish v4 UUID for idempotency keys. Web crypto when
 * available, falls back to math.random for environments without crypto.
 */
export function newIdempotencyKey(): string {
  const g: any = globalThis as any;
  if (g.crypto?.randomUUID) return g.crypto.randomUUID();
  // Fallback (non-crypto, sufficient for retry de-dupe in mock mode)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export const checkoutIntentService = {
  createCheckoutIntent,
  confirmPayment,
  getCheckoutIntent,
  newIdempotencyKey,
};
