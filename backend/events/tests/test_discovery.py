"""S-03 public discovery reads: shapes, visibility, filters, pagination, and
the Social Energy doctrine (no raw counts on any wire payload — asserted as an
exact key allowlist, not a spot check)."""

from datetime import timedelta

import pytest
from django.utils import timezone

from events.models import EventStatus, Venue
from events.social_energy import ENERGY_STATE_LABEL

EVENT_KEYS = {
    "echo_id",
    "public_id",
    "title",
    "description",
    "category",
    "status",
    "venue_name",
    "venue_address",
    "starts_at",
    "ends_at",
    "image_url",
    "is_featured",
    "host_name",
    "host_verified",
    "age_badge",
    "atmosphere_label",
    "atmosphere_intensity",
    "tiers",
}

TIER_KEYS = {"echo_id", "name", "description", "price_cents", "available"}

# The doctrine's forbidden substrings anywhere in a serialized payload.
FORBIDDEN_KEY_FRAGMENTS = ("quantity", "sold", "capacity", "attendance", "sell_through", "occupancy")


def assert_no_raw_counts(payload):
    if isinstance(payload, dict):
        for key, value in payload.items():
            assert not any(fragment in key.lower() for fragment in FORBIDDEN_KEY_FRAGMENTS), key
            assert_no_raw_counts(value)
    elif isinstance(payload, list):
        for item in payload:
            assert_no_raw_counts(item)


@pytest.mark.django_db
class TestEventList:
    def test_paged_shape_and_exact_keys(self, client, make_event, make_tier):
        event = make_event()
        make_tier(event, total=100, sold=40)
        body = client.get("/v1/events").json()

        assert set(body.keys()) <= {"items", "nextCursor"}
        (item,) = body["items"]
        assert set(item.keys()) == EVENT_KEYS
        assert set(item["tiers"][0].keys()) == TIER_KEYS
        assert item["tiers"][0]["available"] == 60
        assert item["age_badge"] == "21_plus"
        assert_no_raw_counts(body)

    def test_atmosphere_is_label_plus_bounded_intensity(self, client, make_event, make_tier):
        make_tier(make_event(), total=100, sold=90)
        (item,) = client.get("/v1/events").json()["items"]
        assert item["atmosphere_label"] in ENERGY_STATE_LABEL.values()
        assert 0.0 <= item["atmosphere_intensity"] <= 1.0

    def test_drafts_are_never_served(self, client, make_event):
        make_event(status=EventStatus.DRAFT, title="Hidden")
        visible = make_event(title="Visible")
        items = client.get("/v1/events").json()["items"]
        assert [item["echo_id"] for item in items] == [str(visible.echo_id)]

    def test_orders_by_start_time_and_paginates(self, client, make_event):
        now = timezone.now()
        for day in range(25):
            make_event(
                title=f"Event {day}",
                starts_at=now + timedelta(days=day + 1),
                ends_at=now + timedelta(days=day + 1, hours=2),
            )
        first = client.get("/v1/events").json()
        assert len(first["items"]) == 20
        assert first["items"][0]["title"] == "Event 0"
        assert "nextCursor" in first

        rest = client.get(f"/v1/events?cursor={first['nextCursor']}").json()
        assert len(rest["items"]) == 5
        assert "nextCursor" not in rest

    def test_filters(self, client, make_event):
        ballard = Venue.objects.create(name="Loft", address="9 Hill St, Portland, OR", city="Portland")
        make_event(title="Seattle Music")
        make_event(title="Portland Art", venue=ballard, category="art", is_featured=True)

        by_city = client.get("/v1/events?city=portland").json()["items"]
        assert [item["title"] for item in by_city] == ["Portland Art"]

        by_category = client.get("/v1/events?category=ART").json()["items"]
        assert [item["title"] for item in by_category] == ["Portland Art"]

        featured = client.get("/v1/events?featured=true").json()["items"]
        assert [item["title"] for item in featured] == ["Portland Art"]

    def test_date_window_filter(self, client, make_event):
        now = timezone.now()
        near = make_event(starts_at=now + timedelta(days=2), ends_at=now + timedelta(days=2, hours=2))
        make_event(starts_at=now + timedelta(days=30), ends_at=now + timedelta(days=30, hours=2))

        window_to = (now + timedelta(days=5)).date().isoformat()
        items = client.get(f"/v1/events?date_to={window_to}").json()["items"]
        assert [item["echo_id"] for item in items] == [str(near.echo_id)]

    def test_invalid_date_is_envelope_400(self, client, db):
        body = client.get("/v1/events?date_from=not-a-date")
        assert body.status_code == 400
        assert body.json()["error"]["code"] == "validation_error"


@pytest.mark.django_db
class TestEventDetailAndInventory:
    def test_detail_serves_event(self, client, make_event, make_tier):
        event = make_event()
        make_tier(event)
        body = client.get(f"/v1/events/{event.echo_id}").json()
        assert body["public_id"].startswith("EV-")
        assert set(body.keys()) == EVENT_KEYS
        assert_no_raw_counts(body)

    def test_detail_draft_and_unknown_are_404(self, client, make_event):
        draft = make_event(status=EventStatus.DRAFT)
        assert client.get(f"/v1/events/{draft.echo_id}").status_code == 404
        assert client.get("/v1/events/not-a-uuid").status_code == 404
        response = client.get(f"/v1/events/{draft.echo_id}")
        assert response.json()["error"]["code"] == "not_found"

    def test_inventory_shape(self, client, make_event, make_tier):
        event = make_event()
        make_tier(event, name="GA", total=100, sold=100)
        make_tier(event, name="VIP", total=50, sold=10, sort_order=1)
        body = client.get(f"/v1/events/{event.echo_id}/inventory").json()

        assert set(body.keys()) == {"event_id", "tiers"}
        assert [tier["name"] for tier in body["tiers"]] == ["GA", "VIP"]
        assert [tier["available"] for tier in body["tiers"]] == [0, 40]
        assert_no_raw_counts(body)

    def test_override_wins_and_is_clamped(self, client, make_event, make_tier):
        event = make_event(social_energy_override={"state": "peak_crowd", "intensity": 3.0})
        make_tier(event)
        body = client.get(f"/v1/events/{event.echo_id}").json()
        assert body["atmosphere_label"] == "Peak Crowd"
        assert body["atmosphere_intensity"] == 1.0

    def test_malformed_override_falls_back(self, client, make_event, make_tier):
        event = make_event(social_energy_override={"state": "dead", "intensity": 0.1})
        make_tier(event)
        body = client.get(f"/v1/events/{event.echo_id}").json()
        assert body["atmosphere_label"] in ENERGY_STATE_LABEL.values()
        assert body["atmosphere_label"] != "dead"
