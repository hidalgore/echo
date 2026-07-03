# ECHO Event Creation V3 — Phase 1 Build Notes

**Base:** v59.3 (39 TSC errors)
**Phase:** 1 of 3 — Foundation (types, stores, services, utility updates)
**TSC:** 39 → 39 (baseline preserved; verified against pristine v59.3 extraction)
**Scope:** No screens, no UI components, no Edge Functions. Pure infrastructure.

---

## 1. Files in this ZIP

### New
- `types/v3.ts` — V3-specific types (lifecycle, scores, refund policy, presale, scheduling, RBAC)
- `stores/v3EventCreationStore.ts` — V3 flow state machine + publish readiness composer
- `services/refundPolicyEngine.ts` — preset → tier array, refund computation, legacy migration
- `services/flyerScoreEngine.ts` — 4-component Flyer Score (9B)
- `services/eventSuccessScore.ts` — ESS with divisor-of-available sub-scores (5A, 9A)
- `services/flyerScanService.ts` — Edge Function client (mock for Phase 1)
- `services/presaleService.ts` — Single-use token generation, validation, consumption
- `services/eventCancellationService.ts` — RBAC + refund batch computation

### Modified
- `types/hostEvents.ts` — Expanded `HostEventStatus` to V3 canonical set + legacy aliases + `normalizeEventStatus` helper
- `stores/eventDraftStore.ts` — Added `refundPolicy: RefundPolicy`, optional `publishDate` + `salesStartDate`. Kept deprecated `allowRefunds` for backward compat; setters sync both.
- `utils/dashboardScoring.ts` — Added R2 + R5 rename aliases (`computeEventOperationsScore`, `computeOperationalReadiness`) + NEW `computePublishReadiness` for 4-gate publish check
- `components/host/StatusBadge.tsx` — Extended `STATUS_CONFIG` to include V3 canonical states (scheduled, published, paused, ended, cancelled) so the Record<HostEventStatus> stays exhaustive

---

## 2. R1–R8 Resolution Status (see Locks v1.1)

| Resolution | Status |
|---|---|
| R1 — 7-screen deletion list | Documented (executed in Phase 2) |
| R2 — Coexist with rename | DONE (`computeEventOperationsScore` alias added) |
| R3 — Lifecycle migration | DONE (state set expanded, helper exposed, StatusBadge updated) |
| R4 — Event-floor + tier-override sales scheduling | Types ready, validation rule documented for Phase 2 |
| R5 — Readiness split | DONE (`computePublishReadiness` added; existing readiness aliased) |
| R6 — Refund schema migration | DONE (`migrateLegacyRefundFlag`, EMPTY_DRAFT defaults to 'balanced') |
| R7 — Custom publish modal | Phase 2 (component lives at `components/host/v3/PublishModal.tsx`) |
| R8 — Post-publish locks extended | Phase 2 (enforced inside `PublishModal` + event update guard) |

---

## 3. Doctrine Compliance — Verified

- ✅ Fee model canon untouched (`services/pricingEngine.ts`, `constants/config.ts`)
- ✅ Circle Spec v1.0 untouched (`services/circleStateModel.ts`, `stores/circleStore.ts`)
- ✅ NFC-primary doctrine preserved
- ✅ No-emoji rule honored across all V3 files
- ✅ "Reserve Access" attendee copy unchanged
- ✅ Protected screens not touched (`(tabs)/profile.tsx`, `(host)/(tabs)/profile.tsx`, `profile/*`)
- ✅ No new `package.json` dependencies
- ✅ `react-native-reanimated/plugin` Babel position untouched
- ✅ `app.json` `"output": "static"` untouched
- ✅ TSC baseline = 39 errors (no regression)
- ✅ ZIP root = `echo-mobile/`

---

## 4. Migration Window Notes

### Refund schema (R6)
`eventDraftStore.EventDraftForm.allowRefunds: boolean` is marked `@deprecated` but kept alive. The store now syncs both fields in both directions:
- `setAllowRefunds(v)` → also calls `setRefundPolicy(migrateLegacyRefundFlag(v))`
- `setRefundPolicy(p)` → also writes `allowRefunds = (any tier > 0%)`
- `loadFromEvent(source)` → uses `source.refundPolicy` if present, else migrates from `source.allowRefunds`, else defaults to `'balanced'`

Plan: V3.1 removes `allowRefunds` field entirely. Phase 2 screens read from `refundPolicy` directly.

### Lifecycle states (R3)
`HostEventStatus` is now a union of V3 canonical states + legacy aliases. `normalizeEventStatus(legacy) → V3` is exported for callers. Switch statements over the old set still compile because the legacy variants remain valid. Existing UI displays unchanged.

Plan: V3.1 drops the four legacy variants. All `services/mockEvents.ts` and DB rows will be migrated by then.

### Per-tier vs event-level sales (R4)
`TicketTier.salesStart`/`salesEnd` remain per-tier. `EventDraftForm.salesStartDate` is now event-level. Validation rule for Phase 2: `tier.salesStart >= event.salesStartDate`. Empty per-tier value inherits event-level.

---

## 5. Manual Smoke Test (Phase 1 only)

There are no new screens to test in Phase 1. The verifications below confirm Phase 1 didn't regress v59.3:

| Step | Expected |
|---|---|
| `npm install` | Succeeds, no new deps |
| `npx tsc --noEmit` | 39 errors (baseline preserved) |
| `npx expo start --tunnel --clear` | Boots clean |
| Open existing `(host)/create.tsx` manual wizard | Unchanged flow; refund toggle works |
| Toggle refund switch in create.tsx | `eventDraftStore.draft.allowRefunds` flips; `refundPolicy.presetId` syncs to 'balanced' ↔ 'strict' |
| Publish an existing draft via legacy flow | No regression; existing publish.tsx still works (Phase 2 replaces it) |
| Status badges across host dashboard | Render correctly for both legacy ('live'/'upcoming'/etc.) and V3 ('published'/'scheduled'/etc.) states |

---

## 6. Phase 2 Scope (Next Session)

**Screens (under `app/(host)/v3/`):**
- `entry.tsx` — Upload Flyer / Start From Scratch
- `upload.tsx` — Flyer upload with HEIC + size validation
- `scan.tsx` — AI scanning progress + inline error
- `review.tsx` — Field-by-field review w/ hard-block <70%
- `health.tsx` — Event Health Center (ESS + 4 sub-scores)
- `pulse.tsx` — Market Pulse (reuses `utils/schedulingIntelligence.ts`)
- `schedule.tsx` — 3-date scheduler + presale toggle
- `launch.tsx` — Launch Center (post-publish)

**Components (under `components/host/v3/`):**
- `PublishModal.tsx` — Custom bottom-sheet modal replacing `Alert.alert`
- `PresaleInviteSheet.tsx` — Reuses ECHO username search from `components/circle/CircleInviteSheet.tsx`
- `FlyerScoreBadge.tsx`, `ESSBadge.tsx`, `RefundPresetPicker.tsx`, `ReadinessGate.tsx`, `ConfidenceField.tsx`

**Route changes:**
- Delete 7 old screens (R1) from `app/(host)/`
- Add 8 new screens to `app/(host)/_layout.tsx`
- Repurpose `app/(host)/create.tsx` as "Start From Scratch" secondary entry (no flow changes)

**Mock data migration:**
- `services/mockEvents.ts`, `services/mockEventsNational.ts`, `services/mockHostEventSuite.ts` — migrate `allowRefunds` → `refundPolicy`

---

## 7. Phase 3 Scope (Future)

- Supabase Edge Functions (`scan-flyer`, `cron-publish-events`)
- DB migrations (`v3_event_creation.sql`)
- Real wiring (replace mock in `flyerScanService.ts`)
- Stripe refund API integration in `eventCancellationService.ts`
- pg_cron schedulers for publish/sales activation

---

## 8. Active Backlog (Round 10+ Items, Carried)

- Flyer Score weighting (equal vs weighted within 4 sub-components)
- Pricing Score algorithm details
- Competition Score algorithm details
- Market Pulse data-sufficiency threshold (≥10 events / 60d?)
- AI Vision retry/fallback policy
- Custom refund override permission (V3.1)
- Verified Host promotion path
- AI-suggested ticket structure UX
- Edge Function auth shape + retry policy
- NFC device provisioning first-time UX

---

*End of Phase 1 Build Notes.*

---

## 9. Phase 1 Enhancement Expansion — June 2026 Lock-In

This package has been updated to carry forward the locked ECHO decisions from previous build conversations without removing mock data or disrupting the current Phase 1 architecture.

### 9.1 Added Canonical Platform Types

Updated `types/v3.ts` with locked definitions for:

- **Access Pass language** — ECHO issues `Access Passes`, not generic tickets.
- **VIP vs General Admission scan differentiation** — GA green, VIP gold, Ultra VIP black+gold, Artist purple, Staff blue, Vendor orange, Press white, Security red.
- **Multi-zone checkpoints** — Main Entry, VIP Lounge, Meet & Greet, Backstage, After Party, Sponsor Lounge, Restricted Areas.
- **Guest Access Control** — Approved, Flagged, Security Hold, Denied; Event/Venue/Host/ECHO Trust restriction levels; required denial reasons; quiet alerts; audit trail; appeal eligibility.
- **ECHO Licensing** — Launch $29/mo, Pro $99/mo, Elite $299/mo; every paid host includes ECHO Disc Core entitlement; Disc Pro available at Pro/Elite level.
- **Scheduled Publish** — event can be created/configured now while public launch and ticket sales begin on host-selected dates.
- **Website v2 locks** — public homepage route `/`, host route `/host`, built inside Expo / React Native Web, host acquisition first, event discovery second, nonprofit support under For Hosts.
- **Web age verification handoff** — age verification must happen before payment; web pushes buyer to phone and returns to checkout.
- **Picked for You / Calm AI UX** — privacy-safe recommendation reason labels and ECHO AI curation copy.

### 9.2 Added Services

New files added:

- `services/scheduledPublishService.ts`
  - Validates publish date, sales start date, and event date.
  - Supports `publish_now` and `schedule_public_launch`.
  - Provides helpers for determining when the event becomes public and when sales open.

- `services/accessControlService.ts`
  - Produces Door Mode scan result copy, color tokens, haptics, and VIP arrival alert flags.
  - Handles duplicate attempts, guest access decisions, and zone restrictions.
  - Keeps staff-facing scan language immediate and clear.

- `services/echoLicensingService.ts`
  - Centralizes Launch / Pro / Elite tier definitions.
  - Provides feature checks and upgrade-target helpers.

- `services/echoWebsiteExperience.ts`
  - Locks public website structure and copy.
  - Keeps host acquisition as the first website priority.
  - Preserves nonprofit support as a supporting host section.

- `services/echoUxEnhancementRegistry.ts`
  - Registry of already-locked ECHO UX trends so the build does not drift into generic market-trend duplication.

### 9.3 Updated Stores

Updated `stores/eventDraftStore.ts`:

- Ticket tiers now carry `accessTierId`.
- Draft now carries `scheduledPublish` config.
- Draft now carries `guestAccessPolicy`.
- Readiness fields now include access-tier readiness.
- Reset/load migration preserves guest access and scheduled publish settings.

Updated `stores/v3EventCreationStore.ts`:

- V3 flow now stores `scheduledPublish` and validation result.
- Publish readiness now fails if scheduled publish validation fails.
- V3 flow now stores `guestAccessPolicy`.
- Added `setScheduledPublish` and `updateGuestAccessPolicy` actions.

### 9.4 Updated Mock Flyer Scan

Updated `services/flyerScanService.ts` mock extraction to better match flyer-first locked flow:

- Extracts title, date, time, venue, address, age, price, category, talent.
- Added access tier hint, sponsors, and contact/social handle fields.
- Keeps low-confidence hard-block behavior for host confirmation.

### 9.5 Website Updates Locked In

Website implementation should use this locked hierarchy:

1. Hero: **The operating system for live event access.**
2. Subcopy: **Sell smarter. Verify faster. Let guests tap in with confidence.**
3. Primary CTA: **Start Hosting**
4. Secondary CTA: **Explore Events**
5. Hero phone: ECHO Home / Discover screen
6. Floating cards: NFC Ready, 21+ Verified, ECHO Circle, Mobile Wallet
7. Main story: Create → Optimize → Sell → Verify → Scan → Report
8. Nonprofit support: supporting section under For Hosts, not the main homepage pillar

### 9.6 Claude Build Guidance

Claude should wire these additions into UI without removing existing mock data:

- Add Access & Admission builder to event creation.
- Add tier selection to ticket tier editor.
- Add Scheduled Publish controls to the schedule step.
- Add Guest Access Control toggles under Trust & Access.
- Add Door Mode result styling using `accessControlService.ts`.
- Add licensing gates using `echoLicensingService.ts`.
- Add public website route content using `echoWebsiteExperience.ts`.
- Add calm AI copy from `PICKED_FOR_YOU_REASON_LABELS`.

The build remains Phase 1 mock-first. Backend wiring, Supabase Edge Functions, real OCR, real scheduled cron jobs, and production licensing enforcement remain future integration work unless the full app/backend layer is attached.

---

# Phase 2 Canonical Expansion — PDF Merge Update

This package now includes the locked details from the Website V2 ERS, Trust & Access Control ERS, Access Control System v1 ERS, Claude Master Build Prompt, Event Creation V3 ERS, and prior ECHO chat-history locks.

## New canonical files

- `types/canonicalPlatform.ts`
  - ECHO Trusted Access Platform positioning
  - ECHO Trust hierarchy: Identity → Host → Venue → Event → Payment → Access → Hardware
  - EchoTrustEngine profiles and signals
  - Verified Venue Program types
  - One Subscription = One Verified Host Entity
  - Agency Workspace
  - Team Access RBAC matrix
  - Temporary Volunteer Pass
  - Trusted Device Network
  - Payout security 72-hour hold
  - Canonical AccessPass model
  - Signed credentials and NFC challenge-response config
  - Door Mode sessions, trusted scanners, emergency lockdown
  - EchoAuditRecord
  - Website V2 routes and drift-control questions

- `services/echoTrustEngine.ts`
  - Recommendation-only trust evaluation for users and hosts.
  - AI/trust output is advisory; humans make final deny/hold/reverse decisions.

- `services/echoAuditService.ts`
  - Immutable audit record builder.
  - Production must persist append-only records server-side.

- `services/accessPassService.ts`
  - Canonical Access Pass creation.
  - Signed credential contract.
  - NFC challenge-response placeholder; serial-number-only validation is explicitly disallowed for future architecture.

- `services/doorModeOperationsService.ts`
  - Door Mode session contract.
  - Trusted scanner device check.
  - 500ms scan latency acceptance helper.
  - Emergency lockdown builder.

- `services/websiteV2ContentService.ts`
  - Website V2 locked hero copy.
  - Hero cards.
  - Homepage section order.
  - NFC flow strip.
  - Journey steps.
  - Host Command Center mock metrics.
  - Locked copy library.

- `services/buildDriftControlService.ts`
  - Open questions and recommendations to avoid drift before Claude/frontend build-out.

- `docs/ECHO_Phase_2_Canonical_Build_Handoff.md`
  - Developer handoff summary with conflicts, recommendations, and remaining production gaps.

## Important lock updates

- Public website hero headline is now: `The new front door for live events.`
- Supporting platform copy remains: `The operating system for live event access.` when needed for investor/strategic context.
- ECHO remains host-first on the homepage with attendee value made obvious.
- NFC must appear above the fold and again as a dedicated product moment.
- Access Pass is the canonical credential object.
- Wallet-first, NFC-first, QR fallback remains locked.
- AI Trust Assistant is recommendations-only; humans make final decisions.
- Door Mode should target <500ms scan feedback.
- ECHO Disc Core remains passive NFC; Disc Pro owns advanced electronics, LED/camera, secure hardware features.

## Questions to confirm before full Phase 2 implementation

1. Keep public pricing names as Launch / Pro / Elite, despite Website V2 PDF saying Starter / Growth / Elite?
   - Recommendation: Yes. Licensing was previously locked.
2. Use `The new front door for live events.` as the public hero headline?
   - Recommendation: Yes. It is the locked Website V2 homepage copy.
3. Use hybrid language: Access Pass in access surfaces, ticket in buyer quantity/pricing surfaces?
   - Recommendation: Yes. It preserves user comprehension while keeping engineering precise.
4. Keep Disc Core passive and move advanced secure hardware to Disc Pro?
   - Recommendation: Yes. This preserves the low-cost onboarding hardware strategy.
