"""
S-03 discovery endpoints (Phase 2 / W2).

Public reads (events / details / inventory) throttle per-IP via the platform
public bucket (the master plan's "moderate per-IP" compliance note —
RATE_LIMIT_PUBLIC, 60/min default). Saved-events are user-scoped and throttle
per identity. None of these are idempotency-flagged in the locked registry.

Visibility: drafts never leave the box — every queryset here filters to
VISIBLE_STATUSES.
"""

import uuid

from django.db import IntegrityError
from django.db.models import Prefetch, Q
from django.utils.dateparse import parse_date, parse_datetime
from django.utils.timezone import make_aware
from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import exceptions, generics, status
from rest_framework.response import Response
from rest_framework.views import APIView

from core.pagination import EchoCursorPagination
from core.ratelimit import PublicIPRateThrottle, UserRateThrottle
from events.models import VISIBLE_STATUSES, Event, SavedEvent, TicketTier
from events.serializers import (
    EventInventorySerializer,
    EventSerializer,
    SaveEventRequestSerializer,
)


def _visible_events():
    return (
        Event.objects.filter(status__in=VISIBLE_STATUSES)
        .select_related("venue")
        .prefetch_related(Prefetch("tiers", queryset=TicketTier.objects.all()))
    )


def _get_visible_event(event_id: str) -> Event:
    """Fetch one servable event; malformed ids and drafts are both 404 (the
    envelope not_found), never a 500."""
    try:
        event_uuid = uuid.UUID(str(event_id))
    except ValueError:
        raise exceptions.NotFound("Event not found.") from None
    try:
        return _visible_events().get(echo_id=event_uuid)
    except Event.DoesNotExist:
        raise exceptions.NotFound("Event not found.") from None


def _parse_bound(raw: str, param: str, *, end_of_day: bool):
    """Accept an ISO datetime or bare date for date_from/date_to."""
    value = parse_datetime(raw)
    if value is not None:
        return make_aware(value) if value.tzinfo is None else value
    day = parse_date(raw)
    if day is None:
        raise exceptions.ValidationError({param: "Expected an ISO date or datetime."})
    boundary = day.isoformat() + ("T23:59:59.999999" if end_of_day else "T00:00:00")
    return make_aware(parse_datetime(boundary))


class EventListPagination(EchoCursorPagination):
    # Discovery reads upcoming-first; pk (UUIDv7, time-ordered) breaks ties.
    ordering = ("starts_at", "pk")


class EventListView(generics.ListAPIView):
    """GET /v1/events — cursor-paginated discovery list.

    Filters mirror what the discovery surface applies (audited): `city`
    (venue name/address match, like the client's filterByCity), `category`,
    `featured`, and a `date_from`/`date_to` window on starts_at.
    """

    required_scope = "public"
    throttle_classes = [PublicIPRateThrottle]
    serializer_class = EventSerializer
    pagination_class = EventListPagination

    @extend_schema(operation_id="events", responses={200: EventSerializer(many=True)})
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    def get_queryset(self):
        params = self.request.query_params
        queryset = _visible_events()

        city = params.get("city", "").strip()
        if city:
            queryset = queryset.filter(
                Q(venue__city__icontains=city)
                | Q(venue__name__icontains=city)
                | Q(venue__address__icontains=city)
            )

        category = params.get("category", "").strip()
        if category:
            queryset = queryset.filter(category__iexact=category)

        featured = params.get("featured", "").strip().lower()
        if featured in ("true", "1"):
            queryset = queryset.filter(is_featured=True)

        date_from = params.get("date_from", "").strip()
        if date_from:
            queryset = queryset.filter(starts_at__gte=_parse_bound(date_from, "date_from", end_of_day=False))
        date_to = params.get("date_to", "").strip()
        if date_to:
            queryset = queryset.filter(starts_at__lte=_parse_bound(date_to, "date_to", end_of_day=True))

        return queryset


class EventDetailView(APIView):
    required_scope = "public"
    throttle_classes = [PublicIPRateThrottle]

    @extend_schema(operation_id="eventDetails", responses={200: EventSerializer})
    def get(self, request, event_id):
        return Response(EventSerializer(_get_visible_event(event_id)).data)


class EventInventoryView(APIView):
    required_scope = "public"
    throttle_classes = [PublicIPRateThrottle]

    @extend_schema(operation_id="eventInventory", responses={200: EventInventorySerializer})
    def get(self, request, event_id):
        return Response(EventInventorySerializer(_get_visible_event(event_id)).data)


class SavedEventsView(APIView):
    """GET (Phase 2 amendment) + POST /v1/saved-events."""

    required_scope = "user"
    throttle_classes = [UserRateThrottle]

    @extend_schema(operation_id="savedEvents", responses={200: EventSerializer(many=True)})
    def get(self, request):
        saved = (
            SavedEvent.objects.filter(user=request.user)
            .select_related("event__venue")
            .prefetch_related("event__tiers")
        )
        paginator = EchoCursorPagination()  # -pk default = most recently saved first
        page = paginator.paginate_queryset(saved, request, view=self)
        data = EventSerializer([record.event for record in page], many=True).data
        return paginator.get_paginated_response(data)

    @extend_schema(
        operation_id="saveEvent",
        request=SaveEventRequestSerializer,
        responses={201: OpenApiResponse(description="Event saved.")},
    )
    def post(self, request):
        serializer = SaveEventRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        event = _get_visible_event(serializer.validated_data["event_id"])
        try:
            _, created = SavedEvent.objects.get_or_create(user=request.user, event=event)
        except IntegrityError:
            created = False  # concurrent duplicate save: already saved is fine
        return Response({"ok": True}, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


class SavedEventDeleteView(APIView):
    required_scope = "user"
    throttle_classes = [UserRateThrottle]

    @extend_schema(operation_id="unsaveEvent", responses={200: OpenApiResponse(description="Event unsaved.")})
    def delete(self, request, event_id):
        # Idempotent by design: unsaving something not saved is still "ok".
        SavedEvent.objects.filter(user=request.user, event_id=event_id).delete()
        return Response({"ok": True})
