from django.urls import path

from events.views import (
    EventDetailView,
    EventInventoryView,
    EventListView,
    SavedEventDeleteView,
    SavedEventsView,
)

urlpatterns = [
    path("v1/events", EventListView.as_view(), name="events"),
    # <uuid:> refuses malformed ids at the router (envelope 404 via handler404).
    path("v1/events/<uuid:event_id>", EventDetailView.as_view(), name="event-details"),
    path("v1/events/<uuid:event_id>/inventory", EventInventoryView.as_view(), name="event-inventory"),
    # GET is the flagged Phase 2 registry amendment (see endpoints.ts).
    path("v1/saved-events", SavedEventsView.as_view(), name="saved-events"),
    path("v1/saved-events/<uuid:event_id>", SavedEventDeleteView.as_view(), name="saved-event-delete"),
]
