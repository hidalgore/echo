"""Checkout fixtures: catalog + bearer sessions (mirroring events/tests) plus
a fake Stripe gateway so no test touches the network (the W4 seam rule)."""

import json
from datetime import timedelta

import pytest
from django.utils import timezone
from rest_framework.test import APIClient

from checkout import stripe_gateway
from checkout.stripe_gateway import PaymentOutcome, WebhookVerificationError
from events.models import DonationCampaign, Event, EventStatus, TicketTier, Venue
from identity.models import Device, User
from identity.tokens import issue_pair


@pytest.fixture
def client():
    return APIClient()


@pytest.fixture
def venue(db):
    return Venue.objects.create(
        name="The Warehouse", address="123 Industrial Ave, Seattle, WA", city="Seattle"
    )


@pytest.fixture
def make_event(db, venue):
    """Factory for a purchasable (on_sale) all-ages event, overridable."""

    def build(**overrides):
        now = timezone.now()
        fields = {
            "title": "Nightfall Festival",
            "description": "An elevated electronic night.",
            "category": "music",
            "venue": venue,
            "starts_at": now + timedelta(days=7),
            "ends_at": now + timedelta(days=7, hours=6),
            "publish_at": now - timedelta(days=7),
            "sales_start_at": now - timedelta(days=1),
            "status": EventStatus.ON_SALE,
            "image_url": "https://example.com/img.jpg",
            "host_name": "Electric Vibes",
            "host_verified": True,
            "age_restriction": None,
        }
        fields.update(overrides)
        event = Event(**fields)
        event.save()
        return event

    return build


@pytest.fixture
def make_tier(db):
    def build(event, *, name="General Admission", price_cents=7500, total=250, sold=0, **overrides):
        return TicketTier.objects.create(
            event=event,
            name=name,
            price_cents=price_cents,
            quantity_total=total,
            quantity_sold=sold,
            **overrides,
        )

    return build


@pytest.fixture
def make_campaign(db):
    def build(event, **overrides):
        fields = {
            "nonprofit_name": "Golden Futures Foundation",
            "cause_title": "Youth Scholarship Fund",
            "cause_description": "Scholarships and mentorship.",
            "goal_cents": 500_000,
            "raised_cents": 10_000,
            "donor_count": 3,
            "suggested_amounts_cents": [500, 1000, 2500],
        }
        fields.update(overrides)
        return DonationCampaign.objects.create(event=event, **fields)

    return build


@pytest.fixture
def user(db):
    return User.objects.create_user(email="buyer@example.com", name="Buyer Example")


@pytest.fixture
def other_user(db):
    return User.objects.create_user(email="other@example.com", name="Other Person")


@pytest.fixture
def _device(db):
    return Device.objects.create(install_id="test-install-checkout", platform="ios")


def _bearer_client(user, device, scope):
    pair = issue_pair(user=user, device=device, scope=scope)
    client = APIClient()
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {pair.access_token}")
    return client


@pytest.fixture
def user_client(user, _device):
    return _bearer_client(user, _device, "user")


@pytest.fixture
def other_user_client(other_user, _device):
    return _bearer_client(other_user, _device, "user")


@pytest.fixture
def guest_client(_device):
    return _bearer_client(None, _device, "guest")


class FakeStripeGateway:
    """Deterministic gateway double honoring the seam's surface. Queue
    outcomes with `queue_outcome`; default is immediate success with a fresh
    payment-intent id per call. Webhook verification accepts the literal
    signature "valid" and returns the JSON payload as the event."""

    def __init__(self):
        self.confirm_calls: list[dict] = []
        self._queued: list[PaymentOutcome] = []
        self._counter = 0

    def queue_outcome(self, outcome: PaymentOutcome) -> None:
        self._queued.append(outcome)

    def confirm_payment(self, **kwargs) -> PaymentOutcome:
        self.confirm_calls.append(kwargs)
        if self._queued:
            return self._queued.pop(0)
        self._counter += 1
        return PaymentOutcome(status="succeeded", payment_intent_id=f"pi_test_{self._counter}")

    def verify_webhook(self, payload: bytes, signature_header: str) -> dict:
        if signature_header != "valid":
            raise WebhookVerificationError("bad signature")
        return json.loads(payload or b"{}")


@pytest.fixture
def gateway(monkeypatch):
    fake = FakeStripeGateway()
    monkeypatch.setattr(stripe_gateway, "get_gateway", lambda: fake)
    return fake


@pytest.fixture
def gateway_unconfigured(monkeypatch):
    def raise_unconfigured():
        raise stripe_gateway.GatewayNotConfigured("no key")

    monkeypatch.setattr(stripe_gateway, "get_gateway", raise_unconfigured)


CREATE_INTENT_PATH = "/v1/checkout/intents"
CONFIRM_PATH = "/v1/payments/confirm"


def create_intent(client, event, *, key, tier=None, quantity=1, donation_cents=0, **extra):
    body = {"event_id": str(event.echo_id), "quantity": quantity, **extra}
    if tier is not None:
        body["ticket_type_id"] = str(tier.echo_id)
    if donation_cents:
        body["donation_cents"] = donation_cents
    return client.post(CREATE_INTENT_PATH, body, format="json", headers={"Idempotency-Key": key})


def confirm_payment(client, intent_id, *, key, token="pm_card_visa", method_type="card"):
    return client.post(
        CONFIRM_PATH,
        {"intent_id": str(intent_id), "payment_method": {"type": method_type, "token": token}},
        format="json",
        headers={"Idempotency-Key": key},
    )
