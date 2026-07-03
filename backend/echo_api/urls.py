"""ECHO API URL configuration. All product routes live under /v1/ (core.urls
and later per-domain apps); schema endpoints are internal tooling."""

from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView

urlpatterns = [
    path("", include("core.urls")),
    path("", include("identity.urls")),
    path("", include("events.urls")),
    path("", include("checkout.urls")),
    path("", include("tickets.urls")),
    path("internal/schema", SpectacularAPIView.as_view(), name="openapi-schema"),
]

handler404 = "core.envelope.json_404"
handler500 = "core.envelope.json_500"
