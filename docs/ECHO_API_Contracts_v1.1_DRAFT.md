# ECHO API Contracts v1.1 — DRAFT (circulated for lock)

Status: **DRAFT** — authored in Phase 0 per D4. Phases 7–8 are gated on locking
this document. v1.0 (the ~36-endpoint registry in
`frontend/types/api/endpoints.ts`) is unchanged; v1.1 is purely additive.

Conventions (identical to v1.0):
- All paths under `/v1`. Cursor pagination `{ items, nextCursor? }` with
  `cursor`/`limit` query params, server-capped.
- Error envelope `{ error: { code, message, details? } }` on every non-2xx.
- **Idempotent** = requires `Idempotency-Key` header; the client refuses the
  call without one and the server persists/replays results (409 on key reuse
  with a different body, 409 while in flight).
- Scopes: `public / guest / user / host / door / admin`; host endpoints
  additionally check the relevant `EchoPermissionId` from
  `ECHO_ROLE_PERMISSION_MATRIX`.
- IDs: wire ids are `echo_id` (UUIDv7); `public_id` (Crockford Base32 +
  checksum) appears only where a human reads it (Settings/Support, closeout
  reports).
- Social Energy doctrine: no raw attendance counts on ANY surface below,
  including host analytics *exports* shared with third parties (host-facing
  dashboards may show real counts — they are the operator).
- Money is integer cents. Timestamps are ISO-8601 UTC.
- Server-authoritative: pricing, refunds, payout math, trust scoring, mission
  verification. Client implementations become display logic.
- Audit log: every mutation below writes an audit entry (actor, action,
  subject, before/after where applicable). Destructive/financial operations
  always.

---

## 1. Host onboarding & profiles (Phase 7)

| Key | Method | Path | Scope | Idem |
|---|---|---|---|---|
| hostApplication | POST | /v1/host/applications | user | — |
| hostApplicationStatus | GET | /v1/host/applications/current | user | — |
| hostActivate | POST | /v1/host/activate | user | — |
| hostProfile | GET | /v1/host/profile | host | — |
| hostProfileUpdate | PATCH | /v1/host/profile | host | — |
| hostPublicProfile | GET | /v1/hosts/:hostId | public | — |

- `hostApplicationStatus` drives the app's `hostAccessStatus` progression
  (`none → applied → approved → active`). Approval is an admin action (admin
  console endpoints are out of scope for v1.1; flagged for v1.2).
- `HostProfileDTO`: `echo_id, public_id, display_name, bio, avatar_url,
  links[], verified, created_at`. Public variant omits internal fields.

## 2. Host events: create / update / publish + flyer extraction (Phase 7)

| Key | Method | Path | Scope | Idem |
|---|---|---|---|---|
| hostEvents | GET | /v1/host/events | host | — |
| hostEventCreate | POST | /v1/host/events | host | ✅ |
| hostEvent | GET | /v1/host/events/:eventId | host | — |
| hostEventUpdate | PATCH | /v1/host/events/:eventId | host | — |
| hostEventPublish | POST | /v1/host/events/:eventId/publish | host | ✅ |
| hostEventCancel | POST | /v1/host/events/:eventId/cancel | host | ✅ |
| flyerUploadUrl | POST | /v1/host/flyers/upload-url | host | — |
| flyerExtract | POST | /v1/host/flyers/:flyerId/extract | host | ✅ |
| flyerExtractStatus | GET | /v1/host/flyers/:flyerId/extraction | host | — |

- Flyer upload is **signed-URL direct-to-storage** (`flyerUploadUrl` returns
  `{ upload_url, flyer_id, expires_at }`; size limit + content-type enforced at
  the URL; malware scan before extraction). `flyerExtract` enqueues the async
  vision/OCR job; `flyerExtractStatus` returns
  `{ status: queued|processing|complete|failed, confidence, draft? }` where
  `draft` mirrors the V3 flyer-first draft shape. May launch manual-confirm
  (server returns `confidence: 0`, client routes to the manual flow).
- Publish validates the locked ordering (`publishDate ≤ salesStartDate <
  eventStart`) and snapshots the refund policy (see §6).
- Scheduled visibility/purchasability transitions are server workers (Phase 2
  machinery reused); no client polling contract needed beyond event status.

## 3. Dashboard, reports & closeout (Phase 7)

| Key | Method | Path | Scope | Idem |
|---|---|---|---|---|
| hostDashboard | GET | /v1/host/dashboard | host | — |
| hostEventStats | GET | /v1/host/events/:eventId/stats | host | — |
| hostEventFinance | GET | /v1/host/events/:eventId/finance | host | — |
| hostEventCloseout | POST | /v1/host/events/:eventId/closeout | host | ✅ |
| hostEventCloseoutReport | GET | /v1/host/events/:eventId/closeout/report | host | — |

- `closeout` finalizes an ended event: attendance summary, denied-attempt log,
  throughput analytics, finance summary; returns a report id. `report` serves
  `{ csv_url, pdf_url?, expires_at }` (signed URLs).
- Nonprofit closeout CSV: donor PII columns are **role-gated** — present only
  when the host holds the nonprofit-owner permission; otherwise redacted
  (locked rule restated from the build notes).

## 4. Promotions & presale (Phase 7)

| Key | Method | Path | Scope | Idem |
|---|---|---|---|---|
| promotions | GET | /v1/host/events/:eventId/promotions | host | — |
| promotionCreate | POST | /v1/host/events/:eventId/promotions | host | ✅ |
| promotionUpdate | PATCH | /v1/promotions/:promotionId | host | — |
| promotionDeactivate | POST | /v1/promotions/:promotionId/deactivate | host | — |
| promoValidate | POST | /v1/checkout/promo/validate | user | — |

- `PromotionDTO`: `echo_id, kind: percent|amount|comp, value, code?,
  starts_at, ends_at, max_redemptions, redeemed_count, status`.
- **Presale/promo-code checkout integration is INCLUDED** as `promoValidate`
  only: it prices a code against an event
  (`{ valid, discount_cents, reason? }`) and `POST /v1/checkout/intents`
  (v1.0) gains an optional `promo_code` body field — the intent's pricing
  block already carries the result, so no v1.0 response shape changes.
  Full presale windows/queues are **DEFERRED to v1.2** (note: the frontend's
  `presaleService` is display-only today; no locked flow exists to encode).

## 5. Ticket transfer (Phase 8)

| Key | Method | Path | Scope | Idem |
|---|---|---|---|---|
| transferCreate | POST | /v1/tickets/:ticketId/transfers | user | ✅ |
| transferClaim | POST | /v1/transfers/:transferId/claim | user | ✅ |
| transferCancel | POST | /v1/transfers/:transferId/cancel | user | ✅ |
| transfers | GET | /v1/me/transfers | user | — |

- `TransferDTO`: `echo_id, ticket_id, direction: outgoing|incoming, recipient
  (phone/email/echo user ref), status: pending|claimed|canceled|expired|
  returned, created_at, expires_at`.
- Locked business rules encoded server-side: transfers disabled 60 min before
  event start (BL-10); unclaimed transfers auto-return after 24 h (BL-12,
  expiry worker); refund eligibility follows the ticket. Ownership conflicts
  resolve by **server timestamp** (v1.0 rule restated). Credential rotation:
  claiming a transfer revokes the sender's credential immediately.

## 6. Refunds (Phase 8; policy snapshot exists from Phase 3)

| Key | Method | Path | Scope | Idem |
|---|---|---|---|---|
| refundRequest | POST | /v1/tickets/:ticketId/refunds | user | ✅ |
| refundStatus | GET | /v1/refunds/:refundId | user | — |
| hostRefundIssue | POST | /v1/host/tickets/:ticketId/refunds | host | ✅ |

- Refund eligibility is computed against the **policy snapshot taken at
  publish** (never the live policy). `RefundDTO`: `echo_id, ticket_id,
  amount_cents, status: requested|approved|processing|refunded|denied,
  reason, requested_at, resolved_at?`. Stripe `charge.refunded` webhook (v1.0
  S-05) drives terminal state. Event cancellation triggers bulk refunds via
  `hostEventCancel` — individual rows still appear in this resource.

## 7. ECHO'd reflections (Phase 8)

| Key | Method | Path | Scope | Idem |
|---|---|---|---|---|
| echodCreate | POST | /v1/events/:eventId/echod | user | ✅ |
| echodUpdate | PATCH | /v1/echod/:echodId | user | — |
| echodForEvent | GET | /v1/events/:eventId/echod | public | — |
| echodMine | GET | /v1/me/echod | user | — |
| echodMediaUploadUrl | POST | /v1/echod/media/upload-url | user | — |

- `EchodDTO`: `echo_id, event_id, rating, tags[], text?, media[],
  visibility: public|attendees|private, created_at`. Only verified attendees
  (scanned-in tickets) may post. Media via signed upload URLs (size limits,
  scan, retention policy per the compliance section of the master plan).
  Public reads respect visibility + Social Energy doctrine (aggregates are
  labels, not counts).

## 8. Notifications (Phase 8)

| Key | Method | Path | Scope | Idem |
|---|---|---|---|---|
| pushTokenRegister | POST | /v1/me/push-tokens | user | — |
| pushTokenRevoke | DELETE | /v1/me/push-tokens/:tokenId | user | — |
| notificationFeed | GET | /v1/me/notifications | user | — |
| notificationRead | POST | /v1/me/notifications/:notificationId/read | user | — |
| notificationReadAll | POST | /v1/me/notifications/read-all | user | — |
| notificationPrefs | GET | /v1/me/notification-preferences | user | — |
| notificationPrefsUpdate | PATCH | /v1/me/notification-preferences | user | — |

- The 12 locked campaign triggers are **server-owned rules** — there is no
  client API to fire campaigns; the server decides, honoring quiet hours
  (per-user timezone) and per-campaign preference toggles exposed via
  `notificationPrefs`. `NotificationDTO`: `echo_id, kind, title, body,
  deeplink, read, created_at`.

## 9. Payouts — Stripe Connect (Phase 7)

| Key | Method | Path | Scope | Idem |
|---|---|---|---|---|
| payoutOnboardingStart | POST | /v1/host/payouts/onboarding | host | ✅ |
| payoutOnboardingStatus | GET | /v1/host/payouts/onboarding | host | — |
| payoutAccount | GET | /v1/host/payouts/account | host | — |
| payouts | GET | /v1/host/payouts | host | — |
| payout | GET | /v1/host/payouts/:payoutId | host | — |

- Onboarding returns a Stripe-hosted onboarding link
  (`{ onboarding_url, expires_at }`); status mirrors Connect account state
  (`requirements_due[]`, `charges_enabled`, `payouts_enabled`). Payout math is
  server-side only; `PayoutDTO`: `echo_id, event_id?, amount_cents, currency,
  status: pending|in_transit|paid|failed, arrival_date, created_at`.

## 10. Insider program (Phase 8)

| Key | Method | Path | Scope | Idem |
|---|---|---|---|---|
| insiderApply | POST | /v1/insider/applications | user | ✅ |
| insiderStatus | GET | /v1/insider/me | user | — |
| insiderMissions | GET | /v1/insider/missions | user | — |
| insiderMissionAccept | POST | /v1/insider/missions/:missionId/accept | user | ✅ |
| insiderMissionSubmit | POST | /v1/insider/missions/:missionId/submit | user | ✅ |
| insiderFeedback | POST | /v1/insider/feedback | user | ✅ |
| insiderLedger | GET | /v1/insider/ledger | user | — |

- Backs the 8 tables from the build notes. Mission verification is
  **signal-based server-side** (scan-ins, purchases, referral attribution) —
  submissions carry evidence refs, never self-attested completion. The credits
  ledger is append-only with server-enforced abuse caps;
  `LedgerEntryDTO`: `echo_id, kind: earn|redeem|adjust, amount, mission_id?,
  balance_after, created_at`.

## 11. Nonprofit verification & donation campaigns (Phase 7)

| Key | Method | Path | Scope | Idem |
|---|---|---|---|---|
| nonprofitVerify | POST | /v1/host/nonprofit/verification | host | ✅ |
| nonprofitVerificationStatus | GET | /v1/host/nonprofit/verification | host | — |
| donationCampaignCreate | POST | /v1/host/events/:eventId/donation-campaigns | host | ✅ |
| donationCampaignUpdate | PATCH | /v1/donation-campaigns/:campaignId | host | — |
| donationCampaign | GET | /v1/donation-campaigns/:campaignId | public | — |

- Verification via EIN lookup (`{ ein }` → async check → `verified|rejected`
  + registry name). Verified nonprofits get the platform-fee waiver applied by
  the Phase 3 pricing engine (processing fees always apply — locked fee
  model). Donations remain separate transactions with campaign attribution
  (v1.0 S-05 rule); campaign public reads expose progress as configured by the
  host, donor identities never.

---

## Explicitly deferred to v1.2 (not silently dropped)

- Admin console surfaces (application review, trust queues beyond the v1.0
  risk feed, campaign administration).
- Full presale windows/queues + Fair-Queue edge tokens (see §4 note).
- Google Wallet passes (Apple-first per Phase 4).
- Web platform / SEO event pages API.

## Open questions to resolve at lock

1. §2 `flyerExtract` confidence threshold: server-owned constant or served via
   `/v1/config/public`? (Recommend config — the app already branches on it.)
2. §5 transfer recipient addressing: phone+email only, or ECHO user search?
   (Recommend both; user search requires privacy review.)
3. §8 quiet hours default window (recommend 22:00–09:00 local) — product call.
4. §10 insider mission catalog authoring: admin API (v1.2) vs seeded data for
   launch. (Recommend seeded for Phase 8.)
