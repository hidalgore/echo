# ECHO Backend Master Plan — V1 (LOCKED)

Status: locked 2026-07-02. Decisions D1–D4 below are signed off; phases execute in order
unless a dependency note says otherwise. Each phase gets its own kickoff doc and its own
work session. This doc is the source of truth for sequencing and scope.

Inputs analyzed:
- `ECHO_Frontend_v59.zip` — full Expo SDK 54 / expo-router / zustand app (~120 screens,
  ~20 stores, ~60 services), 100% mock-driven. No HTTP, no Stripe SDK, no push, no real NFC.
- `ECHO_Backend_Readiness_API_Layer.zip` — NOT a backend. A 6-file frontend API contract
  layer: locked `/v1` endpoint registry (~40 endpoints w/ method/scope/idempotency),
  wire DTOs, mappers, thin fetch client (bearer, error envelope, Idempotency-Key
  enforcement, 429/5xx retry), and `EchoPorts` with the `bindPorts(mock | http)` swap seam.
  This layer is **not yet merged into the v59 frontend tree**.

---

## Locked decisions

- **D1 — Stack:** Django 5 + DRF + PostgreSQL + Redis + Celery, deployed on AWS.
  Rationale: matches the operator's existing production muscle (Siempre runs this stack);
  ECHO's needs (relational inventory/payments integrity, idempotency storage, scheduled
  workers, signed credentials) map directly. Contract stays in sync via an OpenAPI spec
  generated from DRF and diffed against `types/api/endpoints.ts` in CI.
- **D2 — Repo layout:** monorepo — `echo/` with `frontend/` (the v59 app) and `backend/`
  (new Django project), mirroring the Siempre layout. Frontend and backend changes land
  in separate commits. Repo initialized in Phase 0 from the v59 zip.
- **D3 — Age-verification provider:** shortlist Vouched / Jumio / Socure. Evaluation runs
  during Phases 1–5; the decision gates Phase 6 (age-verification half), not earlier work.
- **D4 — Contract v1.1:** the locked v1.0 registry covers the attendee core only. A v1.1
  extension (host platform, ticket transfer, refunds, ECHO'd, notifications, payouts,
  insider, nonprofits) is authored in Phase 0 and must be locked before Phases 7–8 start.
  v1.0 endpoints are implemented as-is; conflicts get flagged, never silently diverged from.

## Standing rules (every phase)

- **Idempotency is contractual.** The client refuses flagged mutations without an
  `Idempotency-Key`; the server stores and replays results for repeated keys.
- **Error envelope, status codes, pagination** exactly per `types/api/shared.ts`
  (`{ error: { code, message, details? } }`, cursor pagination, 429/5xx retryable).
- **IDs:** internal `echo_id` (UUIDv7), external `public_id` (Crockford Base32 + checksum,
  shown only in Settings/Support).
- **Scopes:** `public / guest / user / host / door / admin` enforced per the registry.
- **Social Energy doctrine:** never expose raw attendance counts through any API surface.
  Labels and 0..1 intensity only.
- **Server-authoritative security:** pricing, refunds, inventory holds, credential
  signing, trust/risk scoring, and mission verification all move server-side. Their
  client implementations become display logic or get deleted.
- **Definition of done per phase:** endpoints implemented to contract → http adapter for
  that port in the frontend → staging swap for that domain only → the corresponding mock
  service deleted or demoted to seed fixtures → smoke on device/web.
- **Audit log:** append-only, server-side, from Phase 1 onward; destructive/financial
  operations always write an entry.

---

## Phase 0 — Foundations (see ECHO_Backend_Phase_0_Kickoff_V1.md)

Repo init (D2), readiness-layer merge into the frontend + `mockPorts` adapter + startup
binding, Django scaffold with platform middleware (error envelope, idempotency store,
rate limiting, cursor pagination), dev/staging/prod environments + CI, contract v1.1
authored and circulated for lock. Exit: app runs unchanged through `mockPorts`; backend
answers `GET /v1/config/public` in staging; v1.1 draft exists.

## Phase 1 — Identity & platform core

Apple/Google token verification, guest sessions, `/v1/me`, `/v1/me/flags`,
`/v1/config/public`; access+refresh tokens, device records; RBAC scopes; audit log
service. Frontend swap: real auth replaces `authStore` mock initialize.

## Phase 2 — Events & discovery

Event/venue/tier/inventory models; `GET /v1/events`, `/:id`, `/:id/inventory`,
saved-events; scheduled-publish Celery workers (`publishDate` → visible,
`salesStartDate` → purchasable, locked ordering validation); Social Energy fields served
per doctrine; seeded with the mock event corpus. Swap `DiscoveryPort`.

## Phase 3 — Checkout, payments & ticket issuance (revenue path)

Stripe per locked S-05: `POST /v1/checkout/intents` (all pricing in cents),
`POST /v1/payments/confirm` (card / Apple Pay / Google Pay tokens),
`GET /v1/checkout/intents/:id`. Server-side inventory holds (create on intent, complete
on success, release on failure/TTL 8–15 min, atomic). Pricing engine server-side
(5% platform + 2.9% + $0.30 + tax + nonprofit waiver). Webhooks
(`payment_intent.succeeded/failed`, `charge.refunded`). Refund-policy snapshot at
publish. Ticket issuance on confirm. Donations as separate transactions with campaign
attribution. Age gate: `age_verification_required` on intents; no payment before
verification. Swap `CheckoutPort`; Stripe SDK/PaymentElement lands in the app.

## Phase 4 — Credentials & wallet

Server-signed rotating credentials: short-lived QR payloads + NFC challenge-response
(30s rotation; serial-only validation disallowed; client never mints tokens — deletes
client-side signing in `accessPassService`). Credential get/refresh/status endpoints.
Apple Wallet PKPass generation (`POST /v1/tickets/:id/apple-wallet`) with pass updates;
Google Wallet deferred. Swap `TicketPort`.

## Phase 5 — Door mode

Door sessions + device trust (`door` scope), 6-digit pause/resume passcode validation.
Offline bundle: pre-signed credential cache per event. `POST /v1/door/scans` at <500ms:
signature, status, age badge, zone authorization, duplicate detection (5-min duplicate →
alert not block), locked result shape (approved, tier color, denial reason).
Reconciliation: merge offline ledgers to server truth, duplicates resolved by server
timestamp. Door purchases (intent/confirm). Closeout artifacts: attendance CSV,
denied-attempt log, throughput analytics. Swap `DoorPort`.

## Phase 6 — Circles & age verification (two halves, parallelizable with each other)

**Circles:** server state machine (open → closing_soon → complete/expired), invite tokens
+ universal links, join/claim, per-member payment via Phase 3 checkout, organizer
cover/replace (max 3), expiry worker, organizer-ticket-stays-confirmed guarantee.
Swap `CirclePort`.
**Age verification:** provider integration (D3 decision due here),
`verification/start` + `status`, persisted records (band, provider ref, ~30-day expiry),
3-attempt lockout, web→phone handoff session (QR/SMS link, desktop polls status).

## Phase 7 — Host platform (gated on v1.1 lock)

Host onboarding/activation (`hostAccessStatus` progression) and profiles; event
create/update/publish backing the V3 flyer-first flow; flyer upload + extraction
(storage + async vision/OCR job — may start manual-confirm); Stripe Connect payout
onboarding, payout status/history, event finance summaries; dashboard/analytics
aggregation; closeout reports (CSV/PDF); promotions; nonprofit verification (EIN lookup)
+ donation campaign tracking + locked closeout CSV with role-gated donor PII.
Swap: host stores move off `hostMock` / `dashboardMock`.

## Phase 8 — Engagement & trust (gated on v1.1 lock)

Ticket transfer (idempotent, server-timestamp conflict resolution). Push: token
registration + the 12 locked campaign triggers with quiet hours, server-owned rules;
in-app notification feed. ECHO'd reflections (rating/tags/photos/visibility, signed-URL
media). Trust & risk: `echoTrustEngine` / `botRiskService` scoring server-side (simple
server rules first, same interfaces), risk-decision feed for the admin trust console
(`TrustPort`). Insider program: the 8 tables from the build notes, signal-based mission
verification, credits ledger with abuse caps.

---

## Compliance & security (cross-cutting)

- ID-scan and donor PII: encrypted at rest, retention limits, role-gated access.
- Media uploads (flyers, ECHO'd photos, insider feedback): signed URLs, size limits,
  malware scanning, retention policy.
- Rate limits: low per-user/per-event on checkout-intent creation; moderate per-IP on
  discovery/search; high-throughput path for door scans; per-phone limits on
  age-verification attempts.
- Prod access follows the same touch-only-when-asked discipline as Siempre.

## Sequencing rationale

Phases 1–5 produce a sellable attendee product (discover → verify → pay → hold ticket →
get scanned in). Phases 6–8 widen the funnel and light up the already-built host and
engagement UX. Contract v1.1 authoring (Phase 0) and provider evaluation (D3) overlap
earlier phases so Phases 6–8 are never blocked on paperwork.
