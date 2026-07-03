import pytest
from rest_framework.test import APIClient

from core.models import IdempotencyRecord

pytestmark = [pytest.mark.django_db, pytest.mark.urls("core.tests.urls")]

URL = "/v1/_test/idempotent"
OTHER_URL = "/v1/_test/idempotent-other"


@pytest.fixture
def client():
    return APIClient()


class TestIdempotency:
    def test_missing_key_rejected_with_locked_code(self, client):
        response = client.post(URL, {"a": 1}, format="json")
        assert response.status_code == 400
        assert response.json()["error"]["code"] == "idempotency_key_required"

    def test_oversized_key_rejected(self, client):
        response = client.post(URL, {}, format="json", headers={"Idempotency-Key": "k" * 300})
        assert response.status_code == 400
        assert response.json()["error"]["code"] == "idempotency_key_invalid"

    def test_replay_returns_stored_response_without_reexecution(self, client):
        headers = {"Idempotency-Key": "replay-key-1"}
        first = client.post(URL, {"a": 1}, format="json", headers=headers)
        assert first.status_code == 201

        second = client.post(URL, {"a": 1}, format="json", headers=headers)
        assert second.status_code == 201
        assert second.json() == first.json(), "replay must return the stored body"
        assert second.headers.get("Idempotency-Replayed") == "true"

    def test_key_reuse_with_different_body_conflicts(self, client):
        headers = {"Idempotency-Key": "reuse-key-1"}
        assert client.post(URL, {"a": 1}, format="json", headers=headers).status_code == 201
        conflict = client.post(URL, {"a": 2}, format="json", headers=headers)
        assert conflict.status_code == 409
        assert conflict.json()["error"]["code"] == "idempotency_key_reuse"

    def test_same_key_different_endpoint_is_independent(self, client):
        headers = {"Idempotency-Key": "shared-key-1"}
        assert client.post(URL, {"a": 1}, format="json", headers=headers).status_code == 201
        other = client.post(OTHER_URL, {"a": 1}, format="json", headers=headers)
        assert other.status_code == 201
        assert other.json() == {"other": True}

    def test_get_requests_are_not_gated(self, client):
        # The mixin only gates unsafe methods; config/public GET needs no key.
        response = client.get("/v1/config/public")
        assert response.status_code == 200

    def test_server_error_is_not_stored_for_replay(self, client):
        headers = {"Idempotency-Key": "failing-key-1"}
        first = client.post("/v1/_test/idempotent-failing", {}, format="json", headers=headers)
        assert first.status_code == 500
        assert first.json()["error"]["code"] == "internal_error"
        # The slot must be released so a retry executes again rather than
        # replaying the failure or reporting in-flight.
        assert not IdempotencyRecord.objects.filter(key="failing-key-1").exists()
        second = client.post("/v1/_test/idempotent-failing", {}, format="json", headers=headers)
        assert second.status_code == 500

    def test_in_flight_row_conflicts(self, client):
        # Simulate a concurrent in-flight request: row exists, response not stored.
        from datetime import timedelta

        from django.utils import timezone

        import core.idempotency as idem

        IdempotencyRecord.objects.create(
            key="inflight-1",
            scope=f"POST {URL}",
            request_hash=idem._request_hash(_FakeRequest(URL, b'{"a":1}')),
            expires_at=timezone.now() + timedelta(hours=1),
        )
        response = client.post(URL, {"a": 1}, format="json", headers={"Idempotency-Key": "inflight-1"})
        assert response.status_code == 409
        assert response.json()["error"]["code"] == "idempotency_in_flight"

    def test_expired_slot_is_reclaimed(self, client):
        from datetime import timedelta

        from django.utils import timezone

        IdempotencyRecord.objects.create(
            key="expired-1",
            scope=f"POST {URL}",
            request_hash="stale",
            response_status=201,
            response_body={"stale": True},
            expires_at=timezone.now() - timedelta(seconds=1),
        )
        response = client.post(URL, {"b": 2}, format="json", headers={"Idempotency-Key": "expired-1"})
        assert response.status_code == 201
        assert response.json()["echo"] == {"b": 2}


class _FakeRequest:
    method = "POST"

    def __init__(self, path: str, body: bytes):
        self.path = path
        self.body = body


class TestPurgeTask:
    @pytest.mark.django_db
    def test_purges_only_expired(self):
        from datetime import timedelta

        from django.utils import timezone

        from core.tasks import purge_expired_idempotency_records

        now = timezone.now()
        IdempotencyRecord.objects.create(
            key="old", scope="s", request_hash="h", expires_at=now - timedelta(hours=1)
        )
        IdempotencyRecord.objects.create(
            key="fresh", scope="s", request_hash="h", expires_at=now + timedelta(hours=1)
        )
        deleted = purge_expired_idempotency_records()
        assert deleted == 1
        assert IdempotencyRecord.objects.filter(key="fresh").exists()
