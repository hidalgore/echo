"""POST /v1/webhooks/stripe — signature verification, idempotent event
application (dedup by Stripe event id), and the three consumed event types.
Not in the client registry: the drift script's server-to-server allowlist is
the accounting (asserted in test_drift_allowlist)."""

import json
from pathlib import Path

import pytest

from audit.models import AuditLogEntry
from checkout.models import CheckoutIntent, IntentStatus, StripeWebhookEvent
from checkout.tests.conftest import create_intent
from tickets.models import Ticket

WEBHOOK_PATH = "/v1/webhooks/stripe"


def _stripe_event(event_id, event_type, obj):
    return {"id": event_id, "type": event_type, "data": {"object": obj}}


def _post_event(client, event, signature="valid"):
    return client.post(
        WEBHOOK_PATH,
        data=json.dumps(event),
        content_type="application/json",
        headers={"Stripe-Signature": signature},
    )


def _paid_processing_intent(user_client, event, tier, *, key, pi_id):
    created = create_intent(user_client, event, tier=tier, quantity=1, key=key).json()
    CheckoutIntent.objects.filter(echo_id=created["echo_id"]).update(
        status=IntentStatus.PROCESSING, stripe_payment_intent_id=pi_id
    )
    return CheckoutIntent.objects.get(echo_id=created["echo_id"])


@pytest.mark.django_db
class TestStripeWebhook:
    def test_bad_signature_rejected(self, client, gateway):
        response = _post_event(client, _stripe_event("evt_1", "payment_intent.succeeded", {}), "nope")
        assert response.status_code == 400
        assert response.json()["error"]["code"] == "invalid_signature"
        assert StripeWebhookEvent.objects.count() == 0

    def test_unconfigured_gateway_fails_closed(self, client, gateway_unconfigured):
        response = _post_event(client, _stripe_event("evt_1", "payment_intent.succeeded", {}))
        assert response.status_code == 503

    def test_payment_intent_succeeded_completes_and_issues(
        self, client, user_client, make_event, make_tier, gateway
    ):
        event = make_event()
        tier = make_tier(event, total=10)
        intent = _paid_processing_intent(user_client, event, tier, key="k-wh", pi_id="pi_wh_1")

        response = _post_event(
            client, _stripe_event("evt_ok_1", "payment_intent.succeeded", {"id": "pi_wh_1"})
        )
        assert response.status_code == 200
        assert response.json()["applied"] is True
        intent.refresh_from_db()
        tier.refresh_from_db()
        assert intent.status == IntentStatus.SUCCEEDED
        assert tier.quantity_sold == 1
        assert Ticket.objects.count() == 1
        assert AuditLogEntry.objects.filter(action="webhook.applied").count() == 1

    def test_redelivery_is_replied_not_reapplied(
        self, client, user_client, make_event, make_tier, gateway
    ):
        event = make_event()
        tier = make_tier(event, total=10)
        _paid_processing_intent(user_client, event, tier, key="k-wh2", pi_id="pi_wh_2")
        stripe_event = _stripe_event("evt_dup", "payment_intent.succeeded", {"id": "pi_wh_2"})

        first = _post_event(client, stripe_event)
        second = _post_event(client, stripe_event)
        assert first.json()["applied"] is True
        assert second.json()["applied"] is False
        assert Ticket.objects.count() == 1  # applied exactly once

    def test_sync_confirm_then_webhook_does_not_double_issue(
        self, client, user_client, make_event, make_tier, gateway
    ):
        from checkout.tests.conftest import confirm_payment

        event = make_event()
        tier = make_tier(event, total=10)
        created = create_intent(user_client, event, tier=tier, key="k-both").json()
        confirm_payment(user_client, created["echo_id"], key="k-both-pay")
        stored = CheckoutIntent.objects.get(echo_id=created["echo_id"])

        response = _post_event(
            client,
            _stripe_event(
                "evt_after_sync",
                "payment_intent.succeeded",
                {"id": stored.stripe_payment_intent_id},
            ),
        )
        assert response.status_code == 200
        assert Ticket.objects.count() == 1
        tier.refresh_from_db()
        assert tier.quantity_sold == 1

    def test_payment_failed_reverts_processing_intent(
        self, client, user_client, make_event, make_tier, gateway
    ):
        event = make_event()
        tier = make_tier(event, total=10)
        intent = _paid_processing_intent(user_client, event, tier, key="k-whf", pi_id="pi_wh_f")

        response = _post_event(
            client, _stripe_event("evt_fail", "payment_intent.payment_failed", {"id": "pi_wh_f"})
        )
        assert response.json()["applied"] is True
        intent.refresh_from_db()
        assert intent.status == IntentStatus.REQUIRES_PAYMENT
        assert AuditLogEntry.objects.filter(
            action="payment.failed", metadata__source="webhook"
        ).count() == 1

    def test_charge_refunded_records_signal_only(
        self, client, user_client, make_event, make_tier, gateway
    ):
        event = make_event()
        tier = make_tier(event, total=10)
        intent = _paid_processing_intent(user_client, event, tier, key="k-whr", pi_id="pi_wh_r")

        response = _post_event(
            client,
            _stripe_event(
                "evt_refund",
                "charge.refunded",
                {"id": "ch_1", "payment_intent": "pi_wh_r", "amount_refunded": 500},
            ),
        )
        assert response.json()["applied"] is True
        intent.refresh_from_db()
        assert intent.status == IntentStatus.PROCESSING  # untouched — Phase 8 executes refunds
        assert AuditLogEntry.objects.filter(action="refund.recorded").count() == 1

    def test_unknown_event_types_acknowledged_not_applied(self, client, gateway):
        response = _post_event(client, _stripe_event("evt_misc", "customer.created", {}))
        assert response.status_code == 200
        assert response.json()["applied"] is False

    def test_unknown_payment_intent_acknowledged(self, client, gateway, db):
        response = _post_event(
            client, _stripe_event("evt_orphan", "payment_intent.succeeded", {"id": "pi_unknown"})
        )
        assert response.status_code == 200
        assert response.json()["applied"] is False


class TestDriftAllowlist:
    def test_webhook_route_is_explicitly_allowlisted(self):
        """The Phase 3 registry-amendment decision: server-to-server routes are
        named in the drift script's allowlist, never silently exempt."""
        script = Path(__file__).resolve().parents[2] / "scripts" / "check_contract_drift.py"
        source = script.read_text()
        assert '("POST", "/v1/webhooks/stripe")' in source
