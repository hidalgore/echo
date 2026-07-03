# ECHO

Trusted-access platform for live events — discovery, checkout, signed NFC/QR access
passes, group purchases (Circles), door operations, and host tooling.

## Layout

- `frontend/` — the ECHO mobile/web app (Expo SDK 54, expo-router, zustand). Currently
  fully mock-driven; converts to the real API one domain at a time via the
  `bindPorts(mock | http)` seam.
- `readiness-layer/` — the locked API contract layer (endpoint registry, wire DTOs,
  mappers, fetch client, ports). **Temporary location:** merged into `frontend/` during
  Phase 0 W2, after which this directory is removed.
- `backend/` — Django 5 / DRF / PostgreSQL / Redis / Celery API implementing the
  contract. Created in Phase 0 W3 (does not exist yet).
- `docs/` — plans and locked standards:
  - `ECHO_Backend_Master_Plan_V1.md` — locked decisions + the 9-phase roadmap.
  - `ECHO_Backend_Phase_0_Kickoff_V1.md` — current phase spec.
  - `ECHO_Backend_Phase_0_Session_Prompt.md` — paste-ready prompt for the Phase 0 session.
  - `app-history/` — the ECHO_*.md build-note corpus from the v59 frontend package.

## Status

Planning complete; Phase 0 (Foundations) in progress. Repo bootstrap done (this push);
next: readiness-layer merge + `mockPorts`, backend scaffold, CI, contract v1.1 draft —
see the kickoff doc.
