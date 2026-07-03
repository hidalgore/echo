"""Test URLconf: the real API plus the middleware-exercise routes."""

from django.urls import include, path

from core.tests import testapp

urlpatterns = [
    path("", include("echo_api.urls")),
    path("v1/_test/idempotent", testapp.IdempotentEchoView.as_view()),
    path("v1/_test/idempotent-other", testapp.IdempotentOtherScopeView.as_view()),
    path("v1/_test/idempotent-failing", testapp.FailingIdempotentView.as_view()),
    path("v1/_test/validation-error", testapp.ValidationErrorView.as_view()),
    path("v1/_test/admin-only", testapp.AdminOnlyView.as_view()),
    path("v1/_test/records", testapp.PaginatedRecordsView.as_view()),
]
