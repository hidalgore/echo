"""Door-purchase rate limit (Phase 5 / W4): per (device identity, session) —
walk-up sales are human-paced, and one hot door must not starve another.
Rate override: RATE_LIMIT_DOOR_PURCHASE. Scans deliberately ride only the
high-throughput `door` bucket (600/min, the locked Phase 5 path)."""

from core.ratelimit import ScopedIPRateThrottle


class DoorPurchaseThrottle(ScopedIPRateThrottle):
    scope = "door_purchase"

    def get_cache_key(self, request, view):
        session_id = ""
        data = getattr(request, "data", None)
        if isinstance(data, dict):
            session_id = str(data.get("session_id") or "")
        return self.cache_format % {
            "scope": self.scope,
            "ident": f"{self._ident(request)}:{session_id}",
        }
