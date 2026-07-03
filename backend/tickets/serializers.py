"""
S-06 wire serializers (Phase 4 / W2) — snake_case, matching TicketDTO /
CredentialDTO in frontend/types/api/dto.ts.

TicketSerializer moved here from checkout.serializers (Phase 4): the shape is
owned by the tickets domain and served by both the S-05 confirm response and
every S-06 read — one serializer, never two copies.

Phase 4 AMENDMENT (flagged, needs registry lock sign-off): TicketDTO gains
`intent_id`. GET /v1/wallet serves one row per admission (server truth; door
scans validate individuals) while the locked wallet UI renders one card per
*purchase* — intent linkage is what lets the client group rows back into
cards when hydrating from the server (the local-only Phase 3 store can't be
the source of truth across installs). Confirm responses carry it too: same
serializer, same shape.
"""

from rest_framework import serializers

from events.serializers import age_badge
from tickets.models import Ticket


class TicketSerializer(serializers.ModelSerializer):
    """Locked TicketDTO (+ flagged intent_id amendment)."""

    event_id = serializers.UUIDField(read_only=True)
    tier_id = serializers.UUIDField(read_only=True)
    intent_id = serializers.UUIDField(read_only=True)
    age_badge = serializers.SerializerMethodField()

    class Meta:
        model = Ticket
        fields = ["echo_id", "event_id", "tier_id", "intent_id", "status", "age_badge", "issued_at"]

    def get_age_badge(self, ticket) -> str:
        return age_badge(ticket.event.age_restriction)


class TicketStatusSerializer(serializers.ModelSerializer):
    """GET .../status — the lightweight poll body. No DTO is locked for this
    row (the registry names the route; TicketStatusDTO is just the enum), so
    serve the minimal pair the enum needs to ride on."""

    ticket_id = serializers.UUIDField(source="echo_id", read_only=True)

    class Meta:
        model = Ticket
        fields = ["ticket_id", "status"]


class CredentialSerializer(serializers.Serializer):
    """Locked CredentialDTO — serialized off tickets.credentials.MintedCredential."""

    ticket_id = serializers.CharField(read_only=True)
    nfc_credential_id = serializers.CharField(read_only=True)
    qr_payload = serializers.CharField(read_only=True)
    validation_token = serializers.CharField(read_only=True)
    expires_at = serializers.DateTimeField(read_only=True)
