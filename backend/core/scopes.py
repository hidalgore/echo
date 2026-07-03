"""
Auth scope scaffolding (locked scopes: public/guest/user/host/door/admin).

Phase 1: identity.authentication.EchoTokenAuthentication verifies bearer
tokens and attaches the granted scope as `request.auth.scope`;
`resolve_request_scope` reads it. Anonymous requests stay `public`.
Views declare `required_scope`.

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
    """Return the request's granted scope from its verified token context.

    Accessing `request.auth` runs DRF authentication lazily; an invalid or
    expired bearer token raises AuthenticationFailed here (envelope 401)
    rather than degrading to public.
    """
    auth = getattr(request, "auth", None)
    scope = getattr(auth, "scope", None)
    if scope is None:
        return "public"
    if scope not in SCOPES:
        raise ValueError(f"token carries unknown scope: {scope!r}")
    return scope


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
