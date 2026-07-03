"""
Idempotency-Key persistence + replay (locked platform rule).

Views opt in with `idempotency_required = True` (set on the endpoints the
contract flags: checkout intents, payment confirm, circle create/payments,
door scans/reconcile/purchase). The client refuses those calls without a key;
the server independently enforces the same rule and replays stored results.

Error codes match the client's local rejection (`idempotency_key_required`)
so behavior is identical whichever side catches it first.
"""

import hashlib
from datetime import timedelta

from django.conf import settings
from django.db import IntegrityError, transaction
from django.utils import timezone
from rest_framework.response import Response

from core.envelope import error_response
from core.models import IdempotencyRecord

IDEMPOTENCY_HEADER = "Idempotency-Key"
REPLAY_HEADER = "Idempotency-Replayed"


def _request_hash(request) -> str:
    payload = b"|".join(
        [request.method.encode(), request.path.encode(), request.body or b""]
    )
    return hashlib.sha256(payload).hexdigest()


def _scope_for(request) -> str:
    return f"{request.method} {request.path}"


class IdempotencyMixin:
    """APIView mixin: enforce, persist, and replay idempotent mutations.

    Must precede APIView in the MRO. Only unsafe methods are gated; GETs on
    the same view pass through untouched.
    """

    idempotency_required = False

    def dispatch(self, request, *args, **kwargs):
        if not self.idempotency_required or request.method in ("GET", "HEAD", "OPTIONS"):
            return super().dispatch(request, *args, **kwargs)

        key = request.headers.get(IDEMPOTENCY_HEADER, "").strip()
        if not key:
            return self._finalize_error(
                request,
                error_response(
                    "idempotency_key_required",
                    f"{request.method} {request.path} requires an {IDEMPOTENCY_HEADER} header.",
                    400,
                ),
            )
        if len(key) > settings.IDEMPOTENCY_MAX_KEY_LENGTH:
            return self._finalize_error(
                request,
                error_response(
                    "idempotency_key_invalid",
                    f"{IDEMPOTENCY_HEADER} must be at most "
                    f"{settings.IDEMPOTENCY_MAX_KEY_LENGTH} characters.",
                    400,
                ),
            )

        scope = _scope_for(request)
        request_hash = _request_hash(request)
        now = timezone.now()

        record, outcome = self._claim(key, scope, request_hash, now)
        if outcome == "replay":
            response = Response(record.response_body, status=record.response_status)
            response[REPLAY_HEADER] = "true"
            return self._finalize_error(request, response)
        if outcome == "in_flight":
            return self._finalize_error(
                request,
                error_response(
                    "idempotency_in_flight",
                    "A request with this idempotency key is still being processed.",
                    409,
                ),
            )
        if outcome == "reuse":
            return self._finalize_error(
                request,
                error_response(
                    "idempotency_key_reuse",
                    "This idempotency key was already used with a different request.",
                    409,
                ),
            )

        response = super().dispatch(request, *args, **kwargs)

        # Persist replayable outcomes. 5xx results are NOT stored: the client
        # retries them with the same key and deserves a fresh attempt.
        if response.status_code < 500:
            IdempotencyRecord.objects.filter(pk=record.pk).update(
                response_status=response.status_code,
                response_body=getattr(response, "data", None),
            )
        else:
            IdempotencyRecord.objects.filter(pk=record.pk).delete()
        return response

    def _claim(self, key: str, scope: str, request_hash: str, now):
        """Atomically claim the (key, scope) slot. Returns (record, outcome)
        where outcome is 'claimed' | 'replay' | 'in_flight' | 'reuse'."""
        ttl = timedelta(seconds=settings.IDEMPOTENCY_TTL_SECONDS)
        try:
            with transaction.atomic():
                record = IdempotencyRecord.objects.create(
                    key=key,
                    scope=scope,
                    request_hash=request_hash,
                    expires_at=now + ttl,
                )
                return record, "claimed"
        except IntegrityError:
            existing = IdempotencyRecord.objects.get(key=key, scope=scope)
            if existing.expires_at <= now:
                # Expired slot: purge and re-claim once.
                existing.delete()
                return self._claim(key, scope, request_hash, now)
            if existing.request_hash != request_hash:
                return existing, "reuse"
            if existing.response_status is None:
                return existing, "in_flight"
            return existing, "replay"

    def _finalize_error(self, request, response):
        """Render a Response produced outside the normal DRF dispatch path."""
        if isinstance(response, Response) and getattr(response, "accepted_renderer", None) is None:
            response.accepted_renderer = self.renderer_classes[0]()
            response.accepted_media_type = response.accepted_renderer.media_type
            response.renderer_context = {"request": request, "view": self}
        return response
