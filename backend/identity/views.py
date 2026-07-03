"""
S-01 auth/session + S-02 me endpoints (Phase 1).

Response shape for every session-issuing endpoint:

    {
      "access_token": str, "token_type": "Bearer", "expires_in": int,
      "refresh_token": str,
      "user": MeDTO | null,          # null for guest sessions
      "is_new_user": bool            # login endpoints only
    }

None of these are idempotency-flagged in the locked registry — the
IdempotencyMixin is intentionally absent.
"""

import logging

from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from audit import service as audit
from core.envelope import error_response
from core.ratelimit import GuestIPRateThrottle, PublicIPRateThrottle, UserRateThrottle
from identity import services, tokens
from identity.serializers import (
    MAX_FLAGS,
    FlagsRequestSerializer,
    GuestSessionRequestSerializer,
    LogoutRequestSerializer,
    MeSerializer,
    MeUpdateSerializer,
    ProviderAuthRequestSerializer,
    RefreshRequestSerializer,
)
from identity.verifiers import (
    VerificationError,
    VerifierNotConfigured,
    apple_verifier,
    google_verifier,
)

logger = logging.getLogger(__name__)


def _session_payload(pair: tokens.TokenPair, user, *, is_new_user: bool | None = None) -> dict:
    payload = {
        "access_token": pair.access_token,
        "token_type": "Bearer",
        "expires_in": pair.expires_in,
        "refresh_token": pair.refresh_token,
        "user": MeSerializer(user).data if user is not None else None,
    }
    if is_new_user is not None:
        payload["is_new_user"] = is_new_user
    return payload


class ProviderAuthView(APIView):
    """Shared implementation for POST /v1/auth/apple and /v1/auth/google."""

    required_scope = "public"
    throttle_classes = [PublicIPRateThrottle]
    verifier = None  # set by subclass

    def post(self, request):
        serializer = ProviderAuthRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            identity = self.verifier.verify(data["identity_token"])
        except VerifierNotConfigured as exc:
            logger.warning("identity verifier not configured: %s", exc)
            return error_response(
                "auth_not_configured",
                "This sign-in provider is not configured in this environment.",
                status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        except VerificationError:
            return error_response(
                "invalid_identity_token",
                "The identity token could not be verified.",
                status.HTTP_401_UNAUTHORIZED,
            )

        pair, user, created = services.login_with_identity(
            identity, data["device"], fallback_name=data.get("name", ""), request=request
        )
        return Response(_session_payload(pair, user, is_new_user=created))


class AuthAppleView(ProviderAuthView):
    verifier = apple_verifier

    @extend_schema(operation_id="authApple", request=ProviderAuthRequestSerializer,
                   responses={200: OpenApiResponse(description="Session issued.")})
    def post(self, request):
        return super().post(request)


class AuthGoogleView(ProviderAuthView):
    verifier = google_verifier

    @extend_schema(operation_id="authGoogle", request=ProviderAuthRequestSerializer,
                   responses={200: OpenApiResponse(description="Session issued.")})
    def post(self, request):
        return super().post(request)


class GuestSessionView(APIView):
    required_scope = "public"
    throttle_classes = [GuestIPRateThrottle]

    @extend_schema(operation_id="guestSession", request=GuestSessionRequestSerializer,
                   responses={200: OpenApiResponse(description="Guest session issued.")})
    def post(self, request):
        serializer = GuestSessionRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        pair = services.start_guest_session(serializer.validated_data["device"], request=request)
        return Response(_session_payload(pair, None))


class AuthRefreshView(APIView):
    """POST /v1/auth/refresh — Phase 1 registry amendment (flagged): rotation
    (locked in W1) is unimplementable without a refresh endpoint."""

    required_scope = "public"
    throttle_classes = [PublicIPRateThrottle]

    @extend_schema(operation_id="authRefresh", request=RefreshRequestSerializer,
                   responses={200: OpenApiResponse(description="Rotated session pair.")})
    def post(self, request):
        serializer = RefreshRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            pair = tokens.rotate(serializer.validated_data["refresh_token"])
        except tokens.RefreshReuseDetected:
            record_hint = tokens.RefreshToken.objects.filter(
                token_hash=tokens.hash_refresh_secret(serializer.validated_data["refresh_token"])
            ).first()
            audit.record(
                "auth.refresh_reuse_detected",
                request=request,
                actor=record_hint.user if record_hint else None,
                device_id=record_hint.device_id if record_hint else None,
                metadata={"family_id": str(record_hint.family_id)} if record_hint else {},
            )
            return error_response(
                "refresh_reuse_detected",
                "This refresh token was already used; the session has been revoked.",
                status.HTTP_401_UNAUTHORIZED,
            )
        except tokens.TokenError:
            return error_response(
                "invalid_refresh_token",
                "The refresh token is invalid or expired.",
                status.HTTP_401_UNAUTHORIZED,
            )

        record = pair.refresh_record
        audit.record(
            "auth.refresh",
            request=request,
            actor=record.user,
            device_id=record.device_id,
            metadata={"family_id": str(record.family_id), "scope": record.scope},
        )
        return Response(_session_payload(pair, record.user))


class AuthLogoutView(APIView):
    """POST /v1/auth/logout — Phase 1 registry amendment (flagged): W1 locks
    revocation; without this endpoint logout would only delete client state."""

    required_scope = "guest"  # any authenticated session (user satisfies guest)
    throttle_classes = [UserRateThrottle]

    @extend_schema(operation_id="authLogout", request=LogoutRequestSerializer,
                   responses={200: OpenApiResponse(description="Session revoked.")})
    def post(self, request):
        serializer = LogoutRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        revoked = tokens.revoke_family(request.auth.family_id)

        # A supplied refresh token may belong to an older family on this
        # device (e.g. after a re-login race) — revoke that too, but only if
        # it is actually this caller's.
        presented = serializer.validated_data.get("refresh_token")
        if presented:
            record = tokens.RefreshToken.objects.filter(
                token_hash=tokens.hash_refresh_secret(presented)
            ).first()
            if record and str(record.family_id) != request.auth.family_id:
                owns_it = (record.user_id and str(record.user_id) == request.auth.user_id) or (
                    str(record.device_id) == request.auth.device_id
                )
                if owns_it:
                    revoked += tokens.revoke_family(record.family_id)

        audit.record(
            "auth.logout",
            request=request,
            metadata={"family_id": request.auth.family_id, "revoked_tokens": revoked},
        )
        return Response({"ok": True})


class MeView(APIView):
    required_scope = "user"
    throttle_classes = [UserRateThrottle]

    @extend_schema(operation_id="me", responses={200: MeSerializer})
    def get(self, request):
        return Response(MeSerializer(request.user).data)

    @extend_schema(operation_id="meUpdate", request=MeUpdateSerializer, responses={200: MeSerializer})
    def patch(self, request):
        serializer = MeUpdateSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        changed = sorted(serializer.validated_data.keys())
        serializer.save()
        audit.record(
            "me.updated",
            request=request,
            target=("user", request.user.echo_id),
            metadata={"fields": changed},  # field names only — no PII values
        )
        return Response(MeSerializer(request.user).data)


class MeFlagsView(APIView):
    """POST /v1/me/flags — merge semantics: scalar values set, null deletes."""

    required_scope = "user"
    throttle_classes = [UserRateThrottle]

    @extend_schema(operation_id="meFlags", request=FlagsRequestSerializer,
                   responses={200: OpenApiResponse(description="Updated flags map.")})
    def post(self, request):
        serializer = FlagsRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        incoming = serializer.validated_data["flags"]

        flags = dict(request.user.flags or {})
        for key, value in incoming.items():
            if value is None:
                flags.pop(key, None)
            else:
                flags[key] = value
        if len(flags) > MAX_FLAGS:
            return error_response(
                "flags_limit_exceeded",
                f"At most {MAX_FLAGS} flags may be set per account.",
                status.HTTP_400_BAD_REQUEST,
            )

        request.user.flags = flags
        request.user.save(update_fields=["flags", "updated_at"])
        audit.record(
            "me.flags_updated",
            request=request,
            target=("user", request.user.echo_id),
            metadata={"keys": sorted(incoming.keys())},
        )
        return Response({"flags": flags})
