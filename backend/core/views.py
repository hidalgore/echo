"""Platform views. Phase 0 ships exactly one product-facing endpoint."""

from django.conf import settings
from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework.response import Response
from rest_framework.views import APIView

from core.ratelimit import PublicIPRateThrottle


class ConfigPublicView(APIView):
    """GET /v1/config/public — feature flags, min version, fee display constants.

    The one real endpoint proving the stack end-to-end: envelope on errors,
    per-IP rate limiting, scope enforcement, OpenAPI registration.
    """

    required_scope = "public"
    throttle_classes = [PublicIPRateThrottle]

    @extend_schema(
        operation_id="publicConfig",
        responses={200: OpenApiResponse(description="Public client configuration.")},
    )
    def get(self, request):
        return Response(
            {
                "min_app_version": settings.ECHO_MIN_APP_VERSION,
                "feature_flags": {},
                "fees": {
                    # Display constants only. The authoritative pricing engine
                    # (including tax + nonprofit waivers) is server-side Phase 3.
                    "platform_fee_rate": settings.ECHO_PLATFORM_FEE_RATE,
                    "payment_processing_rate": settings.ECHO_PAYMENT_PROCESSING_RATE,
                    "payment_processing_flat_cents": settings.ECHO_PAYMENT_PROCESSING_FLAT_CENTS,
                    "fee_label": "Service & processing fee",
                },
                "circle": {
                    "min_tickets": 2,
                    "claim_window_seconds": 3600,
                },
                "credential": {
                    "nfc_rotate_interval_ms": 30_000,
                },
            }
        )
