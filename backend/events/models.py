"""
Event catalog models (Phase 2 / W1).

- Venue / Event / TicketTier: the seeded, back-office catalog. Host-authored
  event creation is Phase 7; nothing here is writable through /v1 in Phase 2.
- `Event.status` is the frontend's locked EventStatus enum
  (frontend/types/index.ts): draft → scheduled → on_sale → live → ended.
  Workers in events.tasks only advance it along that flow, never backwards;
  `clean()` enforces the locked schedule ordering so impossible lifecycles
  cannot be written in the first place.
- Social Energy doctrine: tier capacity/sold live here as engine inputs but
  are NEVER serialized. The API emits the atmosphere label + 0..1 intensity
  (events.social_energy) and per-tier `available` (remaining) only.
"""

from django.core.exceptions import ValidationError
from django.db import models

from core.ids import new_public_id
from core.models import EchoIdModel

PUBLIC_ID_PREFIX_EVENT = "EV"


def _default_event_public_id() -> str:
    return new_public_id(PUBLIC_ID_PREFIX_EVENT)


class Venue(EchoIdModel):
    """A physical venue. The corpus embeds venue strings per event; venues are
    deduplicated by (name, address) at seed time."""

    name = models.CharField(max_length=200)
    address = models.CharField(max_length=300)
    # Extracted from the address at seed time; drives the discovery city filter.
    city = models.CharField(max_length=100, blank=True, default="", db_index=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["name", "address"], name="uniq_venue_name_address"),
        ]

    def __str__(self) -> str:
        return f"Venue({self.name})"


class EventStatus(models.TextChoices):
    """Locked to the frontend's EventStatus. `scheduled` = announced/visible,
    sales not yet open (the master plan's 'published')."""

    DRAFT = "draft"
    SCHEDULED = "scheduled"
    ON_SALE = "on_sale"
    LIVE = "live"
    ENDED = "ended"


# Lifecycle order the workers advance along (never backwards, never skipping
# validation) — index comparisons gate "only advance".
STATUS_FLOW = [
    EventStatus.DRAFT,
    EventStatus.SCHEDULED,
    EventStatus.ON_SALE,
    EventStatus.LIVE,
    EventStatus.ENDED,
]

# Statuses served by the public discovery surface (drafts never leave the box).
VISIBLE_STATUSES = [
    EventStatus.SCHEDULED,
    EventStatus.ON_SALE,
    EventStatus.LIVE,
    EventStatus.ENDED,
]


class Event(EchoIdModel):
    public_id = models.CharField(max_length=32, unique=True, default=_default_event_public_id)
    # Stable key for idempotent imports (seed corpus ids like "evt_001").
    # Blank for events created any other way; unique only when present.
    import_ref = models.CharField(max_length=64, blank=True, default="")

    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, default="")
    category = models.CharField(max_length=32, db_index=True)

    venue = models.ForeignKey(Venue, on_delete=models.PROTECT, related_name="events")

    starts_at = models.DateTimeField(db_index=True)
    ends_at = models.DateTimeField()
    # Schedule the workers advance on. Null = that transition is manual
    # (drafts without a schedule simply never auto-advance).
    publish_at = models.DateTimeField(null=True, blank=True)
    sales_start_at = models.DateTimeField(null=True, blank=True)

    status = models.CharField(
        max_length=16, choices=EventStatus.choices, default=EventStatus.DRAFT, db_index=True
    )

    image_url = models.URLField(blank=True, default="")
    is_featured = models.BooleanField(default=False)
    # Denormalized until the host platform lands (Phase 7).
    host_name = models.CharField(max_length=200, blank=True, default="")
    host_verified = models.BooleanField(default=False)
    # None/0 = no restriction; 18 / 21 per the locked age-badge mapping.
    age_restriction = models.PositiveSmallIntegerField(null=True, blank=True)

    # Stored for Phase 3 (refunds) / Phase 8 (transfers); not served in S-03.
    allow_refunds = models.BooleanField(default=True)
    allow_transfers = models.BooleanField(default=True)

    # Phase 3: nonprofit hosts get the platform-fee waiver (processing always
    # applies — locked fee model). Set by seed for the corpus's campaign
    # events; Phase 7 EIN verification becomes the real source of truth.
    host_is_nonprofit = models.BooleanField(default=False)

    # Phase 3: refund policy captured once at publish (events.refunds), never
    # rewritten afterwards; consumed by Phase 8 refund execution.
    refund_policy_snapshot = models.JSONField(null=True, blank=True)

    # Host-locked Social Energy override (frontend SocialEnergy shape). The
    # engine honors `state`/`intensity` from it; everything else is client
    # display logic.
    social_energy_override = models.JSONField(null=True, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["import_ref"],
                condition=~models.Q(import_ref=""),
                name="uniq_event_import_ref",
            ),
        ]

    def __str__(self) -> str:
        return f"Event({self.public_id}, {self.title})"

    def clean(self):
        """Locked schedule ordering: publish ≤ sales start ≤ event start < end,
        enforced across whichever schedule fields are set."""
        super().clean()
        errors = {}
        if self.starts_at and self.ends_at and self.ends_at <= self.starts_at:
            errors["ends_at"] = "ends_at must be after starts_at."
        if self.sales_start_at and self.starts_at and self.sales_start_at > self.starts_at:
            errors["sales_start_at"] = "sales_start_at must be on or before starts_at."
        if self.publish_at:
            if self.sales_start_at and self.publish_at > self.sales_start_at:
                errors["publish_at"] = "publish_at must be on or before sales_start_at."
            elif self.starts_at and self.publish_at > self.starts_at:
                errors["publish_at"] = "publish_at must be on or before starts_at."
        if errors:
            raise ValidationError(errors)

    def save(self, *args, **kwargs):
        # Model-boundary enforcement (locked rule): nothing writes an event
        # with an impossible schedule. Uniqueness stays DB-enforced.
        self.full_clean(validate_unique=False)
        super().save(*args, **kwargs)


class TicketTier(EchoIdModel):
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name="tiers")
    # Stable key within the event for idempotent imports ("tkt_001").
    import_ref = models.CharField(max_length=64, blank=True, default="")

    name = models.CharField(max_length=120)
    description = models.CharField(max_length=300, blank=True, default="")
    price_cents = models.PositiveIntegerField()

    # Social Energy engine inputs + Phase 3 inventory-hold substrate.
    # NEVER serialized — the API exposes `available` only.
    quantity_total = models.PositiveIntegerField()
    quantity_sold = models.PositiveIntegerField(default=0)
    # Actively held by in-flight checkout intents (checkout.services owns
    # every transition under select_for_update). Reduces `available`; never
    # serialized itself (doctrine).
    quantity_held = models.PositiveIntegerField(default=0)

    sort_order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["sort_order", "created_at"]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(quantity_sold__lte=models.F("quantity_total")),
                name="tier_sold_lte_total",
            ),
            # Holds + sales can never overcommit capacity (DB-level backstop
            # for the never-oversell doctrine).
            models.CheckConstraint(
                condition=models.Q(
                    quantity_sold__lte=models.F("quantity_total") - models.F("quantity_held")
                ),
                name="tier_sold_plus_held_lte_total",
            ),
            models.UniqueConstraint(
                fields=["event", "import_ref"],
                condition=~models.Q(import_ref=""),
                name="uniq_tier_event_import_ref",
            ),
        ]

    def __str__(self) -> str:
        return f"TicketTier({self.event_id}, {self.name})"

    @property
    def available(self) -> int:
        """The only inventory number ever serialized: what a buyer could hold
        right now — capacity minus sales minus other buyers' active holds."""
        return max(0, self.quantity_total - self.quantity_sold - self.quantity_held)


class DonationCampaignStatus(models.TextChoices):
    """Stored states only. Progress states the client derives for display
    (goal_reached / goal_exceeded) are never persisted or served."""

    ACTIVE = "active"
    CLOSED = "closed"


class DonationCampaign(EchoIdModel):
    """A nonprofit host's donation drive attached to one event (Phase 3 owns
    donations; Phase 7 adds host CRUD + EIN verification). Served inside the
    event payload (Phase 3 EventDTO amendment) because the checkout UI renders
    campaign progress before any intent exists. Donor identities are never
    serialized — progress only."""

    event = models.OneToOneField(Event, on_delete=models.CASCADE, related_name="donation_campaign")
    # Stable key for idempotent imports (corpus campaign ids).
    import_ref = models.CharField(max_length=64, blank=True, default="")

    nonprofit_name = models.CharField(max_length=200)
    cause_title = models.CharField(max_length=200)
    cause_description = models.TextField(blank=True, default="")

    goal_cents = models.PositiveBigIntegerField()
    # Denormalized progress counters; checkout.services credits them when a
    # carrying payment succeeds. Seed sets them on create only (real
    # donations own them afterwards, like tier sales counters).
    raised_cents = models.PositiveBigIntegerField(default=0)
    donor_count = models.PositiveIntegerField(default=0)

    suggested_amounts_cents = models.JSONField(default=list, blank=True)
    status = models.CharField(
        max_length=16, choices=DonationCampaignStatus.choices, default=DonationCampaignStatus.ACTIVE
    )

    def __str__(self) -> str:
        return f"DonationCampaign({self.event_id}, {self.nonprofit_name})"


class SavedEvent(EchoIdModel):
    """User ↔ event save (wallet's saved list). Requires a full account —
    guest sessions have no user row to hang a save on."""

    user = models.ForeignKey("identity.User", on_delete=models.CASCADE, related_name="saved_events")
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name="saved_by")

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["user", "event"], name="uniq_saved_event_user_event"),
        ]

    def __str__(self) -> str:
        return f"SavedEvent({self.user_id}, {self.event_id})"
