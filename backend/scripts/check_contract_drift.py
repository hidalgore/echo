#!/usr/bin/env python
"""
Contract drift alarm (D4 / v1.0): every path+method the backend serves under
/v1 must exist in the locked registry frontend/types/api/endpoints.ts with the
same method. Registry endpoints the backend does not serve yet are expected
(they land in later phases) and are reported as info, not failures.

Usage (from backend/, venv active):
    python scripts/check_contract_drift.py
Exit codes: 0 = no drift, 1 = drift found, 2 = couldn't run.
"""

import os
import re
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent
REPO_ROOT = BACKEND_DIR.parent
ENDPOINTS_TS = Path(
    os.environ.get("ECHO_ENDPOINTS_TS", REPO_ROOT / "frontend" / "types" / "api" / "endpoints.ts")
)

_ENDPOINT_RE = re.compile(r"method:\s*'(?P<method>[A-Z]+)',\s*path:\s*'(?P<path>/v1/[^']*)'")

# ── Phase 3 AMENDMENT DECISION (flagged, documented here on purpose) ─────────
# Server-to-server routes are NOT client contract surface: the TS registry is
# the typed table apiCall() dials from, and a webhook the client must never
# call doesn't belong in EndpointKey. They still must be named here explicitly
# — an unlisted served route is drift, exactly as before. Nothing gets exempted
# silently.
SERVER_TO_SERVER: set[tuple[str, str]] = {
    ("POST", "/v1/webhooks/stripe"),  # Stripe event delivery (Phase 3 / W4)
}


def registry_endpoints() -> set[tuple[str, str]]:
    if not ENDPOINTS_TS.exists():
        print(f"error: endpoint registry not found at {ENDPOINTS_TS}", file=sys.stderr)
        sys.exit(2)
    source = ENDPOINTS_TS.read_text()
    endpoints = {
        (match["method"], normalize(match["path"]))
        for match in _ENDPOINT_RE.finditer(source)
    }
    if not endpoints:
        print("error: parsed zero endpoints from the registry — parser drift?", file=sys.stderr)
        sys.exit(2)
    return endpoints


def normalize(path: str) -> str:
    """Normalize path params: ':eventId' / '{event_id}' -> '{}' so naming
    differences between TS registry and DRF routes don't mask real drift."""
    path = re.sub(r":[A-Za-z_]+", "{}", path)
    path = re.sub(r"\{[^}]*\}", "{}", path)
    return path.rstrip("/")


def served_endpoints() -> set[tuple[str, str]]:
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "echo_api.settings.test")
    sys.path.insert(0, str(BACKEND_DIR))
    import django

    django.setup()
    from drf_spectacular.generators import SchemaGenerator

    schema = SchemaGenerator().get_schema(public=True)
    served = set()
    for path, methods in (schema.get("paths") or {}).items():
        if not path.startswith("/v1"):
            continue  # /internal/schema etc. are not contract surface
        for method in methods:
            if method.upper() in ("GET", "POST", "PATCH", "PUT", "DELETE"):
                served.add((method.upper(), normalize(path)))
    return served


def main() -> int:
    registry = registry_endpoints()
    served = served_endpoints()
    exempt = {(method, normalize(path)) for method, path in SERVER_TO_SERVER}

    drift = sorted(served - registry - exempt)
    pending = sorted(registry - served)

    if drift:
        print("CONTRACT DRIFT — served endpoints missing from the locked registry:")
        for method, path in drift:
            print(f"  {method} {path}")
        print("\nEither the route is wrong, or the registry needs a locked amendment "
              "(flag it — never diverge silently).")
        return 1

    print(f"OK: {len(served)} served endpoint(s) all present in the locked registry.")
    print(f"info: {len(pending)} registry endpoint(s) not implemented yet (later phases).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
