"""W2 inventory holds: available-number doctrine, exactly-once transitions
under racing writers (deterministic interleavings — true multi-connection
races need Postgres; sqlite serializes, so the guarded-UPDATE winner logic is
what these tests pin down), and the TTL expiry worker."""

from datetime import timedelta

import pytest
from django.utils import timezone

from audit.models import AuditLogEntry
from checkout import services
from checkout.models import CheckoutIntent, IntentStatus
from checkout.tasks import expire_stale_checkout_intents
from checkout.tests.conftest import create_intent
from tickets.models import Ticket


def _intent(response):
    return CheckoutIntent.objects.get(echo_id=response.json()["echo_id"])


@pytest.mark.django_db
class TestHoldAccounting:
    def test_hold_shrinks_served_available_without_new_keys(
        self, user_client, client, make_event, make_tier
    ):
        event = make_event()
        tier = make_tier(event, total=50, sold=10)
        create_intent(user_client, event, tier=tier, quantity=3, key="k-hold")
        body = client.get(f"/v1/events/{event.echo_id}/inventory").json()
        # Doctrine: `available` is the only serialized number and it reflects
        # the hold (50 total - 10 sold - 3 held).
        assert body["tiers"][0]["available"] == 37
        assert set(body["tiers"][0].keys()) == {
            "echo_id",
            "name",
            "description",
            "price_cents",
            "available",
        }

    def test_sequential_intents_cannot_oversell(self, user_client, make_event, make_tier):
        event = make_event()
        tier = make_tier(event, total=5)
        assert create_intent(user_client, event, tier=tier, quantity=3, key="k-a").status_code == 201
        assert create_intent(user_client, event, tier=tier, quantity=2, key="k-b").status_code == 201
        third = create_intent(user_client, event, tier=tier, quantity=1, key="k-c")
        assert third.status_code == 409
        tier.refresh_from_db()
        assert tier.quantity_held == 5
        assert tier.available == 0

    def test_release_is_exactly_once_under_double_fire(self, user_client, make_event, make_tier):
        event = make_event()
        tier = make_tier(event, total=10)
        intent = _intent(create_intent(user_client, event, tier=tier, quantity=4, key="k-once"))

        first = services.release_hold(
            intent, target_status=IntentStatus.CANCELED, audit_action="checkout.hold_released"
        )
        second = services.release_hold(
            intent, target_status=IntentStatus.EXPIRED, audit_action="checkout.hold_expired"
        )
        assert first is True
        assert second is False  # guarded UPDATE already lost — no double return
        tier.refresh_from_db()
        assert tier.quantity_held == 0
        assert intent.status == IntentStatus.CANCELED
        assert intent.hold_returned_at is not None


@pytest.mark.django_db
class TestExpiryWorker:
    def test_expires_only_past_ttl_and_is_idempotent(self, user_client, make_event, make_tier):
        event = make_event()
        tier = make_tier(event, total=20)
        stale = _intent(create_intent(user_client, event, tier=tier, quantity=2, key="k-stale"))
        fresh = _intent(create_intent(user_client, event, tier=tier, quantity=1, key="k-fresh"))
        CheckoutIntent.objects.filter(pk=stale.pk).update(
            expires_at=timezone.now() - timedelta(minutes=1)
        )

        assert expire_stale_checkout_intents() == 1
        assert expire_stale_checkout_intents() == 0  # re-run: nothing to do

        stale.refresh_from_db()
        fresh.refresh_from_db()
        tier.refresh_from_db()
        assert stale.status == IntentStatus.EXPIRED
        assert fresh.status == IntentStatus.REQUIRES_PAYMENT
        assert tier.quantity_held == 1  # only the fresh hold remains
        assert AuditLogEntry.objects.filter(action="checkout.hold_expired").count() == 1

    def test_expiry_sweeps_verification_gated_intents_too(
        self, user_client, make_event, make_tier
    ):
        event = make_event(age_restriction=21)
        tier = make_tier(event, total=10)
        gated = _intent(create_intent(user_client, event, tier=tier, key="k-gated"))
        CheckoutIntent.objects.filter(pk=gated.pk).update(
            expires_at=timezone.now() - timedelta(seconds=1)
        )
        assert expire_stale_checkout_intents() == 1
        tier.refresh_from_db()
        assert tier.quantity_held == 0


@pytest.mark.django_db
class TestLateCompletion:
    """The confirm-vs-expiry race: payment succeeded after the TTL returned
    the hold (webhook path). Never oversell; never lose a paid sale that can
    still be honored."""

    def _expired_paid_intent(self, user_client, event, tier, quantity=2, key="k-late"):
        intent = _intent(create_intent(user_client, event, tier=tier, quantity=quantity, key=key))
        services.release_hold(
            intent, target_status=IntentStatus.EXPIRED, audit_action="checkout.hold_expired"
        )
        intent.refresh_from_db()
        return intent

    def test_late_success_reissues_when_inventory_remains(
        self, user_client, make_event, make_tier
    ):
        event = make_event()
        tier = make_tier(event, total=10)
        intent = self._expired_paid_intent(user_client, event, tier)

        tickets = services.complete_intent(intent, source="webhook")
        assert tickets is not None and len(tickets) == 2
        tier.refresh_from_db()
        intent.refresh_from_db()
        assert intent.status == IntentStatus.SUCCEEDED
        assert tier.quantity_sold == 2
        assert tier.quantity_held == 0  # hold was already returned; not double-counted

    def test_late_success_never_oversells(self, user_client, other_user_client, make_event, make_tier):
        event = make_event()
        tier = make_tier(event, total=2)
        intent = self._expired_paid_intent(user_client, event, tier, quantity=2)
        # Someone else took the freed inventory in the meantime.
        create_intent(other_user_client, event, tier=tier, quantity=1, key="k-sniped")

        tickets = services.complete_intent(intent, source="webhook")
        assert tickets is None
        intent.refresh_from_db()
        tier.refresh_from_db()
        assert intent.status == IntentStatus.EXPIRED  # not resurrected
        assert tier.quantity_sold == 0
        assert Ticket.objects.count() == 0
        assert AuditLogEntry.objects.filter(action="payment.orphaned").count() == 1

    def test_completion_is_exactly_once(self, user_client, make_event, make_tier, gateway):
        from checkout.tests.conftest import confirm_payment

        event = make_event()
        tier = make_tier(event, total=10)
        created = create_intent(user_client, event, tier=tier, quantity=2, key="k-complete")
        confirm_payment(user_client, created.json()["echo_id"], key="k-complete-pay")

        intent = CheckoutIntent.objects.get(echo_id=created.json()["echo_id"])
        assert services.complete_intent(intent, source="webhook") is None  # already done
        tier.refresh_from_db()
        assert tier.quantity_sold == 2
        assert Ticket.objects.count() == 2
