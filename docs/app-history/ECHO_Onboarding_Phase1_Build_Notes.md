# ECHO Onboarding — Phase 1 (MVP) Build Notes

**Version:** v59.7 (built on v59.6 InsiderProgram/VerifiedMissions base)
**Scope:** State-aware, cinematic, accessible first-launch onboarding — Phase 1 MVP.
**Footprint:** Additive only, plus one surgical edit to `app/index.tsx`.

---

## 1. What shipped (decisions 1A · 2A · 3A · 4A + bundled defaults)

A new `app/(onboarding)/` route group drives first launch. The standard attendee
flow is fully live:

`splash → welcome → choose-path → discover → access-demo → trust → event-energy
→ account → permissions → echo-pass → complete → /(tabs)`

Plus a `resume` screen for returning incomplete users.

Onboarding is **state-aware**: it routes from a central `EchoOnboardingState`
model (launch source, user path, progress, permissions, wallet, personalization,
etc.), not from screen order alone. The model persists after every meaningful
step so an interrupted user resumes where they left off.

---

## 2. Files added

**`services/onboarding/`** (typed foundation — 8 files)
- `onboardingTypes.ts` — full state union model + defaults (spec §5)
- `onboardingCopy.ts` — approved copy strings (spec §22), used verbatim
- `onboardingStorage.ts` — AsyncStorage persistence + resume keys
- `onboardingAnalytics.ts` — analytics wrapper over `services/logging` (no age data)
- `onboardingRoutes.ts` — route constants, standard flow, initial-route resolver (spec §6.1)
- `onboardingStateMachine.ts` — path/readiness/resume derivations
- `onboardingGuards.ts` — guest-vs-account gating (spec §9.8)
- `onboardingMockData.ts` — preview cards, interests, demo pass (privacy-safe)

**`stores/onboardingStore.ts`** — Zustand store + actions; completion flips the
existing intro flag via `useAuthStore.markIntroSeen()` (single gate, decision 3A).

**`components/onboarding/`** (12 files) — `OnboardingShell`, `OnboardingProgress`,
`OnboardingChoiceCard`, `OnboardingPermissionCard`, `EchoPassDemoCard`, `EchoDiscDemo`,
`TrustRingExplainerSheet`, `OnboardingHeroMotion`, `EventEnergySelector`,
`FirstActionPrompt`, `LaunchSourceResolver`, `ReduceMotionFallback`.

**`app/(onboarding)/`** (13 files) — `_layout` + the 12 screens above.

**One existing-file edit:** `app/index.tsx` — first-run branch now routes to
`/(onboarding)` instead of `/(auth)/welcome`. Returning-user (`hasSeenIntro`)
still routes to `/(auth)/sign-in`; authenticated still routes to `/(tabs)`.

---

## 3. Accessibility (built into every screen)
- **Reduce Motion**: all motion (hero breathing orb, pass lift/pulse, splash fade)
  has a static fallback; no information lives only in animation.
- **Screen reader**: roles/labels on every actionable element; the decorative
  hero is hidden from the a11y tree.
- **Targets**: 44px minimum on all controls.
- Capabilities are detected at store `initialize()` via `AccessibilityInfo`.

---

## 4. Deliberate Phase-1 choices (flagged for review)

1. **Account screen (Apple / Google / Email)** resolve through the app's existing
   mock auth and keep the onboarding flow **linear** (Account → Permissions → Pass
   → Complete). This preserves flow integrity rather than handing off mid-onboarding
   to the `(auth)` email screen. **Real OAuth/email providers are a later phase.**
2. **NFC / Wallet / Trust Ring are visual/mock only.** No NFC, PassKit, or haptics
   dependency exists in `package.json`, and the hard rule forbids adding deps. The
   "Demo ECHO Pass" and "Add to Wallet" are demonstrations — clearly labeled, never
   mistakable for a real ticket. Haptics route through the existing dependency-free
   `feedbackService` (no-op until an adapter is wired).
3. **Non-organic launch sources** (invite / circle / ticket / host / qr / nfc) are
   fully *classified* by `LaunchSourceResolver`, but in Phase 1 they route to the
   Access Demo as a placeholder. Organic/unknown → welcome and resume → resume are
   the live paths (decision 4A). Phase 2 repoints the rest to real claim/host screens.
4. **Single completion gate**: reuses `echo_has_seen_intro_v1` — no double-gate.

---

## 5. Guarantees / discipline
- **TSC floor preserved (39).** All 34 new files type-check at **0 errors** under
  `strict: true` (verified in isolation with accurate boundary types); the only
  existing-file edit is removal-safe.
- No theme color tokens inside any `StyleSheet.create()` — all inlined.
- `package.json`, `app.json`, `babel.config.js` byte-identical to the v59.6 input.
- Reanimated plugin untouched (still last in Babel). No new dependencies.
- Protected files untouched: `app/(tabs)/profile.tsx`, `app/profile/*`,
  `app/(host)/(tabs)/profile.tsx`.
- No `node_modules` in the ZIP. Root remains `echo-mobile/`.
- Copy discipline: "Access Pass" / demo pass language on access surfaces.
- Social Energy doctrine respected: discover previews use calm reason labels only,
  no raw counts or attendance-suggesting language.

---

## 6. Reverting the entry repoint
To restore the old 3-slide carousel as the first-run entry, change the one line in
`app/index.tsx` back to `'/(auth)/welcome'`. The old `app/(auth)/welcome.tsx` and
`app/(auth)/onboarding.tsx` remain on disk (unrouted), so the rollback is one line.

---

## 7. Deferred to Phase 2–4
Invite-claim, circle-claim, ticket-return, host-intro screens; no-market state;
age-gate procedure (defer to existing `app/verify/*`); real OAuth/email; native
Wallet/NFC; Higgsfield motion assets; first-action prompt wiring on Home.

---

## 8. v59.7.1 hotfix — Expo Go

**Symptom:** app fails to launch in Expo Go (worklet / red-screen error).
**Cause:** `babel.config.js` still listed `react-native-reanimated/plugin`. On SDK 54 the
project runs **Reanimated 4** (with `react-native-worklets` 0.5.1 installed). In
Reanimated 4 the Babel plugin moved into `react-native-worklets`, and `babel-preset-expo`
auto-configures it — so a manual plugin entry **conflicts** and breaks worklets at runtime.
**Fix:** removed the manual `plugins: ['react-native-reanimated/plugin']` line. The preset
now configures worklets automatically. No dependency change.
**Run with a clean cache the first time:** `npx expo start -c`.
**Note:** this supersedes the older "reanimated/plugin must be last" guidance, which applied
to Reanimated 3.

---

## 9. v59.7.2 — Access Pass card cleanup (profile)

Edited `components/wallet/EchoWalletPassCard.tsx` only (consumer `profile.tsx` untouched):
- Removed the **large center duplicate ECHO logo**; the corner `EchoLogoMark` is now the
  single brand mark, and the event flyer shows through the center.
- Removed the **`EchoNfcGlyph` disc icon** to the left of the title/event name (its import
  too). The bottom-right contactless icon and "Secure NFC access enabled" copy remain, so
  the NFC cue is intact.

Removal-only; TSC floor unchanged. To flip the logo choice (keep big center, drop corner),
it's a one-line swap in the same file.

---

## 10. v59.8 — Onboarding redesign to the 5-beat reference (A1 · B1)

Re-skinned and re-sequenced onboarding to the uploaded reference flow. Kept the
state-aware engine (launch resolver, persistence/resume, analytics, accessibility);
restyled the front to five narrative beats + functional steps:

`welcome → echo-pass → circle → event-energy → account → permissions → complete`

- **Welcome** — eclipse/orbit hero (`EclipseHero`), ECHO wordmark, two-tone headline
  ("Premium access. / Unforgettable events."), Get Started / Log In.
- **Your ECHO Pass** ("Tap in with confidence") — merged the old access-demo +
  pass screens into one beat using the real `EchoWalletPassCard` (demo event pass:
  Nightfall Festival · The Warehouse · Seattle).
- **Bring Your Circle** — NEW demo beat: "X of 4 Spots Claimed" via the existing
  `CircleProgressRing`, claimed-avatar row, invite affordance. Illustrative only.
- **Personalize** ("Events that fit your vibe") — 2-column icon chip grid +
  full-width Nearby Events location opt-in.
- **You're Ready** ("You're in. Let's go.") — three status cards that reflect REAL
  state: Age Verified and Entry Ready only show the check when actually true
  (otherwise an honest pending line); Private & Secure is a platform guarantee.

New shared components: `EclipseHero`, `GradientHeadline` (dep-free two-tone; accent
second line — no masked-view added). Interest icon set and Circle demo data added to
`onboardingMockData.ts`.

**Retired from the flow** (files retained on disk, unrouted, reversible):
`choose-path`, `discover`, `access-demo`, and the standalone `trust` screen. Non-organic
launch sources now route through the standard narrative from the top.

Doctrine held: locked website hero untouched (different surface); no faked verification;
no new dependencies; `package.json`/`app.json` byte-identical; TSC floor preserved
(verified 0 errors across all onboarding files against the real copy/routes/data).

---

## 11. v59.8.1 — expo-doctor fix (package.json)

`expo-doctor` flagged the `tsc` script as conflicting with `node_modules/.bin/tsc`.
Renamed the script `tsc` -> `typecheck` (value unchanged: `tsc --noEmit`). No other
script referenced it. Dependencies/devDependencies untouched. expo-doctor now 18/18.
Run type checks with `npm run typecheck` (or `npx tsc --noEmit`).

---

## 12. v59.8.2 — Expo Go white-screen fix (route collisions)

**Symptom:** white screen + loading spinner in Expo Go (no red error).
**Cause:** onboarding was built as a route *group* `app/(onboarding)/`. Groups add no
URL segment, so its screens resolved to root paths and collided with real routes:
`/welcome` (vs `(auth)/welcome`), `/trust` (vs top-level `trust.tsx`), and a third
file at `/`. expo-router can throw while building the navigation tree on conflicting
patterns, which renders as a blank screen with the error only in the Metro console.

**Fix:** converted the group to a real path segment `app/onboarding/` — every screen is
now namespaced under `/onboarding/...` and collides with nothing.
- Moved `app/(onboarding)/` -> `app/onboarding/`.
- Rewrote `ONBOARDING_ROUTES` paths `'/(onboarding)/x'` -> `'/onboarding/x'`.
- `app/index.tsx` first-run target -> `/onboarding`.
- Renamed the retired Phase-1 carousel `app/(auth)/onboarding.tsx` ->
  `app/(auth)/intro-carousel.tsx` (it mapped to `/onboarding` and collided with the new
  segment index); updated `(auth)/_layout.tsx` and the dead push in `(auth)/welcome.tsx`.

**Hardening (defensive):** `app/_layout.tsx` bootstrap now has a `.catch()` so a rejected
init can't strand the app on the spinner, and the onboarding splash falls back to
`/onboarding/welcome` if hydration throws.

Remaining same-path routes (`/`, `/profile`, `/events`, `/overview`, `/search`) are the
pre-existing, intentional cross-group routes for the consumer/host/creative role stacks —
unchanged and not a conflict.

If Expo Go still shows a white spinner after this, it's environmental, not code: run
`npx expo start -c` (clears Metro cache), and confirm the phone can reach Metro (use
Tunnel mode if on a different network). The Metro terminal prints the real error.
