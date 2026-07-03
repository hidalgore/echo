"""
Locked error envelope: every non-2xx response body is

    { "error": { "code": str, "message": str, "details"?: object } }

matching frontend/types/api/shared.ts. DRF exceptions flow through
`envelope_exception_handler`; non-DRF 404/500 are covered by the handlers in
echo_api/urls.py.
"""

import logging

from django.http import Http404, JsonResponse
from rest_framework import exceptions, status
from rest_framework.response import Response

logger = logging.getLogger(__name__)


def error_body(code: str, message: str, details: dict | None = None) -> dict:
    error: dict = {"code": code, "message": message}
    if details:
        error["details"] = details
    return {"error": error}


def error_response(
    code: str, message: str, http_status: int, details: dict | None = None, headers: dict | None = None
) -> Response:
    response = Response(error_body(code, message, details), status=http_status)
    for name, value in (headers or {}).items():
        response[name] = value
    return response


_EXCEPTION_CODES: list[tuple[type[Exception], str]] = [
    # Order matters: subclasses before their parents.
    (exceptions.AuthenticationFailed, "unauthenticated"),
    (exceptions.NotAuthenticated, "unauthenticated"),
    (exceptions.PermissionDenied, "unauthorized"),
    (exceptions.NotFound, "not_found"),
    (exceptions.MethodNotAllowed, "method_not_allowed"),
    (exceptions.UnsupportedMediaType, "unsupported_media_type"),
    (exceptions.ParseError, "invalid_request"),
    (exceptions.ValidationError, "validation_error"),
    (exceptions.Throttled, "rate_limited"),
]


def envelope_exception_handler(exc, context):
    """DRF EXCEPTION_HANDLER: normalize every API error to the locked envelope."""
    if isinstance(exc, Http404):
        exc = exceptions.NotFound()

    if isinstance(exc, exceptions.APIException):
        code = next(
            (mapped for klass, mapped in _EXCEPTION_CODES if isinstance(exc, klass)),
            exc.get_codes() if isinstance(exc.get_codes(), str) else "api_error",
        )
        details = None
        message = str(exc.detail) if not isinstance(exc.detail, (list, dict)) else exc.default_detail
        if isinstance(exc.detail, (list, dict)):
            details = {"fields": exc.detail} if isinstance(exc.detail, dict) else {"errors": exc.detail}

        headers: dict = {}
        if isinstance(exc, exceptions.Throttled) and exc.wait is not None:
            headers["Retry-After"] = str(int(exc.wait))

        return error_response(str(code), message, exc.status_code, details, headers)

    # Unhandled exception: log with traceback, return an opaque envelope 500.
    logger.exception("Unhandled API exception", exc_info=exc)
    return error_response(
        "internal_error",
        "An internal error occurred.",
        status.HTTP_500_INTERNAL_SERVER_ERROR,
    )


# ─── Non-DRF handlers (wired in echo_api/urls.py) ────────────────────────────


def json_404(request, exception=None):
    return JsonResponse(error_body("not_found", "Resource not found."), status=404)


def json_500(request):
    return JsonResponse(error_body("internal_error", "An internal error occurred."), status=500)
