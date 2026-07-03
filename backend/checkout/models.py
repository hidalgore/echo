"""
Checkout & payments models (Phase 3 / W1).

- CheckoutIntent: one buyer's in-flight purchase — the server-computed pricing
  snapshot (all cents, locked rule), the age gate, the Stripe payment-intent
  linkage, and the inventory hold: an intent in a HOLDING status *is* the hold
  on `TicketTier.quantity_held`; its lifecycle transitions (checkout.services)
  move that quantity exactly once.
- DonationTransaction: donations ride the intent's charge but are recorded as
  separate transactions with campaign attribution (locked S-05 rule).
- StripeWebhookEvent: dedup ledger for webhook deliveries — consumers are
  idempotent by Stripe event id (W4).
"""

from django.db import models

from core.models import EchoIdModel


class IntentStatus(models.TextChoices):
    """Server lifecycle. The wire enum (locked CheckoutIntentDTO) folds
    EXPIRED into `canceled` at serialization; everything else maps 1:1."""

    REQUIRES_VERIFICATION = "requires_verification"
    REQUIRES_PAYMENT = "requires_payment"
    PROCESSING = "processing"
    SUCCEEDED = "succeeded"
    CANCELED = "canceled"
    EXPIRED = "expired"


# Statuses whose intents count against TicketTier.quantity_held. Leaving this
# set (succeed / cancel / expire) must adjust the counter exactly once.
HOLDING_STATUSES = (
    IntentStatus.REQUIRES_VERIFICATION,
    IntentStatus.REQUIRES_PAYMENT,
    IntentStatus.PROCESSING,
)


class CheckoutIntent(EchoIdModel):
    user = models.ForeignKey("identity.User", on_delete=models.PROTECT, related_name="checkout_intents")
    # PROTECT throughout: financial records must survive catalog cleanup.
    event = models.ForeignKey("events.Event", on_delete=models.PROTECT, related_name="checkout_intents")
    tier = models.ForeignKey("events.TicketTier", on_delete=models.PROTECT, related_name="checkout_intents")
    quantity = models.PositiveSmallIntegerField()

    status = models.CharField(
        max_length=24, choices=IntentStatus.choices, default=IntentStatus.REQUIRES_PAYMENT, db_index=True
    )
    currency = models.CharField(max_length=3, default="USD")

    # Pricing snapshot in cents (checkout.pricing — server-authoritative).
    # fees_cents on the wire = platform + processing; the split is kept for
    # payouts/closeout reporting (Phase 7).
    subtotal_cents = models.PositiveIntegerField()
    platform_fee_cents = models.PositiveIntegerField()
    processing_fee_cents = models.PositiveIntegerField()
    tax_cents = models.PositiveIntegerField()
    donation_cents = models.PositiveIntegerField(default=0)
    donation_fee_cents = models.PositiveIntegerField(default=0)
    total_cents = models.PositiveIntegerField()

    # Locked age gate: no payment before verification (verification itself is
    # Phase 6 — until it lands, confirm refuses REQUIRES_VERIFICATION intents).
    age_verification_required = models.BooleanField(default=False)

    donation_campaign = models.ForeignKey(
        "events.DonationCampaign",
        null=True,
        blank=True,
        on_delete=models.PROTECT,
        related_name="checkout_intents",
    )

    stripe_payment_intent_id = models.CharField(max_length=255, blank=True, default="")

    # Hold TTL (create + ECHO_CHECKOUT_HOLD_TTL_SECONDS). The expiry worker
    # returns the held quantity after this passes.
    expires_at = models.DateTimeField()
    # Set when the held quantity was RETURNED unsold (cancel/expiry). Stays
    # null on successful completion (the hold converts into quantity_sold) —
    # the late-webhook-success path uses this to know whether it must re-check
    # availability before issuing.
    hold_returned_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        indexes = [
            # Expiry worker scan.
            models.Index(fields=["status", "expires_at"], name="intent_status_expires_idx"),
        ]
        constraints = [
            # Webhooks resolve intents by payment-intent ref; two intents must
            # never share one.
            models.UniqueConstraint(
                fields=["stripe_payment_intent_id"],
                condition=~models.Q(stripe_payment_intent_id=""),
                name="uniq_intent_stripe_payment_intent",
            ),
        ]

    def __str__(self) -> str:
        return f"CheckoutIntent({self.echo_id}, {self.status})"


class DonationTransactionStatus(models.TextChoices):
    SUCCEEDED = "succeeded"
    REFUNDED = "refunded"


class DonationTransaction(EchoIdModel):
    """A completed donation, recorded separately from ticket revenue with
    campaign attribution (locked S-05 rule). Created only when the carrying
    payment succeeds; the donor pays amount + processing fee, the campaign is
    credited the amount."""

    intent = models.ForeignKey(CheckoutIntent, on_delete=models.PROTECT, related_name="donations")
    campaign = models.ForeignKey(
        "events.DonationCampaign", on_delete=models.PROTECT, related_name="transactions"
    )
    user = models.ForeignKey("identity.User", on_delete=models.PROTECT, related_name="donations")

    amount_cents = models.PositiveIntegerField()
    processing_fee_cents = models.PositiveIntegerField(default=0)
    status = models.CharField(
        max_length=16,
        choices=DonationTransactionStatus.choices,
        default=DonationTransactionStatus.SUCCEEDED,
    )

    def __str__(self) -> str:
        return f"DonationTransaction({self.campaign_id}, {self.amount_cents})"


class StripeWebhookEvent(EchoIdModel):
    """Processed-webhook ledger: consumers claim the Stripe event id before
    applying it, so redeliveries are replies, never re-applications."""

    stripe_event_id = models.CharField(max_length=255, unique=True)
    event_type = models.CharField(max_length=128)

    def __str__(self) -> str:
        return f"StripeWebhookEvent({self.stripe_event_id}, {self.event_type})"
