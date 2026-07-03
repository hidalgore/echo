"""
Audit writer API. Call `audit.service.record(...)` — never construct
AuditLogEntry rows in views, so the request-context extraction (actor, ip,
user agent) stays in one place.

Writes must never take the calling flow down: failures are logged and
swallowed. Auth still succeeds if the audit insert hits a transient error;
the error is loud in logs/Sentry instead.
"""

import logging

from audit.models import AuditLogEntry

logger = logging.getLogger(__name__)

_MAX_USER_AGENT = 512


def record(
    action: str,
    *,
    request=None,
    actor=None,
    device_id=None,
    target=None,
    metadata: dict | None = None,
) -> AuditLogEntry | None:
    """Append one audit entry.

    - `actor`: User; defaults to request.user when authenticated.
    - `device_id`: UUID of the acting device (from the token context or the
      just-registered device).
    - `target`: (type, id) tuple, e.g. ("user", str(user.echo_id)).
    """
    try:
        if actor is None and request is not None:
            request_user = getattr(request, "user", None)
            if getattr(request_user, "is_authenticated", False):
                actor = request_user
        if device_id is None and request is not None:
            device_id = getattr(getattr(request, "auth", None), "device_id", None)

        target_type, target_id = target if target else ("", "")
        entry = AuditLogEntry(
            action=action,
            actor=actor,
            device_id=device_id,
            target_type=target_type,
            target_id=str(target_id),
            metadata=metadata or {},
            ip=_client_ip(request) if request is not None else None,
            user_agent=(request.headers.get("User-Agent", "")[:_MAX_USER_AGENT] if request else ""),
        )
        entry.save()
        return entry
    except Exception:
        logger.exception("audit write failed for action=%s", action)
        return None


def _client_ip(request) -> str | None:
    # Behind nginx the client is the first X-Forwarded-For hop; direct
    # connections (dev/tests) fall back to REMOTE_ADDR.
    forwarded = request.headers.get("X-Forwarded-For", "")
    if forwarded:
        return forwarded.split(",")[0].strip() or None
    return request.META.get("REMOTE_ADDR") or None
