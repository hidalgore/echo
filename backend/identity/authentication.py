"""
Bearer authentication (Phase 1 / W1).

Parses `Authorization: Bearer <access token>`, verifies the HS256 access
token, and attaches (user, EchoAuthContext) to the request. No header means
anonymous/public — scope enforcement is HasRequiredScope's job, not ours.
A present-but-invalid token is always a 401, never silently public.
"""

from dataclasses import dataclass

from django.contrib.auth.models import AnonymousUser
from drf_spectacular.extensions import OpenApiAuthenticationExtension
from rest_framework import exceptions
from rest_framework.authentication import BaseAuthentication, get_authorization_header

from identity.models import User
from identity.tokens import TokenError, verify_access_token


@dataclass(frozen=True)
class EchoAuthContext:
    """request.auth for authenticated calls: the token's verified claims."""

    scope: str  # "guest" | "user" | "door"
    device_id: str
    family_id: str
    user_id: str | None


class EchoTokenAuthentication(BaseAuthentication):
    keyword = "Bearer"

    def authenticate(self, request):
        header = get_authorization_header(request).split()
        if not header or header[0].lower() != self.keyword.lower().encode():
            return None
        if len(header) != 2:
            raise exceptions.AuthenticationFailed("Malformed Authorization header.")

        try:
            claims = verify_access_token(header[1].decode())
        except TokenError:
            raise exceptions.AuthenticationFailed("Invalid or expired access token.") from None

        user: User | AnonymousUser
        if claims.user_id is None:
            user = AnonymousUser()  # guest session: authenticated context, no account
        else:
            try:
                user = User.objects.get(pk=claims.user_id, is_active=True)
            except User.DoesNotExist:
                raise exceptions.AuthenticationFailed("Account is unavailable.") from None

        context = EchoAuthContext(
            scope=claims.scope,
            device_id=claims.device_id,
            family_id=claims.family_id,
            user_id=claims.user_id,
        )
        return (user, context)

    def authenticate_header(self, request):
        return self.keyword


class EchoTokenAuthenticationScheme(OpenApiAuthenticationExtension):
    """Documents the bearer scheme in the generated OpenAPI schema."""

    target_class = "identity.authentication.EchoTokenAuthentication"
    name = "bearerAuth"

    def get_security_definition(self, auto_schema):
        return {"type": "http", "scheme": "bearer", "bearerFormat": "JWT"}
