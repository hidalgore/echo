"""Door purchases (W4): walk-up sales ride the Phase 3 checkout engine —
same pricing, same holds, same age gate — under door scope with per-session
walk-up buyer attribution."""

import pytest

from checkout import stripe_gateway
from checkout.models import CheckoutIntent
from checkout.tests.conftest import FakeStripeGateway
from door.models import DoorSessionStatus
from tickets.models import Ticket

pytestmark = pytest.mark.django_db

INTENTS_PATH = "/v1/door/purchase/intents"
CONFIRM_PATH = "/v1/door/purchase/confirm"


@pytest.fixture
def gateway(monkeypatch):
    fake = FakeStripeGateway()
    monkeypatch.setattr(stripe_gateway, "get_gateway", lambda: fake)
    return fake


def create_intent(client, session, *, key, event=None, quantity=1):
    return client.post(
        INTENTS_PATH,
        {
            "session_id": str(session.echo_id),
            "event_id": str((event or session.event).echo_id),
            "quantity": quantity,
        },
        format="json",
        headers={"Idempotency-Key": key},
    )


def confirm(client, session, intent_id, *, key, token="pm_card_visa"):
    return client.post(
        CONFIRM_PATH,
        {
            "session_id": str(session.echo_id),
            "intent_id": str(intent_id),
            "payment_method": {"type": "card", "token": token},
        },
        format="json",
        headers={"Idempotency-Key": key},
    )


@pytest.fixture
def sale_setup(make_event, make_tier, make_session):
    event = make_event()
    tier = make_tier(event)
    session = make_session(event)
    return event, tier, session


class TestPurchaseIntents:
    def test_walkup_intent_rides_the_checkout_engine(self, door_client, sale_setup):
        event, tier, session = sale_setup
        response = create_intent(door_client, session, key="p1", quantity=2)
        assert response.status_code == 201
        body = response.json()
        assert body["status"] == "requires_payment"
        assert body["subtotal_cents"] == tier.price_cents * 2
        assert body["total_cents"] > body["subtotal_cents"]  # server pricing applied

        intent = CheckoutIntent.objects.get(echo_id=body["echo_id"])
        session.refresh_from_db()
        assert intent.user_id == session.walkup_user_id
        tier.refresh_from_db()
        assert tier.quantity_held == 2  # atomic hold, same engine

    def test_walkup_user_created_once_per_session(self, door_client, sale_setup):
        _, _, session = sale_setup
        create_intent(door_client, session, key="p1")
        create_intent(door_client, session, key="p2")
        session.refresh_from_db()
        users = CheckoutIntent.objects.filter(user=session.walkup_user).count()
        assert users == 2

    def test_wrong_event_refused(self, door_client, sale_setup, make_event, make_tier):
        _, _, session = sale_setup
        other = make_event(title="Other Night")
        make_tier(other)
        response = create_intent(door_client, session, key="p1", event=other)
        assert response.status_code == 409
        assert response.json()["error"]["code"] == "wrong_event"

    def test_user_token_refused(self, user_client, sale_setup):
        _, _, session = sale_setup
        assert create_intent(user_client, session, key="p1").status_code == 403

    def test_paused_session_refused(self, door_client, make_event, make_tier, make_session):
        event = make_event()
        make_tier(event)
        session = make_session(event, status=DoorSessionStatus.PAUSED)
        response = create_intent(door_client, session, key="p1")
        assert response.status_code == 409
        assert response.json()["error"]["code"] == "door_session_paused"

    def test_age_gated_event_requires_verification(
        self, door_client, make_event, make_tier, make_session
    ):
        event = make_event(age_restriction=21)
        make_tier(event)
        session = make_session(event)
        body = create_intent(door_client, session, key="p1").json()
        assert body["status"] == "requires_verification"
        assert body["age_verification_required"] is True


class TestPurchaseConfirm:
    def test_confirm_issues_tickets_to_the_walkup_user(self, door_client, sale_setup, gateway):
        _, _, session = sale_setup
        intent_id = create_intent(door_client, session, key="p1", quantity=2).json()["echo_id"]
        response = confirm(door_client, session, intent_id, key="c1")
        assert response.status_code == 201
        body = response.json()
        assert body["status"] == "succeeded"
        assert len(body["tickets"]) == 2

        session.refresh_from_db()
        assert Ticket.objects.filter(user=session.walkup_user).count() == 2
        assert len(gateway.confirm_calls) == 1

    def test_age_gated_intent_refuses_confirm_at_the_door_too(
        self, door_client, make_event, make_tier, make_session, gateway
    ):
        event = make_event(age_restriction=21)
        make_tier(event)
        session = make_session(event)
        intent_id = create_intent(door_client, session, key="p1").json()["echo_id"]
        response = confirm(door_client, session, intent_id, key="c1")
        assert response.status_code == 409
        assert response.json()["error"]["code"] == "age_verification_required"
        assert gateway.confirm_calls == []  # Stripe never reached

    def test_other_sessions_intent_reads_as_absent(
        self, door_client, other_door_client, sale_setup, make_event, make_tier, make_session,
        other_door_device, gateway,
    ):
        _, _, session = sale_setup
        intent_id = create_intent(door_client, session, key="p1").json()["echo_id"]

        other_event = make_event(title="Other Night")
        make_tier(other_event)
        other_session = make_session(other_event, device=other_door_device)
        response = confirm(other_door_client, other_session, intent_id, key="c1")
        assert response.status_code == 404

    def test_replayed_confirm_key_charges_once(self, door_client, sale_setup, gateway):
        _, _, session = sale_setup
        intent_id = create_intent(door_client, session, key="p1").json()["echo_id"]
        first = confirm(door_client, session, intent_id, key="same")
        replay = confirm(door_client, session, intent_id, key="same")
        assert replay.headers.get("Idempotency-Replayed") == "true"
        assert replay.json() == first.json()
        assert len(gateway.confirm_calls) == 1


class TestPurchaseStatus:
    def test_device_bound_status_poll(self, door_client, other_door_client, sale_setup):
        _, _, session = sale_setup
        intent_id = create_intent(door_client, session, key="p1").json()["echo_id"]

        owned = door_client.get(f"{INTENTS_PATH}/{intent_id}")
        assert owned.status_code == 200
        assert owned.json()["status"] == "requires_payment"

        assert other_door_client.get(f"{INTENTS_PATH}/{intent_id}").status_code == 404

    def test_malformed_intent_id_reads_as_absent(self, door_client, sale_setup):
        assert door_client.get(f"{INTENTS_PATH}/nope").status_code == 404


class TestEndToEnd:
    def test_walkup_ticket_scans_at_the_same_door(
        self, door_client, sale_setup, gateway, signing_key
    ):
        """The full door loop: sell -> issue -> credential -> scan approves."""
        from door.tests.conftest import submit_scan
        from tickets import credentials

        _, _, session = sale_setup
        intent_id = create_intent(door_client, session, key="p1").json()["echo_id"]
        [ticket_row] = confirm(door_client, session, intent_id, key="c1").json()["tickets"]

        ticket = Ticket.objects.get(echo_id=ticket_row["echo_id"])
        qr = credentials.issue_credential(ticket).qr_payload
        body = submit_scan(door_client, session, key="s1", qr_payload=qr).json()
        assert body["approved"] is True
        assert body["verification_state"] == "verified"
