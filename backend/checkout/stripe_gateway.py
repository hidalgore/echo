"""
Stripe integration seam (Phase 3 / W4).

Views and services depend on this module's small surface — never on the
`stripe` SDK directly — so unit tests run against a fake gateway and the real
network is only touched in staging E2E (mirrors the Phase 1 verifier seam).

Fail-closed credential gate (same doctrine as identity.verifiers): missing
STRIPE_SECRET_KEY raises GatewayNotConfigured -> envelope 503
`payments_not_configured`, never a silent mock.

Payment-method tokens: the client SDK (card field / Apple Pay / Google Pay)
always produces a Stripe PaymentMethod id — `payment_method.type` is
buyer-facing metadata, the token is what Stripe consumes. Confirmation is
server-side (`confirm=True`) with redirects disallowed; a method that would
require a redirect/3DS action comes back `requires_action` and is surfaced as
a retryable payment error until the 3DS client flow lands (flagged for the
Phase 4+ kickoff).
"""

import logging
from dataclasses import dataclass

from django.conf import settings

logger = logging.getLogger(__name__)


class GatewayNotConfigured(Exception):
    """STRIPE_SECRET_KEY is not set for this environment."""


class WebhookVerificationError(Exception):
    """Webhook payload failed signature verification."""


# Locked client error codes (ConfirmPaymentResponse.error_code).
ERROR_CARD_DECLINED = "card_declined"
ERROR_INSUFFICIENT_FUNDS = "insufficient_funds"
ERROR_EXPIRED_CARD = "expired_card"
ERROR_RATE_LIMITED = "rate_limited"
ERROR_REQUIRES_ACTION = "requires_action"
ERROR_UNKNOWN = "unknown"

_DECLINE_CODE_MAP = {
    "insufficient_funds": ERROR_INSUFFICIENT_FUNDS,
    "expired_card": ERROR_EXPIRED_CARD,
}


def _card_error_decline_code(exc) -> str:
    """Pull the most specific decline code a CardError carries."""
    error = getattr(exc, "error", None)
    for source, attr in ((error, "decline_code"), (error, "code"), (exc, "code")):
        value = getattr(source, attr, None) if source is not None else None
        if value:
            return str(value)
    return ""


def _card_error_payment_intent_id(exc) -> str:
    error = getattr(exc, "error", None)
    payment_intent = getattr(error, "payment_intent", None) if error is not None else None
    if isinstance(payment_intent, dict):
        return str(payment_intent.get("id") or "")
    return str(getattr(payment_intent, "id", "") or "")


@dataclass(frozen=True)
class PaymentOutcome:
    status: str  # "succeeded" | "requires_action" | "failed"
    payment_intent_id: str
    error_code: str | None = None
    error_message: str | None = None

    @property
    def succeeded(self) -> bool:
        return self.status == "succeeded"


class StripeGateway:
    """Thin wrapper over the official SDK. One instance per process."""

    def __init__(self, secret_key: str, webhook_secret: str):
        self._secret_key = secret_key
        self._webhook_secret = webhook_secret

    def _client(self):
        import stripe

        stripe.api_key = self._secret_key
        return stripe

    def confirm_payment(
        self,
        *,
        amount_cents: int,
        currency: str,
        payment_method_token: str,
        idempotency_key: str,
        metadata: dict[str, str],
    ) -> PaymentOutcome:
        """Create + confirm a PaymentIntent in one call. Stripe's own
        idempotency layer makes retries with the same key safe."""
        stripe = self._client()
        try:
            payment_intent = stripe.PaymentIntent.create(
                amount=amount_cents,
                currency=currency.lower(),
                payment_method=payment_method_token,
                confirm=True,
                automatic_payment_methods={"enabled": True, "allow_redirects": "never"},
                metadata=metadata,
                idempotency_key=idempotency_key,
            )
        except stripe.CardError as exc:
            return PaymentOutcome(
                status="failed",
                payment_intent_id=_card_error_payment_intent_id(exc),
                error_code=_DECLINE_CODE_MAP.get(_card_error_decline_code(exc), ERROR_CARD_DECLINED),
                error_message=exc.user_message or "Your card was declined.",
            )
        except stripe.RateLimitError:
            return PaymentOutcome(
                status="failed",
                payment_intent_id="",
                error_code=ERROR_RATE_LIMITED,
                error_message="The payment processor is busy. Please try again.",
            )
        except stripe.StripeError as exc:
            logger.exception("stripe confirm failed")
            return PaymentOutcome(
                status="failed",
                payment_intent_id="",
                error_code=ERROR_UNKNOWN,
                error_message=getattr(exc, "user_message", None) or "Payment could not be processed.",
            )

        if payment_intent.status == "succeeded":
            return PaymentOutcome(status="succeeded", payment_intent_id=payment_intent.id)
        if payment_intent.status == "requires_action":
            return PaymentOutcome(
                status="requires_action",
                payment_intent_id=payment_intent.id,
                error_code=ERROR_REQUIRES_ACTION,
                error_message="This payment method requires additional authentication. "
                "Please try another method.",
            )
        # processing / requires_* — webhook finalizes; report as processing.
        return PaymentOutcome(
            status="failed",
            payment_intent_id=payment_intent.id,
            error_code=ERROR_UNKNOWN,
            error_message=f"Payment did not complete (status: {payment_intent.status}).",
        )

    def verify_webhook(self, payload: bytes, signature_header: str) -> dict:
        """Signature-verify a webhook delivery and return the event dict."""
        stripe = self._client()
        try:
            event = stripe.Webhook.construct_event(payload, signature_header, self._webhook_secret)
        except (ValueError, stripe.SignatureVerificationError) as exc:
            raise WebhookVerificationError(str(exc)) from exc
        return event.to_dict() if hasattr(event, "to_dict") else dict(event)


_gateway: StripeGateway | None = None


def get_gateway() -> StripeGateway:
    """Process-wide gateway. Raises GatewayNotConfigured when the env has no
    Stripe credentials (fail closed — locked credential-gate doctrine)."""
    global _gateway
    if not settings.STRIPE_SECRET_KEY:
        raise GatewayNotConfigured("STRIPE_SECRET_KEY is not configured")
    if _gateway is None or _gateway._secret_key != settings.STRIPE_SECRET_KEY:
        _gateway = StripeGateway(settings.STRIPE_SECRET_KEY, settings.STRIPE_WEBHOOK_SECRET)
    return _gateway
