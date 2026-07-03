# ECHO v51 — Tokenize & Trim

**Build date:** May 26, 2026
**Previous build:** v50 (Event Details Video 30-Second Lock)
**Type:** Architecture cleanup + token layer refactor — zero feature changes, zero behavioral changes.

## Summary

v51 is a **structural** release: removes 22 confirmed-dead files (~1,730 lines), migrates 4 callsites off the legacy `roleStore` shim, and splits the monolithic theme module into a four-file pipeline (`brand → palettes → tokens → dynamicTheme`) so future brand changes and typeface swaps are single-file edits.

**Final stats:** 267 TS/TSX files (was 287), 41,324 lines (was 42,881), 95 components (was 97), 16 stores (was 17).

**Verified:** `tsc --noEmit` runs at parity with v50 baseline (45 errors total, zero introduced by this build; one pre-existing error fixed).

## Section 1 — Deleted dead code

### Services (8 files, ~840 lines)
- `services/ai.ts` — `queryAI`, `QUICK_ACTIONS`, `AI_CONFIG` never imported. The `QUICK_ACTIONS` in `app/(host)/(tabs)/overview.tsx` is a different, locally-redeclared array.
- `services/checkoutService.ts` — API scaffold; all checkout uses `pricingEngine`.
- `services/circleService.ts` — API scaffold; flow uses `circleMock` + `circleStateModel` + `circleStore`.
- `services/eventService.ts` — API scaffold; flow uses `mockEvents` directly.
- `services/ticketService.ts` — API scaffold; flow uses `ticketActions` + `ticketStore`.
- `services/transferService.ts` — API scaffold; flow uses `utils/transfer`.
- `services/walletService.ts` — API scaffold; wallet screen reads `ticketStore` directly.
- `services/notificationEngagementRuntime.ts` — four exports, zero callers.

### Components (9 files, ~960 lines)
- `components/host/CalendarPicker.tsx` (321 lines) — a locally-defined `CalendarPicker` inside `components/home/DatePillRow.tsx` shadowed the name. `formatDateUS` is also redeclared inline in `app/(host)/(tabs)/events.tsx`.
- `components/checkout/PaymentSheet.tsx` (535 lines) — dead code AND contained a stale `SERVICE_FEE_RATE = 0.10` constant. Would have caused a 10% fee discrepancy if ever wired back in. Deleting it removes a logic-drift risk.
- 7 unused barrel `index.ts` files: `calendar/`, `checkout/`, `host/`, `host/ai/`, `navigation/`, `shared/`, `verification/`. Code imports directly from each file.

### Other (5 files)
- `hooks/useDynamicTheme.ts` (1 line) — pass-through re-export. All callers use `theme/dynamicTheme` directly. `hooks/` directory removed (empty after deletion).
- `theme/colors.ts` (1 line) — pass-through re-export of `colors` from `tokens`.
- `theme/index.ts` (1 line) — unused barrel.
- `utils/id.ts` (3 lines) — `generateId` never called.
- `types/icons.ts` (9 lines) — `IconName` never imported.
- `stores/roleStore.ts` — see Section 2.

### Config (1 line)
- `CONFIG.SERVICE_FEE_RATE` — marked deprecated in v50; verified zero readers; removed.

## Section 2 — Store migration

4 files migrated from legacy `roleStore` shim to canonical `modeStore`:

- `components/navigation/ModeSwitchHeader.tsx`
- `services/logging.ts` — also removed a dangling `creativeReady` snapshot field that never existed on either store (was a silent `undefined`-emitting log).
- `app/(host)/(tabs)/settings.tsx`
- `app/(creative)/profile.tsx`

After migration, `stores/roleStore.ts` deleted. No behavior change — the shim was a literal re-export of `modeStore`.

## Section 3 — Theme architecture refactor

### Before (v50)
```
theme/
  tokens.ts          (172 lines — colors, gradients, typography, radii, sizes, spacing, motion, shadows — all hardcoded)
  dynamicTheme.tsx   (336 lines — light + dark palettes inlined alongside Provider)
  colors.ts          (1 line — orphan re-export, deleted)
  index.ts           (1 line — orphan, deleted)
  hostTokens.ts      (138 lines — host colors + duplicated host typography)
```

### After (v51)
```
theme/
  brand.ts           (75 lines)  — Single rebrand control surface
  typography.ts      (94 lines)  — Single typeface swap layer
  palettes.ts        (273 lines) — Light + dark palettes (pure data)
  tokens.ts          (104 lines) — Canonical (dark) shape — same exports
  dynamicTheme.tsx   (154 lines) — Provider + Context only
  hostTokens.ts      (118 lines) — Host colors; hostTypography re-exported
```

### Dependency graph
```
brand.ts ──────┐
               ├──→ palettes.ts ──→ tokens.ts ───┐
               │                                  ├──→ dynamicTheme.tsx ──→ App
typography.ts ─┤    palettes.ts ──→ dynamicTheme  │
               │                                  │
               └──→ tokens.ts (gradients)         │
                                                  ↓
                                              hostTokens.ts ──→ Host components
```

### Key contracts preserved
- `import { colors } from 'theme/tokens'` — works identically (now sources from `palettes.dark`).
- `import { typography } from 'theme/tokens'` — works identically (re-exported from `typography.ts`).
- `import { useDynamicTheme, useThemeColors } from 'theme/dynamicTheme'` — works identically.
- `Palette` type added to `palettes.ts`; `DynamicPalette` in `dynamicTheme.tsx` extends it with runtime-only fields (`tabActivePlate`, gradients, shadows).

### `brand.ts` — single-file rebrand
Edit any hex value here; all 155+ color consumers update automatically through the palette layer. Dark and light variants are tuned separately for AA contrast.

```ts
// brandDark — canonical
primary:   '#7B4DFF'    // dominant interactive accent
cyan:      '#20C7FF'    // (legacy: echoBlue)
magenta:   '#E63DAD'    // (legacy: echoMagenta/echoPink)
orange:    '#FF7A1A'    // (legacy: echoOrange — also age21)
gold:      '#FFC247'    // (legacy: echoGold)
```

Legacy names (`echoBlue`, `echoMagenta`, etc.) are kept as palette aliases — DO NOT introduce new code that uses the `echoX` names; use `brand.cyan`, `brand.magenta`, etc.

### `typography.ts` — single-file typeface swap
The `fontFamily` object is the only edit point for a typeface change:

```ts
export const fontFamily = {
  regular:  Platform.select({ ios: 'System', android: 'sans-serif',        default: 'System' }),
  medium:   Platform.select({ ios: 'System', android: 'sans-serif-medium', default: 'System' }),
  semibold: Platform.select({ ios: 'System', android: 'sans-serif-medium', default: 'System' }),
  bold:     Platform.select({ ios: 'System', android: 'sans-serif',        default: 'System' }),
  mono:     Platform.select({ ios: 'Menlo',  android: 'monospace',         default: 'monospace' }),
};
```

A `familyFor(weight)` resolver maps numeric weights to family slots, so when a brand face like Inter or Söhne arrives (where each weight is a separate file), every `<Text>` automatically picks the right file based on its `fontWeight`.

To roll a brand typeface:
1. Add font files to `assets/fonts/`.
2. In `app/_layout.tsx`, `useFonts({ 'Inter-Regular': require('...'), ... })`.
3. Edit five strings in `theme/typography.ts`:
```ts
export const fontFamily = {
  regular:  'Inter-Regular',
  medium:   'Inter-Medium',
  semibold: 'Inter-SemiBold',
  bold:     'Inter-Bold',
  mono:     'JetBrainsMono-Regular',
};
```
4. Zero consumer-file changes required. Host components included.

### `palettes.ts` — light + dark color sets
Pure data file. The `soft(hex, alpha)` helper builds transparent brand tints for soft pill backgrounds, so a brand color change auto-propagates to its `*Soft` variants.

## Section 4 — TypeScript verification

```
v50 baseline:   46 errors (all pre-existing — font weights '750'/'850', readonly props)
v51 build:      45 errors
new errors:      0
fixed errors:    1  (services/logging.ts — removed non-existent creativeReady field)
```

Zero new errors introduced. Every existing error in v50 is preserved in v51 except the one fixed inadvertently during the role-store migration.

## Section 5 — What did NOT change

- Profile screens (`app/(tabs)/profile.tsx` and all `app/profile/*`) — completely untouched per standing rule.
- All app routes, navigation paths, and screen behaviors — identical.
- Pricing engine (`services/pricingEngine.ts`) and fee model — identical.
- Circle state model and store — identical.
- Mode store capability derivation — identical.
- All visible colors, spacing, radii, motion, shadows — identical (only the source files moved).

## Section 6 — Known pre-existing issues (not fixed in v51)

These appear in the baseline tsc output and are inherited from v50:
- Non-standard font weights `'750'`, `'850'`, `'650'` used in `door.tsx`, `events.tsx`, `profile.tsx`, `wallet.tsx`, `TrendingEventCard.tsx`, `EchoWalletPassCard.tsx` — TS rejects them; runtime accepts them (RN snaps to nearest valid weight). Recommendation: replace with `'700'` or `'800'`.
- `services/logging.ts` references `circle.step`, `circle.claimedTickets`, `circle.remainingAmount` — these properties don't exist on `EchoCircle`. Logger silently emits `undefined` for them. Recommendation: replace with `circle.status`, `deriveCounts(circle).claimed`, etc.
- `services/mockEvents.ts` has untyped `status` strings (`'on_sale'` as `string`, not `EventStatus`).
- Various `app/(host)/*.tsx` prop-mismatch warnings.

None of these are regressions — all present in v50.

## Section 7 — Recommended next steps

1. **v52 — Type Hygiene Pass**: address the 45 pre-existing TS errors above. Estimated 60-90 minutes; low risk since the runtime is already working around them.
2. **Brand typeface rollout**: when Sevon picks a face, the rollout is one file (`theme/typography.ts`) + the font files.
3. **Light mode launch**: the palette is already complete and tuned for AA contrast; no additional theme work required to flip it on.
