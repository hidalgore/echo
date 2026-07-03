# ECHO v59.5 — Handoff

## What this build is
A single consolidated `echo-mobile/` containing **all three modes in one folder**:
consumer app (`app/(tabs)`), host (`app/(host)`), creative (`app/(creative)`), and the
public website (`components/web/*`, routed pages gated on `Platform.OS === 'web'`).
Edit everything from one tree; one `npm install`, one Metro.

## First run
```bash
cd echo-mobile
npm install
npx expo start        # press w for web, i / a for native
npx tsc --noEmit      # type check (expect the pre-existing ~38–39 floor, not higher)
```

## Folder map (high level)
- `app/` — expo-router routes: `(tabs)` consumer · `(host)` host · `(creative)` ·
  `(admin)` trust console · web pages (`trust.tsx`, `trust-center.tsx`, search, etc.)
- `components/web/` — website shell + `sections/` (v59.4.1 homepage arc)
- `components/door/` — `DoorScanResultScreen.tsx` (canon) + `.a11y.tsx` (routed, 3B)
- `components/security/`, `components/admin/` — trust/security surfaces
- `theme/tokens.ts` — canonical lowercase tokens · `theme/a11yTokens.ts` — a11y uppercase
- `services/`, `stores/`, `types/`, `data/`, `hooks/`

## Known-open items (not regressions — scoped follow-ups)
1. **Experience layer not present.** `experienceRecapService`, `nonprofitDonationService`,
   `echoCircleClaimService`, `experienceLayer` are referenced in the Phase-2 *audit notes*
   but were **not** in any uploaded ZIP (decision 4A: proceed without). They were not
   fabricated. Next build can author them from the audit-notes spec and wire:
   recap → attendee post-event + host closeout; donation card → `/checkout/[id]`;
   Circle claim window → Circle Manage / recipient screens.
2. **Door scan result is demo-wired.** `app/(host)/scan-result.tsx` renders the a11y
   screen with a representative `DoorModeResultView`. The live door flow
   (`app/(host)/(tabs)/door.tsx`) should navigate here with the real result per tap.
3. **Pricing subtitles** in `components/web/sections/PricingSection.tsx` reference legacy
   names parenthetically (“Launch (Starter)”). Tier **names** are locked-correct; left as
   shipped per “don’t redesign.” Flag if you want the subtitles dropped.
4. **Strict unused-locals.** The website rebuild may leave a few now-unused local helper
   functions in `EchoPublicWebsite.tsx`. Harmless under the current `tsconfig`
   (`noUnusedLocals` is off). Clean up opportunistically.

## Carry-forward locked rules (unchanged)
ZIP root `echo-mobile/` · no `node_modules` · `app.json output:"static"` ·
reanimated plugin last in Babel · no theme color tokens inside `StyleSheet.create()`
(static literals only) · protected: `app/(tabs)/profile.tsx`, `app/profile/*`,
`app/(host)/(tabs)/profile.tsx`, and the locked `app/trust.tsx` · no emoji in UI ·
TSC floor 38–39 (must not increase) · Social Energy floor “Early Atmosphere.”
