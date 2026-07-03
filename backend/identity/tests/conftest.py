"""
Fixture identity tokens (Phase 1 credential gate): no Apple/Google
credentials exist in this environment, so verification is tested against a
locally-generated RSA keypair injected through the verifiers'
`signing_key_for` seam. Everything else — audience, issuer, expiry,
signature — runs the real PyJWT verification path.
"""

import time

import jwt
import pytest
from cryptography.hazmat.primitives.asymmetric import rsa
from rest_framework.test import APIClient

from identity.verifiers import APPLE_ISSUER, apple_verifier, google_verifier

TEST_APPLE_AUDIENCE = "events.echo.app.test"
TEST_GOOGLE_AUDIENCE = "test-client-id.apps.googleusercontent.com"


@pytest.fixture(scope="session")
def rsa_keypair():
    private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    return private_key, private_key.public_key()


@pytest.fixture
def client():
    return APIClient()


@pytest.fixture
def device_payload():
    return {"install_id": "test-install-0001", "platform": "ios", "app_version": "9.0.0"}


def _sign(private_key, claims: dict) -> str:
    return jwt.encode(claims, private_key, algorithm="RS256", headers={"kid": "fixture-key"})


@pytest.fixture
def apple_token(rsa_keypair, monkeypatch, settings):
    """Builder for Apple identity tokens signed with the fixture key."""
    private_key, public_key = rsa_keypair
    settings.ECHO_APPLE_BUNDLE_IDS = [TEST_APPLE_AUDIENCE]
    monkeypatch.setattr(apple_verifier, "signing_key_for", lambda token: public_key)

    def build(sub="apple-sub-001", email="person@example.com", **overrides):
        now = int(time.time())
        claims = {
            "iss": APPLE_ISSUER,
            "aud": TEST_APPLE_AUDIENCE,
            "sub": sub,
            "iat": now,
            "exp": now + 600,
            "email": email,
            "email_verified": "true",
        }
        claims.update(overrides)
        claims = {k: v for k, v in claims.items() if v is not None}
        return _sign(private_key, claims)

    return build


@pytest.fixture
def google_token(rsa_keypair, monkeypatch, settings):
    """Builder for Google ID tokens signed with the fixture key."""
    private_key, public_key = rsa_keypair
    settings.ECHO_GOOGLE_CLIENT_IDS = [TEST_GOOGLE_AUDIENCE]
    monkeypatch.setattr(google_verifier, "signing_key_for", lambda token: public_key)

    def build(sub="google-sub-001", email="person@example.com", name="Person Example", **overrides):
        now = int(time.time())
        claims = {
            "iss": "https://accounts.google.com",
            "aud": TEST_GOOGLE_AUDIENCE,
            "sub": sub,
            "iat": now,
            "exp": now + 600,
            "email": email,
            "email_verified": True,
            "name": name,
        }
        claims.update(overrides)
        claims = {k: v for k, v in claims.items() if v is not None}
        return _sign(private_key, claims)

    return build


@pytest.fixture
def user_session(client, apple_token, device_payload):
    """A signed-in session: returns the auth response body."""
    response = client.post(
        "/v1/auth/apple",
        {"identity_token": apple_token(), "name": "Person Example", "device": device_payload},
        format="json",
    )
    assert response.status_code == 200, response.content
    return response.json()


@pytest.fixture
def auth_client(client, user_session):
    """APIClient with a live user bearer token."""
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {user_session['access_token']}")
    return client
