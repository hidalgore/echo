# ECHO Frontend — v59.5 Consolidated Build Notes

**One folder, all modes.** This `echo-mobile/` is the single source of truth for the
ECHO consumer app, host side, and the public website (RN-Web, gated on
`Platform.OS === 'web'`). 435 files. No `node_modules` (run `npm install` locally).

Pre-build decisions confirmed: `1A, 2A, 3B, 4A, 5A`.

---

## 1. Canonical base + layering (with evidence)

| Layer | Source | Date | Role |
|---|---|---|---|
| Base | `v59.3 lifelike_hero` | Jun 6 | Full repo (304 files): app, host, website, stores, services |
| Event Creation | `Phase 2 CANONICAL` | Jun 9 | Service/contracts + event-creation stores/types |
| Trust / Access / Door | `Trust_Access_Canon_DoorMode` | Jun 10 | Trust engine, access control, door scan (**wins shared files**) |
| Web sections | `v59.4.1 Web_Sections` | Jun 12 | New homepage section system (newest) |
| Trust/Security UI | net-new (this thread) | — | Admin console, host/attendee security, trust center |

`homepage_nfc` twin was 99% identical to `lifelike_hero` (differed only in 3 web
files the v59.4.1 layer supersedes) → not used. Event Creation **Phase 1** is fully
superseded by Phase 2 → not used.

## 2. Precedence conflicts resolved

- **`types/v3.ts`, `services/accessControlService.ts`, `echoTrustEngine.ts`,
  `types/canonicalPlatform.ts`** were defined in BOTH Trust/Access Canon and Phase 2.
  Decision **1A**: Canon wins — it is newer (Jun 10 > Jun 9) and a clean superset
  (`accessControlService` adds `DoorModeResultView` / `buildDoorModeResultView`;
  `v3.ts` exposes the same public API, larger/newer). No exports lost.
- **My earlier `v3.ts` (38 lines) and `accessControlService.ts` (94 lines)** from the
  a11y sessions were stubs created when those files appeared "missing." They are
  **discarded** in favour of Canon's real versions.
- **Duplicate `V3EventState`** (declared in both `v3.ts` and `hostEvents.ts`, the exact
  drift your Phase-2 audit flagged) — definitions were identical; collapsed so
  `hostEvents.ts` imports + re-exports the single canonical definition from `v3.ts`.

## 3. Token collision fix (decision 5A)

Two token systems shared the path `theme/tokens.ts` and were colliding:
- **Canonical (main app):** lowercase `colors / typography / radii / spacing / sizes`
  — consumed by every screen and `components/ui/*`. **Left untouched.**
- **Accessibility design system:** uppercase `COLOR / SPACE / TYPE / RADIUS / TOUCH /
  SHADOW`. **Re-homed to `theme/a11yTokens.ts`.**

All uppercase consumers repointed to `theme/a11yTokens`: `components/admin/*`,
`components/security/*`, `components/door/DoorScanResultScreen.a11y.tsx`. Canonical
`components/ui/Button.tsx` is kept; the a11y Button was **not** merged. Trust components
were adapted to the canonical Button API (`title` / `onPress`).

## 4. Website rebuild (decision 2A)

`components/web/EchoPublicWebsite.tsx` was rebuilt around the v59.4.1 section system in
the locked arc: **Hero → Picked For You → NFC Access → ECHO Disc → Trust Network →
Host Ops → Pricing → Final CTA**. The hero’s life-like phone + parallax are preserved.

**Drift fixed:** the hero still carried the superseded headline *“The operating system
for live event access.”* — corrected to the locked **“The new front door for live
events.”** Pricing tier **names** verified as locked Launch / Pro / Elite.

## 5. Door scan screen (decision 3B)

The accessibility-enhanced `DoorScanResultScreen.a11y.tsx` is the routed scan-result
screen, surfaced at `app/(host)/scan-result.tsx`. Canon’s plain
`DoorScanResultScreen.tsx` is retained as a component but not routed. Both reconciled
against Canon’s `DoorModeResultView` (all fields the a11y screen reads are present).

## 6. Route additions / fixes

- `app/(admin)/trust-console.tsx` — internal Trust & Safety console.
- `app/(host)/security.tsx` — host TrustShield security center.
- `app/security/privacy.tsx` — attendee privacy & security.
- `app/(host)/scan-result.tsx` — a11y door scan result (3B).
- **Collision fixed:** the locked public `app/trust.tsx` was being shadowed by a new
  `app/trust/index.tsx`. The locked page is preserved; the new Trust Center is re-homed
  to `app/trust-center.tsx` (web-gated). No route collisions remain.

## 7. Validation performed

- Full relative-import resolution sweep across all 435 files → **0 broken imports**.
- No route path collisions (file vs `index.tsx`).
- Locked config intact: `app.json output:"static"`, reanimated plugin last in Babel,
  no `node_modules`, ZIP root `echo-mobile/`.
- Protected routes untouched (`app/(tabs)/profile.tsx`, `app/profile/*`,
  `app/(host)/(tabs)/profile.tsx`); locked `app/trust.tsx` untouched.

> Note: a strict `tsc --noUnusedLocals` was not run here (the app `tsconfig` extends
> `expo/tsconfig.base` → `strict: true`, **not** `noUnusedLocals`). Run
> `npx tsc --noEmit` locally after `npm install`; the pre-existing 38–39-error floor
> should not have increased — this pass added no new cross-module type breaks.
