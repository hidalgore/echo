"""seed_events integration: runs against the real checked-in snapshot, twice,
to prove idempotency (no duplicate rows, sales counters preserved)."""

import pytest
from django.core.management import call_command

from audit.models import AuditLogEntry
from events.models import Event, EventStatus, TicketTier, Venue


@pytest.mark.django_db
class TestSeedEvents:
    def test_seed_and_reseed_are_idempotent(self):
        call_command("seed_events")
        event_count = Event.objects.count()
        venue_count = Venue.objects.count()
        tier_count = TicketTier.objects.count()
        assert event_count > 100  # the corpus, not a token sample
        assert TicketTier.objects.filter(quantity_sold__gt=0).count() == 0

        # A sold counter set by "real sales" must survive a re-seed.
        tier = TicketTier.objects.filter(quantity_total__gte=10).first()
        tier.quantity_sold = 7
        tier.save(update_fields=["quantity_sold", "updated_at"])

        call_command("seed_events")
        assert Event.objects.count() == event_count
        assert Venue.objects.count() == venue_count
        assert TicketTier.objects.count() == tier_count
        tier.refresh_from_db()
        assert tier.quantity_sold == 7

    def test_seeded_events_are_valid_and_visible(self):
        call_command("seed_events")
        assert not Event.objects.filter(status=EventStatus.DRAFT).exists()
        nightfall = Event.objects.get(import_ref="evt_001")
        assert nightfall.public_id.startswith("EV-")
        assert nightfall.venue.city == "Seattle"
        prices = list(nightfall.tiers.values_list("price_cents", flat=True))
        assert prices == [7500, 15000]  # corpus dollars → cents

        # Every seeded schedule respects the locked ordering (full_clean ran).
        sample = Event.objects.order_by("?").first()
        assert sample.publish_at <= sample.sales_start_at <= sample.starts_at < sample.ends_at

    def test_seed_writes_summary_audit(self):
        call_command("seed_events")
        assert AuditLogEntry.objects.filter(action="catalog.seeded").count() == 1
