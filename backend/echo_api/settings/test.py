"""Test settings — hermetic: sqlite + in-memory cache, no Redis/Postgres needed.

The platform code depends on the Django cache API (not a raw Redis client)
precisely so tests can run against locmem while dev/staging/prod run Redis.
"""

from .base import *  # noqa: F401,F403

DEBUG = False

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": ":memory:",
    }
}

CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        "LOCATION": "echo-tests",
    }
}

CELERY_TASK_ALWAYS_EAGER = True

PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]
