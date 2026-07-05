"""Door scans (W2): every refusal code, both token types, the duplicate
window, zone authorization, revoked-mid-scan, and idempotency."""

import uuid
from datetime import timedelta

import pytest
from django.utils import timezone

from door.models import DoorScan
from door.tests.conftest import submit_scan
from tickets import credentials
from tickets.models import Ticket, TicketCredential, TicketStatus

pytestmark = pytest.mark.django_db


@pytest.fixture
def scan_setup(signing_key, make_event, make_tier, make_ticket, make_session):
    """One event with an active ticket + a main-entry session for it."""
    event = make_event()
    tier = make_tier(event)
    ticket = make_ticket(event=event, tier=tier)
    session = make_session(event)
    return event, tier, ticket, session


def minted_qr(ticket):
    return credentials.issue_credential(ticket).qr_payload


class TestApprovals:
    def test_valid_credential_approves_and_checks_in(self, door_client, scan_setup):
        _, _, ticket, session = scan_setup
        response = submit_scan(door_client, session, key="scan-1", qr_payload=minted_qr(ticket))
        assert response.status_code == 200
        body = response.json()
        assert body["approved"] is True
        assert body["verification_state"] == "verified"
        assert body["ticket_status"] == "checked_in"
        assert body["tier_id"] == "general_admission"
        assert body["authorized_zones"] == ["main_entry"]
        assert body["age_badge"] == "none"
        assert "failure_reason" not in body

        ticket.refresh_from_db()
        assert ticket.status == TicketStatus.CHECKED_IN
        assert DoorScan.objects.filter(ticket=ticket, approved=True).count() == 1

    def test_pkpass_token_approves(self, door_client, scan_setup):
        _, _, ticket, session = scan_setup
        token = credentials.mint_pkpass_token(ticket)
        response = submit_scan(
            door_client,
            session,
            key="scan-pkpass",
            qr_payload=credentials.QR_PAYLOAD_PREFIX + token,
        )
        assert response.json()["verification_state"] == "verified"

    def test_nfc_credential_id_approves(self, door_client, scan_setup):
        _, _, ticket, session = scan_setup
        minted = credentials.issue_credential(ticket)
        response = submit_scan(
            door_client, session, key="scan-nfc", nfc_credential_id=minted.nfc_credential_id
        )
        assert response.json()["verification_state"] == "verified"

    def test_age_badge_rides_the_verdict(
        self, door_client, signing_key, make_event, make_tier, make_ticket, make_session
    ):
        event = make_event(age_restriction=21)
        ticket = make_ticket(event=event, tier=make_tier(event))
        session = make_session(event)
        body = submit_scan(
            door_client, session, key="scan-age", qr_payload=minted_qr(ticket)
        ).json()
        assert body["age_badge"] == "21_plus"


class TestRefusals:
    def test_malformed_token(self, door_client, scan_setup):
        _, _, _, session = scan_setup
        body = submit_scan(door_client, session, key="s", qr_payload="ECHO1.not-a-jwt").json()
        assert body == {
            "approved": False,
            "ticket_status": "revoked",
            "verification_state": "denied",
            "failure_reason": "malformed",
            "tier_id": "general_admission",
            "authorized_zones": [],
            "age_badge": "none",
        }

    def test_invalid_signature(self, door_client, scan_setup, settings):
        from door.tests.conftest import generate_seed_b64

        _, _, ticket, session = scan_setup
        # Mint under a different key, then restore the environment's key.
        good_seed = settings.ECHO_CREDENTIAL_SIGNING_KEY
        settings.ECHO_CREDENTIAL_SIGNING_KEY = generate_seed_b64()
        credentials._signer = None
        foreign_qr = minted_qr(ticket)
        settings.ECHO_CREDENTIAL_SIGNING_KEY = good_seed
        credentials._signer = None

        body = submit_scan(door_client, session, key="s", qr_payload=foreign_qr).json()
        assert body["verification_state"] == "denied"
        assert body["failure_reason"] == "invalid_signature"

    def test_expired_token(self, door_client, scan_setup, settings):
        _, _, ticket, session = scan_setup
        settings.ECHO_CREDENTIAL_TTL_SECONDS = -60  # mint already-dead
        qr = minted_qr(ticket)
        settings.ECHO_DOOR_SCAN_LEEWAY_SECONDS = 0
        body = submit_scan(door_client, session, key="s", qr_payload=qr).json()
        assert body["failure_reason"] == "expired"

    def test_superseded_token(self, door_client, scan_setup):
        _, _, ticket, session = scan_setup
        old_qr = minted_qr(ticket)
        credentials.rotate_credential(ticket)
        body = submit_scan(door_client, session, key="s", qr_payload=old_qr).json()
        assert body["failure_reason"] == "superseded"

    def test_unknown_ticket(self, door_client, scan_setup):
        _, _, _, session = scan_setup
        now = timezone.now()
        token = credentials.get_signer().sign(
            {
                "iss": credentials.TOKEN_ISSUER,
                "typ": "credential",
                "tid": str(uuid.uuid4()),
                "eid": str(session.event_id),
                "cid": "deadbeef",
                "iat": int(now.timestamp()),
                "exp": int((now + timedelta(seconds=30)).timestamp()),
            }
        )
        body = submit_scan(
            door_client, session, key="s", qr_payload=credentials.QR_PAYLOAD_PREFIX + token
        ).json()
        assert body["failure_reason"] == "unknown_ticket"

    def test_revoked_mid_scan(self, door_client, scan_setup):
        _, _, ticket, session = scan_setup
        qr = minted_qr(ticket)  # minted while active
        Ticket.objects.filter(pk=ticket.pk).update(status=TicketStatus.REVOKED)
        body = submit_scan(door_client, session, key="s", qr_payload=qr).json()
        assert body["approved"] is False
        assert body["failure_reason"] == "ticket_not_active"
        assert body["ticket_status"] == "revoked"

    def test_revoked_pkpass_refused(self, door_client, scan_setup):
        _, _, ticket, session = scan_setup
        token = credentials.mint_pkpass_token(ticket)
        Ticket.objects.filter(pk=ticket.pk).update(status=TicketStatus.REVOKED)
        body = submit_scan(
            door_client, session, key="s", qr_payload=credentials.QR_PAYLOAD_PREFIX + token
        ).json()
        assert body["failure_reason"] == "ticket_not_active"

    def test_bare_ticket_id_never_approves(self, door_client, scan_setup):
        """Serial-only validation is disallowed (locked platform rule)."""
        _, _, ticket, session = scan_setup
        body = submit_scan(door_client, session, key="s", ticket_id=str(ticket.echo_id)).json()
        assert body["approved"] is False
        assert body["failure_reason"] == "serial_only_disallowed"
        ticket.refresh_from_db()
        assert ticket.status == TicketStatus.ACTIVE

    def test_no_credential_at_all(self, door_client, scan_setup):
        _, _, _, session = scan_setup
        body = submit_scan(door_client, session, key="s").json()
        assert body["failure_reason"] == "no_credential"

    def test_wrong_event_credential(
        self, door_client, scan_setup, make_event, make_tier, make_ticket
    ):
        _, _, _, session = scan_setup
        other_event = make_event(title="Other Night")
        other_ticket = make_ticket(event=other_event, tier=make_tier(other_event))
        body = submit_scan(
            door_client, session, key="s", qr_payload=minted_qr(other_ticket)
        ).json()
        assert body["approved"] is False
        assert body["failure_reason"] == "wrong_event"
        other_ticket.refresh_from_db()
        assert other_ticket.status == TicketStatus.ACTIVE

    def test_stale_nfc_credential_id(self, door_client, scan_setup):
        _, _, ticket, session = scan_setup
        stale_id = credentials.issue_credential(ticket).nfc_credential_id
        credentials.rotate_credential(ticket)  # rotation replaces the NFC id
        body = submit_scan(door_client, session, key="s", nfc_credential_id=stale_id).json()
        assert body["failure_reason"] == "unknown_ticket"

    def test_expired_nfc_credential(self, door_client, scan_setup, settings):
        _, _, ticket, session = scan_setup
        minted = credentials.issue_credential(ticket)
        TicketCredential.objects.filter(ticket=ticket).update(
            expires_at=timezone.now() - timedelta(minutes=5)
        )
        body = submit_scan(
            door_client, session, key="s", nfc_credential_id=minted.nfc_credential_id
        ).json()
        assert body["failure_reason"] == "expired"


class TestZoneAuthorization:
    def test_ga_tier_refused_at_vip_checkpoint(
        self, door_client, signing_key, make_event, make_tier, make_ticket, make_session
    ):
        event = make_event()
        ticket = make_ticket(event=event, tier=make_tier(event))  # GA default
        session = make_session(event, zone="vip_lounge")
        body = submit_scan(door_client, session, key="s", qr_payload=minted_qr(ticket)).json()
        assert body["approved"] is False
        assert body["verification_state"] == "wrong_zone"
        assert body["authorized_zones"] == ["main_entry"]
        # A wrong-zone refusal must not consume the check-in.
        ticket.refresh_from_db()
        assert ticket.status == TicketStatus.ACTIVE

    def test_vip_tier_approved_at_vip_checkpoint(
        self, door_client, signing_key, make_event, make_tier, make_ticket, make_session
    ):
        event = make_event()
        tier = make_tier(event, name="VIP", access_tier="vip")
        ticket = make_ticket(event=event, tier=tier)
        session = make_session(event, zone="vip_lounge")
        body = submit_scan(door_client, session, key="s", qr_payload=minted_qr(ticket)).json()
        assert body["approved"] is True
        assert body["tier_id"] == "vip"
        assert set(body["authorized_zones"]) == {"main_entry", "vip_lounge"}


class TestDuplicateWindow:
    def test_rescan_inside_window_alerts_but_admits(self, door_client, scan_setup):
        _, _, ticket, session = scan_setup
        submit_scan(door_client, session, key="first", qr_payload=minted_qr(ticket))

        # A checked-in ticket can no longer mint, so re-present the stored
        # token — exactly what a passed-back phone shows the second scanner.
        stored = TicketCredential.objects.get(ticket=ticket).validation_token
        body = submit_scan(
            door_client,
            session,
            key="second",
            qr_payload=credentials.QR_PAYLOAD_PREFIX + stored,
        ).json()
        assert body["approved"] is True
        assert body["verification_state"] == "duplicate_alert"
        assert body["failure_reason"] == "credential_already_used"

    def test_rescan_outside_window_blocks(self, door_client, scan_setup, settings):
        _, _, ticket, session = scan_setup
        submit_scan(door_client, session, key="first", qr_payload=minted_qr(ticket))
        DoorScan.objects.filter(ticket=ticket, approved=True).update(
            recorded_at=timezone.now()
            - timedelta(seconds=settings.ECHO_DOOR_DUPLICATE_WINDOW_SECONDS + 60)
        )
        stored = TicketCredential.objects.get(ticket=ticket).validation_token
        body = submit_scan(
            door_client,
            session,
            key="second",
            qr_payload=credentials.QR_PAYLOAD_PREFIX + stored,
        ).json()
        assert body["approved"] is False
        assert body["verification_state"] == "duplicate_blocked"


class TestScanPlumbing:
    def test_idempotency_key_required(self, door_client, scan_setup):
        _, _, ticket, session = scan_setup
        response = door_client.post(
            "/v1/door/scans",
            {
                "session_id": str(session.echo_id),
                "qr_payload": minted_qr(ticket),
                "scanned_at": timezone.now().isoformat(),
                "offline": False,
            },
            format="json",
        )
        assert response.status_code == 400
        assert response.json()["error"]["code"] == "idempotency_key_required"

    def test_replayed_key_returns_stored_verdict_without_rescanning(
        self, door_client, scan_setup
    ):
        _, _, ticket, session = scan_setup
        qr = minted_qr(ticket)
        now = timezone.now()
        first = submit_scan(door_client, session, key="same", scanned_at=now, qr_payload=qr)
        replay = submit_scan(door_client, session, key="same", scanned_at=now, qr_payload=qr)
        assert replay.headers.get("Idempotency-Replayed") == "true"
        assert replay.json() == first.json()
        assert DoorScan.objects.filter(ticket=ticket).count() == 1

    def test_paused_session_refuses_scans(self, door_client, scan_setup):
        _, _, ticket, session = scan_setup
        qr = minted_qr(ticket)
        door_client.post(f"/v1/door/sessions/{session.echo_id}/pause")
        response = submit_scan(door_client, session, key="s", qr_payload=qr)
        assert response.status_code == 409
        assert response.json()["error"]["code"] == "door_session_paused"

    def test_expired_session_refuses_scans(
        self, door_client, signing_key, make_event, make_tier, make_ticket, make_session
    ):
        event = make_event()
        ticket = make_ticket(event=event, tier=make_tier(event))
        session = make_session(event, expires_in=timedelta(seconds=-10))
        response = submit_scan(door_client, session, key="s", qr_payload=minted_qr(ticket))
        assert response.status_code == 403
        assert response.json()["error"]["code"] == "door_session_expired"

    def test_unconfigured_signing_key_fails_closed(
        self, door_client, make_event, make_tier, make_ticket, make_session, settings
    ):
        settings.ECHO_CREDENTIAL_SIGNING_KEY = ""
        event = make_event()
        make_ticket(event=event, tier=make_tier(event))
        session = make_session(event)
        response = submit_scan(door_client, session, key="s", qr_payload="ECHO1.something")
        assert response.status_code == 503
        assert response.json()["error"]["code"] == "credentials_not_configured"

    def test_scan_writes_audit_entry(self, door_client, scan_setup):
        from audit.models import AuditLogEntry

        _, _, ticket, session = scan_setup
        submit_scan(door_client, session, key="s", qr_payload=minted_qr(ticket))
        entry = AuditLogEntry.objects.get(action="door.scan_recorded")
        assert entry.metadata["approved"] is True
        assert entry.metadata["door_session_id"] == str(session.echo_id)
