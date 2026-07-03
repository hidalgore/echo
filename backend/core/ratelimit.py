"""
Redis-backed rate limiting (locked platform rule: 429 is retryable, carries
Retry-After, and renders the locked envelope via the exception handler).

Built on DRF's SimpleRateThrottle so the storage is the Django cache — Redis
in dev/staging/prod, locmem in tests. Rates come from
REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"], keyed by scope, overridable per env.

Phase 1: authenticated requests are throttled per identity, not per IP —
user sessions by user id, guest sessions by device id (carrier NAT would
otherwise pool thousands of users behind one IP bucket). Anonymous requests
still throttle per IP.
"""

from rest_framework.throttling import SimpleRateThrottle


class ScopedIPRateThrottle(SimpleRateThrottle):
    """Per-scope fixed-window throttle: identity ident when authenticated,
    client IP otherwise. The cache key shape is stable across both."""

    scope = "public"

    def get_cache_key(self, request, view):
        return self.cache_format % {
            "scope": self.scope,
            "ident": self._ident(request),
        }

    def _ident(self, request) -> str:
        auth = getattr(request, "auth", None)
        user_id = getattr(auth, "user_id", None)
        if user_id:
            return f"user:{user_id}"
        device_id = getattr(auth, "device_id", None)
        if device_id:
            return f"device:{device_id}"
        return self.get_ident(request)


class PublicIPRateThrottle(ScopedIPRateThrottle):
    scope = "public"


class GuestIPRateThrottle(ScopedIPRateThrottle):
    scope = "guest"


class UserRateThrottle(ScopedIPRateThrottle):
    scope = "user"


class HostRateThrottle(ScopedIPRateThrottle):
    scope = "host"


class DoorRateThrottle(ScopedIPRateThrottle):
    scope = "door"


class AdminRateThrottle(ScopedIPRateThrottle):
    scope = "admin"
