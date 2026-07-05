"""
Server-side mirror of the locked tier→zone semantics (Phase 5 / W2).

The client's `accessControlService.canTierAccessZone` reads the locked
`ACCESS_TIER_DEFINITIONS` table in `frontend/types/v3.ts` (Access Control
System v1, decision 2A). Door verdicts must produce the same zone
authorization server-side, so this module mirrors that table's tier ids and
`allowedZones` exactly — it is a transcription of locked contract data, not a
new Zone schema. If the client table changes, this table changes with it (a
locked-contract amendment, never a silent divergence).

`TicketTier.access_tier` (events app, Phase 5 flagged amendment) maps a
catalog tier row to one of these access tiers; `DoorScanResultDTO.tier_id`
serves the access-tier key (the client maps it to color/label locally —
locked W5 rule: tier color is a client mapping from `tier_id`).
"""

# Zone ids — the client's AccessZoneId union.
ZONES = (
    "main_entry",
    "vip_lounge",
    "meet_and_greet",
    "backstage",
    "after_party",
    "sponsor_lounge",
    "restricted_area",
    "green_room",
    "stage_access",
    "operations_areas",
)

# AccessTierId → allowedZones, exactly as locked in ACCESS_TIER_DEFINITIONS.
ACCESS_TIER_ZONES: dict[str, tuple[str, ...]] = {
    "general_admission": ("main_entry",),
    "vip": ("main_entry", "vip_lounge"),
    "ultra_vip": ("main_entry", "vip_lounge", "meet_and_greet", "after_party"),
    "artist": ("main_entry", "backstage", "green_room", "stage_access", "restricted_area"),
    "staff": ("main_entry", "backstage", "operations_areas", "restricted_area"),
    "vendor": ("main_entry", "sponsor_lounge"),
    "press": ("main_entry", "sponsor_lounge"),
    "security": ZONES,
    "sponsor": ("main_entry", "sponsor_lounge", "vip_lounge"),
    "backstage": ("main_entry", "backstage", "green_room", "stage_access", "restricted_area"),
    # Host-defined; defaults to main entry until host tooling (Phase 7)
    # assigns permissions — same default as the client table.
    "custom_host_tier": ("main_entry",),
}

ACCESS_TIERS = tuple(ACCESS_TIER_ZONES)
DEFAULT_ACCESS_TIER = "general_admission"


def tier_zones(access_tier: str) -> tuple[str, ...]:
    """Allowed zones for an access tier; unknown tiers get the GA default
    (fail toward least privilege, never toward open doors)."""
    return ACCESS_TIER_ZONES.get(access_tier, ACCESS_TIER_ZONES[DEFAULT_ACCESS_TIER])


def can_tier_access_zone(access_tier: str, zone: str) -> bool:
    """Server equivalent of the client's locked `canTierAccessZone`."""
    return zone in tier_zones(access_tier)
