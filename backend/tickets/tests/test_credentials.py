"""W1 — signing service properties: mint/reuse/rotate, expiry, tamper
rejection, revoked-ticket refusal, fail-closed gate, audit trail."""

import base64

import pytest
from django.core.management import call_command

from audit.models import AuditLogEntry
from tickets import credentials
from tickets.models import TicketCredential, TicketStatus

# ─── Fail-closed gate ────────────────────────────────────────────────────────


def test_get_signer_fails_closed_without_key(settings):
    settings.ECHO_CREDENTIAL_SIGNING_KEY = ""
    with pytest.raises(credentials.CredentialSigningNotConfigured):
        credentials.get_signer()


def test_get_signer_rejects_garbage_key(settings):
    settings.ECHO_CREDENTIAL_SIGNING_KEY = "not-base64!!!"
    with pytest.raises(credentials.CredentialSigningNotConfigured):
        credentials.get_signer()


def test_get_signer_rejects_wrong_length_seed(settings):
    settings.ECHO_CREDENTIAL_SIGNING_KEY = base64.b64encode(b"short").decode()
    with pytest.raises(credentials.CredentialSigningNotConfigured):
        credentials.get_signer()


def test_issue_fails_closed_without_key(settings, make_ticket):
    settings.ECHO_CREDENTIAL_SIGNING_KEY = ""
    ticket = make_ticket()
    with pytest.raises(credentials.CredentialSigningNotConfigured):
        credentials.issue_credential(ticket)


# ─── Mint / reuse / rotate ───────────────────────────────────────────────────


def test_issue_mints_locked_dto_fields(signing_key, make_ticket, settings):
    ticket = make_ticket()
    minted = credentials.issue_credential(ticket)

    assert minted.ticket_id == str(ticket.echo_id)
    assert minted.nfc_credential_id.startswith("nfc_")
    assert minted.qr_payload == credentials.QR_PAYLOAD_PREFIX + minted.validation_token
    ttl = (minted.expires_at - ticket.credential.minted_at).total_seconds()
    assert ttl == pytest.approx(settings.ECHO_CREDENTIAL_TTL_SECONDS, abs=1)

    result = credentials.verify_validation_token(minted.validation_token)
    assert result.valid and result.code == credentials.VALID
    assert result.ticket == ticket
    assert result.claims["typ"] == "credential"
    assert result.claims["eid"] == str(ticket.event_id)


def test_issue_within_window_reuses_current(signing_key, make_ticket):
    ticket = make_ticket()
    first = credentials.issue_credential(ticket)
    second = credentials.issue_credential(ticket)
    assert second.validation_token == first.validation_token
    assert second.nfc_credential_id == first.nfc_credential_id
    assert TicketCredential.objects.filter(ticket=ticket).count() == 1


def test_issue_near_expiry_re_mints(signing_key, make_ticket, settings):
    # A credential with less life left than the reuse floor must be replaced.
    settings.ECHO_CREDENTIAL_TTL_SECONDS = credentials.REUSE_MIN_REMAINING_SECONDS - 1
    ticket = make_ticket()
    first = credentials.issue_credential(ticket)
    second = credentials.issue_credential(ticket)
    assert second.validation_token != first.validation_token


def test_rotate_always_mints_and_supersedes_predecessor(signing_key, make_ticket):
    ticket = make_ticket()
    first = credentials.issue_credential(ticket)
    second = credentials.rotate_credential(ticket)

    assert second.validation_token != first.validation_token
    assert second.nfc_credential_id != first.nfc_credential_id
    # One row per ticket: rotation overwrites, never accumulates.
    assert TicketCredential.objects.filter(ticket=ticket).count() == 1

    stale = credentials.verify_validation_token(first.validation_token)
    assert not stale.valid and stale.code == credentials.SUPERSEDED
    fresh = credentials.verify_validation_token(second.validation_token)
    assert fresh.valid


def test_qr_payload_verifies_with_prefix(signing_key, make_ticket):
    ticket = make_ticket()
    minted = credentials.issue_credential(ticket)
    result = credentials.verify_validation_token(minted.qr_payload)
    assert result.valid


# ─── Expiry ──────────────────────────────────────────────────────────────────


def test_expired_token_refused(signing_key, make_ticket, settings):
    settings.ECHO_CREDENTIAL_TTL_SECONDS = -1  # exp already in the past
    ticket = make_ticket()
    minted = credentials.issue_credential(ticket)
    result = credentials.verify_validation_token(minted.validation_token)
    assert not result.valid and result.code == credentials.EXPIRED


def test_expiry_leeway_is_opt_in(signing_key, make_ticket, settings):
    settings.ECHO_CREDENTIAL_TTL_SECONDS = -1
    ticket = make_ticket()
    minted = credentials.issue_credential(ticket)
    # Phase 5 door devices may allow small clock skew — the primitive supports
    # it without changing the default-strict behavior.
    result = credentials.verify_validation_token(minted.validation_token, leeway_seconds=10)
    assert result.valid


# ─── Tamper rejection ────────────────────────────────────────────────────────


def test_tampered_payload_refused(signing_key, make_ticket):
    ticket = make_ticket()
    minted = credentials.issue_credential(ticket)
    header, payload, signature = minted.validation_token.split(".")
    flipped = payload[:-2] + ("AA" if payload[-2:] != "AA" else "BB")
    result = credentials.verify_validation_token(f"{header}.{flipped}.{signature}")
    assert not result.valid
    assert result.code in (credentials.INVALID_SIGNATURE, credentials.MALFORMED)


def test_foreign_key_signature_refused(signing_key, make_ticket, settings):
    """A token signed by a different key never verifies — the client (or an
    attacker) cannot mint credentials, only the server key can."""
    ticket = make_ticket()
    minted = credentials.issue_credential(ticket)
    from tickets.tests.conftest import generate_seed_b64

    settings.ECHO_CREDENTIAL_SIGNING_KEY = generate_seed_b64()
    credentials._signer = None
    result = credentials.verify_validation_token(minted.validation_token)
    assert not result.valid
    assert result.code == credentials.INVALID_SIGNATURE


def test_garbage_token_refused(signing_key):
    result = credentials.verify_validation_token("definitely-not-a-jwt")
    assert not result.valid and result.code == credentials.MALFORMED


def test_unknown_typ_refused(signing_key, make_ticket):
    ticket = make_ticket()
    signer = credentials.get_signer()
    token = signer.sign(
        {
            "iss": credentials.TOKEN_ISSUER,
            "typ": "somethingelse",
            "tid": str(ticket.echo_id),
            "exp": 2**31,
        }
    )
    result = credentials.verify_validation_token(token)
    assert not result.valid and result.code == credentials.MALFORMED


def test_unknown_ticket_refused(signing_key, db):
    signer = credentials.get_signer()
    token = signer.sign(
        {
            "iss": credentials.TOKEN_ISSUER,
            "typ": "credential",
            "tid": "0198c8a0-0000-7000-8000-000000000000",
            "cid": "deadbeef",
            "exp": 2**31,
        }
    )
    result = credentials.verify_validation_token(token)
    assert not result.valid and result.code == credentials.UNKNOWN_TICKET


# ─── Revocation follows ticket status ────────────────────────────────────────


@pytest.mark.parametrize(
    "status",
    [TicketStatus.REVOKED, TicketStatus.EXPIRED, TicketStatus.TRANSFERRED, TicketStatus.CHECKED_IN],
)
def test_mint_refuses_non_active_ticket(signing_key, make_ticket, status):
    ticket = make_ticket(status=status)
    with pytest.raises(credentials.TicketNotActive):
        credentials.issue_credential(ticket)
    with pytest.raises(credentials.TicketNotActive):
        credentials.rotate_credential(ticket)


def test_revoked_ticket_stops_validating_immediately(signing_key, make_ticket):
    """Locked rule: a token minted while active dies the moment the ticket
    stops being active — even inside its expiry window."""
    ticket = make_ticket()
    minted = credentials.issue_credential(ticket)
    ticket.status = TicketStatus.REVOKED
    ticket.save(update_fields=["status"])
    result = credentials.verify_validation_token(minted.validation_token)
    assert not result.valid and result.code == credentials.TICKET_NOT_ACTIVE


def test_revoke_credential_drops_row_and_audits(signing_key, make_ticket):
    ticket = make_ticket()
    credentials.issue_credential(ticket)
    assert credentials.revoke_credential(ticket, reason="transfer") is True
    assert not TicketCredential.objects.filter(ticket=ticket).exists()
    assert credentials.revoke_credential(ticket) is False  # nothing left; no audit spam
    assert AuditLogEntry.objects.filter(action="credential.revoked").count() == 1


# ─── Audit trail ─────────────────────────────────────────────────────────────


def test_mint_and_refresh_write_audit_entries(signing_key, make_ticket):
    ticket = make_ticket()
    credentials.issue_credential(ticket)
    credentials.issue_credential(ticket)  # reuse — must NOT write a second entry
    credentials.rotate_credential(ticket)

    assert AuditLogEntry.objects.filter(
        action="credential.minted", target_id=str(ticket.echo_id)
    ).count() == 1
    assert AuditLogEntry.objects.filter(
        action="credential.refreshed", target_id=str(ticket.echo_id)
    ).count() == 1


# ─── Key tooling ─────────────────────────────────────────────────────────────


def test_generate_command_output_is_usable(settings, capsys, db):
    call_command("generate_credential_signing_key")
    lines = [line for line in capsys.readouterr().out.splitlines() if line.strip()]
    seed_b64 = lines[1].strip()
    settings.ECHO_CREDENTIAL_SIGNING_KEY = seed_b64
    signer = credentials.get_signer()
    assert "BEGIN PUBLIC KEY" in signer.public_key_pem
    assert credentials.signing_public_key_pem() == signer.public_key_pem
