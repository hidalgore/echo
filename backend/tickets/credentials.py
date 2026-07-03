"""
Server-signed rotating credentials (Phase 4 / W1).

The locked doctrine: the client never mints tokens. This module is the only
place credentials come from — short-lived Ed25519-signed tokens (~30s, the
client's locked rotation cadence) carried in both the QR payload and the NFC
validation exchange. Serial-only validation is disallowed: every accepted
scan must present a token that verifies against the server public key AND
matches the ticket's current rotation nonce AND belongs to a live ticket.

Ed25519 (not HS256 like identity's access tokens) is deliberate: Phase 5
door devices verify *offline bundles* with just the public key
(`signing_public_key_pem()`), so no secret material ever ships to a door
device. `verify_validation_token` is the reusable verification primitive —
Phase 5 door scans call it (or reimplement its checks client-side from the
same claims) without redesign.

Fail-closed credential gate (same doctrine as checkout.stripe_gateway):
missing ECHO_CREDENTIAL_SIGNING_KEY raises CredentialSigningNotConfigured
-> envelope 503 `credentials_not_configured`, never a silent mock.

Token claims (compact JWT, alg=EdDSA):
    iss  "echo-credentials"
    typ  "credential" (rotating, nonce-checked) | "pkpass" (Apple Wallet
         barcode — long-lived, signature+status-checked but not nonce-checked,
         because a printed pass cannot rotate without the PassKit web service;
         see tickets.passkit)
    tid  ticket echo_id
    eid  event echo_id (lets Phase 5 scope offline bundles per event)
    cid  rotation nonce (typ=credential only)
    iat / exp
"""

import base64
import binascii
import logging
import secrets
from dataclasses import dataclass
from datetime import datetime, timedelta

import jwt
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
from django.conf import settings
from django.utils import timezone

from audit import service as audit
from tickets.models import Ticket, TicketCredential, TicketStatus

logger = logging.getLogger(__name__)

TOKEN_ISSUER = "echo-credentials"
# Versioned QR envelope so Phase 5 scanners can reject foreign QR formats
# before attempting signature verification.
QR_PAYLOAD_PREFIX = "ECHO1."
# A GET within this many seconds of expiry re-serves the stored credential
# instead of rotating; below it, the client is about to rotate anyway so we
# mint fresh rather than hand back a token that dies mid-display.
REUSE_MIN_REMAINING_SECONDS = 5

# Verification refusal codes (stable — Phase 5 door results build on these).
VALID = "ok"
MALFORMED = "malformed"
INVALID_SIGNATURE = "invalid_signature"
EXPIRED = "expired"
SUPERSEDED = "superseded"
UNKNOWN_TICKET = "unknown_ticket"
TICKET_NOT_ACTIVE = "ticket_not_active"


class CredentialSigningNotConfigured(Exception):
    """ECHO_CREDENTIAL_SIGNING_KEY is not set for this environment."""


class TicketNotActive(Exception):
    """Credential requested for a ticket whose status forbids entry.

    Revoked/expired/transferred tickets must stop validating immediately
    (locked rule) — refusing at mint time is the first half; the nonce/status
    checks in verify_validation_token are the scan-time half.
    """

    def __init__(self, status: str):
        self.status = status
        super().__init__(f"ticket status is {status}")


class CredentialSigner:
    """Process-wide Ed25519 signer. The env slot carries the base64-encoded
    32-byte private seed (single line, env-transport-safe); generate one with
    `manage.py generate_credential_signing_key`."""

    def __init__(self, seed_b64: str):
        self._seed_b64 = seed_b64
        try:
            seed = base64.b64decode(seed_b64, validate=True)
        except (binascii.Error, ValueError) as exc:
            raise CredentialSigningNotConfigured(
                "ECHO_CREDENTIAL_SIGNING_KEY is not valid base64"
            ) from exc
        if len(seed) != 32:
            raise CredentialSigningNotConfigured(
                "ECHO_CREDENTIAL_SIGNING_KEY must decode to a 32-byte Ed25519 seed"
            )
        self._private_key = Ed25519PrivateKey.from_private_bytes(seed)
        self._public_key_pem = (
            self._private_key.public_key()
            .public_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PublicFormat.SubjectPublicKeyInfo,
            )
            .decode("ascii")
        )

    def sign(self, claims: dict) -> str:
        return jwt.encode(claims, self._private_key, algorithm="EdDSA")

    def decode(self, token: str, *, leeway_seconds: int = 0) -> dict:
        """Signature + exp + iss check; raises jwt exceptions on failure."""
        return jwt.decode(
            token,
            self._public_key_pem,
            algorithms=["EdDSA"],
            issuer=TOKEN_ISSUER,
            leeway=leeway_seconds,
            options={"require": ["iss", "typ", "tid", "exp"]},
        )

    @property
    def public_key_pem(self) -> str:
        return self._public_key_pem


_signer: CredentialSigner | None = None


def get_signer() -> CredentialSigner:
    """Raises CredentialSigningNotConfigured when the env has no signing key
    (fail closed — locked credential-gate doctrine)."""
    global _signer
    key = settings.ECHO_CREDENTIAL_SIGNING_KEY
    if not key:
        raise CredentialSigningNotConfigured("ECHO_CREDENTIAL_SIGNING_KEY is not configured")
    if _signer is None or _signer._seed_b64 != key:
        _signer = CredentialSigner(key)
    return _signer


def signing_public_key_pem() -> str:
    """Public verification key (PEM) — what a Phase 5 offline bundle ships."""
    return get_signer().public_key_pem


@dataclass(frozen=True)
class MintedCredential:
    """Exactly the locked CredentialDTO fields (frontend/types/api/dto.ts)."""

    ticket_id: str
    nfc_credential_id: str
    qr_payload: str
    validation_token: str
    expires_at: datetime


def _credential_ttl() -> timedelta:
    return timedelta(seconds=settings.ECHO_CREDENTIAL_TTL_SECONDS)


def _refuse_non_active(ticket: Ticket) -> None:
    if ticket.status != TicketStatus.ACTIVE:
        raise TicketNotActive(ticket.status)


def _as_minted(credential: TicketCredential) -> MintedCredential:
    return MintedCredential(
        ticket_id=str(credential.ticket_id),
        nfc_credential_id=credential.nfc_credential_id,
        qr_payload=QR_PAYLOAD_PREFIX + credential.validation_token,
        validation_token=credential.validation_token,
        expires_at=credential.expires_at,
    )


def _mint(ticket: Ticket, *, request=None, audit_action: str) -> MintedCredential:
    signer = get_signer()  # fail closed before touching the row
    now = timezone.now()
    nonce = secrets.token_hex(16)
    expires_at = now + _credential_ttl()
    token = signer.sign(
        {
            "iss": TOKEN_ISSUER,
            "typ": "credential",
            "tid": str(ticket.echo_id),
            "eid": str(ticket.event_id),
            "cid": nonce,
            "iat": int(now.timestamp()),
            "exp": int(expires_at.timestamp()),
        }
    )
    credential, _created = TicketCredential.objects.update_or_create(
        ticket=ticket,
        defaults={
            "nonce": nonce,
            "nfc_credential_id": f"nfc_{secrets.token_urlsafe(24)}",
            "validation_token": token,
            "expires_at": expires_at,
            "minted_at": now,
        },
    )
    audit.record(
        audit_action,
        request=request,
        actor=ticket.user,
        target=("ticket", str(ticket.echo_id)),
        metadata={"event_id": str(ticket.event_id), "expires_at": expires_at.isoformat()},
    )
    return _as_minted(credential)


def issue_credential(ticket: Ticket, *, request=None) -> MintedCredential:
    """GET .../credential semantics: re-serve the current credential while it
    still has ≥ REUSE_MIN_REMAINING_SECONDS of life, otherwise mint. Repeat
    reads inside the window are read-only (no rotation, no audit spam)."""
    _refuse_non_active(ticket)
    get_signer()  # fail closed even on the reuse path
    now = timezone.now()
    current = TicketCredential.objects.filter(ticket=ticket).first()
    if current and current.expires_at - now >= timedelta(seconds=REUSE_MIN_REMAINING_SECONDS):
        return _as_minted(current)
    return _mint(ticket, request=request, audit_action="credential.minted")


def rotate_credential(ticket: Ticket, *, request=None) -> MintedCredential:
    """POST .../refresh semantics: always rotate; the predecessor stops
    verifying immediately (nonce mismatch -> superseded)."""
    _refuse_non_active(ticket)
    return _mint(ticket, request=request, audit_action="credential.refreshed")


def revoke_credential(ticket: Ticket, *, request=None, reason: str = "") -> bool:
    """Drop a ticket's credential row outright (Phase 5/8 hook — e.g. transfer
    or refund flows). Scan-time refusal doesn't need this (status checks catch
    it); this exists so flows that *change* status can also kill the material
    and leave an explicit audit entry. Returns True if a row was deleted."""
    deleted, _ = TicketCredential.objects.filter(ticket=ticket).delete()
    if deleted:
        audit.record(
            "credential.revoked",
            request=request,
            actor=ticket.user,
            target=("ticket", str(ticket.echo_id)),
            metadata={"event_id": str(ticket.event_id), "reason": reason},
        )
    return bool(deleted)


# A pass minted very near event end still gets a usable barcode window.
PKPASS_MIN_TTL = timedelta(hours=1)


def mint_pkpass_token(ticket: Ticket) -> str:
    """Long-lived barcode token for an Apple Wallet pass (typ=pkpass).

    A pass in someone's Wallet cannot rotate without the PassKit web service
    (deferred — see tickets.passkit), so this token lives until the event
    ends instead of ~30s. It is still a server-signed payload, never a bare
    serial, and revocation bites instantly: verification checks live ticket
    status on every scan. No TicketCredential row is touched — pass tokens
    ride alongside the rotating credential, not instead of it.
    """
    _refuse_non_active(ticket)
    signer = get_signer()
    now = timezone.now()
    expires_at = max(ticket.event.ends_at, now + PKPASS_MIN_TTL)
    return signer.sign(
        {
            "iss": TOKEN_ISSUER,
            "typ": "pkpass",
            "tid": str(ticket.echo_id),
            "eid": str(ticket.event_id),
            "iat": int(now.timestamp()),
            "exp": int(expires_at.timestamp()),
        }
    )


@dataclass(frozen=True)
class VerificationResult:
    """Stable scan-verdict shape — Phase 5 door results are built from this."""

    valid: bool
    code: str  # one of the module-level refusal codes
    ticket: Ticket | None = None
    claims: dict | None = None


def verify_validation_token(token: str, *, leeway_seconds: int = 0) -> VerificationResult:
    """The server-side verification primitive (Phase 4 truth, Phase 5 reuse).

    Accepts a bare token or a full QR payload (prefix is stripped). Checks,
    in order: signature/expiry/issuer, ticket existence, rotation nonce
    (typ=credential only — pkpass barcodes are long-lived by design), and
    live ticket status. Never raises; every failure is a coded refusal.
    """
    if token.startswith(QR_PAYLOAD_PREFIX):
        token = token[len(QR_PAYLOAD_PREFIX) :]

    signer = get_signer()
    try:
        claims = signer.decode(token, leeway_seconds=leeway_seconds)
    except jwt.ExpiredSignatureError:
        return VerificationResult(valid=False, code=EXPIRED)
    except jwt.InvalidTokenError as exc:
        # Signature failures and structural failures are deliberately close:
        # a tampered token should learn nothing from the refusal code split.
        code = INVALID_SIGNATURE if isinstance(exc, jwt.InvalidSignatureError) else MALFORMED
        return VerificationResult(valid=False, code=code)

    if claims.get("typ") not in ("credential", "pkpass"):
        return VerificationResult(valid=False, code=MALFORMED, claims=claims)

    ticket = (
        Ticket.objects.select_related("event", "tier")
        .filter(echo_id=claims.get("tid"))
        .first()
    )
    if ticket is None:
        return VerificationResult(valid=False, code=UNKNOWN_TICKET, claims=claims)

    # Status before nonce: "this ticket is revoked/checked in" is the verdict
    # a door screen needs even when the token is also stale.
    if ticket.status != TicketStatus.ACTIVE:
        return VerificationResult(valid=False, code=TICKET_NOT_ACTIVE, ticket=ticket, claims=claims)

    if claims["typ"] == "credential":
        current = (
            TicketCredential.objects.filter(ticket=ticket).values_list("nonce", flat=True).first()
        )
        if not current or claims.get("cid") != current:
            return VerificationResult(valid=False, code=SUPERSEDED, ticket=ticket, claims=claims)

    return VerificationResult(valid=True, code=VALID, ticket=ticket, claims=claims)
