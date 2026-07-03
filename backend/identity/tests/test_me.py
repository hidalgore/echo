"""S-02 me surface: GET/PATCH /v1/me, POST /v1/me/flags, scope enforcement."""

import pytest

from audit.models import AuditLogEntry
from identity.models import User

pytestmark = pytest.mark.django_db


class TestMe:
    def test_get_me(self, auth_client):
        response = auth_client.get("/v1/me")
        assert response.status_code == 200
        body = response.json()
        assert body["email"] == "person@example.com"
        assert body["name"] == "Person Example"
        assert set(body.keys()) == {
            "echo_id", "public_id", "email", "name", "phone", "avatar_url", "flags", "created_at",
        }

    def test_anonymous_gets_401(self, client):
        response = client.get("/v1/me")
        assert response.status_code == 401
        assert response.json()["error"]["code"] == "unauthenticated"

    def test_garbage_bearer_gets_401_not_public(self, client):
        client.credentials(HTTP_AUTHORIZATION="Bearer garbage")
        response = client.get("/v1/me")
        assert response.status_code == 401

    def test_patch_profile_fields(self, auth_client):
        response = auth_client.patch(
            "/v1/me", {"name": "Renamed", "phone": "+1 555 000 1111"}, format="json"
        )
        assert response.status_code == 200
        assert response.json()["name"] == "Renamed"
        user = User.objects.get()
        assert user.phone == "+1 555 000 1111"
        entry = AuditLogEntry.objects.get(action="me.updated")
        assert entry.metadata["fields"] == ["name", "phone"]
        assert "Renamed" not in str(entry.metadata)  # names are PII; log field names only

    def test_patch_cannot_touch_email_or_flags(self, auth_client):
        auth_client.patch(
            "/v1/me", {"email": "new@example.com", "flags": {"x": 1}, "name": "Ok"}, format="json"
        )
        user = User.objects.get()
        assert user.email == "person@example.com"  # read-only: silently ignored per DRF convention
        assert user.flags == {}


class TestMeFlags:
    def test_merge_set_and_delete(self, auth_client):
        first = auth_client.post(
            "/v1/me/flags",
            {"flags": {"ftue.intro_seen": True, "ui.theme": "dark"}},
            format="json",
        )
        assert first.status_code == 200
        assert first.json()["flags"] == {"ftue.intro_seen": True, "ui.theme": "dark"}

        second = auth_client.post(
            "/v1/me/flags", {"flags": {"ui.theme": None, "ftue.step": 3}}, format="json"
        )
        assert second.json()["flags"] == {"ftue.intro_seen": True, "ftue.step": 3}
        assert User.objects.get().flags == {"ftue.intro_seen": True, "ftue.step": 3}

    def test_invalid_key_rejected(self, auth_client):
        response = auth_client.post("/v1/me/flags", {"flags": {"Bad Key!": True}}, format="json")
        assert response.status_code == 400
        assert response.json()["error"]["code"] == "validation_error"

    def test_object_value_rejected(self, auth_client):
        response = auth_client.post("/v1/me/flags", {"flags": {"nested": {"no": 1}}}, format="json")
        assert response.status_code == 400

    def test_flag_count_cap(self, auth_client):
        big = {f"flag.{i:02d}": True for i in range(51)}
        response = auth_client.post("/v1/me/flags", {"flags": big}, format="json")
        assert response.status_code == 400
        assert response.json()["error"]["code"] == "flags_limit_exceeded"
        assert User.objects.get().flags == {}
