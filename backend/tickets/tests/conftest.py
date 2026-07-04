"""Ticket fixtures: catalog + bearer sessions (mirroring checkout/tests) plus
an ephemeral Ed25519 signing key so no test depends on env material, and
issued-ticket factories (a Ticket always hangs off a succeeded intent)."""

import base64
from datetime import timedelta

import pytest
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
from django.utils import timezone
from rest_framework.test import APIClient

from checkout.models import CheckoutIntent, IntentStatus
from events.models import Event, EventStatus, TicketTier, Venue
from identity.models import Device, User
from identity.tokens import issue_pair
from tickets.models import Ticket


def generate_seed_b64() -> str:
    private_key = Ed25519PrivateKey.generate()
    return base64.b64encode(
        private_key.private_bytes(
            encoding=serialization.Encoding.Raw,
            format=serialization.PrivateFormat.Raw,
            encryption_algorithm=serialization.NoEncryption(),
        )
    ).decode("ascii")


@pytest.fixture(autouse=True)
def _reset_signer_caches():
    """Process-wide signers cache by config; tests swap keys/paths per-test."""
    from tickets import credentials, passkit

    credentials._signer = None
    passkit._pass_signer = None
    yield
    credentials._signer = None
    passkit._pass_signer = None


@pytest.fixture
def signing_key(settings):
    """Configure a fresh per-test signing key (the fail-closed default stays
    unconfigured; tests opt in)."""
    seed = generate_seed_b64()
    settings.ECHO_CREDENTIAL_SIGNING_KEY = seed
    return seed


@pytest.fixture
def venue(db):
    return Venue.objects.create(
        name="The Warehouse", address="123 Industrial Ave, Seattle, WA", city="Seattle"
    )


@pytest.fixture
def make_event(db, venue):
    """Factory for an on-sale all-ages event, overridable."""

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
def user(db):
    return User.objects.create_user(email="buyer@example.com", name="Buyer Example")


@pytest.fixture
def other_user(db):
    return User.objects.create_user(email="other@example.com", name="Other Person")


@pytest.fixture
def _device(db):
    return Device.objects.create(install_id="test-install-tickets", platform="ios")


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


@pytest.fixture
def make_intent(db, make_event, make_tier, user):
    """A succeeded intent — the linkage every issued ticket must carry."""

    def build(*, owner=None, event=None, tier=None, quantity=1):
        event = event or make_event()
        tier = tier or make_tier(event)
        return CheckoutIntent.objects.create(
            user=owner or user,
            event=event,
            tier=tier,
            quantity=quantity,
            status=IntentStatus.SUCCEEDED,
            subtotal_cents=tier.price_cents * quantity,
            platform_fee_cents=0,
            processing_fee_cents=0,
            tax_cents=0,
            total_cents=tier.price_cents * quantity,
            expires_at=timezone.now() + timedelta(minutes=10),
        )

    return build


@pytest.fixture
def make_ticket(db, make_intent):
    """One issued admission (creates the backing intent unless given one)."""

    def build(*, owner=None, intent=None, quantity=1, **overrides):
        intent = intent or make_intent(owner=owner, quantity=quantity)
        return Ticket.objects.create(
            user=intent.user, event=intent.event, tier=intent.tier, intent=intent, **overrides
        )

    return build
