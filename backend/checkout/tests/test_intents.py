"""POST /v1/checkout/intents + GET /v1/checkout/intents/:id — wire shape,
idempotency (first real consumer of the Phase 0 store), eligibility, pricing,
donations, and the age gate."""

import pytest

from audit.models import AuditLogEntry
from checkout.models import CheckoutIntent, IntentStatus
from checkout.pricing import compute_pricing
from checkout.tests.conftest import create_intent
from events.models import EventStatus

INTENT_KEYS = {
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
}


@pytest.mark.django_db
class TestCreateIntent:
    def test_exact_wire_keys_and_server_pricing(self, user_client, make_event, make_tier):
        event = make_event()
        tier = make_tier(event, price_cents=7500, total=50)
        response = create_intent(user_client, event, tier=tier, quantity=2, key="k-shape")
        assert response.status_code == 201
        body = response.json()
        assert set(body.keys()) == INTENT_KEYS
        assert body["status"] == "requires_payment"
        assert body["quantity"] == 2
        assert body["age_verification_required"] is False

        expected = compute_pricing(15_000)
        assert body["subtotal_cents"] == expected.subtotal_cents
        assert body["fees_cents"] == expected.fees_cents
        assert body["tax_cents"] == expected.tax_cents
        assert body["total_cents"] == expected.total_cents

    def test_requires_idempotency_key(self, user_client, make_event, make_tier):
        event = make_event()
        make_tier(event)
        response = user_client.post(
            "/v1/checkout/intents", {"event_id": str(event.echo_id)}, format="json"
        )
        assert response.status_code == 400
        assert response.json()["error"]["code"] == "idempotency_key_required"

    def test_same_key_replays_without_second_intent(self, user_client, make_event, make_tier):
        event = make_event()
        tier = make_tier(event, total=50)
        first = create_intent(user_client, event, tier=tier, key="k-replay")
        replay = create_intent(user_client, event, tier=tier, key="k-replay")
        assert replay.status_code == 201
        assert replay.json() == first.json()
        assert replay.headers.get("Idempotency-Replayed") == "true"
        assert CheckoutIntent.objects.count() == 1
        tier.refresh_from_db()
        assert tier.quantity_held == 1  # hold taken once, not twice

    def test_key_reuse_with_different_body_conflicts(self, user_client, make_event, make_tier):
        event = make_event()
        tier = make_tier(event, total=50)
        create_intent(user_client, event, tier=tier, quantity=1, key="k-reuse")
        response = create_intent(user_client, event, tier=tier, quantity=2, key="k-reuse")
        assert response.status_code == 409
        assert response.json()["error"]["code"] == "idempotency_key_reuse"

    def test_omitted_tier_defaults_to_first_by_sort_order(self, user_client, make_event, make_tier):
        event = make_event()
        make_tier(event, name="VIP", price_cents=20_000, sort_order=1)
        general = make_tier(event, name="GA", price_cents=5_000, sort_order=0)
        response = create_intent(user_client, event, key="k-default-tier")
        assert response.status_code == 201
        assert response.json()["tier_id"] == str(general.echo_id)

    def test_unknown_tier_rejected(self, user_client, make_event, make_tier):
        event = make_event()
        make_tier(event)
        other_event = make_event(title="Other")
        foreign_tier = make_tier(other_event)
        response = create_intent(user_client, event, tier=foreign_tier, key="k-foreign")
        assert response.status_code == 400
        assert response.json()["error"]["code"] == "validation_error"

    def test_event_not_on_sale(self, user_client, make_event, make_tier):
        event = make_event(status=EventStatus.SCHEDULED)
        make_tier(event)
        response = create_intent(user_client, event, key="k-not-on-sale")
        assert response.status_code == 409
        assert response.json()["error"]["code"] == "event_not_on_sale"

    def test_ended_event_not_purchasable(self, user_client, make_event, make_tier):
        event = make_event(status=EventStatus.ENDED)
        make_tier(event)
        response = create_intent(user_client, event, key="k-ended")
        assert response.status_code == 409

    def test_draft_event_reads_as_absent(self, user_client, make_event, make_tier):
        event = make_event(status=EventStatus.DRAFT, publish_at=None, sales_start_at=None)
        make_tier(event)
        response = create_intent(user_client, event, key="k-draft")
        assert response.status_code == 404

    def test_insufficient_inventory_conflict(self, user_client, make_event, make_tier):
        event = make_event()
        tier = make_tier(event, total=10, sold=9)
        response = create_intent(user_client, event, tier=tier, quantity=2, key="k-stock")
        assert response.status_code == 409
        assert response.json()["error"]["code"] == "inventory_changed"
        assert CheckoutIntent.objects.count() == 0
        tier.refresh_from_db()
        assert tier.quantity_held == 0

    def test_quantity_cap_is_eight(self, user_client, make_event, make_tier):
        event = make_event()
        tier = make_tier(event, total=100)
        response = create_intent(user_client, event, tier=tier, quantity=9, key="k-cap")
        assert response.status_code == 400

    def test_donation_requires_campaign(self, user_client, make_event, make_tier):
        event = make_event()
        make_tier(event)
        response = create_intent(user_client, event, donation_cents=500, key="k-no-campaign")
        assert response.status_code == 400

    def test_donation_rides_the_intent(self, user_client, make_event, make_tier, make_campaign):
        event = make_event()
        tier = make_tier(event, price_cents=5000)
        campaign = make_campaign(event)
        response = create_intent(
            user_client, event, tier=tier, donation_cents=1000, key="k-donation"
        )
        assert response.status_code == 201
        body = response.json()
        assert body["donation_cents"] == 1000
        assert body["donation_fee_cents"] == 59
        intent = CheckoutIntent.objects.get()
        assert intent.donation_campaign_id == campaign.echo_id

    def test_nonprofit_host_waives_platform_fee(self, user_client, make_event, make_tier):
        event = make_event(host_is_nonprofit=True)
        tier = make_tier(event, price_cents=12_000)
        response = create_intent(user_client, event, tier=tier, key="k-nonprofit")
        expected = compute_pricing(12_000, nonprofit_host=True)
        assert response.json()["fees_cents"] == expected.fees_cents

    def test_age_gated_event_requires_verification(self, user_client, make_event, make_tier):
        event = make_event(age_restriction=21)
        make_tier(event)
        response = create_intent(user_client, event, key="k-age")
        body = response.json()
        assert body["status"] == "requires_verification"
        assert body["age_verification_required"] is True

    def test_guest_scope_refused(self, guest_client, make_event, make_tier):
        event = make_event()
        make_tier(event)
        response = create_intent(guest_client, event, key="k-guest")
        assert response.status_code == 403

    def test_unauthenticated_refused(self, client, make_event, make_tier, db):
        event = make_event()
        make_tier(event)
        response = create_intent(client, event, key="k-anon")
        assert response.status_code == 401
        assert response.json()["error"]["code"] == "unauthenticated"

    def test_intent_creation_is_audited(self, user_client, make_event, make_tier):
        event = make_event()
        make_tier(event)
        create_intent(user_client, event, key="k-audit")
        assert AuditLogEntry.objects.filter(action="checkout.intent_created").count() == 1


@pytest.mark.django_db
class TestGetIntent:
    def test_owner_reads_intent(self, user_client, make_event, make_tier):
        event = make_event()
        tier = make_tier(event)
        created = create_intent(user_client, event, tier=tier, key="k-get").json()
        response = user_client.get(f"/v1/checkout/intents/{created['echo_id']}")
        assert response.status_code == 200
        assert response.json() == created

    def test_someone_elses_intent_reads_as_absent(
        self, user_client, other_user_client, make_event, make_tier
    ):
        event = make_event()
        tier = make_tier(event)
        created = create_intent(user_client, event, tier=tier, key="k-owner").json()
        response = other_user_client.get(f"/v1/checkout/intents/{created['echo_id']}")
        assert response.status_code == 404

    def test_malformed_id_is_404_not_500(self, user_client):
        assert user_client.get("/v1/checkout/intents/not-a-uuid").status_code == 404

    def test_expired_intent_serializes_as_canceled(self, user_client, make_event, make_tier):
        event = make_event()
        tier = make_tier(event)
        created = create_intent(user_client, event, tier=tier, key="k-expired-wire").json()
        CheckoutIntent.objects.filter(echo_id=created["echo_id"]).update(
            status=IntentStatus.EXPIRED
        )
        body = user_client.get(f"/v1/checkout/intents/{created['echo_id']}").json()
        assert body["status"] == "canceled"
