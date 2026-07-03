"""
Checkout expiry worker (Phase 3 / W2).

One beat task returns the held inventory of intents whose TTL passed
(locked: create on intent, release on failure/expiry). Idempotent like the
Phase 2 lifecycle task: release_hold's status-guarded UPDATE picks a single
winner, so a late beat, a double beat, or a race with confirm/webhook can
never return a hold twice. An intent expiring mid-confirm is fine — the
confirm/webhook completion path re-checks availability when it finds the
hold already returned.
"""

import logging

from celery import shared_task
from django.utils import timezone

from checkout import services
from checkout.models import HOLDING_STATUSES, CheckoutIntent, IntentStatus

logger = logging.getLogger(__name__)


@shared_task
def expire_stale_checkout_intents() -> int:
    """Expire every intent past its hold TTL. Returns holds released."""
    now = timezone.now()
    released = 0
    stale = CheckoutIntent.objects.filter(
        status__in=HOLDING_STATUSES, expires_at__lte=now
    ).select_related("user")
    for intent in stale:
        if services.release_hold(
            intent, target_status=IntentStatus.EXPIRED, audit_action="checkout.hold_expired"
        ):
            released += 1
    if released:
        logger.info("expired %d stale checkout intent hold(s)", released)
    return released
