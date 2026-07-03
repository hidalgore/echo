"""
Ticket + credential models (Phase 3 issuance, Phase 4 credentials).

Tickets are issued on payment confirmation — one row per admission, even for
multi-quantity purchases, because door scans (Phase 5) and credentials
(Phase 4) validate individual admissions. Transfers are Phase 8.

TicketCredential is the rotating-credential substrate (Phase 4 / W1): exactly
one row per ticket holding the *current* rotation state. Rotation overwrites
the row (nonce + NFC id + token + expiry), which is what invalidates the
predecessor — verification (tickets.credentials.verify_validation_token)
accepts only the stored nonce, so an old token fails as superseded even
inside its expiry window. History lives in the audit log, not here.
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


class TicketCredential(EchoIdModel):
    """Current rotation state for one ticket's entry credential.

    Derived security material, not a financial record — CASCADE is correct
    here (unlike Ticket's PROTECT FKs): if a ticket were ever hard-deleted,
    its credential must not outlive it.
    """

    ticket = models.OneToOneField(Ticket, on_delete=models.CASCADE, related_name="credential")
    # Rotation nonce — the `cid` claim inside validation_token. A token whose
    # cid no longer matches this column is superseded (invalidated predecessor).
    nonce = models.CharField(max_length=64)
    # Opaque rotating identifier presented over NFC (challenge-response id;
    # Phase 5 door scans look the ticket up by it). Never derivable from the
    # ticket serial — serial-only validation is disallowed (locked rule).
    nfc_credential_id = models.CharField(max_length=64, unique=True)
    # The current server-signed token, stored so a within-window GET can
    # re-serve it without rotating (Ed25519 signing is deterministic, but
    # explicit storage keeps reads read-only).
    validation_token = models.TextField()
    expires_at = models.DateTimeField(db_index=True)
    minted_at = models.DateTimeField(default=timezone.now)

    def __str__(self) -> str:
        return f"TicketCredential({self.ticket_id}, expires {self.expires_at:%H:%M:%S})"
