# ECHO — Phase 2 Session Prompt

Paste everything below the line into a fresh Claude Code session started in
`/Users/ramonhidalgo/Projects/echo`. Authored at Phase 1 close (2026-07-02);
amendments discovered during Phase 1 are folded in.

---

You are working in `/Users/ramonhidalgo/Projects/echo`, executing **Phase 2
(Events & discovery)** of the ECHO backend buildout. Phases 0–1 are merged to
`main`: the platform middleware (envelope, idempotency, per-scope throttles,
cursor pagination, `core.ids`, scopes) serves a real identity stack — Apple/
Google JWKS verification (credential-gated), guest sessions, rotating refresh
tokens with reuse detection, `/v1/me` + flags, an append-only audit log — and
the frontend auth domain rides it behind `EXPO_PUBLIC_ECHO_AUTH_MODE`
(mock default). All planning decisions are locked — do not re-open them.

## Inputs (read in this order before touching anything)

1. `docs/ECHO_Backend_Master_Plan_V1.md` — locked decisions D1–D4, standing
   rules, roadmap. This session is Phase 2 only.
2. This prompt's workstreams below (Phase 2 has no separate kickoff doc; this
   is it).
3. `backend/core/` + `backend/identity/` + `backend/audit/` — platform and
   identity utilities you MUST reuse (envelope, throttles, pagination,
   `core.ids`, `HasRequiredScope`, `audit.service.record`). New endpoints
   adopt them, never reimplement.
4. `frontend/types/api/endpoints.ts` — the locked v1.0 registry (S-03 rows:
   `events`, `eventDetails`, `eventInventory`, `saveEvent`, `unsaveEvent` are
   this phase's surface) and `frontend/types/api/dto.ts` (`EventDTO` is the
   locked wire shape; extend only by flagged amendment).
5. `frontend/services/api/ports.ts` + `mockAdapters.ts` + the discovery/event
   stores and `frontend/services/mock.ts` — the `DiscoveryPort` swap target
   and the mock event corpus that becomes seed data.
6. `frontend/types/socialEnergy.ts` (+ any social-energy service) — the
   doctrine's domain shape. **Never expose raw attendance counts through any
   API surface: labels and 0..1 intensity only.**
7. `docs/ECHO_Staging_Deploy_Notes.md` — staging state and checklist.

## Locked decisions and standing rules (restated)

- Stack: Django 5 + DRF + PostgreSQL + Redis + Celery on AWS (D1). Monorepo
  (D2). Contract v1.0 implemented as-is; conflicts flagged, never silently
  diverged from (D4).
- Base URL `https://api.echo.events` (staging `api-staging.echo.events`).
- IDs: `echo_id` UUIDv7 pk via `core.models.EchoIdModel`; `public_id`
  Crockford via `core.ids.new_public_id` (events use the `EV` prefix per the
  `EV-…` example in `core.ids`).
- Error envelope / cursor pagination (`Paged<T>` = `items`/`nextCursor`) /
  429 semantics exactly as built in `backend/core`.
- None of the S-03 endpoints are idempotency-flagged — do not add keys.
- Scopes per registry: discovery reads are `public`; saved-events are `user`.
- Audit log: destructive/financial operations write entries; for this phase
  that means publish-state transitions by workers (`event.published`,
  `event.sales_opened`) and any admin/seed mutation of live events.
- Definition of done: endpoints to contract → `DiscoveryPort` http adapter →
  staging swap for this domain only → mock event service demoted to seed
  fixtures → smoke (operator's, not Claude's — deliver tsc-clean +
  tests-green and stop).

## Preconditions (gates — surface and wait, don't fill the wait with code)

- **Staging may still be unprovisioned** — Phase 1's W4 swap was gated on the
  AWS/DNS/secrets checklist and may not have run. If so, this phase's staging
  step inherits BOTH swaps (deploy identity + discovery, curl S-01 + S-03,
  smoke both). Backend work proceeds locally first; say explicitly when you
  reach the gate.
- **Dev/staging Postgres created before Phase 1 must be reset once**
  (`docker compose down -v` + fresh `migrate`) — `AUTH_USER_MODEL` swapped in
  Phase 1 after Phase 0's migrations ran. Do not debug migration failures
  past this known cause.
- No new credential gates: Apple/Google credentials remain open from Phase 1
  but do not block discovery. Stripe is Phase 3.

## Workstreams

### W1 — Catalog models + seed corpus

- Models (all on `EchoIdModel`): `Venue`, `Event` (with `public_id` prefix
  `EV`), `TicketTier`, per-tier inventory counts. Publish lifecycle fields:
  `publish_at`, `sales_start_at`, event start/end, and a status the workers
  advance (draft → published → on_sale → live → ended per the frontend's
  `EventStatus`). Validation enforces the locked ordering
  (publish ≤ sales start ≤ event start) at the model boundary.
- Social Energy stored per doctrine: persist whatever inputs the engine
  needs, but the API emits only `atmosphere_label` + 0..1 intensity. No raw
  counts in any serializer, ever — test for this explicitly.
- Management command seeding the catalog from the mock event corpus
  (`frontend/services/mock.ts`) so staging demos the real app content.
  Seeding is idempotent (safe to re-run).

### W2 — Discovery endpoints (S-03)

- `GET /v1/events` — cursor-paginated (platform pagination), visible =
  published only; filters per what the frontend discovery surface actually
  uses (audit the store/screens first; likely category/featured/date).
- `GET /v1/events/:eventId`, `GET /v1/events/:eventId/inventory` — public
  scope; inventory returns availability shaped for the tier picker without
  leaking exact counts if the doctrine/audit says they're sensitive — flag
  what you find.
- `POST /v1/saved-events` + `DELETE /v1/saved-events/:eventId` — scope
  `user`, backed by a join model on the Phase 1 `User`.
- Per-IP moderate limits on discovery reads (the master plan's compliance
  note): anonymous traffic already throttles per-IP via the platform classes;
  set/confirm sane `public` rates for list endpoints.

### W3 — Scheduled-publish workers

- Celery beat tasks advancing the lifecycle: `publish_at` reached → visible,
  `sales_start_at` reached → purchasable, event end → ended. Idempotent,
  clock-skew tolerant (re-running never double-fires), each transition writes
  an audit entry. Locked ordering validation prevents impossible schedules at
  write time; workers only advance, never invent state.
- Tests run eager (`CELERY_TASK_ALWAYS_EAGER` in test settings, from Phase 0).

### W4 — Frontend swap (`DiscoveryPort` only)

- Build the http adapter for `DiscoveryPort` on `apiCall` + the locked
  `EventDTO` mappers; bind it for the discovery domain only — every other
  port stays mock. Audit `ports.ts`/stores first and recommend the exact
  binding seam (mirror how Phase 1 gated auth: env-gated, mock default until
  staging smoke).
- Mock event data is demoted to seed fixtures, not deleted, until the
  operator smokes staging.
- No other store migrates. Strict `npx tsc --noEmit` stays clean.

### W5 — Staging swap + verification

- Execute/finish the staging checklist (operator involvement for AWS/DNS/
  secrets); deploy; run the one-time DB reset note above if it applies;
  `curl` S-03 (+ S-01 if Phase 1's smoke is still owed); backend pytest +
  ruff + contract-drift + `makemigrations --check` green; frontend strict
  tsc. Device/web smoke is the operator's.

## Out of scope

Checkout/payments/pricing (Phase 3); tickets/credentials/wallet (Phase 4);
door mode (Phase 5); circles + age verification (Phase 6); host-authored
event creation/publishing UI or endpoints (Phase 7 — this phase's events are
seeded/back-office only); ECHO'd/push/transfers (Phase 8); admin console.

## Amendments carried from Phase 1 (do not rediscover these)

- **Registry amendment accepted:** `POST /v1/auth/refresh` and
  `POST /v1/auth/logout` were added to the locked registry (v1.0 omitted
  them; rotation/revocation is unimplementable without them) and merged with
  Phase 1. Treat them as locked.
- **Native build owed:** `expo-secure-store` landed in Phase 1 — the next
  dev build must be rebuilt (fingerprint change). Per the deploy-notes slot,
  install the Sentry RN SDK with whichever phase cuts that build; the DSN
  comes from staging checklist step 5.
- **Apple/Google credential gate still open** (backend 503s
  `auth_not_configured`; `frontend/services/auth/platformSignIn.ts` is the
  client stub seam). Does not block Phase 2.
- **v1.1 lock still pending, 4 open questions** — nag the operator; Phases
  7–8 are gated on it. Flagged v1.1 candidates from Phase 1: an
  account-deletion endpoint (App Store requirement before launch) and the
  contract-less email/password screens (remove vs. amend).
- Throttle infrastructure already keys authenticated traffic by user/device
  ident (Phase 1); anonymous stays per-IP — W2 only tunes rates.

## Working rules (same as Phases 0–1)

- Audit before questions, audit before code. Bring only questions the audit
  produced, one at a time.
- One `phase-2` branch (worktree `git worktree add -b phase-2/discovery
  ../echo-phase-2 main`), clean per-workstream commits; frontend and backend
  in separate commits. Nothing lands half-done.
- Verification bar: backend tests green + drift green; frontend strict tsc
  clean. No "should work" claims — run the checks. Do not launch the app to
  verify — the operator smokes it.
- Finish by delivering: change list (file per line, one-line reason),
  exit-criteria status (met / not met / deferred with reason), and anything
  that should amend Phase 3's kickoff.
