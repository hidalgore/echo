"""W3 lifecycle worker: advances on schedule, never double-fires, audits every
transition. Celery runs eager under test settings."""

from datetime import timedelta

import pytest
from django.utils import timezone

from audit.models import AuditLogEntry
from events.models import EventStatus
from events.tasks import advance_event_lifecycle


def audit_actions(event):
    return list(
        AuditLogEntry.objects.filter(target_type="event", target_id=str(event.echo_id))
        .order_by("created_at")
        .values_list("action", flat=True)
    )


@pytest.mark.django_db
class TestAdvanceEventLifecycle:
    def test_publishes_due_draft(self, make_event):
        now = timezone.now()
        event = make_event(
            status=EventStatus.DRAFT,
            publish_at=now - timedelta(minutes=5),
            sales_start_at=now + timedelta(days=1),
        )
        assert advance_event_lifecycle() == 1
        event.refresh_from_db()
        assert event.status == EventStatus.SCHEDULED
        assert audit_actions(event) == ["event.published"]

    def test_publish_snapshots_refund_policy_once(self, make_event):
        """Phase 3: publish captures the refund policy (allow_refunds ->
        'balanced' preset) exactly once; later transitions never rewrite it."""
        now = timezone.now()
        event = make_event(
            status=EventStatus.DRAFT,
            allow_refunds=True,
            publish_at=now - timedelta(minutes=5),
            sales_start_at=now + timedelta(days=1),
        )
        advance_event_lifecycle()
        event.refresh_from_db()
        assert event.refund_policy_snapshot["preset_id"] == "balanced"
        assert {tier["days_before"] for tier in event.refund_policy_snapshot["tiers"]} == {7, 2, 0}

        # Doctor the snapshot, run the next transition — it must survive.
        sentinel = {"preset_id": "custom-sentinel", "tiers": []}
        type(event).objects.filter(pk=event.pk).update(
            refund_policy_snapshot=sentinel, sales_start_at=now - timedelta(minutes=1)
        )
        advance_event_lifecycle()
        event.refresh_from_db()
        assert event.status == EventStatus.ON_SALE
        assert event.refund_policy_snapshot == sentinel

    def test_no_refunds_flag_snapshots_strict_preset(self, make_event):
        now = timezone.now()
        event = make_event(
            status=EventStatus.DRAFT,
            allow_refunds=False,
            publish_at=now - timedelta(minutes=5),
            sales_start_at=now + timedelta(days=1),
        )
        advance_event_lifecycle()
        event.refresh_from_db()
        assert event.refund_policy_snapshot["preset_id"] == "strict"

    def test_opens_sales(self, make_event):
        now = timezone.now()
        event = make_event(status=EventStatus.SCHEDULED, sales_start_at=now - timedelta(minutes=1))
        advance_event_lifecycle()
        event.refresh_from_db()
        assert event.status == EventStatus.ON_SALE
        assert audit_actions(event) == ["event.sales_opened"]

    def test_full_catchup_in_one_run(self, make_event):
        """A stale draft whose whole schedule has passed lands on `ended` in a
        single run, with one audit entry per transition."""
        now = timezone.now()
        event = make_event(
            status=EventStatus.DRAFT,
            publish_at=now - timedelta(days=10),
            sales_start_at=now - timedelta(days=8),
            starts_at=now - timedelta(days=2),
            ends_at=now - timedelta(days=1),
        )
        assert advance_event_lifecycle() == 4
        event.refresh_from_db()
        assert event.status == EventStatus.ENDED
        assert audit_actions(event) == [
            "event.published",
            "event.sales_opened",
            "event.started",
            "event.ended",
        ]

    def test_scheduled_goes_live_without_sales_date(self, make_event):
        now = timezone.now()
        event = make_event(
            status=EventStatus.SCHEDULED,
            sales_start_at=None,
            starts_at=now - timedelta(minutes=10),
            ends_at=now + timedelta(hours=2),
        )
        advance_event_lifecycle()
        event.refresh_from_db()
        assert event.status == EventStatus.LIVE
        assert audit_actions(event) == ["event.started"]

    def test_rerun_never_double_fires(self, make_event):
        now = timezone.now()
        event = make_event(status=EventStatus.SCHEDULED, sales_start_at=now - timedelta(minutes=1))
        assert advance_event_lifecycle() == 1
        assert advance_event_lifecycle() == 0
        assert audit_actions(event) == ["event.sales_opened"]

    def test_future_schedules_do_not_fire(self, make_event):
        now = timezone.now()
        event = make_event(
            status=EventStatus.DRAFT,
            publish_at=now + timedelta(hours=1),
            sales_start_at=now + timedelta(days=1),
        )
        assert advance_event_lifecycle() == 0
        event.refresh_from_db()
        assert event.status == EventStatus.DRAFT

    def test_draft_without_schedule_never_advances(self, make_event):
        event = make_event(status=EventStatus.DRAFT, publish_at=None, sales_start_at=None)
        assert advance_event_lifecycle() == 0
        event.refresh_from_db()
        assert event.status == EventStatus.DRAFT
