"""
S-07 door-mode endpoints (Phase 5).

- GET  /v1/door/sessions/:sessionId                (door) — session state
- POST /v1/door/sessions/:sessionId/pause          (door) — flagged amendment
- POST /v1/door/sessions/:sessionId/resume         (door) — flagged amendment;
  6-digit passcode validated server-side (hashed at rest, never logged)
- POST /v1/door/sessions/:sessionId/offline-bundle (door) — pre-signed
  credential cache (door.bundles)
- POST /v1/door/scans     (door, ✅ idem) — the <500ms verdict path
- POST /v1/door/reconcile (door, ✅ idem) — offline-ledger merge
- POST /v1/door/purchase/intents + /confirm, GET /v1/door/purchase/intents/:id
  (door, ✅ idem) — walk-up sales riding the Phase 3 checkout engine

Device trust: every route resolves the session through the bearer token's
device binding — a session addressed with another device's token reads as
absent (envelope 404, the owner-only pattern), never 403. Scope enforcement
is the platform's (`required_scope = "door"`; user tokens don't satisfy it
and door tokens don't satisfy user routes).
"""

import logging
import uuid
from datetime import timedelta

from django.conf import settings
from django.contrib.auth.hashers import check_password
from django.db import transaction
from django.utils import timezone
from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import exceptions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from audit import service as audit
from checkout.models import CheckoutIntent
from checkout.serializers import CheckoutIntentSerializer
from checkout.views import build_intent_response, confirm_intent_response
from core.envelope import error_response
from core.idempotency import IdempotencyMixin
from core.ratelimit import DoorRateThrottle
from door import bundles, verdicts
from door.models import DoorSession, DoorSessionStatus
from door.serializers import (
    DoorPurchaseConfirmRequestSerializer,
    DoorPurchaseIntentRequestSerializer,
    DoorReconcileRequestSerializer,
    DoorResumeRequestSerializer,
    DoorScanRequestSerializer,
    DoorScanResultSerializer,
    DoorSessionSerializer,
)
from door.throttling import DoorPurchaseThrottle
from identity.models import User
from tickets import credentials

logger = logging.getLogger(__name__)


def _get_bound_session_or_404(request, session_id) -> DoorSession:
    """Device-trust fetch: malformed ids and other devices' sessions read as
    absent — envelope 404, never 403 (the platform owner-only pattern)."""
    try:
        session_uuid = uuid.UUID(str(session_id))
    except ValueError:
        raise exceptions.NotFound("Door session not found.") from None
    try:
        return DoorSession.objects.select_related("event").get(
            echo_id=session_uuid, device__echo_id=request.auth.device_id
        )
    except DoorSession.DoesNotExist:
        raise exceptions.NotFound("Door session not found.") from None


def _refuse_unusable(session: DoorSession) -> Response | None:
    """Sessions must be live to scan/bundle/sell. GET stays readable and
    reconcile stays mergeable in any state (ledgers arrive after closing)."""
    if session.expired:
        return error_response(
            "door_session_expired",
            "This door session has expired. Provision a new session.",
            status.HTTP_403_FORBIDDEN,
        )
    if session.status == DoorSessionStatus.CLOSED:
        return error_response(
            "door_session_closed", "This door session is closed.", status.HTTP_409_CONFLICT
        )
    if session.status == DoorSessionStatus.PAUSED:
        return error_response(
            "door_session_paused",
            "This door session is paused. Resume with the passcode.",
            status.HTTP_409_CONFLICT,
        )
    return None


def _credentials_not_configured() -> Response:
    return error_response(
        "credentials_not_configured",
        "Credentials are not configured for this environment.",
        status.HTTP_503_SERVICE_UNAVAILABLE,
    )


class DoorSessionDetailView(APIView):
    """GET /v1/door/sessions/:sessionId — session state (readable in every
    lifecycle state; the device needs truth to render pause/closed UIs)."""

    required_scope = "door"
    throttle_classes = [DoorRateThrottle]

    @extend_schema(operation_id="doorSession", responses={200: DoorSessionSerializer})
    def get(self, request, session_id):
        session = _get_bound_session_or_404(request, session_id)
        return Response(DoorSessionSerializer(session).data)


class DoorSessionPauseView(APIView):
    """POST /v1/door/sessions/:sessionId/pause — flagged S-07 amendment.

    Pausing needs no passcode (any staffer must be able to stop entry
    instantly); resuming is what the passcode protects."""

    required_scope = "door"
    throttle_classes = [DoorRateThrottle]

    @extend_schema(
        operation_id="doorSessionPause", request=None, responses={200: DoorSessionSerializer}
    )
    def post(self, request, session_id):
        session = _get_bound_session_or_404(request, session_id)
        if session.expired:
            return _refuse_unusable(session)
        if session.status == DoorSessionStatus.CLOSED:
            return _refuse_unusable(session)

        updated = DoorSession.objects.filter(
            pk=session.pk, status=DoorSessionStatus.ACTIVE
        ).update(status=DoorSessionStatus.PAUSED, updated_at=timezone.now())
        if updated:
            session.status = DoorSessionStatus.PAUSED
            audit.record(
                "door.session_paused",
                request=request,
                target=("door_session", str(session.echo_id)),
                metadata={"event_id": str(session.event_id)},
            )
        # Already paused replays are a no-op success — the door is stopped,
        # which is what the caller asked for.
        return Response(DoorSessionSerializer(session).data)


class DoorSessionResumeView(APIView):
    """POST /v1/door/sessions/:sessionId/resume — flagged S-07 amendment.

    The 6-digit passcode is validated server-side against the stored hash;
    consecutive failures lock the resume path (attempts audited, the
    presented code never logged or echoed)."""

    required_scope = "door"
    throttle_classes = [DoorRateThrottle]

    @extend_schema(
        operation_id="doorSessionResume",
        request=DoorResumeRequestSerializer,
        responses={200: DoorSessionSerializer},
    )
    def post(self, request, session_id):
        serializer = DoorResumeRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        passcode = serializer.validated_data["passcode"]

        with transaction.atomic():
            session = _get_bound_session_or_404(request, session_id)
            session = DoorSession.objects.select_for_update().select_related("event").get(
                pk=session.pk
            )
            now = timezone.now()

            if session.expired:
                return _refuse_unusable(session)
            if session.status == DoorSessionStatus.CLOSED:
                return _refuse_unusable(session)

            if session.passcode_locked_until and session.passcode_locked_until > now:
                return error_response(
                    "door_passcode_locked",
                    "Too many failed passcode attempts. Try again later.",
                    status.HTTP_403_FORBIDDEN,
                )

            if not check_password(passcode, session.passcode_hash):
                session.passcode_failed_attempts += 1
                locked = (
                    session.passcode_failed_attempts
                    >= settings.ECHO_DOOR_PASSCODE_MAX_ATTEMPTS
                )
                if locked:
                    session.passcode_locked_until = now + timedelta(
                        seconds=settings.ECHO_DOOR_PASSCODE_LOCKOUT_SECONDS
                    )
                    session.passcode_failed_attempts = 0
                session.save(
                    update_fields=[
                        "passcode_failed_attempts",
                        "passcode_locked_until",
                        "updated_at",
                    ]
                )
                audit.record(
                    "door.passcode_failed",
                    request=request,
                    target=("door_session", str(session.echo_id)),
                    metadata={"event_id": str(session.event_id), "locked": locked},
                )
                if locked:
                    return error_response(
                        "door_passcode_locked",
                        "Too many failed passcode attempts. Try again later.",
                        status.HTTP_403_FORBIDDEN,
                    )
                return error_response(
                    "door_passcode_invalid", "Incorrect passcode.", status.HTTP_403_FORBIDDEN
                )

            session.status = DoorSessionStatus.ACTIVE
            session.passcode_failed_attempts = 0
            session.passcode_locked_until = None
            session.save(
                update_fields=[
                    "status",
                    "passcode_failed_attempts",
                    "passcode_locked_until",
                    "updated_at",
                ]
            )
        audit.record(
            "door.session_resumed",
            request=request,
            target=("door_session", str(session.echo_id)),
            metadata={"event_id": str(session.event_id)},
        )
        return Response(DoorSessionSerializer(session).data)


class DoorOfflineBundleView(APIView):
    """POST /v1/door/sessions/:sessionId/offline-bundle — the pre-signed
    credential cache (door.bundles documents exactly what offline relaxes)."""

    required_scope = "door"
    throttle_classes = [DoorRateThrottle]

    @extend_schema(
        operation_id="doorOfflineBundle",
        request=None,
        responses={200: OpenApiResponse(description="Versioned offline verification bundle.")},
    )
    def post(self, request, session_id):
        session = _get_bound_session_or_404(request, session_id)
        # Paused doors may still prefetch (staff prepare during a pause);
        # closed/expired sessions may not.
        if session.expired or session.status == DoorSessionStatus.CLOSED:
            return _refuse_unusable(session)

        try:
            bundle = bundles.build_offline_bundle(session)
        except credentials.CredentialSigningNotConfigured:
            return _credentials_not_configured()

        audit.record(
            "door.bundle_generated",
            request=request,
            target=("door_session", str(session.echo_id)),
            metadata={
                "event_id": str(session.event_id),
                "format_version": bundle["format_version"],
                "admissions": len(bundle["admissions"]),
            },
        )
        return Response(bundle)


def _result_body(verdict: verdicts.DoorVerdict) -> dict:
    """Locked DoorScanResultDTO body (+ flagged age_badge). failure_reason is
    omitted, not null, on clean approvals — mock-adapter parity."""
    body = {
        "approved": verdict.approved,
        "ticket_status": verdict.ticket_status,
        "verification_state": verdict.verification_state,
        "tier_id": verdict.tier_id,
        "authorized_zones": verdict.authorized_zones,
        "age_badge": verdict.age_badge,
    }
    if verdict.failure_reason:
        body["failure_reason"] = verdict.failure_reason
    return body


class DoorScanView(IdempotencyMixin, APIView):
    """POST /v1/door/scans — the locked <500ms verdict path (indexed lookups
    + in-process signature verification only; see door.verdicts)."""

    required_scope = "door"
    idempotency_required = True
    throttle_classes = [DoorRateThrottle]

    @extend_schema(
        operation_id="doorScans",
        request=DoorScanRequestSerializer,
        responses={200: DoorScanResultSerializer},
    )
    def post(self, request):
        serializer = DoorScanRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payload = serializer.validated_data

        session = _get_bound_session_or_404(request, payload["session_id"])
        blocked = _refuse_unusable(session)
        if blocked is not None:
            return blocked

        try:
            verdict = verdicts.record_scan(
                session,
                _credential_payload(payload),
                scanned_at=payload["scanned_at"],
                offline=payload["offline"],
            )
        except credentials.CredentialSigningNotConfigured:
            return _credentials_not_configured()

        audit.record(
            "door.scan_recorded",
            request=request,
            target=("ticket", str(verdict.ticket.echo_id)) if verdict.ticket else None,
            metadata={
                "door_session_id": str(session.echo_id),
                "event_id": str(session.event_id),
                "approved": verdict.approved,
                "verification_state": verdict.verification_state,
                "refusal_code": verdict.refusal_code,
                "offline": payload["offline"],
            },
        )
        return Response(_result_body(verdict))


class DoorReconcileView(IdempotencyMixin, APIView):
    """POST /v1/door/reconcile — merge an offline ledger to server truth.

    Mergeable in every session state (ledgers arrive after pause/close, and
    even after expiry — refusing the merge would discard entry records).
    Duplicates resolve by server timestamp; entries whose server verdict is a
    refusal are conflicts (the device likely admitted the guest offline) and
    are audited individually."""

    required_scope = "door"
    idempotency_required = True
    throttle_classes = [DoorRateThrottle]

    @extend_schema(
        operation_id="doorReconcile",
        request=DoorReconcileRequestSerializer,
        responses={200: OpenApiResponse(description="Ledger merge summary.")},
    )
    def post(self, request):
        serializer = DoorReconcileRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        entries = serializer.validated_data["scans"]

        sessions: dict[uuid.UUID, DoorSession] = {}
        results = []
        merged = replayed = conflicts = rejected = 0

        try:
            for entry in entries:
                session_uuid = entry["session_id"]
                if session_uuid not in sessions:
                    try:
                        sessions[session_uuid] = _get_bound_session_or_404(request, session_uuid)
                    except exceptions.NotFound:
                        sessions[session_uuid] = None  # type: ignore[assignment]
                session = sessions[session_uuid]
                if session is None:
                    rejected += 1
                    results.append(
                        {
                            "scanned_at": entry["scanned_at"].isoformat(),
                            "merged": False,
                            "reason": "unknown_session",
                        }
                    )
                    continue

                verdict, was_replay = verdicts.record_reconciled_scan(
                    session, _credential_payload(entry), scanned_at=entry["scanned_at"]
                )
                if was_replay:
                    replayed += 1
                    results.append(
                        {
                            "scanned_at": entry["scanned_at"].isoformat(),
                            "merged": False,
                            "reason": "already_merged",
                        }
                    )
                    continue

                merged += 1
                if not verdict.approved:
                    conflicts += 1
                    audit.record(
                        "door.reconcile_conflict",
                        request=request,
                        target=(
                            ("ticket", str(verdict.ticket.echo_id)) if verdict.ticket else None
                        ),
                        metadata={
                            "door_session_id": str(session.echo_id),
                            "event_id": str(session.event_id),
                            "verification_state": verdict.verification_state,
                            "refusal_code": verdict.refusal_code,
                            "scanned_at": entry["scanned_at"].isoformat(),
                        },
                    )
                results.append(
                    {
                        "scanned_at": entry["scanned_at"].isoformat(),
                        "merged": True,
                        "approved": verdict.approved,
                        "verification_state": verdict.verification_state,
                    }
                )
        except credentials.CredentialSigningNotConfigured:
            return _credentials_not_configured()

        audit.record(
            "door.reconcile_merged",
            request=request,
            metadata={
                "received": len(entries),
                "merged": merged,
                "replayed": replayed,
                "conflicts": conflicts,
                "rejected": rejected,
            },
        )
        return Response(
            {
                "ok": True,
                "received": len(entries),
                "merged": merged,
                "replayed": replayed,
                "conflicts": conflicts,
                "rejected": rejected,
                "results": results,
            }
        )


def _credential_payload(entry: dict) -> dict:
    return {
        "ticket_id": entry.get("ticket_id"),
        "nfc_credential_id": entry.get("nfc_credential_id"),
        "qr_payload": entry.get("qr_payload"),
    }


def _session_walkup_user(session: DoorSession) -> User:
    """The session's walk-up buyer identity, created lazily under the session
    row lock (two concurrent first purchases must not mint two users)."""
    with transaction.atomic():
        locked = DoorSession.objects.select_for_update().get(pk=session.pk)
        if locked.walkup_user_id is None:
            locked.walkup_user = User.objects.create_user(
                email=None, name=f"Door walk-up ({locked.echo_id})"
            )
            locked.save(update_fields=["walkup_user", "updated_at"])
        session.walkup_user = locked.walkup_user
        session.walkup_user_id = locked.walkup_user_id
        return locked.walkup_user


class DoorPurchaseIntentView(IdempotencyMixin, APIView):
    """POST /v1/door/purchase/intents — walk-up sale riding the Phase 3
    engine (pricing, atomic hold, age gate — identical by construction)."""

    required_scope = "door"
    idempotency_required = True
    throttle_classes = [DoorRateThrottle, DoorPurchaseThrottle]

    @extend_schema(
        operation_id="doorPurchaseIntent",
        request=DoorPurchaseIntentRequestSerializer,
        responses={201: CheckoutIntentSerializer},
    )
    def post(self, request):
        serializer = DoorPurchaseIntentRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payload = serializer.validated_data

        session = _get_bound_session_or_404(request, payload["session_id"])
        blocked = _refuse_unusable(session)
        if blocked is not None:
            return blocked

        # A door sells its own event only.
        if payload["event_id"] != session.event.echo_id:
            return error_response(
                "wrong_event",
                "This door session cannot sell tickets for another event.",
                status.HTTP_409_CONFLICT,
            )

        buyer = _session_walkup_user(session)
        return build_intent_response(
            request,
            buyer=buyer,
            audit_action="door.purchase_intent_created",
            extra_audit_metadata={"door_session_id": str(session.echo_id)},
        )


class DoorPurchaseConfirmView(IdempotencyMixin, APIView):
    """POST /v1/door/purchase/confirm — Stripe charge + issuance via the
    shared confirm engine. The age gate is unchanged: intents on age-gated
    events sit in requires_verification and refuse confirmation until
    Phase 6 lands — at the door exactly as in-app (locked)."""

    required_scope = "door"
    idempotency_required = True
    throttle_classes = [DoorRateThrottle, DoorPurchaseThrottle]

    @extend_schema(
        operation_id="doorPurchaseConfirm",
        request=DoorPurchaseConfirmRequestSerializer,
        responses={201: OpenApiResponse(description="Payment confirmed; tickets issued.")},
    )
    def post(self, request):
        serializer = DoorPurchaseConfirmRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payload = serializer.validated_data

        session = _get_bound_session_or_404(request, payload["session_id"])
        blocked = _refuse_unusable(session)
        if blocked is not None:
            return blocked

        intent = _get_session_intent_or_404(payload["intent_id"], session)
        return confirm_intent_response(
            request,
            intent=intent,
            payment_method=payload["payment_method"],
            extra_audit_metadata={"door_session_id": str(session.echo_id)},
        )


class DoorPurchaseIntentStatusView(APIView):
    """GET /v1/door/purchase/intents/:id — poll a walk-up intent. Bound by
    device trust: only intents belonging to walk-up users of this device's
    sessions resolve; anything else reads as absent."""

    required_scope = "door"
    throttle_classes = [DoorRateThrottle]

    @extend_schema(operation_id="doorPurchaseIntentStatus", responses={200: CheckoutIntentSerializer})
    def get(self, request, intent_id):
        try:
            intent_uuid = uuid.UUID(str(intent_id))
        except ValueError:
            raise exceptions.NotFound("Checkout intent not found.") from None
        intent = (
            CheckoutIntent.objects.select_related("event", "tier", "user")
            .filter(
                echo_id=intent_uuid,
                user__door_sessions__device__echo_id=request.auth.device_id,
            )
            .first()
        )
        if intent is None:
            raise exceptions.NotFound("Checkout intent not found.")
        return Response(CheckoutIntentSerializer(intent).data)


def _get_session_intent_or_404(intent_id, session: DoorSession) -> CheckoutIntent:
    """Owner-only fetch scoped to this session's walk-up buyer."""
    if session.walkup_user_id is None:
        raise exceptions.NotFound("Checkout intent not found.")
    try:
        return CheckoutIntent.objects.select_related("event", "tier", "user").get(
            echo_id=intent_id, user_id=session.walkup_user_id
        )
    except CheckoutIntent.DoesNotExist:
        raise exceptions.NotFound("Checkout intent not found.") from None
