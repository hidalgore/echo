"""
Refund-policy snapshot (Phase 3 / W1; consumed by Phase 8 refunds).

Server mirror of the client's locked presets (frontend/types/v3.ts
REFUND_PRESETS) and its legacy-flag migration rule
(services/refundPolicyEngine.ts migrateLegacyRefundFlag):

    allow_refunds True  -> 'balanced'
    allow_refunds False -> 'strict'

The snapshot is captured once, when an event publishes (draft -> scheduled in
events.tasks, or at seed time for events seeded already-published), and is
never overwritten afterwards — at-time-of-publish semantics are the point.
Keys are snake_case (wire convention); the client engine's camelCase tiers
map 1:1 (daysBefore/refundPct).
"""

REFUND_POLICY_PRESETS: dict[str, list[dict[str, int]]] = {
    "flexible": [
        {"days_before": 2, "refund_pct": 100},
        {"days_before": 0, "refund_pct": 0},
    ],
    "balanced": [
        {"days_before": 7, "refund_pct": 100},
        {"days_before": 2, "refund_pct": 50},
        {"days_before": 0, "refund_pct": 0},
    ],
    "strict": [
        {"days_before": 14, "refund_pct": 100},
        {"days_before": 0, "refund_pct": 0},
    ],
}


def build_refund_policy_snapshot(allow_refunds: bool) -> dict:
    """Snapshot the preset the event's legacy refund flag maps to."""
    preset_id = "balanced" if allow_refunds else "strict"
    return {
        "preset_id": preset_id,
        "tiers": [dict(tier) for tier in REFUND_POLICY_PRESETS[preset_id]],
    }
