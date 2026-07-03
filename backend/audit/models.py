"""
Append-only audit log (locked standing rule, live from Phase 1).

Rows are immutable: save() refuses updates and delete() refuses outright.
There is no read API this phase — inspection is via shell/dbshell. Retention
and an admin surface are later-phase concerns.
"""

from django.conf import settings
from django.db import models

from core.ids import uuid7


class AuditLogEntry(models.Model):
    echo_id = models.UUIDField(primary_key=True, default=uuid7, editable=False)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    # Dotted action name, e.g. "auth.login", "auth.refresh_reuse_detected".
    action = models.CharField(max_length=64, db_index=True)
    # SET_NULL keeps the trail when an account is deleted (append-only beats FK purity).
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL, related_name="+"
    )
    device_id = models.UUIDField(null=True)
    target_type = models.CharField(max_length=64, blank=True, default="")
    target_id = models.CharField(max_length=64, blank=True, default="")
    metadata = models.JSONField(default=dict, blank=True)
    ip = models.GenericIPAddressField(null=True)
    user_agent = models.CharField(max_length=512, blank=True, default="")

    class Meta:
        indexes = [models.Index(fields=["target_type", "target_id"])]

    def __str__(self) -> str:
        return f"AuditLogEntry({self.action}, {self.created_at:%Y-%m-%d %H:%M:%S})"

    def save(self, *args, **kwargs):
        if not self._state.adding:
            raise TypeError("AuditLogEntry is append-only; rows cannot be updated.")
        return super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise TypeError("AuditLogEntry is append-only; rows cannot be deleted.")
