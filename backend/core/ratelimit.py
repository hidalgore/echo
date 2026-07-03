"""
Redis-backed rate limiting (locked platform rule: 429 is retryable, carries
Retry-After, and renders the locked envelope via the exception handler).

Built on DRF's SimpleRateThrottle so the storage is the Django cache — Redis
in dev/staging/prod, locmem in tests. Rates come from
REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"], keyed by scope, overridable per env.

Phase 0 wires the per-IP public limiter on /v1/config/public. Later phases
attach the authenticated per-user variants once identity exists (Phase 1).
"""

from rest_framework.throttling import SimpleRateThrottle


class ScopedIPRateThrottle(SimpleRateThrottle):
    """Per-client-IP fixed-window throttle for a given scope.

    Identity-based throttling replaces the IP ident for authenticated scopes
    in Phase 1; the cache key shape stays stable.
    """

    scope = "public"

    def get_cache_key(self, request, view):
        return self.cache_format % {
            "scope": self.scope,
            "ident": self.get_ident(request),
        }


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
