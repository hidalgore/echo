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
6. **Stripe**: test-mode keys into `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET`
   env slots (consumed starting Phase 3).
7. **Workers**: systemd units for gunicorn / celery worker / celery beat
   (mirror the `siempre-*` unit naming convention).
8. **Smoke**: `curl https://api-staging.echo.events/v1/config/public` returns
   the config payload; a bad route returns the locked envelope 404; hammering
   returns 429 with `Retry-After`.

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
