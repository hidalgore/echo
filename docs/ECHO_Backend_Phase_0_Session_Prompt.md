# ECHO — Phase 0 Session Prompt

Paste everything below the line into a fresh Claude Code session started in
`/Users/ramonhidalgo/Projects/echo`.

> Note (2026-07-02): the monorepo bootstrap portion of W1 is already done — the repo
> exists at `/Users/ramonhidalgo/Projects/echo` and is pushed to
> `git@github.com:hidalgore/echo.git`. The prompt below reflects that.

---

You are working in `/Users/ramonhidalgo/Projects/echo`, executing **Phase 0
(Foundations)** of the ECHO backend buildout. ECHO is a trusted-access /
event-ticketing platform. The frontend is a complete, mock-driven Expo app; no backend
exists yet. All planning is done and all decisions are locked — do not re-open them.

## Inputs (read in this order before touching anything)

1. `docs/ECHO_Backend_Master_Plan_V1.md` — locked decisions D1–D4, standing rules, and
   the 9-phase roadmap. This session is Phase 0 only.
2. `docs/ECHO_Backend_Phase_0_Kickoff_V1.md` — the full spec for this session:
   workstreams W1–W5, out-of-scope list, exit criteria, watch items.
3. `frontend/` — the v59 app, already imported.
4. `readiness-layer/` — the six-file API contract layer to merge into `frontend/`
   (its handoff doc is `readiness-layer/docs/ECHO_Backend_Handoff.md`).

## Locked decisions (from the master plan — restated so there is no ambiguity)

- Stack: Django 5 + DRF + PostgreSQL + Redis + Celery, AWS. No Supabase, no Node backend.
- Layout: this monorepo — `frontend/` (app), `backend/` (new Django project, you create
  it), `docs/` (plans + the ECHO_*.md corpus in `docs/app-history/`).
- Contract v1.0 (`readiness-layer/types/api/endpoints.ts`) is implemented as-is;
  conflicts are flagged, never silently diverged from. v1.1
  (host/transfer/notifications/etc.) is *drafted* this session, not implemented.

## What this session must produce (summary — the kickoff doc is authoritative)

- W1 (remainder): frontend boots (`npm install` + `npx expo start`) and
  strict-typechecks (`npx tsc --noEmit`) from `frontend/`. Fix import paths if the
  docs-corpus move broke any (build notes moved to `docs/app-history/`).
- W2: readiness layer merged into `frontend/` at its package paths
  (`types/api/`, `services/api/`), then `readiness-layer/` removed with `git rm` in the
  same change. Write a `mockPorts` adapter wrapping the existing mock services; call
  `configureApiClient` + `bindPorts(mockPorts)` at startup. App behavior
  pixel-identical. Screens do not migrate to ports this session.
- W3: `backend/` Django scaffold with the platform middleware built BEFORE any product
  model: locked error envelope, Idempotency-Key persistence/replay, Redis rate
  limiting, cursor pagination, UUIDv7 `echo_id` + Crockford Base32 `public_id`
  utilities, scope scaffolding. One real endpoint: `GET /v1/config/public`.
  OpenAPI generation + CI diff against `frontend/types/api/endpoints.ts`.
- W4: local docker-compose (Postgres/Redis), CI (backend lint+tests+OpenAPI diff;
  frontend tsc), Sentry slots, staging deploy notes (actual AWS provisioning may be
  deferred to a checklist if credentials aren't at hand — say so explicitly if so).
- W5: `docs/ECHO_API_Contracts_v1.1_DRAFT.md` covering the gap list in the kickoff doc.

## Known conflicts to resolve (flag your resolution in the change list)

- API base URL drift: the handoff doc says `api.echo.app`, frontend
  `constants/config.ts` says `api.echo.events`. Pick one, document it.
- The frontend has an older `services/apiClient.ts`; the readiness layer adds
  `services/api/apiClient.ts`. Check whether the old one has callers; delete it
  explicitly if dead.
- Replace the readiness layer's `Math.random`-based `newIdempotencyKey()` with
  `crypto.randomUUID` during the merge (v4 UUID is required by the Stripe contract).

## Working rules

- Audit before questions, audit before code: read the kickoff doc and the actual files
  before asking anything. Bring only questions the audit produced, one at a time.
- Work on a branch per workstream (or one `phase-0` branch with clean per-workstream
  commits). Frontend and backend changes in separate commits. Nothing lands half-done.
- Verification bar: frontend `npx tsc --noEmit` strict-clean + app boots; backend
  tests green. No claims of "should work" — run the checks.
- Finish by delivering: the change list (file per line, one-line reason), exit-criteria
  status (met / not met / deferred with reason), and anything discovered that should
  amend Phase 1's kickoff.
