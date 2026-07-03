"""
S-05 wire serializers (Phase 3 / W3) — snake_case, matching the (Phase 3-
amended) CheckoutIntentDTO / ConfirmPaymentResponseDTO in
frontend/types/api/dto.ts. Request shapes follow the locked S-05 client
contract (services/checkoutIntentService.ts CreateCheckoutIntentRequest /
ConfirmPaymentRequest; the Idempotency-Key rides the header, per the platform
rule, not the body).

TicketSerializer moved to tickets.serializers in Phase 4 — the S-06 surface
owns the shape now; the confirm response imports it from there (one copy).
"""

from rest_framework import serializers

from checkout.models import CheckoutIntent, IntentStatus

MAX_QUANTITY_PER_INTENT = 8  # the locked checkout UI's "Max 8 per reservation"


class ClientContextSerializer(serializers.Serializer):
    """Optional trust-signal context echoed by the locked request shape.
    Accepted and logged with the intent audit entry; never trusted."""

    platform = serializers.ChoiceField(choices=["web", "ios", "android"], required=False)
    locale = serializers.CharField(max_length=32, required=False)


class CreateCheckoutIntentRequestSerializer(serializers.Serializer):
    event_id = serializers.UUIDField()
    # Optional per the locked shape; omitted -> the event's first tier
    # (sort_order), matching the mock adapter's behavior.
    ticket_type_id = serializers.UUIDField(required=False, allow_null=True)
    quantity = serializers.IntegerField(min_value=1, max_value=MAX_QUANTITY_PER_INTENT, default=1)
    donation_cents = serializers.IntegerField(min_value=0, default=0)
    currency = serializers.ChoiceField(choices=["USD"], default="USD")
    client_context = ClientContextSerializer(required=False)


class PaymentMethodSerializer(serializers.Serializer):
    type = serializers.ChoiceField(choices=["card", "apple_pay", "google_pay"])
    token = serializers.CharField(max_length=255)


class ConfirmPaymentRequestSerializer(serializers.Serializer):
    intent_id = serializers.UUIDField()
    payment_method = PaymentMethodSerializer()


# EXPIRED is a server-side distinction; the locked wire enum folds it into
# `canceled` (the pre-ports S-05 shape's `expired` was reconciled this way
# when the DTO locked).
_STATUS_TO_WIRE = {IntentStatus.EXPIRED: "canceled"}


class CheckoutIntentSerializer(serializers.ModelSerializer):
    event_id = serializers.UUIDField(read_only=True)
    tier_id = serializers.UUIDField(read_only=True)
    status = serializers.SerializerMethodField()
    fees_cents = serializers.SerializerMethodField()

    class Meta:
        model = CheckoutIntent
        fields = [
            "echo_id",
            "event_id",
            "tier_id",
            "quantity",
            "status",
            "currency",
            "subtotal_cents",
            "fees_cents",
            "tax_cents",
            "donation_cents",
            "donation_fee_cents",
            "total_cents",
            "age_verification_required",
            "expires_at",
        ]

    def get_status(self, intent) -> str:
        return _STATUS_TO_WIRE.get(intent.status, intent.status)

    def get_fees_cents(self, intent) -> int:
        return intent.platform_fee_cents + intent.processing_fee_cents
