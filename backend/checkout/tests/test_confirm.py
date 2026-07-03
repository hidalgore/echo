"""POST /v1/payments/confirm — atomic issuance with hold completion, the
locked error codes, idempotent replay, the age gate, and the donation
transaction (all against the fake gateway seam; no network)."""

import pytest

from audit.models import AuditLogEntry
from checkout.models import CheckoutIntent, DonationTransaction, IntentStatus
from checkout.stripe_gateway import PaymentOutcome
from checkout.tests.conftest import confirm_payment, create_intent
from events.models import DonationCampaign
from tickets.models import Ticket

# intent_id: the flagged Phase 4 TicketDTO amendment (wallet grouping linkage).
TICKET_KEYS = {"echo_id", "event_id", "tier_id", "intent_id", "status", "age_badge", "issued_at"}


def _created_intent(user_client, event, tier, **kwargs):
    response = create_intent(user_client, event, tier=tier, **kwargs)
    assert response.status_code == 201, response.json()
    return response.json()


@pytest.mark.django_db
class TestConfirmHappyPath:
    def test_issues_tickets_atomically_with_hold_completion(
        self, user_client, make_event, make_tier, gateway
    ):
        event = make_event()
        tier = make_tier(event, total=10)
        intent = _created_intent(user_client, event, tier, quantity=2, key="k-buy")

        response = confirm_payment(user_client, intent["echo_id"], key="k-pay")
        assert response.status_code == 201
        body = response.json()
        assert body["status"] == "succeeded"
        assert len(body["tickets"]) == 2
        assert all(set(ticket.keys()) == TICKET_KEYS for ticket in body["tickets"])
        assert all(ticket["status"] == "active" for ticket in body["tickets"])
        assert all(ticket["tier_id"] == str(tier.echo_id) for ticket in body["tickets"])

        tier.refresh_from_db()
        assert tier.quantity_sold == 2
        assert tier.quantity_held == 0
        stored = CheckoutIntent.objects.get(echo_id=intent["echo_id"])
        assert stored.status == IntentStatus.SUCCEEDED
        assert stored.stripe_payment_intent_id.startswith("pi_test_")
        assert Ticket.objects.count() == 2

        # The gateway was charged the server-priced total, exactly once.
        assert len(gateway.confirm_calls) == 1
        assert gateway.confirm_calls[0]["amount_cents"] == intent["total_cents"]
        assert AuditLogEntry.objects.filter(action="payment.confirmed").count() == 1

    def test_same_key_replays_without_double_charge(
        self, user_client, make_event, make_tier, gateway
    ):
        event = make_event()
        tier = make_tier(event, total=10)
        intent = _created_intent(user_client, event, tier, key="k-buy2")

        first = confirm_payment(user_client, intent["echo_id"], key="k-pay2")
        replay = confirm_payment(user_client, intent["echo_id"], key="k-pay2")
        assert replay.status_code == 201
        assert replay.json() == first.json()
        assert replay.headers.get("Idempotency-Replayed") == "true"
        assert len(gateway.confirm_calls) == 1
        assert Ticket.objects.count() == 1

    def test_fresh_key_on_paid_intent_conflicts(self, user_client, make_event, make_tier, gateway):
        event = make_event()
        tier = make_tier(event, total=10)
        intent = _created_intent(user_client, event, tier, key="k-buy3")
        confirm_payment(user_client, intent["echo_id"], key="k-pay3")

        again = confirm_payment(user_client, intent["echo_id"], key="k-pay3-different")
        assert again.status_code == 409
        assert again.json()["error"]["code"] == "intent_already_completed"
        assert len(gateway.confirm_calls) == 1

    def test_donation_recorded_as_separate_transaction_with_attribution(
        self, user_client, make_event, make_tier, make_campaign, gateway
    ):
        event = make_event()
        tier = make_tier(event, price_cents=5000, total=10)
        campaign = make_campaign(event, raised_cents=10_000, donor_count=3)
        intent = _created_intent(user_client, event, tier, donation_cents=1000, key="k-don")

        response = confirm_payment(user_client, intent["echo_id"], key="k-don-pay")
        assert response.status_code == 201

        donation = DonationTransaction.objects.get()
        assert donation.campaign_id == campaign.echo_id
        assert donation.amount_cents == 1000
        assert donation.processing_fee_cents == 59
        campaign_row = DonationCampaign.objects.get(pk=campaign.pk)
        assert campaign_row.raised_cents == 11_000
        assert campaign_row.donor_count == 4


@pytest.mark.django_db
class TestConfirmRefusals:
    def test_age_gate_blocks_payment_before_verification(
        self, user_client, make_event, make_tier, gateway
    ):
        event = make_event(age_restriction=21)
        tier = make_tier(event, total=10)
        intent = _created_intent(user_client, event, tier, key="k-age-buy")

        response = confirm_payment(user_client, intent["echo_id"], key="k-age-pay")
        assert response.status_code == 409
        assert response.json()["error"]["code"] == "age_verification_required"
        assert gateway.confirm_calls == []  # Stripe never reached

    def test_declined_card_keeps_hold_and_allows_retry(
        self, user_client, make_event, make_tier, gateway
    ):
        event = make_event()
        tier = make_tier(event, total=10)
        intent = _created_intent(user_client, event, tier, key="k-decline-buy")
        gateway.queue_outcome(
            PaymentOutcome(
                status="failed",
                payment_intent_id="pi_declined_1",
                error_code="card_declined",
                error_message="Your card was declined.",
            )
        )

        declined = confirm_payment(user_client, intent["echo_id"], key="k-decline-pay")
        assert declined.status_code == 402
        assert declined.json()["error"]["code"] == "card_declined"

        stored = CheckoutIntent.objects.get(echo_id=intent["echo_id"])
        tier.refresh_from_db()
        assert stored.status == IntentStatus.REQUIRES_PAYMENT  # payable again
        assert stored.stripe_payment_intent_id == "pi_declined_1"
        assert tier.quantity_held == 1  # hold stands until TTL
        assert AuditLogEntry.objects.filter(action="payment.failed").count() == 1

        retry = confirm_payment(user_client, intent["echo_id"], key="k-decline-retry")
        assert retry.status_code == 201
        assert Ticket.objects.count() == 1

    def test_requires_action_surfaces_as_retryable_402(
        self, user_client, make_event, make_tier, gateway
    ):
        event = make_event()
        tier = make_tier(event, total=10)
        intent = _created_intent(user_client, event, tier, key="k-3ds-buy")
        gateway.queue_outcome(
            PaymentOutcome(
                status="requires_action",
                payment_intent_id="pi_3ds_1",
                error_code="requires_action",
                error_message="Additional authentication required.",
            )
        )
        response = confirm_payment(user_client, intent["echo_id"], key="k-3ds-pay")
        assert response.status_code == 402
        assert response.json()["error"]["code"] == "requires_action"
        stored = CheckoutIntent.objects.get(echo_id=intent["echo_id"])
        assert stored.status == IntentStatus.REQUIRES_PAYMENT

    def test_expired_intent_refused_and_hold_returned(
        self, user_client, make_event, make_tier, gateway
    ):
        from datetime import timedelta

        from django.utils import timezone

        event = make_event()
        tier = make_tier(event, total=10)
        intent = _created_intent(user_client, event, tier, key="k-exp-buy")
        CheckoutIntent.objects.filter(echo_id=intent["echo_id"]).update(
            expires_at=timezone.now() - timedelta(seconds=1)
        )

        response = confirm_payment(user_client, intent["echo_id"], key="k-exp-pay")
        assert response.status_code == 409
        assert response.json()["error"]["code"] == "intent_expired"
        tier.refresh_from_db()
        assert tier.quantity_held == 0
        assert gateway.confirm_calls == []

    def test_someone_elses_intent_reads_as_absent(
        self, user_client, other_user_client, make_event, make_tier, gateway
    ):
        event = make_event()
        tier = make_tier(event, total=10)
        intent = _created_intent(user_client, event, tier, key="k-mine")
        response = confirm_payment(other_user_client, intent["echo_id"], key="k-thief")
        assert response.status_code == 404
        assert gateway.confirm_calls == []

    def test_unconfigured_gateway_fails_closed(
        self, user_client, make_event, make_tier, gateway_unconfigured
    ):
        event = make_event()
        tier = make_tier(event, total=10)
        intent = _created_intent(user_client, event, tier, key="k-nocfg-buy")

        response = confirm_payment(user_client, intent["echo_id"], key="k-nocfg-pay")
        assert response.status_code == 503
        assert response.json()["error"]["code"] == "payments_not_configured"
        stored = CheckoutIntent.objects.get(echo_id=intent["echo_id"])
        assert stored.status == IntentStatus.REQUIRES_PAYMENT  # claim reverted
