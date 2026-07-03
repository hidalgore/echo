"""Production settings (AWS). Identical posture to staging; stricter sampling."""

from .base import *  # noqa: F401,F403
from .base import SENTRY_DSN, SENTRY_ENVIRONMENT

DEBUG = False

SECURE_SSL_REDIRECT = True
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 60 * 60 * 24 * 30
SECURE_HSTS_INCLUDE_SUBDOMAINS = True

if SENTRY_DSN:
    import sentry_sdk

    sentry_sdk.init(
        dsn=SENTRY_DSN,
        environment=SENTRY_ENVIRONMENT or "prod",
        traces_sample_rate=0.05,
        send_default_pii=False,
    )
