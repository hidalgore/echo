"""
ECHO API — base settings.

Env-driven (12-factor): every deploy-varying value comes from the environment;
per-env modules (dev/staging/prod/test) override only what differs. Local dev
reads backend/.env via python-dotenv (see dev.py). Never commit secrets.
"""

import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent


def env(name: str, default: str | None = None) -> str | None:
    return os.environ.get(name, default)


def env_bool(name: str, default: bool = False) -> bool:
    raw = os.environ.get(name)
    if raw is None:
        return default
    return raw.strip().lower() in ("1", "true", "yes", "on")


def env_list(name: str, default: str = "") -> list[str]:
    raw = os.environ.get(name, default)
    return [item.strip() for item in raw.split(",") if item.strip()]


# ─── Core ────────────────────────────────────────────────────────────────────

SECRET_KEY = env("DJANGO_SECRET_KEY", "dev-insecure-key-override-in-env")
DEBUG = env_bool("DJANGO_DEBUG", False)
ALLOWED_HOSTS = env_list("DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1")

INSTALLED_APPS = [
    "django.contrib.contenttypes",
    "django.contrib.auth",
    "rest_framework",
    "drf_spectacular",
    "core",
    "identity",
    "audit",
    "events",
    "checkout",
    "tickets",
    "door",
]

AUTH_USER_MODEL = "identity.User"

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.middleware.common.CommonMiddleware",
]

ROOT_URLCONF = "echo_api.urls"
WSGI_APPLICATION = "echo_api.wsgi.application"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": False,
        "OPTIONS": {"context_processors": []},
    },
]

# ─── Database (PostgreSQL) ───────────────────────────────────────────────────

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": env("POSTGRES_DB", "echo"),
        "USER": env("POSTGRES_USER", "echo"),
        "PASSWORD": env("POSTGRES_PASSWORD", "echo"),
        "HOST": env("POSTGRES_HOST", "localhost"),
        "PORT": env("POSTGRES_PORT", "5432"),
        "CONN_MAX_AGE": 60,
    }
}

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# ─── Cache / Redis ───────────────────────────────────────────────────────────

REDIS_URL = env("REDIS_URL", "redis://localhost:6379/0")

CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": REDIS_URL,
        "OPTIONS": {"CLIENT_CLASS": "django_redis.client.DefaultClient"},
    }
}

# ─── Celery ──────────────────────────────────────────────────────────────────

CELERY_BROKER_URL = env("CELERY_BROKER_URL", "redis://localhost:6379/1")
CELERY_RESULT_BACKEND = env("CELERY_RESULT_BACKEND", "redis://localhost:6379/2")
CELERY_TASK_ALWAYS_EAGER = False
CELERY_TIMEZONE = "UTC"

# ─── DRF / API platform ──────────────────────────────────────────────────────

REST_FRAMEWORK = {
    "DEFAULT_RENDERER_CLASSES": ["rest_framework.renderers.JSONRenderer"],
    "DEFAULT_PARSER_CLASSES": ["rest_framework.parsers.JSONParser"],
    "DEFAULT_AUTHENTICATION_CLASSES": ["identity.authentication.EchoTokenAuthentication"],
    "DEFAULT_PERMISSION_CLASSES": ["core.scopes.HasRequiredScope"],
    "EXCEPTION_HANDLER": "core.envelope.envelope_exception_handler",
    "DEFAULT_PAGINATION_CLASS": "core.pagination.EchoCursorPagination",
    "PAGE_SIZE": 20,
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "DEFAULT_THROTTLE_RATES": {
        # Per-scope defaults (Redis-backed via the default cache).
        # Tuned per phase: checkout gets low per-user rates in Phase 3,
        # door scans get a high-throughput path in Phase 5.
        "public": env("RATE_LIMIT_PUBLIC", "60/min"),
        "guest": env("RATE_LIMIT_GUEST", "60/min"),
        "user": env("RATE_LIMIT_USER", "120/min"),
        "host": env("RATE_LIMIT_HOST", "120/min"),
        "door": env("RATE_LIMIT_DOOR", "600/min"),
        "admin": env("RATE_LIMIT_ADMIN", "120/min"),
        # Phase 3 compliance note: low per-(user, event) on intent creation.
        "checkout_intent": env("RATE_LIMIT_CHECKOUT_INTENT", "6/min"),
        # Phase 4: per-(identity, ticket) on credential get/refresh — the 30s
        # rotation cadence is 2/min, so this is pure headroom + abuse ceiling.
        "credential": env("RATE_LIMIT_CREDENTIAL", "30/min"),
        # Door purchases: per (device, session) — walk-up sales are human-paced.
        "door_purchase": env("RATE_LIMIT_DOOR_PURCHASE", "10/min"),
    },
}

SPECTACULAR_SETTINGS = {
    "TITLE": "ECHO API",
    "DESCRIPTION": "ECHO trusted-access platform — locked /v1 contract.",
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
    # Contract paths are absolute (/v1/...); don't strip a common prefix.
    "SCHEMA_PATH_PREFIX": "",
    # Multiple serializers expose a `status` choices field (events vs tickets);
    # name the ticket one explicitly so schema generation stays deterministic.
    "ENUM_NAME_OVERRIDES": {
        "TicketStatusEnum": "tickets.models.TicketStatus.choices",
    },
}

# ─── Identity / tokens (Phase 1) ─────────────────────────────────────────────

# Access tokens are short-lived HS256 JWTs; refresh tokens rotate (identity.tokens).
ECHO_TOKEN_SIGNING_KEY = env("ECHO_TOKEN_SIGNING_KEY", "") or SECRET_KEY
ECHO_ACCESS_TOKEN_TTL_SECONDS = int(env("ECHO_ACCESS_TOKEN_TTL_SECONDS", "900"))
ECHO_REFRESH_TOKEN_TTL_SECONDS = int(env("ECHO_REFRESH_TOKEN_TTL_SECONDS", str(30 * 24 * 60 * 60)))
ECHO_GUEST_REFRESH_TTL_SECONDS = int(env("ECHO_GUEST_REFRESH_TTL_SECONDS", str(7 * 24 * 60 * 60)))

# Expected audiences for platform identity-token verification. Empty = that
# provider fails closed with 503 auth_not_configured (Phase 1 credential gate).
ECHO_APPLE_BUNDLE_IDS = env_list("ECHO_APPLE_BUNDLE_IDS")
ECHO_GOOGLE_CLIENT_IDS = env_list("ECHO_GOOGLE_CLIENT_IDS")

# ─── Idempotency (locked platform rule) ──────────────────────────────────────

# Replay window for stored idempotent responses.
IDEMPOTENCY_TTL_SECONDS = int(env("IDEMPOTENCY_TTL_SECONDS", str(24 * 60 * 60)))
IDEMPOTENCY_MAX_KEY_LENGTH = 255

# ─── App config (served by /v1/config/public) ────────────────────────────────

ECHO_MIN_APP_VERSION = env("ECHO_MIN_APP_VERSION", "9.0.0")
# Locked fee model, consumed by the Phase 3 pricing engine (checkout.pricing).
ECHO_PLATFORM_FEE_RATE = 0.05
ECHO_PAYMENT_PROCESSING_RATE = 0.029
ECHO_PAYMENT_PROCESSING_FLAT_CENTS = 30

# ─── Checkout (Phase 3) ──────────────────────────────────────────────────────

# Tax slot: flat default rate until per-jurisdiction calculation lands
# (mirrors the client engine's 8.5% WA default).
ECHO_DEFAULT_TAX_RATE = float(env("ECHO_DEFAULT_TAX_RATE", "0.085"))
# Inventory-hold TTL — locked range 8-15 minutes.
ECHO_CHECKOUT_HOLD_TTL_SECONDS = int(env("ECHO_CHECKOUT_HOLD_TTL_SECONDS", "600"))

# ─── Stripe (Phase 3: consumed by checkout.stripe_gateway; fail-closed) ──────

STRIPE_SECRET_KEY = env("STRIPE_SECRET_KEY", "")
STRIPE_WEBHOOK_SECRET = env("STRIPE_WEBHOOK_SECRET", "")

# ─── Credentials (Phase 4: consumed by tickets.credentials; fail-closed) ─────

# Base64-encoded 32-byte Ed25519 private seed; mint one with
# `manage.py generate_credential_signing_key`. Missing -> envelope 503
# `credentials_not_configured` on every credential surface.
ECHO_CREDENTIAL_SIGNING_KEY = env("ECHO_CREDENTIAL_SIGNING_KEY", "")
# Credential lifetime — the locked ~30s rotation cadence (the client's
# CONFIG.NFC_CREDENTIAL_ROTATE_INTERVAL_MS drives its refresh off the
# credential's real expires_at).
ECHO_CREDENTIAL_TTL_SECONDS = int(env("ECHO_CREDENTIAL_TTL_SECONDS", "30"))

# ─── Door mode (Phase 5: door app) ───────────────────────────────────────────

# Clock-skew allowance when a door verifies a rotating credential (token TTL
# is ~30s and scans happen right after display, so a small leeway absorbs
# device drift without meaningfully widening the window).
ECHO_DOOR_SCAN_LEEWAY_SECONDS = int(env("ECHO_DOOR_SCAN_LEEWAY_SECONDS", "10"))
# Re-scan of a checked-in ticket inside this window approves with an alert
# (locked rule: alert, not block); outside it, the scan refuses.
ECHO_DOOR_DUPLICATE_WINDOW_SECONDS = int(env("ECHO_DOOR_DUPLICATE_WINDOW_SECONDS", "300"))
# Pause/resume passcode lockout: this many consecutive failures locks the
# resume path for the lockout period (attempts are audited, never logged
# with the presented code).
ECHO_DOOR_PASSCODE_MAX_ATTEMPTS = int(env("ECHO_DOOR_PASSCODE_MAX_ATTEMPTS", "5"))
ECHO_DOOR_PASSCODE_LOCKOUT_SECONDS = int(env("ECHO_DOOR_PASSCODE_LOCKOUT_SECONDS", "900"))

# ─── Apple Wallet / PassKit (Phase 4: tickets.passkit; fail-closed) ──────────

# Paths to the operator-provided pass-signing assets (PEM): the Pass Type ID
# certificate, its private key, and Apple's WWDR intermediate. All paths plus
# both identifiers must be set or pass generation 503s
# `wallet_pass_not_configured`.
ECHO_PASSKIT_CERT_PATH = env("ECHO_PASSKIT_CERT_PATH", "")
ECHO_PASSKIT_KEY_PATH = env("ECHO_PASSKIT_KEY_PATH", "")
ECHO_PASSKIT_WWDR_CERT_PATH = env("ECHO_PASSKIT_WWDR_CERT_PATH", "")
ECHO_PASSKIT_PASS_TYPE_ID = env("ECHO_PASSKIT_PASS_TYPE_ID", "")
ECHO_PASSKIT_TEAM_ID = env("ECHO_PASSKIT_TEAM_ID", "")
ECHO_PASSKIT_ORG_NAME = env("ECHO_PASSKIT_ORG_NAME", "ECHO")

# ─── Sentry (slot — initialized in staging/prod when DSN is set) ─────────────

SENTRY_DSN = env("SENTRY_DSN", "")
SENTRY_ENVIRONMENT = env("SENTRY_ENVIRONMENT", "dev")

# ─── I18N / TZ ───────────────────────────────────────────────────────────────

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = False
USE_TZ = True

# ─── Logging (structured console; aggregation is deploy-side) ────────────────

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "structured": {
            "format": (
                '{"ts":"%(asctime)s","level":"%(levelname)s",'
                '"logger":"%(name)s","message":"%(message)s"}'
            ),
        },
    },
    "handlers": {
        "console": {"class": "logging.StreamHandler", "formatter": "structured"},
    },
    "root": {"handlers": ["console"], "level": env("LOG_LEVEL", "INFO")},
    "loggers": {
        "django.request": {"level": "WARNING"},
    },
}
