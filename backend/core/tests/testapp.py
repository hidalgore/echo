"""Test-only views/urls exercising the platform middleware end-to-end."""

import itertools

from rest_framework import serializers
from rest_framework.exceptions import ValidationError
from rest_framework.generics import ListAPIView
from rest_framework.response import Response
from rest_framework.views import APIView

from core.idempotency import IdempotencyMixin
from core.models import IdempotencyRecord

invocations = itertools.count(1)


class IdempotentEchoView(IdempotencyMixin, APIView):
    required_scope = "public"
    idempotency_required = True

    def post(self, request):
        return Response({"invocation": next(invocations), "echo": request.data}, status=201)


class IdempotentOtherScopeView(IdempotencyMixin, APIView):
    required_scope = "public"
    idempotency_required = True

    def post(self, request):
        return Response({"other": True}, status=201)


class FailingIdempotentView(IdempotencyMixin, APIView):
    required_scope = "public"
    idempotency_required = True

    def post(self, request):
        raise RuntimeError("boom")


class ValidationErrorView(APIView):
    required_scope = "public"

    def post(self, request):
        raise ValidationError({"title": ["This field is required."]})


class AdminOnlyView(APIView):
    required_scope = "admin"

    def get(self, request):
        return Response({"secret": True})


class RecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = IdempotencyRecord
        fields = ["echo_id", "key"]


class PaginatedRecordsView(ListAPIView):
    required_scope = "public"
    queryset = IdempotencyRecord.objects.all()
    serializer_class = RecordSerializer
