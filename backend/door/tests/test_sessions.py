"""Door sessions (W1): scope enforcement, device trust, expiry, pause/resume
passcode validation + lockout, and the provisioning command."""

from datetime import timedelta
from io import StringIO

import pytest
from django.core.management import call_command
from django.utils import timezone

from audit.models import AuditLogEntry
from door.models import DoorSession, DoorSessionStatus
from door.tests.conftest import DEFAULT_PASSCODE, session_path

pytestmark = pytest.mark.django_db


class TestScopeEnforcement:
    def test_user_token_refused_on_door_route(self, user_client, make_event, make_session):
        session = make_session(make_event())
        assert user_client.get(session_path(session)).status_code == 403

    def test_door_token_refused_on_user_route(self, door_client):
        assert door_client.get("/v1/wallet").status_code == 403

    def test_anonymous_refused(self, client, make_event, make_session):
        session = make_session(make_event())
        # No bearer at all -> 401 (credentials required), not scope 403.
        assert client.get(session_path(session)).status_code == 401

    def test_door_token_verifies(self, door_client, make_event, make_session):
        session = make_session(make_event())
        assert door_client.get(session_path(session)).status_code == 200


class TestDeviceTrust:
    def test_other_devices_session_reads_as_absent(
        self, other_door_client, make_event, make_session
    ):
        session = make_session(make_event())  # bound to door_device
        response = other_door_client.get(session_path(session))
        assert response.status_code == 404

    def test_malformed_session_id_reads_as_absent(self, door_client):
        assert door_client.get("/v1/door/sessions/not-a-uuid").status_code == 404


class TestSessionDetail:
    def test_serves_session_state_without_counts(self, door_client, make_event, make_session):
        session = make_session(make_event(), zone="vip_lounge")
        body = door_client.get(session_path(session)).json()
        assert body["session_id"] == str(session.echo_id)
        assert body["event_id"] == str(session.event_id)
        assert body["zone"] == "vip_lounge"
        assert body["status"] == "active"
        assert "expires_at" in body
        # Social Energy doctrine: no attendance tallies on any wire payload.
        assert "checked_in_count" not in body
        assert "denied_count" not in body

    def test_expired_session_still_readable(self, door_client, make_event, make_session):
        session = make_session(make_event(), expires_in=timedelta(seconds=-10))
        assert door_client.get(session_path(session)).status_code == 200


class TestPauseResume:
    def test_pause_then_resume_roundtrip(self, door_client, make_event, make_session):
        session = make_session(make_event())

        paused = door_client.post(session_path(session, "/pause"))
        assert paused.status_code == 200
        assert paused.json()["status"] == "paused"

        resumed = door_client.post(
            session_path(session, "/resume"), {"passcode": DEFAULT_PASSCODE}, format="json"
        )
        assert resumed.status_code == 200
        assert resumed.json()["status"] == "active"

    def test_pause_is_idempotent(self, door_client, make_event, make_session):
        session = make_session(make_event(), status=DoorSessionStatus.PAUSED)
        response = door_client.post(session_path(session, "/pause"))
        assert response.status_code == 200
        assert response.json()["status"] == "paused"

    def test_wrong_passcode_refused_and_audited_without_the_code(
        self, door_client, make_event, make_session
    ):
        session = make_session(make_event(), status=DoorSessionStatus.PAUSED)
        response = door_client.post(
            session_path(session, "/resume"), {"passcode": "000000"}, format="json"
        )
        assert response.status_code == 403
        assert response.json()["error"]["code"] == "door_passcode_invalid"

        entry = AuditLogEntry.objects.get(action="door.passcode_failed")
        assert "000000" not in str(entry.metadata)

    def test_lockout_after_max_attempts(self, door_client, make_event, make_session, settings):
        settings.ECHO_DOOR_PASSCODE_MAX_ATTEMPTS = 3
        session = make_session(make_event(), status=DoorSessionStatus.PAUSED)

        for _ in range(2):
            response = door_client.post(
                session_path(session, "/resume"), {"passcode": "000000"}, format="json"
            )
            assert response.json()["error"]["code"] == "door_passcode_invalid"

        locked = door_client.post(
            session_path(session, "/resume"), {"passcode": "000000"}, format="json"
        )
        assert locked.json()["error"]["code"] == "door_passcode_locked"

        # The correct passcode is also refused while locked.
        still_locked = door_client.post(
            session_path(session, "/resume"), {"passcode": DEFAULT_PASSCODE}, format="json"
        )
        assert still_locked.json()["error"]["code"] == "door_passcode_locked"

        # After the lockout window passes, the correct code resumes.
        DoorSession.objects.filter(pk=session.pk).update(
            passcode_locked_until=timezone.now() - timedelta(seconds=1)
        )
        resumed = door_client.post(
            session_path(session, "/resume"), {"passcode": DEFAULT_PASSCODE}, format="json"
        )
        assert resumed.status_code == 200
        assert resumed.json()["status"] == "active"

    def test_success_resets_failed_attempts(self, door_client, make_event, make_session, settings):
        settings.ECHO_DOOR_PASSCODE_MAX_ATTEMPTS = 3
        session = make_session(make_event(), status=DoorSessionStatus.PAUSED)

        door_client.post(session_path(session, "/resume"), {"passcode": "000000"}, format="json")
        door_client.post(
            session_path(session, "/resume"), {"passcode": DEFAULT_PASSCODE}, format="json"
        )
        session.refresh_from_db()
        assert session.passcode_failed_attempts == 0

    def test_non_six_digit_passcode_rejected(self, door_client, make_event, make_session):
        session = make_session(make_event(), status=DoorSessionStatus.PAUSED)
        response = door_client.post(
            session_path(session, "/resume"), {"passcode": "12345"}, format="json"
        )
        assert response.status_code == 400

    def test_resume_on_closed_session_conflicts(self, door_client, make_event, make_session):
        session = make_session(make_event(), status=DoorSessionStatus.CLOSED)
        response = door_client.post(
            session_path(session, "/resume"), {"passcode": DEFAULT_PASSCODE}, format="json"
        )
        assert response.status_code == 409
        assert response.json()["error"]["code"] == "door_session_closed"

    def test_pause_on_expired_session_refused(self, door_client, make_event, make_session):
        session = make_session(make_event(), expires_in=timedelta(seconds=-10))
        response = door_client.post(session_path(session, "/pause"))
        assert response.status_code == 403
        assert response.json()["error"]["code"] == "door_session_expired"


class TestProvisioningCommand:
    def test_provisions_session_device_and_tokens(self, make_event):
        event = make_event()
        out = StringIO()
        call_command(
            "provision_door_session",
            "--event",
            str(event.echo_id),
            "--zone",
            "vip_lounge",
            "--label",
            "North door",
            "--passcode",
            "654321",
            stdout=out,
        )
        output = out.getvalue()
        session = DoorSession.objects.get(event=event)
        assert session.zone == "vip_lounge"
        assert session.label == "North door"
        assert session.device.install_id.startswith("door_")
        # The passcode is printed once and stored only as a hash.
        assert "654321" in output
        assert session.passcode_hash != "654321"
        assert "access_token" in output
        assert AuditLogEntry.objects.filter(action="door.session_provisioned").exists()

    def test_provisioned_token_reaches_door_routes(self, make_event):
        from rest_framework.test import APIClient

        event = make_event()
        out = StringIO()
        call_command("provision_door_session", "--event", str(event.echo_id), stdout=out)
        access_token = next(
            line.split(":", 1)[1].strip()
            for line in out.getvalue().splitlines()
            if "access_token" in line
        )
        session = DoorSession.objects.get(event=event)
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")
        assert client.get(session_path(session)).status_code == 200
