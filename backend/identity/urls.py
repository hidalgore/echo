from django.urls import path

from identity.views import (
    AuthAppleView,
    AuthGoogleView,
    AuthLogoutView,
    AuthRefreshView,
    GuestSessionView,
    MeFlagsView,
    MeView,
)

urlpatterns = [
    path("v1/auth/apple", AuthAppleView.as_view(), name="auth-apple"),
    path("v1/auth/google", AuthGoogleView.as_view(), name="auth-google"),
    # Phase 1 registry amendment (flagged in frontend/types/api/endpoints.ts).
    path("v1/auth/refresh", AuthRefreshView.as_view(), name="auth-refresh"),
    path("v1/auth/logout", AuthLogoutView.as_view(), name="auth-logout"),
    path("v1/sessions/guest", GuestSessionView.as_view(), name="sessions-guest"),
    path("v1/me", MeView.as_view(), name="me"),
    path("v1/me/flags", MeFlagsView.as_view(), name="me-flags"),
]
