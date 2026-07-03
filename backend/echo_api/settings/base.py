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
]

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
    "DEFAULT_AUTHENTICATION_CLASSES": [],
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
    },
}

SPECTACULAR_SETTINGS = {
    "TITLE": "ECHO API",
    "DESCRIPTION": "ECHO trusted-access platform — locked /v1 contract.",
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
    # Contract paths are absolute (/v1/...); don't strip a common prefix.
    "SCHEMA_PATH_PREFIX": "",
}

# ─── Idempotency (locked platform rule) ──────────────────────────────────────

# Replay window for stored idempotent responses.
IDEMPOTENCY_TTL_SECONDS = int(env("IDEMPOTENCY_TTL_SECONDS", str(24 * 60 * 60)))
IDEMPOTENCY_MAX_KEY_LENGTH = 255

# ─── App config (served by /v1/config/public) ────────────────────────────────

ECHO_MIN_APP_VERSION = env("ECHO_MIN_APP_VERSION", "9.0.0")
# Locked fee model (display constants; authoritative pricing engine is Phase 3).
ECHO_PLATFORM_FEE_RATE = 0.05
ECHO_PAYMENT_PROCESSING_RATE = 0.029
ECHO_PAYMENT_PROCESSING_FLAT_CENTS = 30

# ─── Stripe (slots only — not wired until Phase 3) ───────────────────────────

STRIPE_SECRET_KEY = env("STRIPE_SECRET_KEY", "")
STRIPE_WEBHOOK_SECRET = env("STRIPE_WEBHOOK_SECRET", "")

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
