"""
Identity models (Phase 1 / W1).

- `User`: swapped-in AUTH_USER_MODEL on a UUIDv7 pk. No password auth — the
  only sign-in paths are Apple / Google identity tokens (S-01); the inherited
  password field is always unusable.
- `Device`: one row per app install (client-minted `install_id`). Guest
  sessions create devices with no user; sign-in attaches the user.
- `RefreshToken`: rotating refresh credentials stored as SHA-256 hashes.
  Rotation invalidates the predecessor; presenting an already-rotated token
  is treated as theft and revokes the whole family (reuse detection).
"""

import hashlib
import secrets

from django.contrib.auth.base_user import AbstractBaseUser, BaseUserManager
from django.db import models

from core.ids import new_public_id, uuid7
from core.models import EchoIdModel

PUBLIC_ID_PREFIX_USER = "US"


def _default_user_public_id() -> str:
    return new_public_id(PUBLIC_ID_PREFIX_USER)


class UserManager(BaseUserManager):
    def create_user(self, email: str | None = None, **fields):
        user = self.model(email=self.normalize_email(email) if email else None, **fields)
        user.set_unusable_password()
        user.save(using=self._db)
        return user


class User(EchoIdModel, AbstractBaseUser):
    """ECHO account. Created on first Apple/Google sign-in, never via password."""

    public_id = models.CharField(max_length=32, unique=True, default=_default_user_public_id)
    # Providers may withhold email on repeat auths; subject ids below are the
    # stable lookup keys. NULL (not "") when absent so unique-when-present
    # holds — hence the DJ001 exemptions.
    email = models.EmailField(null=True, unique=True)  # noqa: DJ001
    name = models.CharField(max_length=200, blank=True, default="")
    phone = models.CharField(max_length=32, blank=True, default="")
    avatar_url = models.URLField(blank=True, default="")
    # FTUE / feature flags set via POST /v1/me/flags (S-02).
    flags = models.JSONField(default=dict, blank=True)

    apple_sub = models.CharField(max_length=255, null=True, unique=True)  # noqa: DJ001
    google_sub = models.CharField(max_length=255, null=True, unique=True)  # noqa: DJ001

    is_active = models.BooleanField(default=True)

    USERNAME_FIELD = "email"
    objects = UserManager()

    def __str__(self) -> str:
        return f"User({self.public_id})"


class Device(EchoIdModel):
    """One row per app install. `install_id` is minted client-side and stable
    for the life of the install; `user` is the install's current account
    (null while the install is guest-only)."""

    PLATFORMS = (("ios", "ios"), ("android", "android"), ("web", "web"))

    install_id = models.CharField(max_length=64, unique=True)
    user = models.ForeignKey(User, null=True, on_delete=models.CASCADE, related_name="devices")
    platform = models.CharField(max_length=16, choices=PLATFORMS)
    os_version = models.CharField(max_length=64, blank=True, default="")
    model = models.CharField(max_length=128, blank=True, default="")
    app_version = models.CharField(max_length=32, blank=True, default="")
    last_seen_at = models.DateTimeField(null=True)

    def __str__(self) -> str:
        return f"Device({self.platform}, {self.install_id[:8]}…)"


def new_refresh_secret() -> str:
    """Mint the client-held refresh secret (256 bits, urlsafe)."""
    return secrets.token_urlsafe(32)


def hash_refresh_secret(secret: str) -> str:
    return hashlib.sha256(secret.encode()).hexdigest()


class RefreshToken(EchoIdModel):
    """Server side of a refresh credential. Only the SHA-256 of the secret is
    stored; the family id groups a rotation chain so reuse detection can kill
    every descendant at once. `user` is null for guest sessions."""

    token_hash = models.CharField(max_length=64, unique=True)
    user = models.ForeignKey(User, null=True, on_delete=models.CASCADE, related_name="refresh_tokens")
    device = models.ForeignKey(Device, on_delete=models.CASCADE, related_name="refresh_tokens")
    scope = models.CharField(max_length=16)  # "user" | "guest" (host/door land later phases)
    family_id = models.UUIDField(default=uuid7, db_index=True)
    parent = models.ForeignKey("self", null=True, on_delete=models.SET_NULL, related_name="children")
    expires_at = models.DateTimeField(db_index=True)
    revoked_at = models.DateTimeField(null=True)
    last_used_at = models.DateTimeField(null=True)

    def __str__(self) -> str:
        return f"RefreshToken({self.scope}, family={self.family_id})"
