from datetime import timedelta

import pytest
from django.core.exceptions import ValidationError
from django.utils import timezone

from core.ids import is_valid_public_id
from events.models import EventStatus


@pytest.mark.django_db
class TestEventModel:
    def test_public_id_uses_ev_prefix(self, make_event):
        event = make_event()
        assert event.public_id.startswith("EV-")
        assert is_valid_public_id(event.public_id, prefix="EV")

    def test_rejects_end_before_start(self, make_event):
        now = timezone.now()
        with pytest.raises(ValidationError, match="ends_at"):
            make_event(starts_at=now + timedelta(days=2), ends_at=now + timedelta(days=1))

    def test_rejects_sales_after_start(self, make_event):
        now = timezone.now()
        with pytest.raises(ValidationError, match="sales_start_at"):
            make_event(
                starts_at=now + timedelta(days=2),
                ends_at=now + timedelta(days=3),
                sales_start_at=now + timedelta(days=2, hours=1),
            )

    def test_rejects_publish_after_sales_start(self, make_event):
        now = timezone.now()
        with pytest.raises(ValidationError, match="publish_at"):
            make_event(
                publish_at=now + timedelta(days=2),
                sales_start_at=now + timedelta(days=1),
            )

    def test_publish_checked_against_start_when_no_sales_date(self, make_event):
        now = timezone.now()
        with pytest.raises(ValidationError, match="publish_at"):
            make_event(
                publish_at=now + timedelta(days=8),
                sales_start_at=None,
                starts_at=now + timedelta(days=7),
                ends_at=now + timedelta(days=7, hours=6),
            )

    def test_null_schedule_fields_are_allowed(self, make_event):
        event = make_event(publish_at=None, sales_start_at=None, status=EventStatus.DRAFT)
        assert event.status == EventStatus.DRAFT


@pytest.mark.django_db
class TestTicketTier:
    def test_available_is_total_minus_sold(self, make_event, make_tier):
        tier = make_tier(make_event(), total=100, sold=30)
        assert tier.available == 70

    def test_available_never_negative(self, make_event, make_tier):
        tier = make_tier(make_event(), total=10)
        tier.quantity_total = 5
        tier.quantity_sold = 9  # not saved; property math only
        assert tier.available == 0
