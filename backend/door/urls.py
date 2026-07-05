"""S-07 routes (Phase 5). Paths must match frontend/types/api/endpoints.ts —
scripts/check_contract_drift.py enforces it. The pause/resume rows are
flagged Phase 5 registry amendments (the locked v1.0 registry had no route
for the 6-digit pause/resume validation; the audit concluded a session
sub-action, not a session-state field — validation is a mutation with
attempt lockout and audit, which a GET field cannot carry)."""

from django.urls import path

from door.views import (
    DoorOfflineBundleView,
    DoorPurchaseConfirmView,
    DoorPurchaseIntentStatusView,
    DoorPurchaseIntentView,
    DoorReconcileView,
    DoorScanView,
    DoorSessionDetailView,
    DoorSessionPauseView,
    DoorSessionResumeView,
)

urlpatterns = [
    path(
        "v1/door/sessions/<str:session_id>",
        DoorSessionDetailView.as_view(),
        name="door-session",
    ),
    path(
        "v1/door/sessions/<str:session_id>/pause",
        DoorSessionPauseView.as_view(),
        name="door-session-pause",
    ),
    path(
        "v1/door/sessions/<str:session_id>/resume",
        DoorSessionResumeView.as_view(),
        name="door-session-resume",
    ),
    path(
        "v1/door/sessions/<str:session_id>/offline-bundle",
        DoorOfflineBundleView.as_view(),
        name="door-offline-bundle",
    ),
    path("v1/door/scans", DoorScanView.as_view(), name="door-scans"),
    path("v1/door/reconcile", DoorReconcileView.as_view(), name="door-reconcile"),
    path(
        "v1/door/purchase/intents",
        DoorPurchaseIntentView.as_view(),
        name="door-purchase-intent",
    ),
    path(
        "v1/door/purchase/confirm",
        DoorPurchaseConfirmView.as_view(),
        name="door-purchase-confirm",
    ),
    path(
        "v1/door/purchase/intents/<str:intent_id>",
        DoorPurchaseIntentStatusView.as_view(),
        name="door-purchase-intent-status",
    ),
]
