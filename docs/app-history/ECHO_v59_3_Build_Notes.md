# ECHO v59.3 — Polish Pass Build Notes

**Base:** v59.2 Balanced Homepage
**Scope:** Six surgical fixes, locked decisions, zero feature drift.
**TSC:** 39 errors → 39 errors (no regressions; baseline preserved).

---

## 1. Decisions Locked (Round 1 + Round 2)

`1A · 2B · 3B · 4A · 5C · 6B · 7C · 8C · 9B`

See `ECHO_v59_3_Polish_Pass_Spec.md` for the option text.

---

## 2. Files Changed

### New
- **`stores/uiStore.ts`** — ephemeral UI store. Holds `tabBarVisible` and a monotonic `bookmarkPulseToken`. Not persisted.
- **`components/navigation/useEchoTabBarVisibility.ts`** — hook mirroring `useEchoHeaderVisibility`. Threshold-based hide (≥10% screen height), idle-timer re-show (150 ms after last scroll event). Auto-shows when `y < 12`. Resets visibility on unmount.

### Modified
- **`app/(tabs)/_layout.tsx`** — replaced built-in tab bar with custom `EchoAnimatedTabBar` rendered via `tabBar` prop. Custom bar reads `uiStore.tabBarVisible`, animates `opacity 1↔0` and `translateY 0↔120` over 220 ms. Walks `state.routes` and renders each tab from the descriptor's `tabBarIcon`, so no new dependency on `@react-navigation/bottom-tabs` was introduced. Wallet tab forwards `pulseToken={useUIStore(s => s.bookmarkPulseToken)}` so the icon plays a halo when the token changes.
- **`app/(tabs)/index.tsx` (Home)** —
  - Imported `useEchoTabBarVisibility`, combined its `onScroll` with the existing `handleHeaderScroll` into `handleScroll`.
  - Inserted the inline H1 block `"Discover"` + subtitle `"Events curated for you"` as the first scroll content (Q2 = 2B).
  - Bumped bottom spacer from `118` → `148` to fully clear the floating tab bar on tall iPhones.
  - Added `headerCopy / screenTitle / screenSubtitle` styles with explicit `lineHeight: 40` to prevent heavy-weight font clipping.
- **`app/(tabs)/search.tsx`** — see Section 3 (largest delta).
- **`components/navigation/GradientTabIcon.tsx`** — new optional `pulseToken?: number` prop. When the value increments, an internal `HaloPulse` component runs an `Animated.sequence` of three beats (scale `0.55 → 1.65`, opacity `0.55 → 0`, 280 ms each, 60 ms gaps). `useNativeDriver: true` throughout. Initial mount is skipped via a `firstRender` ref so the halo doesn't fire on app open.
- **`stores/eventStore.ts`** — `toggleSaved` now detects ADD vs REMOVE; if ADD, calls `useUIStore.getState().triggerBookmarkPulse()`. Lazy `require('./uiStore')` to keep stores decoupled and avoid any circular-import risk. Removes are silent (Q5/Q6 lock).

---

## 3. Search Screen Deltas

1. **Absolute overlay header (1A):**
   - `ModeSwitchHeader` moved out of inline layout, wrapped in an `Animated.View` styled with `headerOverlay` (`position: absolute, top: 0, left: 0, right: 0, zIndex: 10`).
   - ScrollView `contentContainerStyle` now `{ paddingTop: headerHeight, paddingBottom: 160 }` (matching Home's pattern; `headerHeight = insets.top + 84`).
2. **Title clipping fix (root cause):**
   - `styles.screenTitle` got `lineHeight: 40` to stop React Native clipping the top of `fontSize: 32, fontWeight: '900'` glyphs.
3. **Intent row (8C):**
   - Removed `21+` chip from `INTENT_CHIPS`; replaced with `Free` (`'free events near me'`).
   - Row still 6 chips wide: Tonight · This Weekend · Near Me · Music · Food · Free.
4. **Narrow block (8C + 9B):**
   - New leading **sticky toggle** chip rendered before the `NARROW_CHIPS.map(...)` output.
   - Bound to `filters.age`: `isAgeRestricted = filters.age === '21'`.
   - Tap calls `handleToggle21Plus()` which flips `age` between `'21'` and `'all'` and re-runs the search with the new filter.
   - Active state: tint background `rgba(32,199,255,0.14)`, border `rgba(32,199,255,0.42)`, white text, leading checkmark icon.
   - Reads/writes the same `filters.age` the `FilterModal` already uses, so toggling either UI is consistent.
5. **Recent ways to search — removed (per request):**
   - The `suggestionsBlock` JSX block was deleted from the default content. The `suggestions` state is preserved internally but no UI surface renders it.
6. **Clear actions (7C):**
   - `hasActiveSearchState = !!query || !!draftQuery || activeFilterCount > 0`.
   - **X icon** inserted as the first icon button inside the input row (left of mic). Only renders when `hasActiveSearchState` is true.
   - **Sticky "Clear all" pill** rendered just below the input glow, above the intent row. Shows `Clear all` or `Clear all (n)` when filter count > 0. Inline, scrolls with content.
   - Both controls call `handleClearAll()`, which clears `query`, `draftQuery`, resets `filters` to `DEFAULT_FILTERS` (which also wipes 21+), blurs the input, and re-runs the empty search.

---

## 4. Locked Rules Honored

- No `c.xxx` theme tokens inside `StyleSheet.create()` blocks. Dynamic colors inlined where needed (e.g. `[styles.screenTitle, { color: c.text }]` on Home).
- No emoji introduced anywhere.
- `react-native-reanimated/plugin` Babel position untouched.
- `app.json` `"output": "static"` untouched.
- No new dependencies added to `package.json`. The custom tab bar deliberately avoids `@react-navigation/bottom-tabs` so the build doesn't depend on transitive packages.
- ZIP root is `echo-mobile/`. No `node_modules` included.
- Protected screens (`app/(tabs)/profile.tsx`, `app/profile/*`, `app/(host)/(tabs)/profile.tsx`) — untouched.

---

## 5. Manual Smoke Test Plan

Run on iOS sim (iPhone 15 Pro) and any Android device.

| Step | Expected |
|------|----------|
| Cold-open Home | "Discover" H1 + subtitle render cleanly, no top clip |
| Scroll Home down past ~10% | Top header fades; bottom tab bar slides down + fades |
| Pause scrolling for 150 ms | Both bars re-appear |
| Bookmark any Trending card | Wallet icon plays 3-beat halo expansion |
| Tap Search tab | Bar restored visible; "Search" H1 renders cleanly, no top clip |
| Tap "Tonight" chip | X icon appears in input, "Clear all (n)" pill shows below |
| Tap X inside input | Returns to default search view, keyboard dismissed |
| Tap 21+ toggle in Narrow block | Chip shows active state, results refresh with `age: '21'` |
| Tap 21+ again | Toggles off, results return to no-age-filter |
| Open Filter Modal → set 21+ there → Apply | Narrow 21+ chip reflects active state |
| Tap Clear all pill | All filters reset (including 21+), default view restored |
| Verify default Search view | No "Recent ways to search" block anywhere |
| Verify intent row | 6 chips, ending with "Free", no "21+" |

---

## 6. Out of Scope / Deferred

- Reanimated-based animations (using stock `Animated` to stay risk-free vs the babel plugin order rule).
- Pulse on bookmark remove (locked silent per Q5/Q6).
- Touching protected profile screens.
- Hide-on-scroll for Search / Wallet / Profile (Home-only per Q3).
- The 24 `StyleSheet.create()` color-literal cleanups deferred from earlier sessions.
