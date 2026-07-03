# ECHO Backend — Phase 0 Kickoff (Foundations) — V1

Parent doc: `ECHO_Backend_Master_Plan_V1.md` (decisions D1–D4 locked there).
Run this phase in its own session. Audit before questions; audit before code.

## Goal

At the end of Phase 0: the ECHO monorepo exists; the frontend runs unchanged but now
routes all data through the `bindPorts(mockPorts)` seam; a skeleton Django backend
deploys to staging and answers `GET /v1/config/public` with the locked envelope and
middleware in place; contract v1.1 is drafted and circulated for lock.

No product endpoints beyond `config/public` are in scope. No screens change.

## Preconditions

- `ECHO_Frontend_v59.zip` and `ECHO_Backend_Readiness_API_Layer.zip` (the six files:
  `types/api/{shared,endpoints,dto}.ts`, `services/api/{apiClient,mappers,ports}.ts`,
  `docs/ECHO_Backend_Handoff.md`).
- AWS account + domain decision for the API host (handoff doc placeholder:
  `https://api.echo.app`; frontend `constants/config.ts` currently says
  `https://api.echo.events` — **reconcile this drift when wiring config**, it is the
  first live conflict between the two packages).
- Stripe account (test mode) — not wired this phase, but the keys/env slots get created.

## Workstreams

### W1 — Repo init (D2)

- Create `echo/` monorepo: `frontend/` = extracted v59 app, `backend/` = new Django
  project, `docs/` = the ECHO_*.md corpus (move the build notes out of the app root),
  plus the two plan docs.
- Git hygiene from day one: `main` protected, branch-per-task, worktree-friendly.
- Frontend must still boot (`npx expo start`) and typecheck (`npx tsc --noEmit`)
  from the new location before anything else lands.

### W2 — Readiness-layer merge + mockPorts (frontend)

- Merge the six readiness files into `frontend/` at their package paths. Known repo
  dependencies the handoff doc names: `zustand`, `constants/eventMedia`, and
  `utils/dashboardScoring.ts` → `types/dashboard` (already in the repo; resolves on merge).
- Note the frontend already has a different, older `services/apiClient.ts` — the
  readiness layer's client lives at `services/api/apiClient.ts`. Decide in-session
  whether the old one is referenced anywhere; if dead, delete it explicitly.
- Write `services/api/mockAdapters.ts` (name per repo convention): a `mockPorts`
  implementation of `EchoPorts` wrapping the existing mock services
  (`mockEvents`/`eventStore` seeds → DiscoveryPort, `checkoutIntentService` →
  CheckoutPort, `accessPassService`/`ticketStore` → TicketPort,
  `doorModeOperationsService` → DoorPort, `circleStateModel`/`circleMock` → CirclePort,
  `botRiskService` feed → TrustPort).
- Call `configureApiClient(...)` + `bindPorts(mockPorts)` at startup (`app/_layout.tsx`
  or an init module). App behavior must be pixel-identical; strict tsc clean.
- Screens do NOT migrate to ports in this phase. Store-by-store migration to
  `getPorts()` happens inside each later phase's swap step. (Exception: if a store can
  adopt a port with zero behavior change and it helps validate the seam, one exemplar
  store — discovery — may migrate; flag it in the change list.)

### W3 — Backend scaffold (D1)

- Django 5 + DRF project, Postgres, Redis, Celery (+ beat), pinned Python version,
  `.env`-driven settings, per-env settings modules.
- Platform middleware/utilities — these are the contract, build them before any model:
  - Error envelope: every non-2xx response is `{ error: { code, message, details? } }`.
  - Idempotency: `Idempotency-Key` header persistence + replay table (key, scope,
    request hash, response snapshot, TTL); flagged mutations 400 without a key
    (`idempotency_key_required` — matches the client's local rejection code).
  - Rate limiting (Redis-backed), per-scope defaults; 429 with retryable semantics.
  - Cursor pagination helpers returning `{ items, nextCursor? }`.
  - `echo_id` (UUIDv7) primary keys + `public_id` (Crockford Base32 w/ checksum)
    generation utilities.
  - Auth scaffolding for scopes `public/guest/user/door/host/admin` (enforcement
    wiring only; real identity is Phase 1).
- `GET /v1/config/public` implemented for real (feature flags, min-version, fee display
  constants) — the one live endpoint proving the stack end-to-end.
- OpenAPI schema generation + a CI check that diffs served paths/methods against
  `frontend/types/api/endpoints.ts` (the drift alarm for D4/v1.0).

### W4 — Environments & CI

- dev (local docker-compose: Postgres/Redis), staging (AWS), prod (AWS, empty for now).
- CI: backend lint + tests + OpenAPI diff; frontend `tsc --noEmit`.
- Sentry (backend + frontend), structured logging, migration workflow documented.

### W5 — Contract v1.1 draft (D4)

Author `ECHO_API_Contracts_v1.1` covering, at minimum: host onboarding/profiles; event
create/update/publish + flyer upload/extract; dashboard/reports/closeout; promotions;
payouts (Stripe Connect onboarding/status/history); ticket transfer; refunds; ECHO'd
reflections; notifications (token registration, feed, preferences); insider
(applications/missions/feedback/ledger); nonprofit verification + campaigns + closeout
CSV. Same conventions as v1.0 (scopes, idempotency flags, DTO style). Circulate for
lock; Phases 7–8 are gated on it. Presale/promo-code validation: include or explicitly
defer with a note.

## Out of scope

Real auth, any Stripe call, any product model beyond config, screen edits, http
adapters, provider selection (D3 — evaluation may start, decision not due).

## Exit criteria

1. Monorepo builds: frontend boots + strict-typechecks; backend tests green in CI.
2. App runs through `bindPorts(mockPorts)` with zero visible change.
3. Staging returns `GET /v1/config/public` with envelope/rate-limit/pagination
   middleware active and OpenAPI diff passing.
4. v1.1 draft exists in `docs/` and is circulated for lock.
5. Change list delivered (file-per-line with reasons), including the resolved
   `api.echo.app` vs `api.echo.events` base-URL decision.

## Known risks / watch items

- The readiness layer was authored against a slightly different tree than v59
  (it references `dashboard.ts` and services the handoff says live "in the repo") —
  expect small reconciliation edits; flag any real contract conflict rather than
  adapting silently.
- `newIdempotencyKey()` in the readiness client is `Math.random`-based with a note to
  replace with `crypto.randomUUID` — do that during the merge (Stripe scaffold note
  requires v4 UUIDs).
- Frontend has no test suite; the merge's safety net is strict tsc + boot smoke.
