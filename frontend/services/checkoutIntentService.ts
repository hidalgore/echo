/**
 * ECHO Checkout Intent Service — MOCK FIXTURE (demoted in Phase 3 / W5).
 *
 * The real S-05 surface (POST /v1/checkout/intents, POST /v1/payments/confirm,
 * GET /v1/checkout/intents/:id) is served by the backend and reached through
 * `getPorts().checkout` (services/api/httpAdapters.ts) behind
 * EXPO_PUBLIC_ECHO_CHECKOUT_MODE=live. Pricing, inventory holds, and ticket
 * issuance are server-authoritative there (locked rule).
 *
 * What remains here is the local fabricator that backs `mockPorts.checkout`
 * (services/api/mockAdapters.ts) so the app keeps demoing offline: responses
 * match the locked schemas (pricing in **cents**), tokens containing the
 * literal "decline" simulate a card decline for QA.
 */
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
  /** Pricing subtotal in dollars (mock pricing input). */
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

// ── Mock fabricators ────────────────────────────────────────────────────

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

// ── Public API (mock-only; the live path is getPorts().checkout) ────────

export async function createCheckoutIntent(
  req: CreateCheckoutIntentRequest,
): Promise<CheckoutIntent> {
  await delay(180);
  return fabricateMockIntent(req);
}

export async function confirmPayment(
  req: ConfirmPaymentRequest,
): Promise<ConfirmPaymentResponse> {
  if (!req.idempotency_key) {
    throw new Error('confirmPayment requires an idempotency_key (locked S-05 rule)');
  }
  await delay(640);
  return fabricateMockConfirmation(req);
}

export async function getCheckoutIntent(intentId: string): Promise<CheckoutIntent> {
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

export const checkoutIntentService = {
  createCheckoutIntent,
  confirmPayment,
  getCheckoutIntent,
};
