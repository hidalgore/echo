"""
Scheduled-publish lifecycle workers (Phase 2 / W3).

One beat task advances events along the locked flow:

    draft → scheduled (publish_at)   → visible          audit event.published
    scheduled → on_sale (sales_start_at) → purchasable  audit event.sales_opened
    scheduled/on_sale → live (starts_at)                audit event.started
    live → ended (ends_at)                              audit event.ended

Guarantees:
- **Only advance.** Every transition is a status-guarded UPDATE
  (`WHERE status = <source>`); the task can never move an event backwards or
  invent a state, and model validation already refuses impossible schedules.
- **Idempotent / no double-fire.** Re-running (or two concurrent beats)
  re-selects by source status; whoever wins the guarded UPDATE (rowcount 1)
  writes the single audit entry.
- **Clock-skew tolerant.** Pure `<= now` comparisons — a late beat catches up
  (transitions are processed in flow order, so a stale event advances through
  multiple states in one run), an early/backwards clock simply matches
  nothing.
"""

import logging

from celery import shared_task
from django.utils import timezone

from audit import service as audit
from events.models import Event, EventStatus

logger = logging.getLogger(__name__)

# (source status, target status, datetime field that triggers it, audit action)
# Order matters: flow order lets a stale event catch up in a single run.
_TRANSITIONS = (
    (EventStatus.DRAFT, EventStatus.SCHEDULED, "publish_at", "event.published"),
    (EventStatus.SCHEDULED, EventStatus.ON_SALE, "sales_start_at", "event.sales_opened"),
    # An event whose sales never open (no sales_start_at) still goes live.
    (EventStatus.SCHEDULED, EventStatus.LIVE, "starts_at", "event.started"),
    (EventStatus.ON_SALE, EventStatus.LIVE, "starts_at", "event.started"),
    (EventStatus.LIVE, EventStatus.ENDED, "ends_at", "event.ended"),
)


@shared_task
def advance_event_lifecycle() -> int:
    """Advance every due event one or more lifecycle steps. Returns the number
    of transitions applied."""
    now = timezone.now()
    advanced = 0
    for source, target, trigger_field, action in _TRANSITIONS:
        due = Event.objects.filter(status=source, **{f"{trigger_field}__lte": now}).only(
            "echo_id", "public_id"
        )
        for event in due:
            updated = Event.objects.filter(pk=event.pk, status=source).update(
                status=target, updated_at=now
            )
            if not updated:
                continue  # another worker won the guarded update
            advanced += 1
            audit.record(
                action,
                target=("event", event.echo_id),
                metadata={"public_id": event.public_id, "from_status": source, "to_status": target},
            )
    if advanced:
        logger.info("advanced %d event lifecycle transition(s)", advanced)
    return advanced
