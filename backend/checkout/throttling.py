"""
Checkout-specific rate limits (master plan compliance note: "low per-user /
per-event on checkout-intent creation"). Built on the platform throttle
classes; the rate comes from DEFAULT_THROTTLE_RATES["checkout_intent"]
(RATE_LIMIT_CHECKOUT_INTENT env). Views also keep the standard per-identity
user bucket.
"""

from core.ratelimit import ScopedIPRateThrottle


class CheckoutIntentThrottle(ScopedIPRateThrottle):
    """Fixed window per (identity, event): hammering one event's inventory is
    throttled without locking the user out of buying elsewhere."""

    scope = "checkout_intent"

    def get_cache_key(self, request, view):
        event_id = ""
        data = getattr(request, "data", None)
        if isinstance(data, dict):
            event_id = str(data.get("event_id") or "")
        return self.cache_format % {
            "scope": self.scope,
            "ident": f"{self._ident(request)}:{event_id}",
        }
