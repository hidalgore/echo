"""
Server-side Social Energy engine (Phase 2 / W1).

Port of frontend/services/socialEnergyService.ts state/intensity derivation,
upgraded to the real sell-through ratio (the client only had `available` and
inferred the rest; the server has true capacity/sold as engine inputs).

Doctrine (frontend/types/socialEnergy.ts): emotional truth over operational
metrics. The API emits ONLY the atmosphere label and a 0..1 intensity — raw
inputs (capacity, sold, sell-through) never leave this module, and the public
floor is "Early Atmosphere" (an unsold event never reads as dead/empty/sparse).

Host override: `Event.social_energy_override` (the frontend SocialEnergy
shape) wins when present; only its `state` + `intensity` are honored here —
pulse/gravity/framing stay client display logic. Invalid overrides fall back
to the derived snapshot rather than failing the read path.
"""

import logging
from dataclasses import dataclass
from datetime import timedelta

from django.utils import timezone

logger = logging.getLogger(__name__)

# Public energy states + labels, locked to frontend/types/socialEnergy.ts.
ENERGY_STATE_LABEL = {
    "early_atmosphere": "Early Atmosphere",
    "building_energy": "Building Energy",
    "well_attended": "Well Attended",
    "high_energy": "High Energy",
    "peak_crowd": "Peak Crowd",
}

_STATE_BASE_INTENSITY = {
    "early_atmosphere": 0.18,
    "building_energy": 0.35,
    "well_attended": 0.55,
    "high_energy": 0.78,
    "peak_crowd": 1.0,
}

_FRAMING_MULTIPLIER = {
    "far_future": 0.6,
    "this_week": 0.75,
    "today": 0.9,
    "live": 1.0,
    "past": 0.5,
}


@dataclass(frozen=True)
class Atmosphere:
    label: str
    intensity: float  # 0..1


def _time_framing(event, now) -> str:
    if now > event.ends_at:
        return "past"
    if now >= event.starts_at:
        return "live"
    delta = event.starts_at - now
    if delta <= timedelta(days=1):
        return "today"
    if delta <= timedelta(days=7):
        return "this_week"
    return "far_future"


def _sell_through(event) -> float:
    """True 0..1 fill ratio across tiers. Uses prefetched tiers when present
    (list serialization must not N+1)."""
    tiers = event.tiers.all()
    total = sum(tier.quantity_total for tier in tiers)
    if total <= 0:
        return 0.0
    sold = sum(tier.quantity_sold for tier in tiers)
    return min(1.0, max(0.0, sold / total))


def _state(framing: str, sell_through: float) -> str:
    # Thresholds match the client derivation verbatim.
    if framing == "past":
        return "peak_crowd" if sell_through > 0.55 else "high_energy"
    if framing == "live":
        return "peak_crowd" if sell_through > 0.45 else "high_energy"
    if framing == "today":
        if sell_through > 0.6:
            return "peak_crowd"
        if sell_through > 0.4:
            return "high_energy"
        return "well_attended"
    if framing == "this_week":
        if sell_through > 0.55:
            return "high_energy"
        if sell_through > 0.3:
            return "well_attended"
        return "building_energy"
    # far_future
    if sell_through > 0.5:
        return "well_attended"
    if sell_through > 0.25:
        return "building_energy"
    return "early_atmosphere"


def _from_override(override) -> Atmosphere | None:
    if not isinstance(override, dict):
        return None
    state = override.get("state")
    intensity = override.get("intensity")
    if state not in ENERGY_STATE_LABEL or not isinstance(intensity, (int, float)):
        logger.warning("ignoring malformed social_energy_override state=%r", state)
        return None
    return Atmosphere(label=ENERGY_STATE_LABEL[state], intensity=min(1.0, max(0.0, float(intensity))))


def compute(event, now=None) -> Atmosphere:
    """The one sanctioned way to read an event's atmosphere."""
    override = _from_override(event.social_energy_override)
    if override is not None:
        return override

    now = now or timezone.now()
    framing = _time_framing(event, now)
    state = _state(framing, _sell_through(event))
    intensity = min(1.0, _STATE_BASE_INTENSITY[state] * _FRAMING_MULTIPLIER[framing])
    return Atmosphere(label=ENERGY_STATE_LABEL[state], intensity=round(intensity, 3))
