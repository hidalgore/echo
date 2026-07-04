# ECHO — Environments, Staging Deploy & Ops Notes (Phase 0 / W4)

Status 2026-07-02: **dev is fully provisioned; staging/prod AWS provisioning is
DEFERRED to a checklist** — no AWS credentials were at hand in the Phase 0
session (the kickoff allows this explicitly). Nothing below blocks Phase 1
development; staging must exist before the Phase 1 "swap auth on staging" step.

## Environments

| Env | Where | State |
|---|---|---|
| dev | local docker-compose (Postgres 16, Redis 7) + `backend/.venv` | **Working now** |
| staging | AWS (single EC2 or ECS, mirrors the Siempre topology) | Checklist below |
| prod | AWS | Empty until launch phases |

## Local dev (works today)

```bash
docker compose up -d                       # repo root: Postgres + Redis
cd backend
cp .env.example .env                       # then edit if needed
.venv/bin/python manage.py migrate
.venv/bin/python manage.py runserver       # http://127.0.0.1:8000/v1/config/public
.venv/bin/python -m pytest                 # hermetic; no services needed
.venv/bin/python scripts/check_contract_drift.py
# Celery (when a phase needs workers):
.venv/bin/celery -A echo_api worker -l info
.venv/bin/celery -A echo_api beat -l info
```

## CI (works on push once the repo has a GitHub remote)

`.github/workflows/ci.yml`:
- **backend**: ruff → pytest (hermetic sqlite/locmem settings) → contract-drift
  script → `makemigrations --check` (models never change without a migration).
- **frontend**: `npm ci` → strict `tsc --noEmit`.

## Staging provisioning checklist (do before Phase 1 staging swap)

1. **DNS / domain**: the API base URL decision is `https://api.echo.events`
   (locked in Phase 0 — frontend `constants/config.ts` wins; the handoff doc's
   `api.echo.app` was a placeholder). Create `api-staging.echo.events`.
2. **Compute**: one EC2 instance (same shape as Siempre prod) or ECS service.
   gunicorn behind nginx; TLS via ACM/certbot — set a renewal dry-run check on
   day one (see Siempre TLS-expiry postmortem).
3. **Data**: RDS Postgres 16 (or on-box Postgres to start), ElastiCache Redis
   (or on-box Redis). Set `POSTGRES_*`, `REDIS_URL`, `CELERY_*` env vars.
4. **App env**: `DJANGO_SETTINGS_MODULE=echo_api.settings.staging`,
   `DJANGO_SECRET_KEY` (fresh), `DJANGO_ALLOWED_HOSTS`, `ECHO_MIN_APP_VERSION`.
5. **Sentry**: create `echo-backend` + `echo-frontend` projects; set
   `SENTRY_DSN` + `SENTRY_ENVIRONMENT=staging` (backend init already wired in
   `settings/staging.py`; frontend SDK install is deferred — slot noted below).
6. **Stripe** (consumed since Phase 3 — the gateway fails closed with 503
   `payments_not_configured` until these are set):
   - Test-mode secret key into `STRIPE_SECRET_KEY`.
   - Stripe dashboard: add a webhook endpoint
     `https://api-staging.echo.events/v1/webhooks/stripe` subscribed to
     `payment_intent.succeeded`, `payment_intent.payment_failed`,
     `charge.refunded`; put its signing secret into `STRIPE_WEBHOOK_SECRET`.
   - Frontend build env: `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` (test-mode
     publishable key) + `EXPO_PUBLIC_ECHO_CHECKOUT_MODE=live` to bind the
     S-05 http port (mock stays the default otherwise).
   - Checkout knobs (defaults fine): `RATE_LIMIT_CHECKOUT_INTENT` (6/min per
     user+event), `ECHO_CHECKOUT_HOLD_TTL_SECONDS` (600; locked range 8–15
     min), `ECHO_DEFAULT_TAX_RATE` (0.085).
   - Apple Pay / Google Pay: token collection needs operator-provisioned
     merchant identifiers (Apple merchant id + Google Pay config) — card is
     the E2E path until then; the server already accepts all three token
     types.
7. **Credentials & Apple Wallet** (consumed since Phase 4 — both surfaces
   fail closed with envelope 503s until configured):
   - `ECHO_CREDENTIAL_SIGNING_KEY`: base64 Ed25519 seed from
     `manage.py generate_credential_signing_key` (fresh per environment; the
     printed public key is what Phase 5 door bundles will ship). Missing →
     503 `credentials_not_configured` on credential/refresh/apple-wallet.
   - `ECHO_CREDENTIAL_TTL_SECONDS` (default 30 — the locked rotation cadence)
     and `RATE_LIMIT_CREDENTIAL` (default 30/min per user+ticket).
   - **Apple Wallet signing assets (operator-provided)**: export the Pass
     Type ID certificate + private key as PEM, download Apple's WWDR
     intermediate (PEM), place on the box and set `ECHO_PASSKIT_CERT_PATH`,
     `ECHO_PASSKIT_KEY_PATH`, `ECHO_PASSKIT_WWDR_CERT_PATH`,
     `ECHO_PASSKIT_PASS_TYPE_ID` (e.g. `pass.events.echo.ticket`),
     `ECHO_PASSKIT_TEAM_ID` (+ optional `ECHO_PASSKIT_ORG_NAME`). Missing →
     503 `wallet_pass_not_configured`. Real-pass install verification (unit
     tests use self-signed fixtures) is an operator smoke step on a device.
   - Frontend build env: `EXPO_PUBLIC_ECHO_TICKET_MODE=live` binds the S-06
     http port (mock stays the default otherwise).
8. **Door devices (Phase 5 — operator-provisioned)**: each scanning post gets
   its own session + token pair from the box:
   `manage.py provision_door_session --event <echo_id> --zone main_entry
   --label "North door"` — prints the session id, 6-digit pause/resume
   passcode, and door-scoped access/refresh tokens ONCE (stored hashed;
   re-run to re-provision, there is no recovery read). Knobs (defaults fine):
   `RATE_LIMIT_DOOR` (600/min), `RATE_LIMIT_DOOR_PURCHASE` (10/min per
   session), `ECHO_DOOR_SCAN_LEEWAY_SECONDS` (10),
   `ECHO_DOOR_DUPLICATE_WINDOW_SECONDS` (300),
   `ECHO_DOOR_PASSCODE_MAX_ATTEMPTS` (5) /
   `ECHO_DOOR_PASSCODE_LOCKOUT_SECONDS` (900). Frontend build env:
   `EXPO_PUBLIC_ECHO_DOOR_MODE=live` binds the S-07 http port (mock stays the
   default otherwise). NOTE: real NFC/QR scanner input needs native modules
   that are part of the owed native build — until then the live door path is
   exercised by curl, not the door screen.
9. **Workers**: systemd units for gunicorn / celery worker / celery beat
   (mirror the `siempre-*` unit naming convention).
10. **Smoke**: `curl https://api-staging.echo.events/v1/config/public` returns
    the config payload; a bad route returns the locked envelope 404; hammering
    returns 429 with `Retry-After`. Phase 3 adds the revenue-path E2E: seeded
    on-sale event → `POST /v1/checkout/intents` (Idempotency-Key required) →
    `POST /v1/payments/confirm` with a Stripe test PaymentMethod (`pm_card_visa`)
    → ticket rows issued → Stripe CLI `stripe trigger payment_intent.succeeded`
    redelivery is deduped. Phase 4 adds the credential E2E: buy a ticket →
    `GET /v1/wallet` lists it → two `GET /v1/tickets/:id/credential` calls 30s
    apart return different tokens → `POST .../refresh` rotates immediately →
    a revoked ticket's credential 409s → `POST .../apple-wallet` returns a
    `.pkpass` that installs on a real device (operator). Phase 5 adds the door
    E2E (door-scoped bearer from step 8): buy → `GET .../credential` →
    `POST /v1/door/scans` with the `qr_payload` approves (`verified`,
    ticket flips to `checked_in`) → immediate re-scan returns
    `duplicate_alert` (approved) → revoke the ticket and a fresh scan refuses
    (`ticket_not_active`) → `POST .../offline-bundle` returns the versioned
    bundle with the Ed25519 public key → `POST /v1/door/reconcile` with an
    offline ledger merges (replay under a new Idempotency-Key reports
    `replayed`) → door purchase intent + confirm issues walk-up tickets →
    `manage.py door_closeout --event <id>` writes the three CSVs.

## Migration workflow (locked from day one)

- Migrations are authored + committed with the model change (CI enforces via
  `makemigrations --check`).
- Deploy order: `git pull` → `pip install -r requirements.txt` → `manage.py
  migrate` → restart gunicorn/celery. Never edit models on the server.
- Destructive migrations (drops, data deletions) require an explicit backup
  first (`pg_dump`) — same discipline as Siempre's backend rules.

## Sentry slots

- **Backend**: wired — `settings/staging.py` / `settings/prod.py` call
  `sentry_sdk.init` when `SENTRY_DSN` is set; `sentry-sdk` is in requirements.
- **Frontend**: intentionally NOT installed in Phase 0 (would be a native-build
  dependency change). Slot: add `@sentry/react-native` during the first phase
  that cuts a native build, wiring DSN via `app.json` extra. Tracked for
  Phase 1 kickoff.

## Structured logging

Backend logs are single-line JSON to stdout (`LOGGING` in `settings/base.py`);
aggregate via CloudWatch agent / journald on the staging box.
