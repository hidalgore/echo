"""Refresh rotation, reuse detection, logout revocation (W1 locked design)."""

from datetime import timedelta

import pytest
from django.utils import timezone

from audit.models import AuditLogEntry
from identity.models import RefreshToken

pytestmark = pytest.mark.django_db


def _refresh(client, secret):
    return client.post("/v1/auth/refresh", {"refresh_token": secret}, format="json")


class TestRotation:
    def test_rotation_issues_new_pair_and_retires_predecessor(self, client, user_session):
        response = _refresh(client, user_session["refresh_token"])
        assert response.status_code == 200
        body = response.json()
        assert body["refresh_token"] != user_session["refresh_token"]
        assert body["user"]["email"] == "person@example.com"

        live = RefreshToken.objects.filter(revoked_at__isnull=True)
        assert live.count() == 1
        retired = RefreshToken.objects.filter(revoked_at__isnull=False)
        assert retired.count() == 1
        assert live.get().parent == retired.get()
        assert live.get().family_id == retired.get().family_id
        assert AuditLogEntry.objects.filter(action="auth.refresh").count() == 1

    def test_reuse_of_rotated_token_revokes_family(self, client, user_session):
        rotated = _refresh(client, user_session["refresh_token"]).json()
        # Replay the original secret: theft signal — everything dies.
        response = _refresh(client, user_session["refresh_token"])
        assert response.status_code == 401
        assert response.json()["error"]["code"] == "refresh_reuse_detected"
        assert RefreshToken.objects.filter(revoked_at__isnull=True).count() == 0
        assert AuditLogEntry.objects.filter(action="auth.refresh_reuse_detected").count() == 1

        # The rotated descendant is dead too.
        assert _refresh(client, rotated["refresh_token"]).status_code == 401
        # And so are in-flight access tokens from the family.
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {rotated['access_token']}")
        assert client.get("/v1/me").status_code == 401

    def test_unknown_token_rejected(self, client):
        response = _refresh(client, "not-a-real-refresh-token")
        assert response.status_code == 401
        assert response.json()["error"]["code"] == "invalid_refresh_token"

    def test_expired_token_rejected(self, client, user_session):
        RefreshToken.objects.update(expires_at=timezone.now() - timedelta(seconds=1))
        response = _refresh(client, user_session["refresh_token"])
        assert response.status_code == 401
        assert response.json()["error"]["code"] == "invalid_refresh_token"

    def test_guest_session_rotates_too(self, client, device_payload):
        guest = client.post("/v1/sessions/guest", {"device": device_payload}, format="json").json()
        response = _refresh(client, guest["refresh_token"])
        assert response.status_code == 200
        assert response.json()["user"] is None
        assert RefreshToken.objects.filter(revoked_at__isnull=True, scope="guest").count() == 1


class TestLogout:
    def test_logout_revokes_session_and_access_token(self, client, user_session):
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {user_session['access_token']}")
        response = client.post(
            "/v1/auth/logout", {"refresh_token": user_session["refresh_token"]}, format="json"
        )
        assert response.status_code == 200
        assert response.json() == {"ok": True}
        assert RefreshToken.objects.filter(revoked_at__isnull=True).count() == 0
        assert AuditLogEntry.objects.filter(action="auth.logout").count() == 1

        # Same access token is now refused (denylisted family).
        assert client.get("/v1/me").status_code == 401
        # And the refresh token is gone with it.
        client.credentials()
        assert _refresh(client, user_session["refresh_token"]).status_code == 401

    def test_logout_requires_a_session(self, client):
        response = client.post("/v1/auth/logout", {}, format="json")
        assert response.status_code == 401

    def test_guest_can_logout(self, client, device_payload):
        guest = client.post("/v1/sessions/guest", {"device": device_payload}, format="json").json()
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {guest['access_token']}")
        assert client.post("/v1/auth/logout", {}, format="json").status_code == 200
        assert RefreshToken.objects.filter(revoked_at__isnull=True).count() == 0

    def test_logout_ignores_someone_elses_refresh_token(
        self, client, user_session, apple_token, device_payload
    ):
        # Second account on a different install with its own live session.
        other = client.post(
            "/v1/auth/apple",
            {
                "identity_token": apple_token(sub="apple-sub-002", email="other@example.com"),
                "device": {**device_payload, "install_id": "other-install-0002"},
            },
            format="json",
        ).json()

        client.credentials(HTTP_AUTHORIZATION=f"Bearer {user_session['access_token']}")
        client.post("/v1/auth/logout", {"refresh_token": other["refresh_token"]}, format="json")

        # The other account's session must still be alive.
        client.credentials()
        assert _refresh(client, other["refresh_token"]).status_code == 200
