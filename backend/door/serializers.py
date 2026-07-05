"""
S-07 wire serializers (Phase 5) — snake_case, matching the locked
DoorScanRequestDTO / DoorScanResultDTO in frontend/types/api/dto.ts plus the
audit-produced session/bundle/reconcile shapes (no DTOs were locked for those
rows — the ticketStatus precedent; flagged as Phase 5 amendments).
"""

from rest_framework import serializers

from checkout.serializers import (
    CreateCheckoutIntentRequestSerializer,
    PaymentMethodSerializer,
)
from door.models import DoorSession


class DoorSessionSerializer(serializers.ModelSerializer):
    """Audit-produced DoorSessionDTO. No attendance counts on the wire —
    Social Energy doctrine applies to door surfaces too; the device keeps
    its own local tallies."""

    session_id = serializers.UUIDField(source="echo_id", read_only=True)
    event_id = serializers.UUIDField(read_only=True)

    class Meta:
        model = DoorSession
        fields = [
            "session_id",
            "event_id",
            "label",
            "zone",
            "status",
            "expires_at",
            "passcode_locked_until",
        ]


class DoorScanRequestSerializer(serializers.Serializer):
    """Locked DoorScanRequestDTO."""

    session_id = serializers.UUIDField()
    ticket_id = serializers.UUIDField(required=False, allow_null=True)
    nfc_credential_id = serializers.CharField(max_length=128, required=False, allow_blank=True)
    qr_payload = serializers.CharField(max_length=4096, required=False, allow_blank=True)
    scanned_at = serializers.DateTimeField()
    offline = serializers.BooleanField(default=False)


class DoorScanResultSerializer(serializers.Serializer):
    """Locked DoorScanResultDTO (+ flagged age_badge amendment — the locked
    scan verdict includes the age badge but v1.0 gave it no field)."""

    approved = serializers.BooleanField()
    ticket_status = serializers.CharField()
    verification_state = serializers.CharField()
    failure_reason = serializers.CharField(required=False)
    tier_id = serializers.CharField()
    authorized_zones = serializers.ListField(child=serializers.CharField())
    age_badge = serializers.CharField()


class DoorResumeRequestSerializer(serializers.Serializer):
    # Exactly 6 digits (locked client rule); the value itself is never logged.
    passcode = serializers.RegexField(regex=r"^\d{6}$", write_only=True)


class DoorReconcileRequestSerializer(serializers.Serializer):
    scans = DoorScanRequestSerializer(many=True, allow_empty=True, max_length=1000)


class DoorPurchaseIntentRequestSerializer(CreateCheckoutIntentRequestSerializer):
    """S-05 create shape + the session the sale rides on (audit-produced)."""

    session_id = serializers.UUIDField()


class DoorPurchaseConfirmRequestSerializer(serializers.Serializer):
    session_id = serializers.UUIDField()
    intent_id = serializers.UUIDField()
    payment_method = PaymentMethodSerializer()
