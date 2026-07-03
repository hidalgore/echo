# ECHO — Phase 3 Session Prompt

Paste everything below the line into a fresh Claude Code session started in
`/Users/ramonhidalgo/Projects/echo`. Authored at Phase 2 close (2026-07-03);
amendments discovered during Phase 2 are folded in.

---

You are working in `/Users/ramonhidalgo/Projects/echo`, executing **Phase 3
(Checkout, payments & ticket issuance — the revenue path)** of the ECHO
backend buildout. Phases 0–2 are merged to `main`: the platform middleware
(envelope, idempotency store, per-scope throttles, cursor pagination,
`core.ids`, scopes) serves a real identity stack (Apple/Google verification,
guest sessions, rotating refresh tokens, `/v1/me`, audit log) and a real
events catalog (Venue/Event/TicketTier/SavedEvent, S-03 discovery endpoints,
scheduled-publish workers, `seed_events` over the 158-event corpus). The
frontend rides both behind env gates: `EXPO_PUBLIC_ECHO_AUTH_MODE` and
`EXPO_PUBLIC_ECHO_DISCOVERY_MODE` (mock default). All planning decisions are
locked — do not re-open them.

## Inputs (read in this order before touching anything)

1. `docs/ECHO_Backend_Master_Plan_V1.md` — locked decisions D1–D4, standing
   rules, roadmap. This session is Phase 3 only.
2. This prompt's workstreams below (Phase 3 has no separate kickoff doc; this
   is it).
3. `backend/core/` + `backend/identity/` + `backend/audit/` +
   `backend/events/` — platform, identity, and catalog utilities you MUST
   reuse. In particular: `core.idempotency` (the Idempotency-Key store built
   in Phase 0 — Phase 3 is the first phase whose endpoints are
   idempotency-flagged, so this is its first real consumer) and
   `events.models.TicketTier.quantity_total/quantity_sold` (the substrate
   inventory holds must build on; `available` is the only serialized number).
4. `frontend/types/api/endpoints.ts` — the locked v1.0 registry (S-05 rows:
   `createCheckoutIntent` ✅idem, `checkoutIntent`, `confirmPayment` ✅idem
   are this phase's surface) and `frontend/types/api/dto.ts`
   (`CheckoutIntentDTO`, `TicketDTO` are the locked wire shapes; extend only
   by flagged amendment).
5. `frontend/services/api/ports.ts` + `mockAdapters.ts` +
   `frontend/services/checkoutIntentService.ts`, `pricingEngine.ts`,
   `inventoryHoldService.ts`, `refundPolicyEngine.ts`,
   `donationCampaignService.ts` and the checkout screens/stores — the
   `CheckoutPort` swap target and the client logic that becomes
   display-or-deleted (server-authoritative rule).
6. `docs/ECHO_Staging_Deploy_Notes.md` — staging state, checklist (Stripe
   env slots are step 6).

## Locked decisions and standing rules (restated)

- Stack: Django 5 + DRF + PostgreSQL + Redis + Celery on AWS (D1). Monorepo
  (D2). Contract v1.0 implemented as-is; conflicts flagged, never silently
  diverged from (D4).
- Base URL `https://api.echo.events` (staging `api-staging.echo.events`).
- **Idempotency is contractual and this phase is its proving ground:**
  `POST /v1/checkout/intents` and `POST /v1/payments/confirm` require an
  `Idempotency-Key`; the server stores and replays results for repeated keys
  (`core.idempotency` semantics: replay / in-flight 409 / key-reuse 409).
- **All pricing in cents, server-side:** 5% platform fee + 2.9% + $0.30
  processing + tax + nonprofit waiver (waiver removes platform fee only;
  processing always applies). The client `pricingEngine` becomes display
  logic or is deleted.
- **Inventory holds are atomic and server-side:** create on intent, complete
  on success, release on failure/expiry (TTL 8–15 min, expiry worker).
  Holds consume `TicketTier.quantity_sold`-adjacent state — never oversell,
  never leak held inventory into `available`.
- Webhooks: `payment_intent.succeeded` / `payment_intent.failed` /
  `charge.refunded`, signature-verified, idempotent consumers.
- Refund-policy snapshot at publish (the field lands on Event; snapshot
  consumed by Phase 8 refunds).
- Ticket issuance on confirm (`TicketDTO`: active, tier, age badge —
  credentials/QR/NFC are Phase 4, do NOT build them).
- Donations: separate transactions with campaign attribution.
- Age gate: `age_verification_required` on intents; **no payment before
  verification** (verification itself is Phase 6 — audit how the frontend
  mock handles `requires_verification` today and flag the pre-Phase-6
  behavior decision if the audit leaves it genuinely open).
- Audit log: every financial operation writes entries (intent created,
  payment confirmed/failed, hold released, webhook applied, refund seen).
- Error envelope / cursor pagination / 429 semantics exactly as built in
  `backend/core`.

## Preconditions (gates — surface and wait, don't fill the wait with code)

- **Stripe test-mode keys** (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` env
  slots exist since Phase 0). Backend work proceeds locally against the
  Stripe SDK's test mode / mocked client seams, but end-to-end confirm and
  webhook verification need real test keys from the operator — say
  explicitly when you reach that gate.
- **Staging is still unprovisioned** — Phase 1's and Phase 2's staging swaps
  are both owed, gated on the AWS/DNS/secrets checklist. If it is still
  unprovisioned this phase's staging step inherits ALL THREE swaps (identity
  + discovery + checkout; curl S-01 + S-03 + S-05; smoke all).
- **Dev/staging Postgres reset note** from Phase 1 still applies the first
  time a real DB is stood up (AUTH_USER_MODEL swap) — `docker compose down
  -v` + fresh `migrate` + `seed_events`. **No Docker on this machine** (found
  in Phase 2) — compose steps are the operator's.
- **v1.1 lock still pending** (4 open questions) — nag the operator; Phases
  7–8 are gated on it. The Phase 1 (auth refresh/logout) and Phase 2
  (EventDTO extension, `GET /v1/saved-events`) registry amendments also await
  formal sign-off; treat them as locked-in-practice (they are merged and
  drift-checked).

## Workstreams

**W1 — Pricing engine + checkout models.** `CheckoutIntent` model on
`EchoIdModel` (event, tier, quantity, user, pricing breakdown in cents,
status per the locked `CheckoutIntentDTO` enum, `age_verification_required`,
donation line, Stripe payment-intent ref, idempotency linkage). Server
pricing engine implementing the locked fee model + tax slot + nonprofit
waiver; property-test it against the client `pricingEngine`'s outputs before
demoting that to display logic. Refund-policy snapshot field on Event
(captured when events publish — wire into the Phase 2 lifecycle worker's
publish transition).

**W2 — Inventory holds.** Atomic hold on intent creation
(`select_for_update` on tiers; never oversell under concurrency — test with
threads or transaction-level races), complete on payment success, release on
failure/cancel/TTL expiry (8–15 min; Celery beat expiry worker, idempotent
like Phase 2's lifecycle task). Held quantity must reduce S-03 `available`
without ever being separately exposed (doctrine: `available` remains the only
serialized number).

**W3 — S-05 endpoints.** `POST /v1/checkout/intents` (scope user, ✅idem),
`GET /v1/checkout/intents/:id` (scope user, owner-only), `POST
/v1/payments/confirm` (scope user, ✅idem) accepting card / Apple Pay /
Google Pay tokens per the locked shapes. Confirm issues tickets atomically
with hold completion. Donations ride the intent as separate transaction rows
with campaign attribution. Low per-user/per-event rates on intent creation
(the master plan's compliance note) via the platform throttle classes.

**W4 — Stripe integration + webhooks.** PaymentIntent create/confirm through
the official SDK behind a thin service seam (unit tests run against the seam,
not the network). `POST /v1/webhooks/stripe` — **not in the v1.0 registry;
this is a known, expected registry amendment** (server-to-server, not a
client endpoint — flag it exactly like the Phase 1/2 amendments, decide with
the drift script whether webhook routes are contract surface or exempt
infrastructure, and document the call). Signature verification, idempotent
event application, audit entries.

**W5 — Frontend swap (CheckoutPort only).** Http adapter for `CheckoutPort`
on `apiCall` (idempotency keys via `newIdempotencyKey()` — the client
enforces the header already); bind env-gated
(`EXPO_PUBLIC_ECHO_CHECKOUT_MODE`, mock default) exactly like auth/discovery.
Stripe RN SDK + PaymentElement land in the app — **this is a native-build
dependency**; bundle it with the already-owed native build (expo-secure-store
from Phase 1 + Sentry RN slot from the deploy notes). `checkoutIntentService`
/ `inventoryHoldService` demote to display logic or delete per the
server-authoritative rule. Strict `npx tsc --noEmit` stays clean.

**W6 — Staging swap + verification.** Execute/finish the staging checklist
(operator involvement for AWS/DNS/secrets/Stripe keys); deploy; one-time DB
reset + `seed_events` if this is the first staging DB; curl S-05 (+ S-01/S-03
if still owed); Stripe test-mode end-to-end (intent → confirm → webhook →
ticket row); backend pytest + ruff + contract-drift + `makemigrations
--check` green; frontend strict tsc. Device/web smoke is the operator's.

## Out of scope

Credentials/QR/NFC/wallet passes (Phase 4); door purchases (Phase 5); circles
(Phase 6 — `circlePayments` stays mock even though it's S-05-adjacent); age
verification implementation (Phase 6 — only the intent flag lands now);
refund execution/transfers (Phase 8 — only the policy snapshot and the
`charge.refunded` webhook recording land now); host payouts/Stripe Connect
(Phase 7); promotions/promo codes (v1.1).

## Amendments carried from Phase 2 (do not rediscover these)

- **EventDTO was extended + `GET /v1/saved-events` added** (flagged, merged
  with PR #3): the tier picker consumes `TicketTierDTO { echo_id, name,
  description, price_cents, available }` from the event payload or `GET
  /v1/events/:id/inventory` — checkout should re-verify against fresh
  inventory server-side, and the frontend `DiscoveryPort.getInventory` is
  already wired for a fresh read at checkout open.
- **`donation_campaign` is not on the S-03 wire** — the nonprofit seed events
  carry campaigns only in the mock corpus. Phase 3 owns donations: decide the
  donation surface (extend EventDTO by flagged amendment, or serve it through
  the checkout intent) based on what the checkout/donation UI actually reads
  — audit `donationCampaignService` + the nonprofit screens first.
- **Tier availability is served as exact remaining counts** (audited: the
  locked tier picker renders "N remaining"); capacity/sold are never
  serialized. Holds must preserve this: `available` shrinks while held,
  nothing else leaks.
- **`TicketTier.quantity_sold`** exists and `seed_events` re-runs never
  touch it — holds/sales own it from this phase on.
- **Status naming**: the wire `EventStatusDTO` is
  `scheduled|on_sale|live|ended` (frontend enum; the plan's "published" =
  `scheduled`). Checkout eligibility is `on_sale`/`live` — enforce
  server-side at intent creation.
- **Native build owed** (fingerprint changed in Phase 1, unchanged since):
  expo-secure-store + Sentry RN SDK slot + now the Stripe RN SDK — cut ONE
  build with all three when W5 lands.
- **Environment drift bites**: `backend/.venv` was missing Phase 1 deps and
  `frontend/node_modules` was missing expo-secure-store at Phase 2 start —
  run `pip install -r requirements.txt` and `npm install` before diagnosing
  anything.

## Working rules (same as Phases 0–2)

- Audit before questions, audit before code. Bring only questions the audit
  produced, one at a time.
- One phase-3 branch (worktree: `git worktree add -b phase-3/checkout
  ../echo-phase-3 main`), clean per-workstream commits; frontend and backend
  in separate commits. Nothing lands half-done.
- Verification bar: backend tests green + drift green; frontend strict tsc
  clean. No "should work" claims — run the checks. Do not launch the app to
  verify — the operator smokes it.
- Finish by delivering: change list (file per line, one-line reason),
  exit-criteria status (met / not met / deferred with reason), and anything
  that should amend Phase 4's kickoff.
