# ECHO Backend Handoff & Package Analysis

Locked decisions this pass: 1A (contract layer aligned to `ECHO_API_Contracts_v1.0`),
2A (separate DTOs + mappers), 3A (locked wire enums), 4A (leave `dashboard.ts`
to the repo), 5A (thin fetch client), 6A (this handoff doc).

## Package analysis (no dead code)

- **Dead files: none.** 24 modules appear "unreferenced" inside the package, but
  they are the public API consumed by repo screens (not present here). Do not
  delete them.
- **Compile issues: one** — `utils/dashboardScoring.ts` imports `../types/dashboard`
  (lives in your repo; not fabricated here per 4A). Everything else: strict
  `tsc` clean.
- **External deps (resolve in repo):** `zustand`, `../constants/eventMedia`.
- No duplicate types, no polarity bugs (resolved in earlier passes).

## What shipped (backend-readiness layer)

- `types/api/shared.ts` — locked error envelope, identifiers (echo_id/public_id),
  status codes, `isRetryable`, **TicketStatusDTO** and **AgeBadgeDTO** (locked
  enums), idempotency header, pagination.
- `types/api/endpoints.ts` — typed registry of every locked `/v1` endpoint with
  method, scope, and `idempotent` flag; `buildPath` for path params.
- `types/api/dto.ts` — wire DTOs (Event, Ticket, Credential, CheckoutIntent,
  DoorScan req/result, Circle, RiskDecision).
- `services/api/apiClient.ts` — the only network seam: error envelope,
  `Idempotency-Key`, bearer auth, retry/backoff on 429/5xx; refuses idempotent
  calls without a key. No new dependency.
- `services/api/mappers.ts` — domain ↔ DTO, incl. the locked age-badge and
  ticket-status reconciliation.
- `services/api/ports.ts` — `EchoPorts` (discovery/checkout/ticket/door/circle/
  trust); `bindPorts(mock | http)` is the v55 SWAP-POINT made explicit.

## Endpoint ↔ service ↔ DTO matrix

| Endpoint (locked) | Port / domain service | DTO |
|---|---|---|
| `GET /v1/events` | DiscoveryPort.listEvents | EventDTO |
| `GET /v1/events/:id` | DiscoveryPort.getEvent | EventDTO |
| `POST /v1/checkout/intents` | CheckoutPort.createIntent (+`pricingEngine`) | CheckoutIntentDTO |
| `POST /v1/payments/confirm` | CheckoutPort.confirmPayment | TicketDTO |
| `GET /v1/tickets/:id/credential` | TicketPort.getCredential (+`accessPassService`) | CredentialDTO |
| `POST /v1/tickets/:id/refresh` | TicketPort.refreshCredential | CredentialDTO |
| `POST /v1/door/scans` | DoorPort.submitScan (+`accessControlService`) | DoorScanResultDTO |
| `POST /v1/door/reconcile` | DoorPort.reconcile (+`doorModeOperationsService`) | ok |
| `POST /v1/circles` … `/payments` | CirclePort (+`echoCircleClaimService`) | CircleDTO |
| `GET /v1/me/verification/status` | (age gate; +`echoTrustEngine`) | — |
| admin risk feed | TrustPort.listRiskDecisions (+`botRiskService`) | RiskDecisionDTO |

## Auth scopes (map to RBAC)

`public` · `guest` · `user` · `host` · `door` · `admin`. Door endpoints require
the `door` scope (trusted scanner device). Admin risk/queue endpoints require
`admin`. Host dashboard/payout endpoints require `host` + the relevant
`EchoPermissionId` from `ECHO_ROLE_PERMISSION_MATRIX`.

## Idempotency rules (locked)

`Idempotency-Key` is REQUIRED on: checkout intents, payment confirm, circle
create/payments, door scans, door reconcile, door purchase intent/confirm. The
client rejects these calls without a key. Transfer/ownership conflicts resolve by
server timestamp; offline door ledgers reconcile to server truth.

## The 11 backend services (wire mock → http here)

`AuthSecurityService`, `BotRiskService`, `TicketCredentialService` (signed
rotating QR/NFC), `CheckoutRiskService`, `HostTrustService`,
`DoorModeTrustService`, `PayoutRiskService`, `AuditLogService` (persistence),
`DeviceTrustService`, `RateLimitService`, `IncidentResponseService`. Each binds
to a port adapter; the frontend-safe logic already in `services/*` becomes the
mock adapter, and the http adapter calls `apiCall(...)`.

## How the app wires it (startup)

```ts
configureApiClient({ baseUrl: 'https://api.echo.app', getAuthToken });
// dev/today:
bindPorts(mockPorts);
// when backend is live:
bindPorts(httpPorts); // httpPorts implemented with apiCall(...)
```

## Remaining backend dependencies

Credential signing + rotating QR/NFC issuance, the edge layer (WAF/rate-limit/
Fair-Queue tokens), audit persistence, real trust-factor data sources, and the
admin review queues. The contract + ports above are the seam they plug into.

## Recommended next

Implement `httpPorts` (one adapter file calling `apiCall`) and a `mockPorts`
adapter wrapping the existing frontend-safe services, then bind per environment.
That makes every screen backend-ready without further screen edits.
