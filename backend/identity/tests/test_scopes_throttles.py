"""Scope resolution from tokens + identity-based throttle idents (W1)."""

import pytest

from core.ratelimit import UserRateThrottle
from core.scopes import resolve_request_scope
from identity.authentication import EchoAuthContext

pytestmark = pytest.mark.django_db


class _FakeAuthRequest:
    """Minimal stand-in: DRF Request exposing .auth and META."""

    def __init__(self, auth=None):
        self.auth = auth
        self.META = {"REMOTE_ADDR": "203.0.113.9"}


class TestScopeResolution:
    def test_no_auth_is_public(self):
        assert resolve_request_scope(_FakeAuthRequest()) == "public"

    def test_token_scope_flows_through(self):
        auth = EchoAuthContext(scope="user", device_id="d", family_id="f", user_id="u")
        assert resolve_request_scope(_FakeAuthRequest(auth)) == "user"

    def test_unknown_scope_refused(self):
        auth = EchoAuthContext(scope="superadmin", device_id="d", family_id="f", user_id="u")
        with pytest.raises(ValueError):
            resolve_request_scope(_FakeAuthRequest(auth))

    def test_end_to_end_user_scope_via_http(self, auth_client):
        # Bearer token grants user scope; /v1/me (required_scope=user) admits it.
        assert auth_client.get("/v1/me").status_code == 200


class TestThrottleIdent:
    def _cache_key(self, auth):
        throttle = UserRateThrottle()
        request = _FakeAuthRequest(auth)
        return throttle.get_cache_key(request, view=None)

    def test_authenticated_user_throttles_by_user_id(self):
        auth = EchoAuthContext(scope="user", device_id="dev-1", family_id="f", user_id="user-42")
        assert "user:user-42" in self._cache_key(auth)

    def test_guest_throttles_by_device(self):
        auth = EchoAuthContext(scope="guest", device_id="dev-1", family_id="f", user_id=None)
        assert "device:dev-1" in self._cache_key(auth)

    def test_anonymous_throttles_by_ip(self):
        assert "203.0.113.9" in self._cache_key(None)

    def test_two_users_behind_one_ip_get_separate_buckets(self):
        a = EchoAuthContext(scope="user", device_id="dev-1", family_id="f", user_id="user-a")
        b = EchoAuthContext(scope="user", device_id="dev-2", family_id="f", user_id="user-b")
        assert self._cache_key(a) != self._cache_key(b)
