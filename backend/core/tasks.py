import logging

from celery import shared_task
from django.utils import timezone

from core.models import IdempotencyRecord

logger = logging.getLogger(__name__)


@shared_task
def purge_expired_idempotency_records() -> int:
    """Delete idempotency rows past their replay TTL. Returns rows deleted."""
    deleted, _ = IdempotencyRecord.objects.filter(expires_at__lte=timezone.now()).delete()
    if deleted:
        logger.info("Purged %d expired idempotency records", deleted)
    return deleted
