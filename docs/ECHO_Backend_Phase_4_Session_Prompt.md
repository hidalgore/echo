# ECHO — Phase 4 Session Prompt

Paste everything below the line into a fresh Claude Code session started in
`/Users/ramonhidalgo/Projects/echo`. Authored at Phase 3 close (2026-07-03);
amendments discovered during Phase 3 are folded in.

---

You are working in `/Users/ramonhidalgo/Projects/echo`, executing **Phase 4
(Credentials & wallet)** of the ECHO backend buildout. Phases 0–3 are merged
to `main`: the platform middleware (envelope, idempotency store, per-scope
throttles, cursor pagination, `core.ids`, scopes) serves a real identity
stack, a real events catalog (S-03 + lifecycle workers + `seed_events`), and
the full revenue path (S-05 checkout intents with server pricing and atomic
inventory holds, Stripe gateway + webhooks, donations, and ticket issuance —
the `tickets` app writes one `Ticket` row per admission on confirm). The
frontend rides it all behind env gates: `EXPO_PUBLIC_ECHO_AUTH_MODE`,
`EXPO_PUBLIC_ECHO_DISCOVERY_MODE`, `EXPO_PUBLIC_ECHO_CHECKOUT_MODE` (mock
default). All planning decisions are locked — do not re-open them.

## Inputs (read in this order before touching anything)

1. `docs/ECHO_Backend_Master_Plan_V1.md` — locked decisions D1–D4, standing
   rules, roadmap. This session is Phase 4 only.
2. This prompt's workstreams below (Phase 4 has no separate kickoff doc; this
   is it).
3. `backend/core/` + `backend/identity/` + `backend/audit/` +
   `backend/events/` + `backend/checkout/` + `backend/tickets/` — platform
   and product code you MUST reuse. In particular: `tickets.models.Ticket`
   (the credential substrate — user/event/tier/intent FKs, locked
   TicketStatusDTO statuses, issued by `checkout.services.complete_intent`)
   and the audit writer (credential mint/refresh/revoke are
   security-relevant operations — they write entries).
4. `frontend/types/api/endpoints.ts` — the locked v1.0 registry (S-06 rows:
   `ticket`, `ticketStatus`, `ticketCredential`, `ticketRefresh` (POST, not
   idempotency-flagged), `ticketAppleWallet`, `wallet` are this phase's
   surface) and `frontend/types/api/dto.ts` (`TicketDTO`, `CredentialDTO`
   are the locked wire shapes; extend only by flagged amendment).
5. `frontend/services/api/ports.ts` (`TicketPort` — the swap target; NOTE it
   has get/getCredential/refreshCredential but **no wallet-list method**
   while `GET /v1/wallet` is in the registry — resolve via audit; a port
   method addition is frontend-internal, not a registry amendment) +
   `mockAdapters.ts` (`buildCredentialDTO` exercises the mock signing path) +
   `frontend/services/accessPassService.ts` (client-side credential signing —
   the locked rule DELETES/demotes this: the client never mints tokens) +
   the wallet/ticket screens and `stores/ticketStore.ts`.
6. `docs/ECHO_Staging_Deploy_Notes.md` — staging state, checklist (Stripe +
   checkout env steps landed in Phase 3; Phase 4 adds pass-signing assets).

## Locked decisions and standing rules (restated)

- Stack: Django 5 + DRF + PostgreSQL + Redis + Celery on AWS (D1). Monorepo
  (D2). Contract v1.0 implemented as-is; conflicts flagged, never silently
  diverged from (D4).
- **Server-signed rotating credentials:** short-lived QR payloads + NFC
  challenge-response, ~30s rotation (the client's
  `CONFIG.NFC_CREDENTIAL_ROTATE_INTERVAL_MS` = 30_000 is the locked cadence);
  serial-only validation is disallowed; **the client never mints tokens** —
  `accessPassService`'s signing becomes display logic or is deleted.
- `CredentialDTO` (locked): `{ ticket_id, nfc_credential_id?, qr_payload?,
  validation_token, expires_at }` — validation_token is server-signed.
- Credential lifecycle follows ticket status: revoked/expired/transferred
  tickets must stop validating immediately (Phase 5 door scans consume this;
  design the signing/verification primitives so Phase 5 can validate offline
  bundles without redesign — don't build Phase 5, don't preclude it).
- **Apple Wallet PKPass** via `POST /v1/tickets/:ticketId/apple-wallet`, with
  a pass-update slot; **Google Wallet deferred** (v1.2, locked).
- All S-06 endpoints scope `user`, owner-only (someone else's ticket reads as
  absent — the Phase 3 pattern). None are idempotency-flagged in v1.0.
- Error envelope / cursor pagination / 429 semantics exactly as built in
  `backend/core`. Credential endpoints get sensible per-identity throttles
  (rotation polling every 30s per ticket must fit comfortably).
- Audit log: credential minted/refreshed/revoked and pass generation write
  entries.
- Social Energy doctrine unchanged (no raw counts on any wire payload).

## Preconditions (gates — surface and wait, don't fill the wait with code)

- **Apple Wallet signing assets** (Pass Type ID, pass-signing certificate,
  WWDR intermediate) are operator-provided. Build the PKPass generator
  behind a fail-closed seam (missing certs → envelope 503, mirroring the
  Stripe gateway) and test against fixtures; say explicitly when real-pass
  verification needs the operator.
- **Staging is still unprovisioned** — if that's still true this phase's
  staging step inherits ALL owed swaps (identity + discovery + checkout +
  ticket; curl S-01/S-03/S-05/S-06; Stripe test keys + webhook secret; the
  one-time DB reset + `seed_events`). **No Docker on this machine** — compose
  steps are the operator's.
- **One native build is owed** bundling expo-secure-store (Phase 1), the
  Sentry RN slot, and the Stripe RN SDK (Phase 3). If Phase 4's "Add to
  Apple Wallet" needs a new native module, it joins that same build — flag
  it; otherwise the TicketPort swap is plain JS/OTA-able.
- **v1.1 lock still pending** — nag the operator; Phases 7–8 are gated on
  it. The Phase 1 (auth refresh/logout), Phase 2 (EventDTO extension +
  saved-events read), and Phase 3 (CheckoutIntentDTO extension, confirm
  tickets[], EventDTO.donation_campaign, webhook allowlist) registry
  amendments all await formal sign-off; treat them as locked-in-practice
  (merged and drift-checked).

## Workstreams

**W1 — Credential model + signing service.** Server-side signing keys (env
slot, fail closed when absent), a `Credential` (or equivalent) model/service
on the `tickets` app: mint short-lived signed QR payloads + NFC
challenge-response material per ticket, ~30s expiry, rotation invalidates the
predecessor, revocation follows ticket status. Verification primitives live
server-side and are reusable by Phase 5 (door scans, offline bundles).
Property/unit tests: expiry, rotation, tamper rejection, revoked-ticket
refusal.

**W2 — S-06 endpoints.** `GET /v1/tickets/:ticketId`, `GET .../status`,
`GET .../credential`, `POST .../refresh`, `GET /v1/wallet` (the buyer's
tickets; audit the wallet screen first — the client renders ONE grouped
record per purchase while server truth is one row per admission, so decide
the serialization: likely serve per-admission rows + intent linkage and let
the client group, but the audit decides). Owner-only, throttled, audited.

**W3 — Apple Wallet.** PKPass generation behind a seam (certs from env/file
slots; fail closed), `POST /v1/tickets/:ticketId/apple-wallet` returning the
pass; barcode carries the same server-signed payload discipline (no
serial-only validation). Pass updates: audit what the locked scope actually
requires — the full PassKit web service (device registration + APNs pushes)
is its own surface; if it exceeds this phase, land the pass with a
documented update slot and flag the decision rather than half-building it.
If web-service routes are served, they are server-to-server: use the drift
script's `SERVER_TO_SERVER` allowlist (the Phase 3 mechanism), not the
client registry.

**W4 — Frontend swap (TicketPort only).** Http adapter for `TicketPort` on
`apiCall`; bind env-gated (`EXPO_PUBLIC_ECHO_TICKET_MODE`, mock default)
exactly like auth/discovery/checkout. Wallet/ticket screens ride
`getPorts().ticket` for credential display + 30s rotation against real
`expires_at` (note: the Phase 3 live checkout writes placeholder
`qr_code`/`nfc_credential` strings into the local wallet record — credential
rendering must come from the port, never those placeholders).
`accessPassService` client signing deleted or demoted per the locked rule;
`mockAdapters.buildCredentialDTO` keeps the mock path working. Strict
`npx tsc --noEmit` stays clean.

**W5 — Staging swap + verification.** Execute/finish the staging checklist
(operator involvement for AWS/DNS/secrets/Stripe/pass certs); deploy; curl
S-06 (+ everything still owed); credential rotation observed live (two
`GET .../credential` calls 30s apart return different tokens; a revoked
ticket refuses); Apple Wallet pass installs on a real device (operator).
Backend pytest + ruff + contract-drift + `makemigrations --check` green;
frontend strict tsc. Device/web smoke is the operator's.

## Out of scope

Door mode, scans, offline bundles, reconciliation (Phase 5 — but W1's
verification primitives must be reusable there); circles & age verification
(Phase 6); ticket transfer (Phase 8); Google Wallet (v1.2, locked deferral);
push notifications (Phase 8).

## Amendments carried from Phase 3 (do not rediscover these)

- **The `tickets` app exists**: `Ticket` rows per admission with
  user/event/tier/intent FKs and locked TicketStatusDTO statuses;
  `checkout.services.complete_intent` issues them and handles the
  late-webhook-success path (`hold_returned_at`). Credentials attach here.
- **Wallet grouping**: the client wallet renders one grouped record per
  purchase (`grouped_ticket_record`, `quantity`, `ticket_mix`) built
  client-side at purchase time; the server has per-admission rows linked by
  `intent`. `GET /v1/wallet` must reconcile this — audit
  `app/(tabs)/wallet.tsx` + `stores/ticketStore.ts` before deciding.
- **CheckoutIntentDTO / confirm `tickets[]` / EventDTO.donation_campaign**
  are merged flagged amendments (sign-off pending). `TicketDTO` is
  unchanged and already served by confirm — S-06 must serialize the exact
  same shape (the serializer lives in `checkout/serializers.py`; move or
  share it rather than duplicating).
- **Webhook-route doctrine**: server-to-server routes go in
  `scripts/check_contract_drift.py::SERVER_TO_SERVER`, never silently
  exempt. Same call for any PassKit web-service routes.
- **Age-gated events cannot complete live checkout until Phase 6** (locked
  gate) — don't burn time "fixing" it.
- **`core.envelope` str() fix** landed in Phase 3 (lazy default_detail broke
  JSONField persistence) — error bodies are JSON-safe now.
- **Environment drift bites**: run `pip install -r requirements.txt` (venv
  lives at `backend/.venv`) and `npm install` in `frontend/` before
  diagnosing anything. Node runs fine for the dump scripts
  (`npx sucrase-node`).

## Working rules (same as Phases 0–3)

- Audit before questions, audit before code. Bring only questions the audit
  produced, one at a time.
- One phase-4 branch (worktree: `git worktree add -b phase-4/credentials
  ../echo-phase-4 main`), clean per-workstream commits; frontend and backend
  in separate commits; flagged contract changes in a `contracts:` commit.
  Nothing lands half-done.
- Verification bar: backend tests green + drift green; frontend strict tsc
  clean. No "should work" claims — run the checks. Do not launch the app to
  verify — the operator smokes it.
- Finish by delivering: change list (file per line, one-line reason),
  exit-criteria status (met / not met / deferred with reason), and anything
  that should amend Phase 5's kickoff.
