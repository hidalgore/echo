"""
Inventory holds + intent lifecycle (Phase 3 / W2, consumed by W3/W4).

Doctrine (locked): holds are atomic and server-side — create on intent,
complete on payment success, release on failure/cancel/TTL expiry. Held
quantity reduces the S-03 `available` number and is never separately exposed.

Accounting model: an intent in a HOLDING status counts against
`TicketTier.quantity_held`; `TicketTier.available` is
total - sold - held. Every transition out of a HOLDING status pairs a
status-guarded UPDATE (`WHERE status IN <holding>` — only one writer wins)
with the counter adjustment inside one transaction that holds the tier row
lock (`select_for_update`), so the counter moves exactly once per intent no
matter how many workers race (expiry beat vs. confirm vs. webhook).
"""

import logging

from django.db import transaction
from django.db.models import F
from django.utils import timezone

from audit import service as audit
from checkout.models import HOLDING_STATUSES, CheckoutIntent, DonationTransaction, IntentStatus
from events.models import DonationCampaign, TicketTier
from tickets.models import Ticket

logger = logging.getLogger(__name__)


class InsufficientInventory(Exception):
    """Requested quantity exceeds the tier's available (total - sold - held)."""


def _locked_tier(tier_id) -> TicketTier:
    return TicketTier.objects.select_for_update().get(pk=tier_id)


def acquire_hold(tier: TicketTier, quantity: int) -> TicketTier:
    """Atomically reserve `quantity` on the tier. Must run inside the same
    transaction that creates the intent (the caller owns the atomic block);
    re-reads the row under lock so concurrent intents serialize."""
    locked = _locked_tier(tier.pk)
    if locked.available < quantity:
        raise InsufficientInventory(
            f"tier {locked.pk}: requested {quantity}, available {locked.available}"
        )
    locked.quantity_held += quantity
    locked.save(update_fields=["quantity_held", "updated_at"])
    return locked


def release_hold(intent: CheckoutIntent, *, target_status: str, audit_action: str) -> bool:
    """Return an intent's held quantity unsold (cancel / TTL expiry).

    Returns True when this call performed the transition; False when another
    writer already moved the intent out of its HOLDING status.
    """
    now = timezone.now()
    with transaction.atomic():
        tier = _locked_tier(intent.tier_id)
        updated = CheckoutIntent.objects.filter(
            pk=intent.pk, status__in=HOLDING_STATUSES
        ).update(status=target_status, hold_returned_at=now, updated_at=now)
        if not updated:
            return False
        tier.quantity_held = max(0, tier.quantity_held - intent.quantity)
        tier.save(update_fields=["quantity_held", "updated_at"])
    audit.record(
        audit_action,
        actor=intent.user,
        target=("checkout_intent", intent.echo_id),
        metadata={
            "event_id": str(intent.event_id),
            "tier_id": str(intent.tier_id),
            "quantity": intent.quantity,
        },
    )
    intent.refresh_from_db()
    return True


def complete_intent(intent: CheckoutIntent, *, source: str, request=None) -> list[Ticket] | None:
    """Finalize a paid intent: convert the hold into sales, issue tickets, and
    record the donation — all atomically. Idempotent: the status-guarded
    UPDATE decides a single winner; late callers get None (already done or
    already dead).

    `source` is "confirm" or "webhook" (audit metadata). The webhook path may
    arrive after the TTL expired and returned the hold; in that case the sale
    must re-check availability instead of double-consuming the counter.
    """
    now = timezone.now()
    with transaction.atomic():
        tier = _locked_tier(intent.tier_id)
        current = CheckoutIntent.objects.select_for_update().get(pk=intent.pk)

        if current.status == IntentStatus.SUCCEEDED:
            return None  # already completed (idempotent replay)

        if current.status in HOLDING_STATUSES:
            # Normal path: the hold is still counted — convert it to a sale.
            CheckoutIntent.objects.filter(pk=current.pk).update(
                status=IntentStatus.SUCCEEDED, updated_at=now
            )
            tier.quantity_held = max(0, tier.quantity_held - current.quantity)
            tier.quantity_sold += current.quantity
        elif current.hold_returned_at is not None:
            # Late success (webhook landed after expiry returned the hold):
            # the reservation is gone, so the sale must re-qualify against
            # live availability — never oversell.
            if tier.available < current.quantity:
                logger.error(
                    "late payment success for intent %s but tier %s has %d available "
                    "(needed %d) — payment captured without issuance; refund is a "
                    "Phase 8 operation, flag to operator",
                    current.echo_id,
                    tier.pk,
                    tier.available,
                    current.quantity,
                )
                audit.record(
                    "payment.orphaned",
                    actor=current.user,
                    target=("checkout_intent", current.echo_id),
                    metadata={"source": source, "reason": "insufficient_inventory_after_expiry"},
                )
                return None
            CheckoutIntent.objects.filter(pk=current.pk).update(
                status=IntentStatus.SUCCEEDED, updated_at=now
            )
            tier.quantity_sold += current.quantity
        else:
            # CANCELED without a returned hold cannot happen (release sets the
            # timestamp); treat defensively as not-completable.
            logger.warning(
                "complete_intent(%s) skipped: status=%s hold_returned_at=%s",
                current.echo_id,
                current.status,
                current.hold_returned_at,
            )
            return None

        tier.save(update_fields=["quantity_held", "quantity_sold", "updated_at"])

        tickets = [
            Ticket.objects.create(
                user=current.user,
                event=current.event,
                tier=tier,
                intent=current,
                issued_at=now,
            )
            for _ in range(current.quantity)
        ]

        if current.donation_cents > 0 and current.donation_campaign_id:
            DonationTransaction.objects.create(
                intent=current,
                campaign_id=current.donation_campaign_id,
                user=current.user,
                amount_cents=current.donation_cents,
                processing_fee_cents=current.donation_fee_cents,
            )
            DonationCampaign.objects.filter(pk=current.donation_campaign_id).update(
                raised_cents=F("raised_cents") + current.donation_cents,
                donor_count=F("donor_count") + 1,
            )

    audit.record(
        "payment.confirmed",
        request=request,
        actor=intent.user,
        target=("checkout_intent", intent.echo_id),
        metadata={
            "source": source,
            "event_id": str(intent.event_id),
            "tier_id": str(intent.tier_id),
            "quantity": intent.quantity,
            "total_cents": intent.total_cents,
            "donation_cents": intent.donation_cents,
            "stripe_payment_intent_id": intent.stripe_payment_intent_id,
        },
    )
    intent.refresh_from_db()
    return tickets
