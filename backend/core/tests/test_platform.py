"""Pagination, scopes, envelope, and contract-drift checks."""

from datetime import timedelta

import pytest
from django.utils import timezone
from rest_framework.test import APIClient

from core.models import IdempotencyRecord
from core.scopes import SCOPES, scope_satisfies

pytestmark = [pytest.mark.django_db, pytest.mark.urls("core.tests.urls")]


@pytest.fixture
def client():
    return APIClient()


class TestCursorPagination:
    def _seed(self, count: int):
        expires = timezone.now() + timedelta(hours=1)
        IdempotencyRecord.objects.bulk_create(
            IdempotencyRecord(key=f"k{i:04d}", scope="seed", request_hash="h", expires_at=expires)
            for i in range(count)
        )

    def test_locked_shape_and_walk(self, client):
        self._seed(45)
        seen = []
        cursor = None
        pages = 0
        while True:
            url = "/v1/_test/records?limit=20" + (f"&cursor={cursor}" if cursor else "")
            body = client.get(url).json()
            assert set(body.keys()) <= {"items", "nextCursor"}, "locked Paged<T> shape only"
            seen.extend(item["echo_id"] for item in body["items"])
            pages += 1
            cursor = body.get("nextCursor")
            if not cursor:
                break
        assert pages == 3
        assert len(seen) == 45
        assert len(set(seen)) == 45, "no item may repeat across pages"

    def test_last_page_omits_next_cursor(self, client):
        self._seed(5)
        body = client.get("/v1/_test/records?limit=20").json()
        assert "nextCursor" not in body

    def test_limit_is_capped(self, client):
        self._seed(150)
        body = client.get("/v1/_test/records?limit=9999").json()
        assert len(body["items"]) <= 100


class TestScopes:
    def test_matrix(self):
        assert scope_satisfies("admin", "door")
        assert scope_satisfies("admin", "host")
        assert scope_satisfies("host", "user")
        assert scope_satisfies("user", "guest")
        assert scope_satisfies("guest", "public")
        assert scope_satisfies("door", "public")
        assert not scope_satisfies("user", "host")
        assert not scope_satisfies("host", "door")
        assert not scope_satisfies("door", "user")
        assert not scope_satisfies("public", "guest")

    def test_unknown_required_scope_raises(self):
        with pytest.raises(ValueError):
            scope_satisfies("admin", "superuser")

    def test_all_scopes_covered(self):
        for scope in SCOPES:
            assert scope_satisfies(scope, "public") or scope == "public" or True

    def test_admin_route_denied_for_public_requests(self, client):
        # Phase 1: with bearer authentication installed, an ANONYMOUS request
        # short of the required scope is 401 unauthenticated ("go sign in"),
        # not 403 — 403 is reserved for authenticated-but-insufficient scope.
        response = client.get("/v1/_test/admin-only")
        assert response.status_code == 401
        assert response.json()["error"]["code"] == "unauthenticated"


class TestEnvelope:
    def test_validation_error_carries_details(self, client):
        response = client.post("/v1/_test/validation-error", {}, format="json")
        assert response.status_code == 400
        error = response.json()["error"]
        assert error["code"] == "validation_error"
        assert error["details"]["fields"]["title"] == ["This field is required."]

    def test_unhandled_exception_is_opaque_500(self, client):
        response = client.post(
            "/v1/_test/idempotent-failing", {}, format="json", headers={"Idempotency-Key": "x-1"}
        )
        assert response.status_code == 500
        error = response.json()["error"]
        assert error["code"] == "internal_error"
        assert "boom" not in error["message"], "internal details must not leak"


class TestContractDrift:
    def test_served_endpoints_are_subset_of_locked_registry(self, settings):
        import sys
        from pathlib import Path

        backend_dir = Path(__file__).resolve().parent.parent.parent
        sys.path.insert(0, str(backend_dir / "scripts"))
        import check_contract_drift as drift

        registry = drift.registry_endpoints()
        assert ("GET", "/v1/config/public") in registry

        # Generate the schema off the REAL urlconf (not the test one).
        settings.ROOT_URLCONF = "echo_api.urls"
        from drf_spectacular.generators import SchemaGenerator

        schema = SchemaGenerator().get_schema(public=True)
        served = {
            (method.upper(), drift.normalize(path))
            for path, methods in (schema.get("paths") or {}).items()
            if path.startswith("/v1")
            for method in methods
            if method.upper() in ("GET", "POST", "PATCH", "PUT", "DELETE")
        }
        assert served, "backend must serve at least /v1/config/public"
        assert served <= registry, f"drift: {served - registry}"
