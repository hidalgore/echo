"""Staging settings (AWS). All secrets/hosts come from the environment."""

from .base import *  # noqa: F401,F403
from .base import SENTRY_DSN, SENTRY_ENVIRONMENT

DEBUG = False

SECURE_SSL_REDIRECT = True
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True

if SENTRY_DSN:
    import sentry_sdk

    sentry_sdk.init(
        dsn=SENTRY_DSN,
        environment=SENTRY_ENVIRONMENT or "staging",
        traces_sample_rate=0.1,
        send_default_pii=False,
    )
