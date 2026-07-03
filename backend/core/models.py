"""Platform models. Product models do NOT live here (they come with Phases 1+)."""

from django.db import models

from core.ids import uuid7


class EchoIdModel(models.Model):
    """Abstract base every product model will extend: UUIDv7 `echo_id` PK.

    `public_id` columns are added per-model where a human-facing id is part of
    the contract (minted via core.ids.new_public_id with a per-entity prefix).
    """

    echo_id = models.UUIDField(primary_key=True, default=uuid7, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class IdempotencyRecord(models.Model):
    """Persistence + replay for `Idempotency-Key` mutations (locked rule).

    Lifecycle: a row is created *before* the view executes (response_status
    null = in flight); filled in afterwards. A duplicate key with:
      - same request hash + stored response  -> replay the stored response
      - same request hash + still in flight  -> 409 idempotency_in_flight
      - different request hash               -> 409 idempotency_key_reuse
    Expired rows are purged by core.tasks.purge_expired_idempotency_records.
    """

    echo_id = models.UUIDField(primary_key=True, default=uuid7, editable=False)
    key = models.CharField(max_length=255)
    # Endpoint scope, e.g. "POST /v1/checkout/intents" — the same key may be
    # legitimately reused across different endpoints.
    scope = models.CharField(max_length=255)
    request_hash = models.CharField(max_length=64)
    response_status = models.PositiveSmallIntegerField(null=True)
    response_body = models.JSONField(null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(db_index=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["key", "scope"], name="uniq_idempotency_key_scope"),
        ]

    def __str__(self) -> str:  # pragma: no cover - repr convenience
        return f"IdempotencyRecord({self.scope}, {self.key})"
