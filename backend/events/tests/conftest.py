"""Events fixtures: catalog factories + bearer sessions minted directly via
identity.tokens (no provider round-trip needed for S-03)."""

from datetime import timedelta

import pytest
from django.utils import timezone
from rest_framework.test import APIClient

from events.models import Event, EventStatus, TicketTier, Venue
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
    """Factory for a visible (on_sale) event one week out, overridable."""

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
            "age_restriction": 21,
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
    return User.objects.create_user(email="person@example.com", name="Person Example")


@pytest.fixture
def _device(db):
    return Device.objects.create(install_id="test-install-0001", platform="ios")


@pytest.fixture
def user_client(user, _device):
    pair = issue_pair(user=user, device=_device, scope="user")
    client = APIClient()
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {pair.access_token}")
    return client


@pytest.fixture
def guest_client(_device):
    pair = issue_pair(user=None, device=_device, scope="guest")
    client = APIClient()
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {pair.access_token}")
    return client
