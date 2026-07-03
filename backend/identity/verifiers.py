"""
Platform identity-token verification (Phase 1 / W1).

Apple and Google identity tokens are verified server-side against the
provider's published JWKS — signature, issuer, audience, expiry. The
verifiers sit behind one interface so views don't care which provider ran
and tests can substitute fixture keys (`signing_key_for` is the seam).

Configuration gate (per the Phase 1 preconditions): if the expected
audiences (ECHO_APPLE_BUNDLE_IDS / ECHO_GOOGLE_CLIENT_IDS) are not set in
the environment, verification fails closed with VerifierNotConfigured —
the endpoint reports 503 rather than faking a pass.
"""

import logging
from dataclasses import dataclass

import jwt
from django.conf import settings

logger = logging.getLogger(__name__)

APPLE_JWKS_URL = "https://appleid.apple.com/auth/keys"
APPLE_ISSUER = "https://appleid.apple.com"
GOOGLE_JWKS_URL = "https://www.googleapis.com/oauth2/v3/certs"
GOOGLE_ISSUERS = ("https://accounts.google.com", "accounts.google.com")


class VerificationError(Exception):
    """The identity token is invalid (signature/issuer/audience/expiry)."""


class VerifierNotConfigured(Exception):
    """Provider credentials are not configured in this environment."""


@dataclass(frozen=True)
class VerifiedIdentity:
    provider: str  # "apple" | "google"
    subject: str
    email: str | None
    email_verified: bool
    name: str | None


class JWKSVerifier:
    """Shared JWKS verification. Subclasses pin provider constants."""

    provider: str
    jwks_url: str
    issuers: tuple[str, ...]
    audience_setting: str

    def __init__(self) -> None:
        self._jwks_client: jwt.PyJWKClient | None = None

    def audiences(self) -> list[str]:
        return getattr(settings, self.audience_setting)

    def signing_key_for(self, token: str):
        """Fetch the provider key matching the token's `kid`. Test seam."""
        if self._jwks_client is None:
            self._jwks_client = jwt.PyJWKClient(self.jwks_url, cache_keys=True, lifespan=3600)
        return self._jwks_client.get_signing_key_from_jwt(token).key

    def verify(self, token: str) -> VerifiedIdentity:
        audiences = self.audiences()
        if not audiences:
            raise VerifierNotConfigured(
                f"{self.audience_setting} is not configured; cannot verify {self.provider} tokens"
            )
        try:
            key = self.signing_key_for(token)
            claims = jwt.decode(
                token,
                key,
                algorithms=["RS256"],
                audience=audiences,
                options={"require": ["exp", "iat", "iss", "sub", "aud"]},
            )
        except jwt.PyJWTError as exc:
            raise VerificationError(f"{self.provider} token rejected: {exc}") from exc

        if claims["iss"] not in self.issuers:
            raise VerificationError(f"{self.provider} token has unexpected issuer {claims['iss']!r}")

        return VerifiedIdentity(
            provider=self.provider,
            subject=claims["sub"],
            email=claims.get("email"),
            # Apple sends email_verified as bool or the string "true"/"false".
            email_verified=str(claims.get("email_verified", "")).lower() == "true"
            or claims.get("email_verified") is True,
            name=self._name_from(claims),
        )

    def _name_from(self, claims: dict) -> str | None:
        return None


class AppleIdentityVerifier(JWKSVerifier):
    provider = "apple"
    jwks_url = APPLE_JWKS_URL
    issuers = (APPLE_ISSUER,)
    audience_setting = "ECHO_APPLE_BUNDLE_IDS"
    # Apple never puts the name in the identity token; the client forwards it
    # from the first-auth credential (views accept an optional `name`).


class GoogleIdentityVerifier(JWKSVerifier):
    provider = "google"
    jwks_url = GOOGLE_JWKS_URL
    issuers = GOOGLE_ISSUERS
    audience_setting = "ECHO_GOOGLE_CLIENT_IDS"

    def _name_from(self, claims: dict) -> str | None:
        return claims.get("name") or None


# Module-level instances so the JWKS client (and its key cache) is shared.
apple_verifier = AppleIdentityVerifier()
google_verifier = GoogleIdentityVerifier()
