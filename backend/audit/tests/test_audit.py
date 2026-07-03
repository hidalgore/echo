"""Append-only guarantees and writer behavior for the audit log (W2)."""

import pytest
from django.test import RequestFactory

from audit import service
from audit.models import AuditLogEntry

pytestmark = pytest.mark.django_db


class TestAppendOnly:
    def test_rows_cannot_be_updated(self):
        entry = service.record("test.action")
        entry.action = "test.tampered"
        with pytest.raises(TypeError):
            entry.save()

    def test_rows_cannot_be_deleted(self):
        entry = service.record("test.action")
        with pytest.raises(TypeError):
            entry.delete()


class TestWriter:
    def test_record_captures_request_context(self):
        request = RequestFactory().post(
            "/v1/auth/apple",
            HTTP_USER_AGENT="EchoApp/9.0.0 (iOS)",
            HTTP_X_FORWARDED_FOR="198.51.100.7, 10.0.0.1",
        )
        entry = service.record(
            "auth.login", request=request, target=("user", "abc"), metadata={"provider": "apple"}
        )
        assert entry.ip == "198.51.100.7"  # first XFF hop = real client behind nginx
        assert entry.user_agent == "EchoApp/9.0.0 (iOS)"
        assert entry.target_type == "user"
        assert entry.target_id == "abc"
        assert entry.metadata == {"provider": "apple"}

    def test_record_without_request(self):
        entry = service.record("worker.action", metadata={"task": "cleanup"})
        assert entry.ip is None
        assert entry.user_agent == ""

    def test_writer_never_raises(self, monkeypatch):
        # A failed audit insert must not take the auth flow down with it.
        monkeypatch.setattr(
            AuditLogEntry, "save", lambda self, *a, **k: (_ for _ in ()).throw(RuntimeError("db down"))
        )
        assert service.record("auth.login") is None
