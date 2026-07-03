"""
Auth scope scaffolding (locked scopes: public/guest/user/host/door/admin).

Phase 0 wires *enforcement*, not identity: every request resolves to the
`public` scope until Phase 1 attaches real authentication, which only needs to
replace `resolve_request_scope`. Views declare `required_scope`.

Hierarchy (a granted scope satisfies the ones it covers):
  admin  -> everything
  host   -> host, user, guest, public
  user   -> user, guest, public
  guest  -> guest, public
  door   -> door, public   (trusted scanner devices are not user sessions)
  public -> public
"""

from rest_framework.permissions import BasePermission

SCOPES = ("public", "guest", "user", "host", "door", "admin")

_SATISFIES: dict[str, frozenset[str]] = {
    "admin": frozenset(SCOPES),
    "host": frozenset({"host", "user", "guest", "public"}),
    "user": frozenset({"user", "guest", "public"}),
    "guest": frozenset({"guest", "public"}),
    "door": frozenset({"door", "public"}),
    "public": frozenset({"public"}),
}


def scope_satisfies(granted: str, required: str) -> bool:
    if required not in SCOPES:
        raise ValueError(f"unknown scope: {required!r}")
    return required in _SATISFIES.get(granted, frozenset())


def resolve_request_scope(request) -> str:
    """Phase 0: no identity — every request is `public`.

    Phase 1 replaces this with token verification that returns the session's
    granted scope (and attaches the user/device to the request).
    """
    return "public"


class HasRequiredScope(BasePermission):
    """Default permission class: enforce the view's `required_scope`.

    Views without a `required_scope` attribute default to `public` (explicitly
    declaring it is still preferred — the endpoint registry names one for
    every route).
    """

    def has_permission(self, request, view) -> bool:
        required = getattr(view, "required_scope", "public")
        granted = resolve_request_scope(request)
        return scope_satisfies(granted, required)
