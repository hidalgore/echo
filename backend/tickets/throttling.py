"""Credential-surface throttle (Phase 4 / W2).

Keyed per (identity, ticket): the locked 30s rotation cadence is 2 req/min
per open ticket — the 30/min default leaves headroom for a wallet with
several live tickets plus retries, while still stopping QR-scrape hammering
of one ticket. Rate override: RATE_LIMIT_CREDENTIAL.
"""

from core.ratelimit import ScopedIPRateThrottle


class CredentialThrottle(ScopedIPRateThrottle):
    scope = "credential"

    def get_cache_key(self, request, view):
        ticket_id = str(view.kwargs.get("ticket_id") or "")
        return self.cache_format % {
            "scope": self.scope,
            "ident": f"{self._ident(request)}:{ticket_id}",
        }
