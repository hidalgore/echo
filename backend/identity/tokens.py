"""
Token service (Phase 1 / W1).

Access tokens: short-lived HS256 JWTs signed with ECHO_TOKEN_SIGNING_KEY,
carrying subject / device / scope / session-family claims. Stateless per
request, with one cache lookup for session revocation (logout must kill
in-flight access tokens, not just refresh tokens).

Refresh tokens: opaque 256-bit secrets, stored hashed (identity.models).
`rotate` enforces single-use: the presented token is retired and a child in
the same family is issued; presenting a retired token revokes the family.
"""

from dataclasses import dataclass
from datetime import timedelta

import jwt
from django.conf import settings
from django.core.cache import cache
from django.db import transaction
from django.utils import timezone

from identity.models import Device, RefreshToken, User, hash_refresh_secret, new_refresh_secret

ALGORITHM = "HS256"
ISSUER = "echo-api"
_REVOKED_FAMILY_CACHE_KEY = "echo:auth:revoked-family:{family_id}"


class TokenError(Exception):
    """Invalid, expired, revoked, or malformed token."""


class RefreshReuseDetected(TokenError):
    """A retired refresh token was presented; its family has been revoked."""


class _ReuseSignal(Exception):
    """Internal: reuse detected inside the rotation transaction. The family
    revocation must be written AFTER the transaction aborts (a write inside
    it would roll back with the raise), so this carries the family out."""

    def __init__(self, family_id):
        self.family_id = family_id


@dataclass(frozen=True)
class AccessClaims:
    user_id: str | None
    device_id: str
    scope: str
    family_id: str


@dataclass(frozen=True)
class TokenPair:
    access_token: str
    expires_in: int
    refresh_token: str
    refresh_record: RefreshToken


def _signing_key() -> str:
    return settings.ECHO_TOKEN_SIGNING_KEY


def mint_access_token(*, user: User | None, device: Device, scope: str, family_id) -> tuple[str, int]:
    ttl = settings.ECHO_ACCESS_TOKEN_TTL_SECONDS
    now = timezone.now()
    claims = {
        "iss": ISSUER,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(seconds=ttl)).timestamp()),
        "dev": str(device.echo_id),
        "scope": scope,
        "fam": str(family_id),
    }
    if user is not None:
        claims["sub"] = str(user.echo_id)
    return jwt.encode(claims, _signing_key(), algorithm=ALGORITHM), ttl


def verify_access_token(token: str) -> AccessClaims:
    try:
        claims = jwt.decode(
            token,
            _signing_key(),
            algorithms=[ALGORITHM],
            issuer=ISSUER,
            options={"require": ["exp", "iat", "iss", "dev", "scope", "fam"]},
        )
    except jwt.PyJWTError as exc:
        raise TokenError(f"invalid access token: {exc}") from exc

    if claims["scope"] not in ("guest", "user", "door"):
        # host/admin tokens do not exist yet; refuse rather than trust.
        raise TokenError(f"unsupported token scope: {claims['scope']!r}")
    if is_family_revoked(claims["fam"]):
        raise TokenError("session has been revoked")
    return AccessClaims(
        user_id=claims.get("sub"),
        device_id=claims["dev"],
        scope=claims["scope"],
        family_id=claims["fam"],
    )


def is_family_revoked(family_id: str) -> bool:
    return cache.get(_REVOKED_FAMILY_CACHE_KEY.format(family_id=family_id)) is not None


def _denylist_family(family_id) -> None:
    # Only needs to outlive the longest possible in-flight access token.
    cache.set(
        _REVOKED_FAMILY_CACHE_KEY.format(family_id=family_id),
        1,
        timeout=settings.ECHO_ACCESS_TOKEN_TTL_SECONDS + 60,
    )


def _refresh_ttl(scope: str) -> int:
    if scope == "guest":
        return settings.ECHO_GUEST_REFRESH_TTL_SECONDS
    return settings.ECHO_REFRESH_TOKEN_TTL_SECONDS


def issue_pair(*, user: User | None, device: Device, scope: str) -> TokenPair:
    """Start a new session family: fresh refresh token + matching access token."""
    secret = new_refresh_secret()
    record = RefreshToken.objects.create(
        token_hash=hash_refresh_secret(secret),
        user=user,
        device=device,
        scope=scope,
        expires_at=timezone.now() + timedelta(seconds=_refresh_ttl(scope)),
    )
    access, ttl = mint_access_token(user=user, device=device, scope=scope, family_id=record.family_id)
    return TokenPair(access_token=access, expires_in=ttl, refresh_token=secret, refresh_record=record)


def rotate(presented_secret: str) -> TokenPair:
    """Exchange a live refresh token for a rotated pair (single use).

    Raises RefreshReuseDetected (family revoked) if the token was already
    rotated or revoked; TokenError if unknown or expired.
    """
    token_hash = hash_refresh_secret(presented_secret)
    now = timezone.now()
    try:
        with transaction.atomic():
            try:
                record = RefreshToken.objects.select_for_update().get(token_hash=token_hash)
            except RefreshToken.DoesNotExist:
                raise TokenError("unknown refresh token") from None

            if record.revoked_at is not None:
                raise _ReuseSignal(record.family_id)
            if record.expires_at <= now:
                raise TokenError("refresh token expired")

            record.revoked_at = now
            record.last_used_at = now
            record.save(update_fields=["revoked_at", "last_used_at", "updated_at"])

            secret = new_refresh_secret()
            child = RefreshToken.objects.create(
                token_hash=hash_refresh_secret(secret),
                user=record.user,
                device=record.device,
                scope=record.scope,
                family_id=record.family_id,
                parent=record,
                expires_at=now + timedelta(seconds=_refresh_ttl(record.scope)),
            )
    except _ReuseSignal as signal:
        revoke_family(signal.family_id)
        raise RefreshReuseDetected("refresh token reuse detected; session family revoked") from None
    access, ttl = mint_access_token(
        user=child.user, device=child.device, scope=child.scope, family_id=child.family_id
    )
    return TokenPair(access_token=access, expires_in=ttl, refresh_token=secret, refresh_record=child)


def revoke_family(family_id) -> int:
    """Revoke every live token in a session family and denylist its access
    tokens. Returns the number of refresh rows revoked."""
    revoked = RefreshToken.objects.filter(family_id=family_id, revoked_at__isnull=True).update(
        revoked_at=timezone.now()
    )
    _denylist_family(family_id)
    return revoked


def revoke_all_for_device(device: Device) -> int:
    """Revoke every live session on a device (used when a different account
    signs in on the same install)."""
    families = RefreshToken.objects.filter(device=device, revoked_at__isnull=True).values_list(
        "family_id", flat=True
    )
    count = 0
    for family_id in set(families):
        count += revoke_family(family_id)
    return count
