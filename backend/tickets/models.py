"""
Ticket model (Phase 3 / W3 issuance).

Tickets are issued on payment confirmation — one row per admission, even for
multi-quantity purchases, because door scans (Phase 5) and credentials
(Phase 4) validate individual admissions. Phase 3 only issues and serializes
them (the locked TicketDTO); credential/QR/NFC surfaces land in Phase 4 and
transfers in Phase 8.
"""

from django.db import models
from django.utils import timezone

from core.models import EchoIdModel


class TicketStatus(models.TextChoices):
    """Locked TicketStatusDTO (frontend/types/api/shared.ts)."""

    ACTIVE = "active"
    CHECKED_IN = "checked_in"
    EXPIRED = "expired"
    REVOKED = "revoked"
    TRANSFERRED = "transferred"


class Ticket(EchoIdModel):
    user = models.ForeignKey("identity.User", on_delete=models.PROTECT, related_name="tickets")
    # PROTECT throughout: financial records must survive catalog cleanup.
    event = models.ForeignKey("events.Event", on_delete=models.PROTECT, related_name="tickets")
    tier = models.ForeignKey("events.TicketTier", on_delete=models.PROTECT, related_name="tickets")
    intent = models.ForeignKey(
        "checkout.CheckoutIntent", on_delete=models.PROTECT, related_name="tickets"
    )

    status = models.CharField(
        max_length=16, choices=TicketStatus.choices, default=TicketStatus.ACTIVE, db_index=True
    )
    issued_at = models.DateTimeField(default=timezone.now)

    def __str__(self) -> str:
        return f"Ticket({self.echo_id}, {self.status})"
