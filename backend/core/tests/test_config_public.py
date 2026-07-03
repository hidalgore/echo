import pytest
from django.core.cache import cache
from rest_framework.test import APIClient


@pytest.fixture(autouse=True)
def _clear_cache():
    cache.clear()
    yield
    cache.clear()


@pytest.fixture
def client():
    return APIClient()


class TestConfigPublic:
    def test_returns_config(self, client):
        response = client.get("/v1/config/public")
        assert response.status_code == 200
        body = response.json()
        assert body["min_app_version"]
        assert body["fees"]["platform_fee_rate"] == 0.05
        assert body["fees"]["payment_processing_rate"] == 0.029
        assert body["fees"]["payment_processing_flat_cents"] == 30
        assert body["credential"]["nfc_rotate_interval_ms"] == 30_000

    def test_unknown_route_is_enveloped_404(self, client):
        response = client.get("/v1/nope")
        assert response.status_code == 404
        assert response.json()["error"]["code"] == "not_found"

    def test_method_not_allowed_is_enveloped(self, client):
        response = client.post("/v1/config/public", {}, format="json")
        assert response.status_code == 405
        assert response.json()["error"]["code"] == "method_not_allowed"

    def test_rate_limit_returns_locked_429(self, client, monkeypatch):
        # DRF throttles read rates at import time; patch the shared rates dict.
        from core.ratelimit import PublicIPRateThrottle

        monkeypatch.setitem(PublicIPRateThrottle.THROTTLE_RATES, "public", "2/min")
        assert client.get("/v1/config/public").status_code == 200
        assert client.get("/v1/config/public").status_code == 200
        limited = client.get("/v1/config/public")
        assert limited.status_code == 429
        assert limited.json()["error"]["code"] == "rate_limited"
        assert limited.headers.get("Retry-After") is not None
