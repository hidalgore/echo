# ECHO_V59_1_STRIPE_SCAFFOLD_NOTE

**Status:** Scaffolded, not wired
**Files:** `services/checkoutIntentService.ts`, `components/web/StripePaymentBlock.tsx`
**Wired into checkout?** **No.** `app/checkout/[id].tsx` still uses the inline mock card field from v59.

---

## What was added in the v59.1 pass

Mid-build in the v59.1 session, two files were added to scaffold the path toward real Stripe integration without changing the v59 checkout UI. The user then pivoted to a homepage rebalance (v59.2). The scaffold files were kept in place since they\u2019re purely additive \u2014 no v59 file imports them.

### `services/checkoutIntentService.ts`

Implements the **locked S-05 Checkout (<3 Tickets) v1** API contract from `ECHO_Engineering_Spec_v1.0_100p.pdf`:

| Function | Endpoint (locked) | Mock-mode behavior |
|---|---|---|
| `createCheckoutIntent(req)` | `POST /v1/checkout/intents` | Returns a fabricated intent with pricing in **cents** matching the locked response schema. |
| `confirmPayment(req)` | `POST /v1/payments/confirm` | Returns `succeeded` by default; returns `card_declined` if the payment token contains the literal "decline". |
| `getCheckoutIntent(id)` | `GET /v1/checkout/intents/{id}` | Returns a zero-value placeholder intent. |
| `newIdempotencyKey()` | (helper) | Returns a v4 UUID for retry de-dupe. |

Routing logic respects `CONFIG.MOCK_MODE`. When `false`, calls hit the real `apiRequest()` layer against `CONFIG.API_BASE_URL`.

### `components/web/StripePaymentBlock.tsx`

A web payment collection block. The card field is a mock that emits a `pm_mock_card_...` token. Apple Pay and Google Pay buttons emit `pm_mock_apple_pay_...` and `pm_mock_google_pay_...` tokens. The component contract (`onTokenReady(token, method)`) is stable; only the internal field changes when Stripe Elements is swapped in.

## How to finish the swap (production)

1. Add `@stripe/stripe-js` and `@stripe/react-stripe-js` to the project.
2. In a web-only wrapper component, mount `<Elements stripe={loadStripe(PUBLISHABLE_KEY)}>` around the route tree (or just around the checkout page).
3. Inside `StripePaymentBlock.tsx`, replace the mock `<TextInput>` card field with `<PaymentElement />` from Stripe Elements.
4. On submit, call `stripe.confirmPayment({ elements, ... })` and pass the resulting `PaymentMethod.id` to `onTokenReady`. No call sites need to change.
5. Set `CONFIG.MOCK_MODE = false` and point `CONFIG.API_BASE_URL` at the real ECHO API host. `checkoutIntentService` will start hitting `/v1/checkout/intents` and `/v1/payments/confirm` for real.

## Wiring into `/checkout/[id]` (the unwired piece)

`app/checkout/[id].tsx` currently uses an inline mock card row. The next pass should:

1. On mount, call `createCheckoutIntent({ event_id, quantity, ticket_type_id, donation_cents, mock_subtotal_dollars })` and store `intent_id` + the returned `pricing` block (in cents).
2. Render the order summary directly from `intent.pricing` instead of recomputing locally. This guarantees the buyer sees what the server is about to charge.
3. Replace the mock card field with `<StripePaymentBlock onTokenReady={...} />`.
4. On "Complete Reservation" press, call `confirmPayment({ intent_id, payment_method: { type, token }, idempotency_key: newIdempotencyKey() })`. Show `processing`, `succeeded`, `failed` states. Route to `/wallet` on `succeeded`.

Until that wiring lands, the scaffold files are intentionally isolated and safe to keep in the codebase.
