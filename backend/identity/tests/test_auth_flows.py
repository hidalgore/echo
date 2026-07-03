"""S-01 sign-in flows: verification outcomes, create-or-attach, guest sessions."""

import jwt
import pytest
from cryptography.hazmat.primitives.asymmetric import rsa

from audit.models import AuditLogEntry
from identity.models import Device, RefreshToken, User

pytestmark = pytest.mark.django_db


class TestAppleAuth:
    def test_first_sign_in_creates_user_and_session(self, client, apple_token, device_payload):
        response = client.post(
            "/v1/auth/apple",
            {"identity_token": apple_token(), "name": "New Person", "device": device_payload},
            format="json",
        )
        assert response.status_code == 200
        body = response.json()
        assert body["token_type"] == "Bearer"
        assert body["is_new_user"] is True
        assert body["user"]["email"] == "person@example.com"
        assert body["user"]["name"] == "New Person"
        assert body["user"]["public_id"].startswith("US-")
        assert body["access_token"] and body["refresh_token"]

        user = User.objects.get(apple_sub="apple-sub-001")
        assert not user.has_usable_password()
        device = Device.objects.get(install_id=device_payload["install_id"])
        assert device.user == user
        assert AuditLogEntry.objects.filter(action="auth.login", actor=user).count() == 1

    def test_repeat_sign_in_reuses_user(self, client, apple_token, device_payload):
        for _ in range(2):
            response = client.post(
                "/v1/auth/apple",
                {"identity_token": apple_token(), "device": device_payload},
                format="json",
            )
            assert response.status_code == 200
        assert User.objects.count() == 1
        assert response.json()["is_new_user"] is False

    def test_new_sign_in_revokes_previous_sessions_on_device(
        self, client, apple_token, device_payload
    ):
        first = client.post(
            "/v1/auth/apple",
            {"identity_token": apple_token(), "device": device_payload},
            format="json",
        ).json()
        client.post(
            "/v1/auth/apple",
            {"identity_token": apple_token(), "device": device_payload},
            format="json",
        )
        # The first session's access token dies with its revoked family.
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {first['access_token']}")
        assert client.get("/v1/me").status_code == 401
        live = RefreshToken.objects.filter(revoked_at__isnull=True)
        assert live.count() == 1

    def test_bad_signature_rejected(self, client, apple_token, device_payload):
        # apple_token wires the fixture keypair into the verifier; this token
        # is signed by a DIFFERENT key, so only the signature check can fail.
        forged = jwt.encode(
            {"iss": "https://appleid.apple.com", "aud": "events.echo.app.test", "sub": "x",
             "iat": 0, "exp": 2**31},
            rsa.generate_private_key(public_exponent=65537, key_size=2048),
            algorithm="RS256",
        )
        response = client.post(
            "/v1/auth/apple", {"identity_token": forged, "device": device_payload}, format="json"
        )
        assert response.status_code == 401
        assert response.json()["error"]["code"] == "invalid_identity_token"

    def test_wrong_audience_rejected(self, client, apple_token, device_payload):
        token = apple_token(aud="com.someone.else")
        response = client.post(
            "/v1/auth/apple", {"identity_token": token, "device": device_payload}, format="json"
        )
        assert response.status_code == 401

    def test_expired_token_rejected(self, client, apple_token, device_payload):
        token = apple_token(exp=1)
        response = client.post(
            "/v1/auth/apple", {"identity_token": token, "device": device_payload}, format="json"
        )
        assert response.status_code == 401

    def test_unconfigured_provider_fails_closed(self, client, apple_token, device_payload, settings):
        settings.ECHO_APPLE_BUNDLE_IDS = []
        response = client.post(
            "/v1/auth/apple",
            {"identity_token": apple_token(), "device": device_payload},
            format="json",
        )
        assert response.status_code == 503
        assert response.json()["error"]["code"] == "auth_not_configured"

    def test_missing_device_is_validation_error(self, client, apple_token):
        response = client.post(
            "/v1/auth/apple", {"identity_token": apple_token()}, format="json"
        )
        assert response.status_code == 400
        assert response.json()["error"]["code"] == "validation_error"


class TestGoogleAuth:
    def test_sign_in_uses_token_name_and_google_sub(self, client, google_token, device_payload):
        response = client.post(
            "/v1/auth/google",
            {"identity_token": google_token(), "device": device_payload},
            format="json",
        )
        assert response.status_code == 200
        user = User.objects.get(google_sub="google-sub-001")
        assert user.name == "Person Example"

    def test_same_email_attaches_to_existing_account(
        self, client, apple_token, google_token, device_payload
    ):
        client.post(
            "/v1/auth/apple",
            {"identity_token": apple_token(email="one@example.com"), "device": device_payload},
            format="json",
        )
        response = client.post(
            "/v1/auth/google",
            {"identity_token": google_token(email="one@example.com"), "device": device_payload},
            format="json",
        )
        assert response.status_code == 200
        assert response.json()["is_new_user"] is False
        assert User.objects.count() == 1
        user = User.objects.get()
        assert user.apple_sub and user.google_sub

    def test_wrong_issuer_rejected(self, client, google_token, device_payload):
        token = google_token(iss="https://evil.example.com")
        response = client.post(
            "/v1/auth/google", {"identity_token": token, "device": device_payload}, format="json"
        )
        assert response.status_code == 401


class TestGuestSession:
    def test_guest_session_issued_without_account(self, client, device_payload):
        response = client.post("/v1/sessions/guest", {"device": device_payload}, format="json")
        assert response.status_code == 200
        body = response.json()
        assert body["user"] is None
        assert body["access_token"] and body["refresh_token"]
        assert User.objects.count() == 0
        assert Device.objects.get(install_id=device_payload["install_id"]).user is None
        token = RefreshToken.objects.get()
        assert token.scope == "guest" and token.user is None

    def test_guest_token_cannot_reach_user_surface(self, client, device_payload):
        body = client.post("/v1/sessions/guest", {"device": device_payload}, format="json").json()
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {body['access_token']}")
        response = client.get("/v1/me")
        assert response.status_code == 403
        assert response.json()["error"]["code"] == "unauthorized"
