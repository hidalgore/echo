# ECHO — Phase 5 Session Prompt

Paste everything below the line into a fresh Claude Code session started in
`/Users/ramonhidalgo/Projects/echo`. Authored at Phase 4 close (2026-07-04);
amendments discovered during Phase 4 are folded in.

---

You are working in `/Users/ramonhidalgo/Projects/echo`, executing **Phase 5
(Door mode)** of the ECHO backend buildout. Phases 0–4 are merged to `main`:
the platform middleware (envelope, idempotency store, per-scope throttles,
cursor pagination, `core.ids`, scopes) serves a real identity stack, a real
events catalog, the full revenue path (S-05 intents/Stripe/tickets — one
`Ticket` row per admission), and the credential surface (S-06: Ed25519
server-signed rotating credentials on `tickets.credentials`, owner-only
ticket/wallet reads, Apple Wallet PKPass behind a fail-closed seam). The
frontend rides it all behind env gates: `EXPO_PUBLIC_ECHO_AUTH_MODE`,
`_DISCOVERY_MODE`, `_CHECKOUT_MODE`, `_TICKET_MODE` (mock default). All
planning decisions are locked — do not re-open them.

## Inputs (read in this order before touching anything)

1. `docs/ECHO_Backend_Master_Plan_V1.md` — locked decisions D1–D4, standing
   rules, roadmap. This session is Phase 5 only.
2. This prompt's workstreams below (Phase 5 has no separate kickoff doc; this
   is it).
3. `backend/tickets/credentials.py` — **the door-scan verdict substrate you
   MUST build on, not redesign** (locked at Phase 4): `verify_validation_token`
   (signature → live ticket status → rotation nonce; `leeway_seconds` param
   exists for door clock skew), the stable refusal codes (`ok` / `malformed` /
   `invalid_signature` / `expired` / `superseded` / `unknown_ticket` /
   `ticket_not_active`), `signing_public_key_pem()` (what an offline bundle
   ships), and the two token types: `typ=credential` (rotating, nonce-checked)
   vs `typ=pkpass` (Wallet barcode — long-lived, signature+status-checked but
   deliberately NOT nonce-checked; door scans must accept both).
4. `backend/core/` + `backend/identity/` (scopes: `door` exists in the
   hierarchy and throttle rates — `RATE_LIMIT_DOOR` 600/min default;
   `identity.tokens.issue_pair` already accepts `scope="door"`) +
   `backend/checkout/` (door purchases REUSE `acquire_hold` /
   `complete_intent` / the pricing engine — never a second checkout path) +
   `backend/audit/` + `backend/tickets/`.
5. `frontend/types/api/endpoints.ts` — the locked S-07 rows: `doorSession`
   (GET `/v1/door/sessions/:sessionId`), `doorOfflineBundle` (POST
   `.../offline-bundle`), `doorScans` (POST, ✅ idem), `doorReconcile` (POST,
   ✅ idem), `doorPurchaseIntent` / `doorPurchaseConfirm` (POST, ✅ idem),
   `doorPurchaseIntentStatus` (GET) — all scope `door`. NOTE two registry
   gaps to resolve via audit, not speculation: **no session-creation POST**
   (how does a device become a door session? host provisioning is Phase 7 —
   decide the Phase 5 provisioning seam: likely a management command +
   `issue_pair(scope="door")`, flagged amendment only if a client-facing
   route is truly needed) and **no passcode route** (the 6-digit pause/resume
   validation has no row — decide whether it rides the session resource as a
   sub-action amendment or a session-state field; flag whatever the audit
   concludes).
6. `frontend/types/api/dto.ts` — locked `DoorScanRequestDTO` (`session_id`,
   `ticket_id?`, `nfc_credential_id?`, `qr_payload?`, `scanned_at`,
   `offline`) and `DoorScanResultDTO` (`approved`, `ticket_status`,
   `verification_state`, `failure_reason?`, `tier_id`, `authorized_zones`).
   Extend only by flagged amendment.
7. `frontend/services/api/ports.ts` (`DoorPort` — the swap target; it has
   ONLY `submitScan`/`reconcile` while the registry has 7 door rows — port
   method additions are frontend-internal, the Phase 4 `listWallet`
   precedent) + `mockAdapters.ts` (the mock door port shows the intended
   verdict semantics incl. `canTierAccessZone`) + `services/doorModeService.ts`
   / `doorModeOperationsService.ts` / `accessControlService.ts` + the door
   screens and stores.
8. `docs/ECHO_Staging_Deploy_Notes.md` — staging state and checklist (Phase 4
   added credential-key + PassKit asset steps; Phase 5 adds door-device
   provisioning).

## Locked decisions and standing rules (restated)

- Stack: Django 5 + DRF + PostgreSQL + Redis + Celery on AWS (D1). Monorepo
  (D2). Contract v1.0 implemented as-is; conflicts flagged, never silently
  diverged from (D4).
- **Scan verdict at <500ms**: signature, ticket status, age badge, zone
  authorization, duplicate detection. The hot path is indexed lookups only —
  no external calls, no unindexed scans. Duplicate inside a 5-minute window →
  **alert, not block** (approved with a flag the client renders as an alert).
- **Serial-only validation is disallowed** (locked platform rule): every
  accepted scan verifies a server-signed payload (`verify_validation_token`)
  or an offline-bundle equivalent with the same refusal semantics. A bare
  `ticket_id` with no token never approves.
- **Offline bundle**: pre-signed credential cache per event — the public key
  plus the per-ticket snapshot a door device needs to produce the SAME
  verdicts offline that the server would produce online (rotating-credential
  nonce checks are impossible offline by construction; the bundle documents
  what it relaxes and reconciliation re-derives server truth). Bundle
  generation is `door`-scoped and audited.
- **Reconciliation**: offline ledgers merge to server truth; duplicate scans
  resolved by server timestamp; idempotent (both routes are
  idempotency-flagged in the registry — use `IdempotencyMixin`, the locked
  platform rule).
- **Door purchases** ride the Phase 3 checkout engine (server pricing, atomic
  holds, Stripe confirm, ticket issuance) under `door` scope — reuse
  `checkout.services`; flag anything that genuinely differs (walk-up buyer
  identity is the expected wrinkle — audit `checkout.models.CheckoutIntent.user`
  and decide; a flagged amendment beats a parallel model).
- **Closeout artifacts**: attendance CSV, denied-attempt log, throughput
  analytics — derived from scan records + audit entries. v1.0 has no closeout
  routes; generate via management command / internal tooling and flag the
  v1.1 surface (do NOT invent unregistered client routes; the drift script
  enforces this).
- Error envelope / cursor pagination / 429 / audit exactly as built in
  `backend/core` and used by Phases 1–4. Scan/reconcile write audit entries.
- Social Energy doctrine unchanged (no raw counts on any wire payload).

## Preconditions (gates — surface and wait, don't fill the wait with code)

- **Staging is still unprovisioned** — the staging step inherits ALL owed
  swaps (identity + discovery + checkout + ticket + door; curl S-01→S-07;
  Stripe test keys; `ECHO_CREDENTIAL_SIGNING_KEY`; Apple pass certs; the
  one-time DB reset + `seed_events`). **No Docker on this machine** — compose
  steps are the operator's.
- **One native build is owed** (expo-secure-store + Sentry RN + Stripe RN
  from Phases 1/3). Real NFC tag reading / camera QR scanning on the door
  screens would need native modules that are NOT installed — the Phase 5 swap
  is transport-only (the port). If a door screen genuinely requires a native
  scanner module to exercise the live path, flag it into the owed build;
  do not install it unilaterally.
- **v1.1 lock still pending** — nag the operator; Phases 7–8 are gated on it.
  The Phase 1–4 registry/DTO amendments (auth refresh/logout; EventDTO +
  saved-events read; CheckoutIntentDTO + confirm `tickets[]` +
  `donation_campaign`; **`TicketDTO.intent_id`**) all await formal sign-off;
  treat them as locked-in-practice (merged and drift-checked).

## Workstreams

**W1 — Door sessions + device trust.** Session model on a new `door` app
(event-scoped, device-bound, expiring), door-scoped tokens via the existing
`identity.tokens` machinery, `GET /v1/door/sessions/:sessionId`, and the
6-digit pause/resume passcode (hashed at rest, never logged; validation
server-side; resolve the missing-route question per Inputs #5 and flag the
outcome). Provisioning seam per audit (management command until Phase 7 host
tooling). Audited lifecycle. Tests: scope enforcement (user tokens refused on
door routes and vice versa), expiry, passcode attempts.

**W2 — Scans.** `POST /v1/door/scans` (idempotent): resolve the ticket via
`qr_payload`/`validation_token` → `verify_validation_token` (accept both
`typ=credential` and `typ=pkpass`; small `leeway_seconds` per audit) or via
`nfc_credential_id` lookup → equivalent checks. Verdict maps refusal codes →
locked `DoorScanResultDTO` (`verification_state` mirrors the client's
`DoorVerificationState` — audit it); age badge from the event; zone
authorization (audit `accessControlService.canTierAccessZone` for the locked
tier→zone semantics — the server needs an equivalent, not a new Zone schema
unless the audit proves one; flag if so); 5-minute duplicate → approved +
alert flag. Scan rows persisted (they feed reconciliation + closeout).
<500ms: `select_related` the whole chain, index what the lookups touch.
Throttle: the `door` bucket (600/min). Tests: every refusal code, duplicate
window, both token types, revoked-mid-scan.

**W3 — Offline bundles + reconciliation.** `POST
/v1/door/sessions/:sessionId/offline-bundle`: public key +
per-event snapshot (per-admission: ticket id, current `nfc_credential_id`,
status, tier, age badge, zones) sized and shaped so the device can produce
server-equivalent verdicts; document explicitly what offline relaxes
(rotating nonce freshness) and version the bundle format. `POST
/v1/door/reconcile` (idempotent): merge an offline ledger of
`DoorScanRequestDTO[]`; duplicates resolved by server timestamp; conflicting
offline approvals reconciled to server truth and audited. Tests: bundle
shape/versioning, ledger merge, duplicate resolution, replayed reconcile.

**W4 — Door purchases.** `POST /v1/door/purchase/intents` + `/confirm` +
`GET /v1/door/purchase/intents/:id` riding `checkout.services` (holds,
pricing, Stripe gateway, ticket issuance — the Phase 3 engine, reused). Door
scope, per-session throttle, audited. Resolve walk-up buyer identity via
audit (see locked decisions). Age-gated events still cannot complete live
checkout until Phase 6 — same gate, don't fight it at the door either.

**W5 — Frontend swap (DoorPort).** Http adapter for `DoorPort` on `apiCall`;
frontend-internal port additions for session/bundle/purchases as the screens
need them (the `listWallet` precedent); bind env-gated
(`EXPO_PUBLIC_ECHO_DOOR_MODE`, mock default) exactly like the other domains.
Door screens/services ride `getPorts().door`; scan results render the locked
result shape (tier color is a client mapping from `tier_id`). Mock door port
stays the default and keeps working. Strict `npx tsc --noEmit` stays clean.

**W6 — Staging swap + verification.** Execute/finish the staging checklist
(operator involvement for AWS/DNS/secrets/Stripe/pass certs/door device
provisioning); deploy; curl S-07 (+ everything still owed); live E2E: buy →
credential → scan approves → duplicate scan alerts → revoked ticket refuses →
offline bundle fetched → reconcile merges. Backend pytest + ruff +
contract-drift + `makemigrations --check` green; frontend strict tsc.
Device/web smoke is the operator's.

## Out of scope

Circles & age verification (Phase 6); host tooling for door-session
provisioning, closeout report UI, payouts (Phase 7); ticket transfer, push,
trust scoring (Phase 8); the PassKit web service (pass updates — documented
slot in `tickets/passkit.py`; if it ever lands it rides the drift script's
`SERVER_TO_SERVER` allowlist); Google Wallet (v1.2, locked deferral).

## Amendments carried from Phase 4 (do not rediscover these)

- **The credential verification primitives are locked API** (see Inputs #3).
  Door verdicts BUILD ON `verify_validation_token` and its refusal codes —
  extending the codes is fine; re-deriving signature/status/nonce logic in
  the door app is not.
- **`TicketDTO.intent_id`** is a merged flagged amendment (sign-off pending).
  `TicketSerializer` lives in `tickets/serializers.py` (moved from checkout);
  S-05 confirm and S-06 serve the same shape.
- **Cross-install wallet hydration is deferred, deliberately**: `listWallet`
  is complete on port/mock/http/backend but has NO ticketStore consumer —
  `TicketDTO` carries no pricing by design, so purchase-card reconstruction
  needs intent reconciliation. It is NOT Phase 5 scope; leave it unless the
  operator pulls it in.
- **pkpass barcode tokens are long-lived by design** (`typ=pkpass`, exp =
  event end, not nonce-checked) — a Wallet pass cannot rotate without the
  deferred PassKit web service. Door scans must accept them; revocation still
  bites via ticket status.
- **`ticketStatus` serves `{ticket_id, status}`** — audit-produced shape (no
  DTO was locked for the row).
- **`AddToWalletSheet` still fakes success** — wiring it to
  `POST .../apple-wallet` joins the owed native build conversation; not door
  scope.
- **Schema enum-name collisions**: `SPECTACULAR_SETTINGS["ENUM_NAME_OVERRIDES"]`
  is the mechanism (`TicketStatusEnum` is pinned there; a door
  `verification_state` enum may need the same treatment — the drift run
  surfaces it as a warning, treat warnings as failures).
- **Test-suite conventions that bit us**: no freezegun in requirements-dev —
  drive expiry via `settings.ECHO_CREDENTIAL_TTL_SECONDS` overrides or direct
  row edits; DRF throttle rates are captured by reference at import — mutate
  `ThrottleClass.THROTTLE_RATES` via `monkeypatch.setitem`, never replace
  `settings.REST_FRAMEWORK`; per-app `tests/conftest.py` mirrors
  checkout/tickets (bearer fixtures, factories, autouse signer-cache reset).
- **Environment drift bites**: run `pip install -r requirements.txt` (venv at
  `backend/.venv`) and `npm install` in `frontend/` before diagnosing
  anything.

## Working rules (same as Phases 0–4)

- Audit before questions, audit before code. Bring only questions the audit
  produced, one at a time.
- One phase-5 branch (worktree: `git worktree add -b phase-5/door-mode
  ../echo-phase-5 main`), clean per-workstream commits; frontend and backend
  in separate commits; flagged contract changes in a `contracts:` commit.
  Nothing lands half-done.
- Verification bar: backend tests green + drift green; frontend strict tsc
  clean. No "should work" claims — run the checks. Do not launch the app to
  verify — the operator smokes it.
- PRs: open the PR with CI green, then **stop — the operator merges**
  (Phase 4 precedent: auto-merging your own PR is permission-denied by
  design).
- Finish by delivering: change list (file per line, one-line reason),
  exit-criteria status (met / not met / deferred with reason), and anything
  that should amend Phase 6's kickoff.
