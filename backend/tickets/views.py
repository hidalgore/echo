"""
S-06 ticket / credential endpoints (Phase 4 / W2).

- GET  /v1/tickets/:ticketId            (user, owner-only) — locked TicketDTO
- GET  /v1/tickets/:ticketId/status     (user, owner-only) — status poll
- GET  /v1/tickets/:ticketId/credential (user, owner-only) — current rotating
  credential (re-served inside its window, minted when stale)
- POST /v1/tickets/:ticketId/refresh    (user, owner-only) — force rotation;
  NOT idempotency-flagged in the locked registry (rotation is the point:
  a replayed refresh minting again is correct, not a duplicate hazard)
- GET  /v1/wallet                       (user) — the buyer's admissions,
  cursor-paginated, one row per admission + intent linkage (the flagged
  Phase 4 TicketDTO amendment; the client groups rows into purchase cards)

Owner-only follows the Phase 3 pattern: someone else's ticket (and malformed
ids) read as absent — envelope 404, never 403. Credential surfaces throttle
per (identity, ticket) on top of the user bucket, and fail closed with 503
`credentials_not_configured` when the signing key is missing.
"""

import uuid

from drf_spectacular.utils import extend_schema
from rest_framework import exceptions, generics, status
from rest_framework.response import Response
from rest_framework.views import APIView

from core.envelope import error_response
from core.pagination import EchoCursorPagination
from core.ratelimit import UserRateThrottle
from tickets import credentials
from tickets.models import Ticket
from tickets.serializers import CredentialSerializer, TicketSerializer, TicketStatusSerializer
from tickets.throttling import CredentialThrottle


def _get_owned_ticket_or_404(request, ticket_id) -> Ticket:
    """Owner-only fetch; someone else's ticket reads as absent, never 403."""
    try:
        ticket_uuid = uuid.UUID(str(ticket_id))
    except ValueError:
        raise exceptions.NotFound("Ticket not found.") from None
    try:
        return Ticket.objects.select_related("event", "tier").get(
            echo_id=ticket_uuid, user=request.user
        )
    except Ticket.DoesNotExist:
        raise exceptions.NotFound("Ticket not found.") from None


def _minted_credential_response(request, ticket_id, mint):
    """Shared GET-credential / POST-refresh body: owner fetch, fail-closed
    seam, live-status gate, locked CredentialDTO out."""
    ticket = _get_owned_ticket_or_404(request, ticket_id)
    try:
        minted = mint(ticket)
    except credentials.CredentialSigningNotConfigured:
        return error_response(
            "credentials_not_configured",
            "Credentials are not configured for this environment.",
            status.HTTP_503_SERVICE_UNAVAILABLE,
        )
    except credentials.TicketNotActive as exc:
        return error_response(
            "ticket_not_active",
            f"This ticket is {exc.status.replace('_', ' ')} and can no longer present a credential.",
            status.HTTP_409_CONFLICT,
        )
    return Response(CredentialSerializer(minted).data)


class TicketDetailView(APIView):
    """GET /v1/tickets/:ticketId — one admission (owner-only)."""

    required_scope = "user"
    throttle_classes = [UserRateThrottle]

    @extend_schema(operation_id="ticket", responses={200: TicketSerializer})
    def get(self, request, ticket_id):
        ticket = _get_owned_ticket_or_404(request, ticket_id)
        return Response(TicketSerializer(ticket).data)


class TicketStatusView(APIView):
    """GET /v1/tickets/:ticketId/status — lightweight status poll (owner-only)."""

    required_scope = "user"
    throttle_classes = [UserRateThrottle]

    @extend_schema(operation_id="ticketStatus", responses={200: TicketStatusSerializer})
    def get(self, request, ticket_id):
        ticket = _get_owned_ticket_or_404(request, ticket_id)
        return Response(TicketStatusSerializer(ticket).data)


class TicketCredentialView(APIView):
    """GET /v1/tickets/:ticketId/credential — the current rotating credential."""

    required_scope = "user"
    throttle_classes = [UserRateThrottle, CredentialThrottle]

    @extend_schema(operation_id="ticketCredential", responses={200: CredentialSerializer})
    def get(self, request, ticket_id):
        return _minted_credential_response(
            request, ticket_id, lambda ticket: credentials.issue_credential(ticket, request=request)
        )


class TicketRefreshView(APIView):
    """POST /v1/tickets/:ticketId/refresh — force a rotation."""

    required_scope = "user"
    throttle_classes = [UserRateThrottle, CredentialThrottle]

    @extend_schema(operation_id="ticketRefresh", request=None, responses={200: CredentialSerializer})
    def post(self, request, ticket_id):
        return _minted_credential_response(
            request, ticket_id, lambda ticket: credentials.rotate_credential(ticket, request=request)
        )


class WalletPagination(EchoCursorPagination):
    # Newest purchases first; pk (UUIDv7, time-ordered) breaks ties.
    ordering = ("-issued_at", "-pk")


class WalletListView(generics.ListAPIView):
    """GET /v1/wallet — every admission the buyer holds, per-admission rows."""

    required_scope = "user"
    throttle_classes = [UserRateThrottle]
    serializer_class = TicketSerializer
    pagination_class = WalletPagination

    @extend_schema(operation_id="wallet", responses={200: TicketSerializer(many=True)})
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    def get_queryset(self):
        return Ticket.objects.filter(user=self.request.user).select_related("event", "tier")
