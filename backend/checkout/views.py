"""
S-05 checkout / payments endpoints (Phase 3 / W3-W4).

- POST /v1/checkout/intents   (user, ✅ idem) — price + hold + create intent
- GET  /v1/checkout/intents/:id (user, owner-only)
- POST /v1/payments/confirm   (user, ✅ idem) — charge, complete hold, issue
  tickets atomically
- POST /v1/webhooks/stripe    (server-to-server; signature-verified, exempt
  from the client registry — see scripts/check_contract_drift.py)

This is the first real consumer of core.idempotency (the locked platform
rule): both flagged mutations run under IdempotencyMixin, so a repeated key
replays the stored result and a concurrent duplicate 409s.

Age gate (locked): intents on age-restricted events are created as
`requires_verification` and confirm refuses them. Server-side verification
records land in Phase 6 — until then age-gated events cannot complete a live
checkout (flagged in the phase close-out).
"""

import logging
import uuid
from datetime import timedelta

from django.conf import settings
from django.db import IntegrityError, transaction
from django.utils import timezone
from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import exceptions, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from audit import service as audit
from checkout import services, stripe_gateway
from checkout.models import CheckoutIntent, IntentStatus, StripeWebhookEvent
from checkout.pricing import compute_pricing
from checkout.serializers import (
    CheckoutIntentSerializer,
    ConfirmPaymentRequestSerializer,
    CreateCheckoutIntentRequestSerializer,
)
from checkout.throttling import CheckoutIntentThrottle
from core.envelope import error_response
from core.idempotency import IDEMPOTENCY_HEADER, IdempotencyMixin
from core.ratelimit import UserRateThrottle
from events.models import VISIBLE_STATUSES, Event, EventStatus
from tickets.serializers import TicketSerializer

logger = logging.getLogger(__name__)

# Locked checkout eligibility (Phase 2 amendment note): buyable while sales
# are open or the event is underway.
PURCHASABLE_STATUSES = (EventStatus.ON_SALE, EventStatus.LIVE)


def _get_event_or_404(event_id) -> Event:
    try:
        return (
            Event.objects.filter(status__in=VISIBLE_STATUSES)
            .select_related("venue", "donation_campaign")
            .prefetch_related("tiers")
            .get(echo_id=event_id)
        )
    except Event.DoesNotExist:
        raise exceptions.NotFound("Event not found.") from None


def _get_owned_intent_or_404(request, intent_id) -> CheckoutIntent:
    """Owner-only fetch; someone else's intent reads as absent, never 403."""
    try:
        intent_uuid = uuid.UUID(str(intent_id))
    except ValueError:
        raise exceptions.NotFound("Checkout intent not found.") from None
    try:
        return CheckoutIntent.objects.select_related(
            "event", "tier", "user", "donation_campaign"
        ).get(echo_id=intent_uuid, user=request.user)
    except CheckoutIntent.DoesNotExist:
        raise exceptions.NotFound("Checkout intent not found.") from None


class CheckoutIntentCreateView(IdempotencyMixin, APIView):
    """POST /v1/checkout/intents — server pricing + atomic inventory hold."""

    required_scope = "user"
    idempotency_required = True
    throttle_classes = [UserRateThrottle, CheckoutIntentThrottle]

    @extend_schema(
        operation_id="createCheckoutIntent",
        request=CreateCheckoutIntentRequestSerializer,
        responses={201: CheckoutIntentSerializer},
    )
    def post(self, request):
        serializer = CreateCheckoutIntentRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payload = serializer.validated_data

        event = _get_event_or_404(payload["event_id"])
        if event.status not in PURCHASABLE_STATUSES:
            return error_response(
                "event_not_on_sale",
                "Tickets for this event are not currently on sale.",
                status.HTTP_409_CONFLICT,
            )

        tier = self._resolve_tier(event, payload.get("ticket_type_id"))

        campaign = getattr(event, "donation_campaign", None)
        donation_cents = payload["donation_cents"]
        if donation_cents > 0 and campaign is None:
            raise exceptions.ValidationError(
                {"donation_cents": "This event has no donation campaign."}
            )

        pricing = compute_pricing(
            tier.price_cents * payload["quantity"],
            nonprofit_host=event.host_is_nonprofit,
            donation_cents=donation_cents,
        )

        age_gated = bool(event.age_restriction)
        try:
            with transaction.atomic():
                services.acquire_hold(tier, payload["quantity"])
                intent = CheckoutIntent.objects.create(
                    user=request.user,
                    event=event,
                    tier=tier,
                    quantity=payload["quantity"],
                    status=(
                        IntentStatus.REQUIRES_VERIFICATION
                        if age_gated
                        else IntentStatus.REQUIRES_PAYMENT
                    ),
                    currency=payload["currency"],
                    subtotal_cents=pricing.subtotal_cents,
                    platform_fee_cents=pricing.platform_fee_cents,
                    processing_fee_cents=pricing.processing_fee_cents,
                    tax_cents=pricing.tax_cents,
                    donation_cents=pricing.donation_cents,
                    donation_fee_cents=pricing.donation_fee_cents,
                    total_cents=pricing.total_cents,
                    age_verification_required=age_gated,
                    donation_campaign=campaign if donation_cents > 0 else None,
                    expires_at=timezone.now()
                    + timedelta(seconds=settings.ECHO_CHECKOUT_HOLD_TTL_SECONDS),
                )
        except services.InsufficientInventory:
            # The locked client error code for stock races.
            return error_response(
                "inventory_changed",
                "Not enough tickets remain in this tier.",
                status.HTTP_409_CONFLICT,
            )

        audit.record(
            "checkout.intent_created",
            request=request,
            target=("checkout_intent", intent.echo_id),
            metadata={
                "event_id": str(event.echo_id),
                "tier_id": str(tier.echo_id),
                "quantity": intent.quantity,
                "total_cents": intent.total_cents,
                "donation_cents": intent.donation_cents,
                "age_verification_required": age_gated,
                "client_context": payload.get("client_context") or {},
            },
        )
        return Response(CheckoutIntentSerializer(intent).data, status=status.HTTP_201_CREATED)

    def _resolve_tier(self, event, ticket_type_id):
        tiers = list(event.tiers.all())
        if not tiers:
            raise exceptions.ValidationError({"event_id": "This event has no ticket tiers."})
        if ticket_type_id is None:
            return tiers[0]  # tiers are ordered by sort_order (model Meta)
        for tier in tiers:
            if tier.echo_id == ticket_type_id:
                return tier
        raise exceptions.ValidationError({"ticket_type_id": "Unknown ticket tier for this event."})


class CheckoutIntentDetailView(APIView):
    """GET /v1/checkout/intents/:id — poll an intent (owner-only)."""

    required_scope = "user"
    throttle_classes = [UserRateThrottle]

    @extend_schema(operation_id="checkoutIntent", responses={200: CheckoutIntentSerializer})
    def get(self, request, intent_id):
        intent = _get_owned_intent_or_404(request, intent_id)
        return Response(CheckoutIntentSerializer(intent).data)


class PaymentConfirmView(IdempotencyMixin, APIView):
    """POST /v1/payments/confirm — charge via Stripe, then atomically convert
    the hold into issued tickets."""

    required_scope = "user"
    idempotency_required = True
    throttle_classes = [UserRateThrottle]

    @extend_schema(
        operation_id="confirmPayment",
        request=ConfirmPaymentRequestSerializer,
        responses={201: OpenApiResponse(description="Payment confirmed; tickets issued.")},
    )
    def post(self, request):
        serializer = ConfirmPaymentRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payload = serializer.validated_data

        intent = _get_owned_intent_or_404(request, payload["intent_id"])

        blocked = self._refuse_unconfirmable(intent)
        if blocked is not None:
            return blocked

        # Claim the intent (requires_payment -> processing) so a concurrent
        # confirm with a *different* idempotency key can't double-charge; the
        # same-key case is already handled by the idempotency layer.
        claimed = CheckoutIntent.objects.filter(
            pk=intent.pk, status=IntentStatus.REQUIRES_PAYMENT
        ).update(status=IntentStatus.PROCESSING, updated_at=timezone.now())
        if not claimed:
            return error_response(
                "payment_in_flight",
                "A payment for this intent is already being processed.",
                status.HTTP_409_CONFLICT,
            )
        intent.status = IntentStatus.PROCESSING

        try:
            gateway = stripe_gateway.get_gateway()
        except stripe_gateway.GatewayNotConfigured:
            self._revert_to_payable(intent)
            return error_response(
                "payments_not_configured",
                "Payments are not configured for this environment.",
                status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        outcome = gateway.confirm_payment(
            amount_cents=intent.total_cents,
            currency=intent.currency,
            payment_method_token=payload["payment_method"]["token"],
            # Scope Stripe's idempotency to this intent + this client attempt:
            # a client retry replays, a fresh attempt (new key) re-charges a
            # failed intent.
            idempotency_key=f"{intent.echo_id}:{request.headers.get(IDEMPOTENCY_HEADER, '')}",
            metadata={
                "checkout_intent_id": str(intent.echo_id),
                "event_id": str(intent.event_id),
                "user_id": str(intent.user_id),
            },
        )

        if outcome.payment_intent_id:
            CheckoutIntent.objects.filter(pk=intent.pk).update(
                stripe_payment_intent_id=outcome.payment_intent_id, updated_at=timezone.now()
            )
            intent.stripe_payment_intent_id = outcome.payment_intent_id

        if not outcome.succeeded:
            # Leave the hold in place: the buyer may retry with another
            # method until the TTL returns it.
            self._revert_to_payable(intent)
            audit.record(
                "payment.failed",
                request=request,
                target=("checkout_intent", intent.echo_id),
                metadata={
                    "source": "confirm",
                    "error_code": outcome.error_code,
                    "stripe_payment_intent_id": outcome.payment_intent_id,
                    "payment_method_type": payload["payment_method"]["type"],
                },
            )
            return error_response(
                outcome.error_code or stripe_gateway.ERROR_UNKNOWN,
                outcome.error_message or "Payment could not be confirmed.",
                status.HTTP_402_PAYMENT_REQUIRED,
            )

        tickets = services.complete_intent(intent, source="confirm", request=request)
        if tickets is None:
            # The TTL expired mid-charge and inventory is gone (complete_intent
            # audited payment.orphaned) — surface the locked stock-race code.
            return error_response(
                "inventory_changed",
                "Your ticket hold expired before payment completed and the tier "
                "sold out. Support has been notified.",
                status.HTTP_409_CONFLICT,
            )

        return Response(
            {"status": "succeeded", "tickets": TicketSerializer(tickets, many=True).data},
            status=status.HTTP_201_CREATED,
        )

    def _refuse_unconfirmable(self, intent) -> Response | None:
        """Terminal / gated intents never reach Stripe."""
        if intent.status == IntentStatus.REQUIRES_VERIFICATION:
            return error_response(
                "age_verification_required",
                "Age verification must be completed before payment.",
                status.HTTP_409_CONFLICT,
            )
        if intent.status == IntentStatus.SUCCEEDED:
            return error_response(
                "intent_already_completed",
                "This checkout intent was already paid.",
                status.HTTP_409_CONFLICT,
            )
        if intent.status in (IntentStatus.CANCELED, IntentStatus.EXPIRED):
            return error_response(
                "intent_expired",
                "This checkout intent has expired. Start a new checkout.",
                status.HTTP_409_CONFLICT,
            )
        if intent.status == IntentStatus.PROCESSING:
            return error_response(
                "payment_in_flight",
                "A payment for this intent is already being processed.",
                status.HTTP_409_CONFLICT,
            )
        if intent.expires_at <= timezone.now():
            # TTL passed but the beat hasn't swept it yet — expire it now.
            services.release_hold(
                intent, target_status=IntentStatus.EXPIRED, audit_action="checkout.hold_expired"
            )
            return error_response(
                "intent_expired",
                "This checkout intent has expired. Start a new checkout.",
                status.HTTP_409_CONFLICT,
            )
        return None

    def _revert_to_payable(self, intent) -> None:
        CheckoutIntent.objects.filter(pk=intent.pk, status=IntentStatus.PROCESSING).update(
            status=IntentStatus.REQUIRES_PAYMENT, updated_at=timezone.now()
        )
        intent.status = IntentStatus.REQUIRES_PAYMENT


class StripeWebhookView(APIView):
    """POST /v1/webhooks/stripe — server-to-server; NOT client contract
    surface (allowlisted in scripts/check_contract_drift.py, the Phase 3
    registry-amendment decision). Authentication is the signature check; no
    bearer, no throttle (Stripe retries on 429 and bursts on backfills)."""

    required_scope = "public"
    authentication_classes: list = []
    permission_classes = [AllowAny]
    throttle_classes: list = []

    # Deliberately NOT schema-excluded: the drift script must see this route
    # so its server-to-server allowlist (not silence) is what vouches for it.
    @extend_schema(
        operation_id="stripeWebhook",
        request=None,
        responses={200: OpenApiResponse(description="Event acknowledged.")},
    )
    def post(self, request):
        try:
            gateway = stripe_gateway.get_gateway()
        except stripe_gateway.GatewayNotConfigured:
            return error_response(
                "payments_not_configured",
                "Payments are not configured for this environment.",
                status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        try:
            event = gateway.verify_webhook(
                request.body, request.headers.get("Stripe-Signature", "")
            )
        except stripe_gateway.WebhookVerificationError:
            return error_response(
                "invalid_signature", "Webhook signature verification failed.", 400
            )

        applied = apply_stripe_event(event)
        return Response({"ok": True, "applied": applied})


def apply_stripe_event(event: dict) -> bool:
    """Idempotently apply one verified Stripe event. Returns False for
    redeliveries and event types Phase 3 does not consume."""
    event_id = str(event.get("id") or "")
    event_type = str(event.get("type") or "")
    if not event_id:
        return False
    try:
        # Inner atomic: the duplicate-key rollback must not poison the
        # caller's transaction.
        with transaction.atomic():
            StripeWebhookEvent.objects.create(stripe_event_id=event_id, event_type=event_type)
    except IntegrityError:
        return False  # redelivery — already applied

    data = (event.get("data") or {}).get("object") or {}
    if event_type.startswith("payment_intent."):
        payment_intent_id = str(data.get("id") or "")
    else:
        payment_intent_id = str(data.get("payment_intent") or "")

    if event_type == "payment_intent.succeeded":
        intent = _intent_for_payment_intent(payment_intent_id)
        if intent is None:
            return False
        tickets = services.complete_intent(intent, source="webhook")
        audit.record(
            "webhook.applied",
            target=("checkout_intent", intent.echo_id),
            metadata={
                "stripe_event_id": event_id,
                "type": event_type,
                "issued": len(tickets) if tickets else 0,
            },
        )
        return True

    if event_type == "payment_intent.payment_failed":
        intent = _intent_for_payment_intent(payment_intent_id)
        if intent is None:
            return False
        # A processing intent whose async confirmation failed becomes payable
        # again (the hold stands until TTL); guarded so a sync confirm that
        # already handled it is untouched.
        CheckoutIntent.objects.filter(pk=intent.pk, status=IntentStatus.PROCESSING).update(
            status=IntentStatus.REQUIRES_PAYMENT, updated_at=timezone.now()
        )
        audit.record(
            "payment.failed",
            target=("checkout_intent", intent.echo_id),
            metadata={"source": "webhook", "stripe_event_id": event_id},
        )
        return True

    if event_type == "charge.refunded":
        # Phase 3 records the signal only — refund execution is Phase 8.
        intent = _intent_for_payment_intent(payment_intent_id)
        audit.record(
            "refund.recorded",
            target=("checkout_intent", intent.echo_id) if intent else None,
            metadata={
                "stripe_event_id": event_id,
                "stripe_payment_intent_id": payment_intent_id,
                "charge_id": str(data.get("id") or ""),
                "amount_refunded": data.get("amount_refunded"),
            },
        )
        return True

    logger.debug("ignoring unconsumed stripe event type %s", event_type)
    return False


def _intent_for_payment_intent(payment_intent_id: str) -> CheckoutIntent | None:
    if not payment_intent_id:
        return None
    intent = (
        CheckoutIntent.objects.select_related("user", "event", "tier")
        .filter(stripe_payment_intent_id=payment_intent_id)
        .first()
    )
    if intent is None:
        logger.warning("stripe webhook references unknown payment intent %s", payment_intent_id)
    return intent
