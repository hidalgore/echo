# ECHO — Phase 1 Session Prompt

Paste everything below the line into a fresh Claude Code session started in
`/Users/ramonhidalgo/Projects/echo`. Authored at Phase 0 close (2026-07-02);
amendments discovered during Phase 0 are folded in.

---

You are working in `/Users/ramonhidalgo/Projects/echo`, executing **Phase 1
(Identity & platform core)** of the ECHO backend buildout. Phase 0 is merged to
`main`: the frontend strict-typechecks and routes through `bindPorts(mockPorts)`;
`backend/` is a Django 5.2 + DRF scaffold whose platform middleware (error
envelope, Idempotency-Key replay, per-scope rate limits, cursor pagination,
UUIDv7/Crockford id utilities, scope scaffolding) is built and tested, serving
one endpoint: `GET /v1/config/public`. All planning decisions are locked — do
not re-open them.

## Inputs (read in this order before touching anything)

1. `docs/ECHO_Backend_Master_Plan_V1.md` — locked decisions D1–D4, standing
   rules, roadmap. This session is Phase 1 only.
2. This prompt's workstreams below (Phase 1 has no separate kickoff doc; this
   is it).
3. `backend/core/` — the platform utilities you MUST reuse (envelope,
   idempotency mixin, throttles, pagination, `core.ids`, `core.scopes`).
4. `frontend/types/api/endpoints.ts` — the locked v1.0 registry (S-01/S-02
   rows are this phase's surface).
5. `frontend/stores/authStore.ts` + `frontend/services/api/apiClient.ts` — the
   swap target and the transport it will ride.
6. `docs/ECHO_Staging_Deploy_Notes.md` — the staging provisioning checklist
   (deferred from Phase 0; becomes real this phase).

## Locked decisions and standing rules (restated)

- Stack: Django 5 + DRF + PostgreSQL + Redis + Celery on AWS (D1). Monorepo
  layout (D2). Contract v1.0 implemented as-is; conflicts flagged, never
  silently diverged from (D4).
- API base URL is **`https://api.echo.events`** (locked in Phase 0; staging is
  `api-staging.echo.events`).
- Error envelope / cursor pagination / idempotency / 429 semantics exactly as
  built in `backend/core` — new endpoints adopt them, never reimplement.
- IDs: `echo_id` UUIDv7 internal, `public_id` Crockford Base32 display-only
  (`core.ids` provides both).
- Audit log: append-only, server-side, **starts this phase**; auth events and
  every destructive/financial operation write entries from day one.
- Definition of done: endpoints to contract → frontend http adapter → staging
  swap for this domain only → mock demoted to seed/fallback → smoke (smoke is
  performed by the operator, not Claude — deliver tsc-clean + tests-green and
  stop).

## Preconditions (gates — surface and wait, don't fill the wait with code)

- **Staging must be provisioned** (checklist in
  `docs/ECHO_Staging_Deploy_Notes.md`) before the staging-swap step. Backend
  work can proceed locally first; say explicitly when you reach the gate.
- **Apple credentials**: Team ID, bundle ID, and Sign in with Apple key/JWKS
  expectations for identity-token verification.
- **Google credentials**: OAuth client ID(s) for ID-token verification.
- If any credential is missing at the point of wiring, stub the verifier
  behind an interface with tests against recorded/fixture tokens and flag the
  gap — do not fake a passing verifier.

## Workstreams

### W1 — Identity backend (models + token verification)

- Models (all on `core.ids` UUIDv7 pks): `User`, `Device` (device records per
  the master plan), refresh-token/session records with rotation + revocation.
  Access tokens short-lived; refresh rotation invalidates the predecessor.
- `POST /v1/auth/apple` and `POST /v1/auth/google`: verify the platform
  identity token server-side (Apple JWKS / Google certs), create-or-attach the
  user + device, issue access+refresh.
- `POST /v1/sessions/guest`: anonymous guest session with `guest` scope.
- Replace `core.scopes.resolve_request_scope` (the single seam Phase 0 left)
  with real token verification → granted scope; everything else in
  `core.scopes` stays.
- Wire authenticated identities into the per-scope throttles (ident = user id
  instead of IP where a user exists — the Phase 0 throttle classes note this).

### W2 — Me surface + audit log

- `GET /v1/me`, `PATCH /v1/me`, `POST /v1/me/flags` per the registry (scope
  `user`).
- Audit log service: append-only model + writer API used by the auth flows
  (login, token refresh, revocation, profile mutation). No read API this phase
  beyond Django admin/shell.

### W3 — Frontend swap (auth domain only)

- Auth is not an `EchoPorts` port; swap `authStore.initialize` (and its login
  paths) to a small auth service calling `apiCall` against the S-01 endpoints.
  Audit `authStore` before deciding the exact seam — recommend and flag it.
- Token storage: secure storage on native, with the
  `apiClient.getAuthToken` hook feeding the bearer + a refresh-on-401 path
  (decide single-flight refresh handling in-session; flag the design).
- Mock auth is demoted to a dev fallback (e.g. env-gated), not deleted, until
  the staging swap is smoked by the operator.
- No other store migrates. Strict `npx tsc --noEmit` stays clean.

### W4 — Staging swap + verification

- Execute the staging checklist (operator involvement for AWS/DNS/secrets).
- Deploy backend to staging; `curl` the S-01/S-02 surface; point a dev build's
  env at staging for the auth domain only.
- Backend: pytest green, ruff clean, contract-drift script green (the new
  endpoints already exist in the locked registry), `makemigrations --check`
  clean. Frontend: strict tsc. Device/web smoke is the operator's.

## Out of scope

Any discovery/checkout/ticket/door/circle endpoint; age verification
(`/v1/me/verification/*` is Phase 6); push tokens (v1.1 / Phase 8); Stripe;
admin console; frontend Sentry SDK **unless** this phase cuts a native build
(then install it per the deploy-notes slot).

## Amendments carried from Phase 0 (do not rediscover these)

- `core.scopes.resolve_request_scope` is the intended single replacement
  point; `HasRequiredScope` and the hierarchy stay as-is.
- The idempotency mixin exists but S-01/S-02 endpoints are not flagged
  idempotent in the registry — do not add keys the contract doesn't require.
- v1.1 draft (`docs/ECHO_API_Contracts_v1.1_DRAFT.md`) is circulating for
  lock with 4 open questions; not blocking Phase 1, but nag the operator —
  Phases 7–8 are gated on it.
- Consider serving the flyer-extract confidence threshold via
  `/v1/config/public` when v1.1 locks (open question #1) — no action now.

## Working rules (same as Phase 0)

- Audit before questions, audit before code. Bring only questions the audit
  produced, one at a time.
- One `phase-1` branch with clean per-workstream commits; frontend and backend
  in separate commits. Nothing lands half-done.
- Verification bar: backend tests green + drift green; frontend strict tsc
  clean. No claims of "should work" — run the checks. Do not launch the app
  to verify — the operator smokes it.
- Finish by delivering: change list (file per line, one-line reason),
  exit-criteria status (met / not met / deferred with reason), and anything
  that should amend Phase 2's kickoff.
