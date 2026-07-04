"""Offline bundles (W3): shape/versioning, snapshot fidelity, documented
relaxations, and the fail-closed signing-key gate."""

from datetime import timedelta

import pytest

from audit.models import AuditLogEntry
from door.bundles import BUNDLE_FORMAT_VERSION
from door.models import DoorSessionStatus
from door.tests.conftest import session_path
from tickets import credentials
from tickets.models import Ticket, TicketStatus

pytestmark = pytest.mark.django_db


def fetch_bundle(client, session):
    return client.post(session_path(session, "/offline-bundle"))


class TestBundleShape:
    def test_versioned_bundle_with_key_and_relaxations(
        self, door_client, signing_key, make_event, make_tier, make_ticket, make_session
    ):
        event = make_event(age_restriction=18)
        tier = make_tier(event, name="VIP", access_tier="vip")
        ticket = make_ticket(event=event, tier=tier)
        minted = credentials.issue_credential(ticket)
        session = make_session(event, zone="vip_lounge")

        response = fetch_bundle(door_client, session)
        assert response.status_code == 200
        bundle = response.json()

        assert bundle["format_version"] == BUNDLE_FORMAT_VERSION
        assert bundle["session_id"] == str(session.echo_id)
        assert bundle["event_id"] == str(event.echo_id)
        assert bundle["zone"] == "vip_lounge"
        assert "BEGIN PUBLIC KEY" in bundle["signing_public_key_pem"]
        assert bundle["qr_payload_prefix"] == "ECHO1."
        # The documented relaxation — devices and audits read the same truth.
        assert bundle["relaxations"] == ["rotating_nonce_freshness"]
        assert bundle["scan_leeway_seconds"] >= 0
        assert bundle["duplicate_window_seconds"] > 0

        [admission] = bundle["admissions"]
        assert admission == {
            "ticket_id": str(ticket.echo_id),
            "nfc_credential_id": minted.nfc_credential_id,
            "status": "active",
            "tier_id": "vip",
            "age_badge": "18_plus",
            "authorized_zones": ["main_entry", "vip_lounge"],
        }

    def test_snapshot_carries_status_and_missing_credentials(
        self, door_client, signing_key, make_event, make_tier, make_ticket, make_session
    ):
        event = make_event()
        tier = make_tier(event)
        revoked = make_ticket(event=event, tier=tier)
        Ticket.objects.filter(pk=revoked.pk).update(status=TicketStatus.REVOKED)
        never_opened = make_ticket(event=event, tier=tier)  # no credential minted

        session = make_session(event)
        bundle = fetch_bundle(door_client, session).json()
        by_id = {row["ticket_id"]: row for row in bundle["admissions"]}

        assert by_id[str(revoked.echo_id)]["status"] == "revoked"
        assert by_id[str(never_opened.echo_id)]["nfc_credential_id"] is None

    def test_bundle_scopes_to_the_sessions_event(
        self, door_client, signing_key, make_event, make_tier, make_ticket, make_session
    ):
        event = make_event()
        other = make_event(title="Other Night")
        make_ticket(event=other, tier=make_tier(other))
        session = make_session(event)
        bundle = fetch_bundle(door_client, session).json()
        assert bundle["admissions"] == []


class TestBundleGates:
    def test_fails_closed_without_signing_key(
        self, door_client, make_event, make_session, settings
    ):
        settings.ECHO_CREDENTIAL_SIGNING_KEY = ""
        session = make_session(make_event())
        response = fetch_bundle(door_client, session)
        assert response.status_code == 503
        assert response.json()["error"]["code"] == "credentials_not_configured"

    def test_paused_session_may_prefetch(
        self, door_client, signing_key, make_event, make_session
    ):
        session = make_session(make_event(), status=DoorSessionStatus.PAUSED)
        assert fetch_bundle(door_client, session).status_code == 200

    def test_closed_session_refused(self, door_client, signing_key, make_event, make_session):
        session = make_session(make_event(), status=DoorSessionStatus.CLOSED)
        response = fetch_bundle(door_client, session)
        assert response.status_code == 409
        assert response.json()["error"]["code"] == "door_session_closed"

    def test_expired_session_refused(self, door_client, signing_key, make_event, make_session):
        session = make_session(make_event(), expires_in=timedelta(seconds=-10))
        assert fetch_bundle(door_client, session).status_code == 403

    def test_generation_is_audited(
        self, door_client, signing_key, make_event, make_tier, make_ticket, make_session
    ):
        event = make_event()
        make_ticket(event=event, tier=make_tier(event))
        session = make_session(event)
        fetch_bundle(door_client, session)
        entry = AuditLogEntry.objects.get(action="door.bundle_generated")
        assert entry.metadata["admissions"] == 1
