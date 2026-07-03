"""
Apple Wallet PKPass generation (Phase 4 / W3).

A .pkpass is a zip: pass.json + icons + manifest.json (SHA-1 of every file,
per the PassKit bundle spec) + a detached PKCS#7 signature over the manifest
made with the operator's Pass Type ID certificate and Apple's WWDR
intermediate. Built with stdlib + `cryptography` (already a PyJWT dependency)
— no new runtime requirement.

Fail-closed asset gate (same doctrine as checkout.stripe_gateway): any
missing ECHO_PASSKIT_* setting or unreadable file raises PassKitNotConfigured
-> envelope 503 `wallet_pass_not_configured`, never a silent mock. Real-pass
verification (install on a device) needs the operator's certificates — unit
tests sign with self-signed fixtures and verify bundle structure/hashes.

Barcode discipline (locked): the QR message is a server-signed pkpass-typed
token from tickets.credentials — never a bare serial. It is long-lived
(event end) because a shipped pass cannot rotate; ticket-status checks still
kill it instantly at scan time.

PASS-UPDATE SLOT (documented deferral, flagged in the phase closeout): the
pass ships WITHOUT webServiceURL/authenticationToken. Live pass updates
require the full PassKit web service — device registration routes + APNs
pushes — which is its own surface (and would ride the drift script's
SERVER_TO_SERVER allowlist, the Phase 3 webhook mechanism). Adding the two
keys here is the only pass-side change when that lands.
"""

import hashlib
import io
import json
import zipfile
from pathlib import Path

from cryptography import x509
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.serialization import pkcs7
from django.conf import settings

from tickets.models import Ticket

ASSETS_DIR = Path(__file__).resolve().parent / "passkit_assets"
ICON_FILES = ("icon.png", "icon@2x.png", "icon@3x.png")

_REQUIRED_SETTINGS = (
    "ECHO_PASSKIT_CERT_PATH",
    "ECHO_PASSKIT_KEY_PATH",
    "ECHO_PASSKIT_WWDR_CERT_PATH",
    "ECHO_PASSKIT_PASS_TYPE_ID",
    "ECHO_PASSKIT_TEAM_ID",
)


class PassKitNotConfigured(Exception):
    """Pass-signing assets are not (fully) configured for this environment."""


class PassSigner:
    """Holds the loaded signing material; sign_manifest is the only surface."""

    def __init__(self, cert_path: str, key_path: str, wwdr_path: str):
        self._paths = (cert_path, key_path, wwdr_path)
        try:
            self._cert = x509.load_pem_x509_certificate(Path(cert_path).read_bytes())
            self._key = serialization.load_pem_private_key(
                Path(key_path).read_bytes(), password=None
            )
            self._wwdr = x509.load_pem_x509_certificate(Path(wwdr_path).read_bytes())
        except (OSError, ValueError) as exc:
            raise PassKitNotConfigured(f"pass-signing assets unreadable: {exc}") from exc

    def sign_manifest(self, manifest_bytes: bytes) -> bytes:
        """Detached DER PKCS#7 over manifest.json, WWDR chained in."""
        return (
            pkcs7.PKCS7SignatureBuilder()
            .set_data(manifest_bytes)
            .add_signer(self._cert, self._key, hashes.SHA256())
            .add_certificate(self._wwdr)
            .sign(
                serialization.Encoding.DER,
                [pkcs7.PKCS7Options.DetachedSignature, pkcs7.PKCS7Options.Binary],
            )
        )


_pass_signer: PassSigner | None = None


def get_pass_signer() -> PassSigner:
    """Process-wide signer. Raises PassKitNotConfigured when any asset slot is
    empty or unreadable (fail closed — locked credential-gate doctrine)."""
    global _pass_signer
    missing = [name for name in _REQUIRED_SETTINGS if not getattr(settings, name)]
    if missing:
        raise PassKitNotConfigured(f"missing settings: {', '.join(missing)}")
    paths = (
        settings.ECHO_PASSKIT_CERT_PATH,
        settings.ECHO_PASSKIT_KEY_PATH,
        settings.ECHO_PASSKIT_WWDR_CERT_PATH,
    )
    if _pass_signer is None or _pass_signer._paths != paths:
        _pass_signer = PassSigner(*paths)
    return _pass_signer


def _pass_json(ticket: Ticket, barcode_message: str) -> dict:
    event = ticket.event
    return {
        "formatVersion": 1,
        "passTypeIdentifier": settings.ECHO_PASSKIT_PASS_TYPE_ID,
        "teamIdentifier": settings.ECHO_PASSKIT_TEAM_ID,
        "organizationName": settings.ECHO_PASSKIT_ORG_NAME,
        "serialNumber": str(ticket.echo_id),
        "description": f"{event.title} — ECHO ticket",
        "relevantDate": event.starts_at.isoformat(),
        "barcodes": [
            {
                "format": "PKBarcodeFormatQR",
                "message": barcode_message,
                "messageEncoding": "iso-8859-1",
            }
        ],
        "eventTicket": {
            "primaryFields": [{"key": "event", "label": "EVENT", "value": event.title}],
            "secondaryFields": [
                {"key": "venue", "label": "VENUE", "value": event.venue.name},
                {"key": "tier", "label": "TIER", "value": ticket.tier.name},
            ],
            "auxiliaryFields": [
                {
                    "key": "starts",
                    "label": "DATE",
                    "value": event.starts_at.isoformat(),
                    "dateStyle": "PKDateStyleMedium",
                    "timeStyle": "PKDateStyleShort",
                }
            ],
        },
    }


def build_pass(ticket: Ticket, *, barcode_message: str) -> bytes:
    """Assemble + sign the .pkpass bundle. Raises PassKitNotConfigured when
    the environment has no signing assets."""
    signer = get_pass_signer()

    files: dict[str, bytes] = {
        "pass.json": json.dumps(_pass_json(ticket, barcode_message), indent=2).encode("utf-8"),
    }
    for icon in ICON_FILES:
        files[icon] = (ASSETS_DIR / icon).read_bytes()

    # Bundle spec: manifest maps every file to its SHA-1 hex digest; the
    # signature covers the manifest (and thereby everything).
    manifest = {
        name: hashlib.sha1(content).hexdigest()  # noqa: S324 — PassKit bundle spec mandates SHA-1
        for name, content in files.items()
    }
    manifest_bytes = json.dumps(manifest, indent=2).encode("utf-8")

    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w", compression=zipfile.ZIP_DEFLATED) as bundle:
        for name, content in files.items():
            bundle.writestr(name, content)
        bundle.writestr("manifest.json", manifest_bytes)
        bundle.writestr("signature", signer.sign_manifest(manifest_bytes))
    return buffer.getvalue()
