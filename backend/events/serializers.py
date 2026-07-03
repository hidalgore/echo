"""
S-03 wire serializers — snake_case, matching the (Phase 2-amended) EventDTO /
TicketTierDTO / EventInventoryDTO in frontend/types/api/dto.ts.

Social Energy doctrine: these are the only places catalog rows become wire
payloads, and none of them may ever expose quantity_total / quantity_sold /
sell-through — tests assert the exact key sets.
"""

from rest_framework import serializers

from events import social_energy
from events.models import DonationCampaign, Event, TicketTier


def age_badge(age_restriction) -> str:
    """Domain age requirement → locked AgeBadgeDTO (single source of truth)."""
    if age_restriction and age_restriction >= 21:
        return "21_plus"
    if age_restriction and age_restriction >= 18:
        return "18_plus"
    return "none"


class TicketTierSerializer(serializers.ModelSerializer):
    # Remaining-only by construction: capacity/sold are not fields here.
    available = serializers.IntegerField(read_only=True)

    class Meta:
        model = TicketTier
        fields = ["echo_id", "name", "description", "price_cents", "available"]


class DonationCampaignSerializer(serializers.ModelSerializer):
    """Phase 3 EventDTO amendment: campaign progress for the checkout /
    nonprofit surfaces. Progress only — donor identities are never wired."""

    class Meta:
        model = DonationCampaign
        fields = [
            "echo_id",
            "nonprofit_name",
            "cause_title",
            "cause_description",
            "goal_cents",
            "raised_cents",
            "donor_count",
            "suggested_amounts_cents",
            "status",
        ]


class EventSerializer(serializers.ModelSerializer):
    venue_name = serializers.CharField(source="venue.name", read_only=True)
    venue_address = serializers.CharField(source="venue.address", read_only=True)
    age_badge = serializers.SerializerMethodField()
    tiers = TicketTierSerializer(many=True, read_only=True)
    donation_campaign = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = [
            "echo_id",
            "public_id",
            "title",
            "description",
            "category",
            "status",
            "venue_name",
            "venue_address",
            "starts_at",
            "ends_at",
            "image_url",
            "is_featured",
            "host_name",
            "host_verified",
            "age_badge",
            "tiers",
            "donation_campaign",
        ]

    def get_age_badge(self, event) -> str:
        return age_badge(event.age_restriction)

    def get_donation_campaign(self, event) -> dict | None:
        # Reverse OneToOne: absent for most events (null on the wire).
        campaign = getattr(event, "donation_campaign", None)
        return DonationCampaignSerializer(campaign).data if campaign is not None else None

    def to_representation(self, event):
        data = super().to_representation(event)
        atmosphere = social_energy.compute(event)
        data["atmosphere_label"] = atmosphere.label
        data["atmosphere_intensity"] = atmosphere.intensity
        return data


class EventInventorySerializer(serializers.Serializer):
    """GET /v1/events/:eventId/inventory — fresh availability for the picker."""

    event_id = serializers.UUIDField(source="echo_id", read_only=True)
    tiers = TicketTierSerializer(many=True, read_only=True)


class SaveEventRequestSerializer(serializers.Serializer):
    event_id = serializers.UUIDField()
