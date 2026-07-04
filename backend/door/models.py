"""
Door-mode models (Phase 5 / W1-W3).

- DoorSession: one provisioned scanning post — event-scoped, device-bound,
  expiring (locked W1 shape). The 6-digit pause/resume passcode is stored
  hashed (Django hasher) and never logged; the walk-up buyer identity for
  door purchases (W4) hangs off the session so financial rows keep a real,
  attributable `User` without a schema change on checkout/tickets.
- DoorScan: one verdict record per scan attempt — live or reconciled. Feeds
  duplicate detection (last approved scan per ticket), reconciliation, and
  the closeout artifacts (attendance CSV, denied-attempt log, throughput).
"""

from django.db import models
from django.utils import timezone

from core.models import EchoIdModel
from door.access import ZONES


class DoorSessionStatus(models.TextChoices):
    ACTIVE = "active"
    PAUSED = "paused"
    CLOSED = "closed"


class DoorSession(EchoIdModel):
    """A provisioned door-scanning post for one event.

    Provisioning is a management command until Phase 7 host tooling
    (`manage.py provision_door_session`) — it creates the device row, issues
    the door-scoped token pair, and prints them once. Device trust: every
    door route resolves the session through the token's device binding; a
    session read with another device's token is absent, never 403.
    """

    # PROTECT: scan history and walk-up purchases reference the session.
    event = models.ForeignKey("events.Event", on_delete=models.PROTECT, related_name="door_sessions")
    device = models.ForeignKey(
        "identity.Device", on_delete=models.PROTECT, related_name="door_sessions"
    )

    label = models.CharField(max_length=120, blank=True, default="")
    # The checkpoint this post scans for — zone authorization compares the
    # ticket tier's allowed zones against this (locked tier→zone table).
    zone = models.CharField(max_length=32, choices=[(z, z) for z in ZONES], default="main_entry")

    status = models.CharField(
        max_length=16,
        choices=DoorSessionStatus.choices,
        default=DoorSessionStatus.ACTIVE,
        db_index=True,
    )

    # 6-digit pause/resume passcode — Django password hash, never plaintext,
    # never logged. Failed attempts lock the resume path (W1 locked rule:
    # validation is server-side).
    passcode_hash = models.CharField(max_length=128)
    passcode_failed_attempts = models.PositiveSmallIntegerField(default=0)
    passcode_locked_until = models.DateTimeField(null=True, blank=True)

    # Lazily-created buyer identity for door purchases (W4): walk-up buyers
    # have no account, but CheckoutIntent.user / Ticket.user are non-null
    # financial attribution — each session gets its own walk-up User so
    # purchases stay attributable to the post that sold them.
    walkup_user = models.ForeignKey(
        "identity.User",
        null=True,
        blank=True,
        on_delete=models.PROTECT,
        related_name="door_sessions",
    )

    expires_at = models.DateTimeField(db_index=True)

    def __str__(self) -> str:
        return f"DoorSession({self.echo_id}, {self.zone}, {self.status})"

    @property
    def expired(self) -> bool:
        return self.expires_at <= timezone.now()


class DoorScanSource(models.TextChoices):
    LIVE = "live"
    RECONCILE = "reconcile"


class DoorScan(EchoIdModel):
    """One scan verdict, live or merged from an offline ledger.

    `scanned_at` is the device's claim; `recorded_at` is server truth and is
    what duplicate resolution orders by (locked reconciliation rule).
    """

    session = models.ForeignKey(DoorSession, on_delete=models.PROTECT, related_name="scans")
    # Denormalized from session for closeout queries across a whole event.
    event = models.ForeignKey("events.Event", on_delete=models.PROTECT, related_name="door_scans")
    # Null when the credential never resolved to a ticket (malformed/unknown).
    ticket = models.ForeignKey(
        "tickets.Ticket",
        null=True,
        blank=True,
        on_delete=models.PROTECT,
        related_name="door_scans",
    )

    approved = models.BooleanField()
    # Locked client vocabulary (DoorVerificationState + the flagged
    # duplicate_alert extension) — see door.verdicts.
    verification_state = models.CharField(max_length=32)
    # The stable refusal code the verdict was built from (tickets.credentials
    # codes + door-level extensions); empty on clean approvals.
    refusal_code = models.CharField(max_length=32, blank=True, default="")
    failure_reason = models.CharField(max_length=64, blank=True, default="")
    # Wire TicketStatusDTO snapshot at verdict time.
    ticket_status = models.CharField(max_length=16)

    offline = models.BooleanField(default=False)
    source = models.CharField(
        max_length=16, choices=DoorScanSource.choices, default=DoorScanSource.LIVE
    )
    scanned_at = models.DateTimeField()
    recorded_at = models.DateTimeField(default=timezone.now, db_index=True)

    class Meta:
        indexes = [
            # Duplicate-window lookup on the scan hot path (<500ms rule).
            models.Index(fields=["ticket", "approved", "-recorded_at"], name="scan_ticket_dup_idx"),
            # Closeout: attendance/denied/throughput per event.
            models.Index(fields=["event", "recorded_at"], name="scan_event_recorded_idx"),
        ]
        constraints = [
            # Reconcile replays with a fresh Idempotency-Key must not
            # double-record the same ledger entry: one row per
            # (session, ticket, device-claimed timestamp) for merged scans.
            models.UniqueConstraint(
                fields=["session", "ticket", "scanned_at"],
                condition=models.Q(source="reconcile"),
                name="uniq_reconciled_scan_entry",
            ),
        ]

    def __str__(self) -> str:
        return f"DoorScan({self.verification_state}, ticket={self.ticket_id})"
