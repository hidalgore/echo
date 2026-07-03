import pytest

from events.models import EventStatus, SavedEvent


@pytest.mark.django_db
class TestSavedEvents:
    def test_save_list_unsave_roundtrip(self, user_client, make_event, make_tier):
        event = make_event()
        make_tier(event)

        created = user_client.post("/v1/saved-events", {"event_id": str(event.echo_id)}, format="json")
        assert created.status_code == 201

        items = user_client.get("/v1/saved-events").json()["items"]
        assert [item["echo_id"] for item in items] == [str(event.echo_id)]

        deleted = user_client.delete(f"/v1/saved-events/{event.echo_id}")
        assert deleted.status_code == 200
        assert user_client.get("/v1/saved-events").json()["items"] == []

    def test_save_is_idempotent(self, user_client, user, make_event):
        event = make_event()
        first = user_client.post("/v1/saved-events", {"event_id": str(event.echo_id)}, format="json")
        second = user_client.post("/v1/saved-events", {"event_id": str(event.echo_id)}, format="json")
        assert (first.status_code, second.status_code) == (201, 200)
        assert SavedEvent.objects.filter(user=user).count() == 1

    def test_unsave_never_saved_is_ok(self, user_client, make_event):
        event = make_event()
        assert user_client.delete(f"/v1/saved-events/{event.echo_id}").status_code == 200

    def test_cannot_save_draft_or_unknown(self, user_client, make_event):
        draft = make_event(status=EventStatus.DRAFT)
        response = user_client.post("/v1/saved-events", {"event_id": str(draft.echo_id)}, format="json")
        assert response.status_code == 404

        response = user_client.post("/v1/saved-events", {"event_id": "junk"}, format="json")
        assert response.status_code == 400  # serializer refuses non-UUID

    def test_requires_user_scope(self, client, guest_client, make_event):
        event = make_event()
        payload = {"event_id": str(event.echo_id)}
        # Anonymous is 401 (unauthenticated); a guest session is 403 (wrong scope).
        assert client.post("/v1/saved-events", payload, format="json").status_code == 401
        assert guest_client.post("/v1/saved-events", payload, format="json").status_code == 403
        assert guest_client.get("/v1/saved-events").status_code == 403

    def test_saved_lists_are_per_user(self, user_client, make_event, _device):
        from rest_framework.test import APIClient

        from identity.models import User
        from identity.tokens import issue_pair

        event = make_event()
        user_client.post("/v1/saved-events", {"event_id": str(event.echo_id)}, format="json")

        other = User.objects.create_user(email="other@example.com")
        pair = issue_pair(user=other, device=_device, scope="user")
        other_client = APIClient()
        other_client.credentials(HTTP_AUTHORIZATION=f"Bearer {pair.access_token}")
        assert other_client.get("/v1/saved-events").json()["items"] == []
