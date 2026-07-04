"""W3 — Apple Wallet pass generation: fail-closed gate, bundle structure,
manifest hashes, signed-barcode discipline, refusals. Signing uses
self-signed fixture certs — real-pass install verification needs the
operator's Pass Type ID assets (flagged in the phase closeout)."""

import hashlib
import io
import json
import zipfile
from datetime import UTC, datetime, timedelta

import pytest
from cryptography import x509
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.x509.oid import NameOID

from tickets import credentials
from tickets.models import TicketStatus


def _self_signed(common_name: str):
    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    name = x509.Name([x509.NameAttribute(NameOID.COMMON_NAME, common_name)])
    now = datetime.now(UTC)
    cert = (
        x509.CertificateBuilder()
        .subject_name(name)
        .issuer_name(name)
        .public_key(key.public_key())
        .serial_number(x509.random_serial_number())
        .not_valid_before(now - timedelta(days=1))
        .not_valid_after(now + timedelta(days=365))
        .sign(key, hashes.SHA256())
    )
    return key, cert


@pytest.fixture
def passkit_assets(settings, tmp_path):
    """Self-signed stand-ins for the operator's Pass Type ID cert + WWDR."""
    key, cert = _self_signed("Pass Type ID: pass.events.echo.test")
    _, wwdr = _self_signed("Fixture WWDR CA")

    cert_path = tmp_path / "pass_cert.pem"
    key_path = tmp_path / "pass_key.pem"
    wwdr_path = tmp_path / "wwdr.pem"
    cert_path.write_bytes(cert.public_bytes(serialization.Encoding.PEM))
    key_path.write_bytes(
        key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption(),
        )
    )
    wwdr_path.write_bytes(wwdr.public_bytes(serialization.Encoding.PEM))

    settings.ECHO_PASSKIT_CERT_PATH = str(cert_path)
    settings.ECHO_PASSKIT_KEY_PATH = str(key_path)
    settings.ECHO_PASSKIT_WWDR_CERT_PATH = str(wwdr_path)
    settings.ECHO_PASSKIT_PASS_TYPE_ID = "pass.events.echo.test"
    settings.ECHO_PASSKIT_TEAM_ID = "TEAMID9999"


def wallet_path(ticket):
    return f"/v1/tickets/{ticket.echo_id}/apple-wallet"


# ─── Fail-closed gate ────────────────────────────────────────────────────────


def test_fails_closed_without_assets(signing_key, user_client, make_ticket, settings):
    settings.ECHO_PASSKIT_CERT_PATH = ""
    ticket = make_ticket()
    response = user_client.post(wallet_path(ticket))
    assert response.status_code == 503
    assert response.json()["error"]["code"] == "wallet_pass_not_configured"


def test_fails_closed_with_partial_assets(signing_key, user_client, make_ticket, passkit_assets, settings):
    settings.ECHO_PASSKIT_TEAM_ID = ""
    ticket = make_ticket()
    assert user_client.post(wallet_path(ticket)).status_code == 503


def test_fails_closed_with_unreadable_cert(signing_key, user_client, make_ticket, passkit_assets, settings):
    settings.ECHO_PASSKIT_CERT_PATH = settings.ECHO_PASSKIT_CERT_PATH + ".missing"
    ticket = make_ticket()
    response = user_client.post(wallet_path(ticket))
    assert response.status_code == 503
    assert response.json()["error"]["code"] == "wallet_pass_not_configured"


def test_fails_closed_without_credential_signing_key(settings, user_client, make_ticket, passkit_assets):
    """The barcode token needs the credential key — its gate fires first."""
    settings.ECHO_CREDENTIAL_SIGNING_KEY = ""
    ticket = make_ticket()
    response = user_client.post(wallet_path(ticket))
    assert response.status_code == 503
    assert response.json()["error"]["code"] == "credentials_not_configured"


# ─── Bundle structure ────────────────────────────────────────────────────────


def test_pass_bundle_structure_and_signed_barcode(signing_key, user_client, make_ticket, passkit_assets):
    ticket = make_ticket()
    response = user_client.post(wallet_path(ticket))
    assert response.status_code == 200
    assert response["Content-Type"] == "application/vnd.apple.pkpass"

    bundle = zipfile.ZipFile(io.BytesIO(response.content))
    names = set(bundle.namelist())
    assert names == {"pass.json", "icon.png", "icon@2x.png", "icon@3x.png", "manifest.json", "signature"}

    pass_json = json.loads(bundle.read("pass.json"))
    assert pass_json["formatVersion"] == 1
    assert pass_json["passTypeIdentifier"] == "pass.events.echo.test"
    assert pass_json["teamIdentifier"] == "TEAMID9999"
    assert pass_json["serialNumber"] == str(ticket.echo_id)
    assert ticket.event.title in pass_json["description"]
    assert pass_json["eventTicket"]["primaryFields"][0]["value"] == ticket.event.title

    # Locked barcode discipline: a server-signed payload, never a bare serial.
    message = pass_json["barcodes"][0]["message"]
    assert message.startswith(credentials.QR_PAYLOAD_PREFIX)
    assert str(ticket.echo_id) not in message.split(".")[0]  # not a serial envelope
    result = credentials.verify_validation_token(message)
    assert result.valid
    assert result.claims["typ"] == "pkpass"
    assert result.ticket == ticket

    # Documented update slot: web service deliberately absent until Phase 5+.
    assert "webServiceURL" not in pass_json
    assert "authenticationToken" not in pass_json

    # Manifest covers every file with its SHA-1 (bundle spec).
    manifest = json.loads(bundle.read("manifest.json"))
    assert set(manifest) == names - {"manifest.json", "signature"}
    for name, digest in manifest.items():
        assert hashlib.sha1(bundle.read(name)).hexdigest() == digest

    # Detached PKCS#7 signature: DER SEQUENCE, non-trivial length.
    signature = bundle.read("signature")
    assert signature[0] == 0x30 and len(signature) > 500


def test_pass_barcode_outlives_credential_rotation(signing_key, user_client, make_ticket, passkit_assets):
    """pkpass tokens are not nonce-checked — rotating the live credential
    must not brick a pass already in someone's Wallet."""
    ticket = make_ticket()
    message = _issued_barcode(user_client, ticket)
    user_client.post(f"/v1/tickets/{ticket.echo_id}/refresh")
    assert credentials.verify_validation_token(message).valid


def test_pass_barcode_dies_with_ticket_status(signing_key, user_client, make_ticket, passkit_assets):
    ticket = make_ticket()
    message = _issued_barcode(user_client, ticket)
    ticket.status = TicketStatus.REVOKED
    ticket.save(update_fields=["status"])
    result = credentials.verify_validation_token(message)
    assert not result.valid and result.code == credentials.TICKET_NOT_ACTIVE


def _issued_barcode(user_client, ticket) -> str:
    response = user_client.post(wallet_path(ticket))
    assert response.status_code == 200
    pass_json = json.loads(zipfile.ZipFile(io.BytesIO(response.content)).read("pass.json"))
    return pass_json["barcodes"][0]["message"]


# ─── Refusals + audit ────────────────────────────────────────────────────────


def test_non_active_ticket_refused(signing_key, user_client, make_ticket, passkit_assets):
    ticket = make_ticket(status=TicketStatus.TRANSFERRED)
    response = user_client.post(wallet_path(ticket))
    assert response.status_code == 409
    assert response.json()["error"]["code"] == "ticket_not_active"


def test_owner_only(signing_key, other_user_client, make_ticket, passkit_assets):
    ticket = make_ticket()
    assert other_user_client.post(wallet_path(ticket)).status_code == 404


def test_generation_writes_audit_entry(signing_key, user_client, make_ticket, passkit_assets):
    from audit.models import AuditLogEntry

    ticket = make_ticket()
    user_client.post(wallet_path(ticket))
    assert AuditLogEntry.objects.filter(
        action="wallet_pass.generated", target_id=str(ticket.echo_id)
    ).count() == 1
