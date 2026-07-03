"""S-06 routes (Phase 4). Paths must match frontend/types/api/endpoints.ts —
scripts/check_contract_drift.py enforces it."""

from django.urls import path

from tickets.views import (
    TicketCredentialView,
    TicketDetailView,
    TicketRefreshView,
    TicketStatusView,
    WalletListView,
)

urlpatterns = [
    path("v1/tickets/<str:ticket_id>", TicketDetailView.as_view(), name="ticket-detail"),
    path("v1/tickets/<str:ticket_id>/status", TicketStatusView.as_view(), name="ticket-status"),
    path(
        "v1/tickets/<str:ticket_id>/credential",
        TicketCredentialView.as_view(),
        name="ticket-credential",
    ),
    path("v1/tickets/<str:ticket_id>/refresh", TicketRefreshView.as_view(), name="ticket-refresh"),
    path("v1/wallet", WalletListView.as_view(), name="wallet"),
]
