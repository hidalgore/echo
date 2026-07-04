"""Reconciliation (W3): ledger merge, duplicate resolution by server
timestamp, conflict auditing, and replay behavior (both same-key idempotent
replays and re-sent ledgers under fresh keys)."""

import pytest
from django.utils import timezone

from audit.models import AuditLogEntry
from door.models import DoorScan, DoorScanSource, DoorSessionStatus
from door.tests.conftest import RECONCILE_PATH, submit_scan
from tickets import credentials
from tickets.models import Ticket, TicketStatus

pytestmark = pytest.mark.django_db


def entry_for(session, *, scanned_at=None, **credential):
    return {
        "session_id": str(session.echo_id),
        "scanned_at": (scanned_at or timezone.now()).isoformat(),
        "offline": True,
        **credential,
    }


def reconcile(client, entries, *, key):
    return client.post(
        RECONCILE_PATH, {"scans": entries}, format="json", headers={"Idempotency-Key": key}
    )


@pytest.fixture
def scan_setup(signing_key, make_event, make_tier, make_ticket, make_session):
    event = make_event()
    tier = make_tier(event)
    ticket = make_ticket(event=event, tier=tier)
    session = make_session(event)
    return event, tier, ticket, session


class TestLedgerMerge:
    def test_offline_approval_merges_and_checks_in(self, door_client, scan_setup):
        _, _, ticket, session = scan_setup
        qr = credentials.issue_credential(ticket).qr_payload
        response = reconcile(door_client, [entry_for(session, qr_payload=qr)], key="r1")
        assert response.status_code == 200
        body = response.json()
        assert body["ok"] is True
        assert body["merged"] == 1
        assert body["conflicts"] == 0
        assert body["results"][0]["approved"] is True

        ticket.refresh_from_db()
        assert ticket.status == TicketStatus.CHECKED_IN
        scan = DoorScan.objects.get(ticket=ticket)
        assert scan.source == DoorScanSource.RECONCILE
        assert scan.offline is True

    def test_online_checkin_wins_offline_becomes_duplicate(self, door_client, scan_setup):
        """Server truth by server timestamp: the online scan recorded first;
        the offline approval merges as a duplicate, not a second admission."""
        _, _, ticket, session = scan_setup
        qr = credentials.issue_credential(ticket).qr_payload
        offline_scanned_at = timezone.now()  # device claims it scanned first
        submit_scan(door_client, session, key="online", qr_payload=qr)

        body = reconcile(
            door_client,
            [entry_for(session, scanned_at=offline_scanned_at, qr_payload=qr)],
            key="r1",
        ).json()
        assert body["merged"] == 1
        assert body["results"][0]["verification_state"] == "duplicate_alert"
        assert DoorScan.objects.filter(ticket=ticket, approved=True).count() == 2

    def test_conflicting_offline_approval_reconciles_to_refusal_and_audits(
        self, door_client, scan_setup
    ):
        """The device approved offline (nonce freshness relaxed), but the
        ticket was revoked server-side — server truth wins, audited."""
        _, _, ticket, session = scan_setup
        qr = credentials.issue_credential(ticket).qr_payload
        Ticket.objects.filter(pk=ticket.pk).update(status=TicketStatus.REVOKED)

        body = reconcile(door_client, [entry_for(session, qr_payload=qr)], key="r1").json()
        assert body["merged"] == 1
        assert body["conflicts"] == 1
        assert body["results"][0]["approved"] is False

        entry = AuditLogEntry.objects.get(action="door.reconcile_conflict")
        assert entry.metadata["door_session_id"] == str(session.echo_id)

    def test_unknown_session_entries_rejected(self, door_client, scan_setup):
        _, _, ticket, session = scan_setup
        qr = credentials.issue_credential(ticket).qr_payload
        foreign = dict(entry_for(session, qr_payload=qr), session_id=str(ticket.echo_id))
        body = reconcile(door_client, [foreign], key="r1").json()
        assert body["rejected"] == 1
        assert body["merged"] == 0
        assert body["results"][0]["reason"] == "unknown_session"

    def test_closed_session_ledger_still_merges(
        self, door_client, signing_key, make_event, make_tier, make_ticket, make_session
    ):
        """Ledgers arrive after the door closes — refusing would lose records."""
        event = make_event()
        ticket = make_ticket(event=event, tier=make_tier(event))
        qr = credentials.issue_credential(ticket).qr_payload
        session = make_session(event, status=DoorSessionStatus.CLOSED)
        body = reconcile(door_client, [entry_for(session, qr_payload=qr)], key="r1").json()
        assert body["merged"] == 1


class TestReplays:
    def test_same_key_replays_the_stored_summary(self, door_client, scan_setup):
        _, _, ticket, session = scan_setup
        qr = credentials.issue_credential(ticket).qr_payload
        entries = [entry_for(session, qr_payload=qr)]
        first = reconcile(door_client, entries, key="same")
        replay = reconcile(door_client, entries, key="same")
        assert replay.headers.get("Idempotency-Replayed") == "true"
        assert replay.json() == first.json()
        assert DoorScan.objects.filter(ticket=ticket).count() == 1

    def test_resent_ledger_under_fresh_key_skips_already_merged_entries(
        self, door_client, scan_setup
    ):
        _, _, ticket, session = scan_setup
        qr = credentials.issue_credential(ticket).qr_payload
        entries = [entry_for(session, qr_payload=qr)]
        reconcile(door_client, entries, key="first")
        body = reconcile(door_client, entries, key="second").json()
        assert body["merged"] == 0
        assert body["replayed"] == 1
        assert body["results"][0]["reason"] == "already_merged"
        assert DoorScan.objects.filter(ticket=ticket).count() == 1

    def test_merge_summary_is_audited(self, door_client, scan_setup):
        _, _, ticket, session = scan_setup
        qr = credentials.issue_credential(ticket).qr_payload
        reconcile(door_client, [entry_for(session, qr_payload=qr)], key="r1")
        entry = AuditLogEntry.objects.get(action="door.reconcile_merged")
        assert entry.metadata["merged"] == 1
