# ECHO v59.3 — Polish Pass Spec

**Base:** v59.2 Balanced Homepage
**Date locked:** Jun 6, 2026
**Scope:** Six surgical fixes, no feature drift.

---

## 1. Round 1 & Round 2 — Locked Decisions

| # | Decision | Choice |
|---|----------|--------|
| Q1 | Search header architecture | **1A** — Absolute overlay + `paddingTop: headerHeight` on ScrollView |
| Q2 | Home screen inline title | **2B** — "Discover" + "Events curated for you" |
| Q3 | Bottom nav hide threshold | **3B** — ~10% screen height (mirrors top header hook) |
| Q4 | Bottom nav re-show trigger | **4A** — 150 ms idle timer after last scroll event |
| Q5 | Bookmark pulse visual | **5C** — Halo ring expansion ×3 |
| Q6 | Pulse trigger scope | **6B** — Any bookmark-add anywhere in app |
| Q7 | Filter exit interaction | **7C** — X inside input AND sticky "Clear all" pill |
| Q8 | `21+` chip placement | **8C** — Move out of intent row, into narrow block; replace intent slot with "Free" |
| Q9 | `21+` chip behavior | **9B** — Sticky toggle, integrates with `FilterModal.age`, cleared by Q7 |

---

## 2. Root-Cause Findings

### 2.1 Search title cut-off ("Searcn")
Not a paddingTop issue. The `screenTitle` style at `fontSize: 32, fontWeight: '900', letterSpacing: -0.7` ships **without an explicit `lineHeight`**. React Native computes default lineHeight tighter than the ascender height of heavy/900-weight fonts, clipping the top stroke of every letter. **Fix:** add `lineHeight: 40` to screen-title styles wherever they appear.

### 2.2 Home bottom-clip on trending row
`<View style={{ height: 118 }} />` spacer (index.tsx line 138) is ≤ tab bar real estate on tall iPhones (`bottom: max(insets.bottom, 12) + 68 height + 22 shadow radius` ≈ 124–140 px). **Fix:** raise to 148 px.

### 2.3 Search top-of-screen occlusion
Search renders `ModeSwitchHeader` inline (not absolute) — when fade fires, the header occupies layout space until fully hidden. Inconsistent with Home. **Fix per 1A:** make Search overlay absolute and add matching `paddingTop: headerHeight` to its ScrollView.

---

## 3. File-by-File Change List

### 3.1 NEW — `stores/uiStore.ts`
Lightweight UI ephemeral state.
```ts
interface UIState {
  tabBarVisible: boolean;
  setTabBarVisible(v: boolean): void;
  bookmarkPulseToken: number;
  triggerBookmarkPulse(): void;
}
```
Not persisted. Pure session memory.

### 3.2 NEW — `components/navigation/useEchoTabBarVisibility.ts`
Mirrors `useEchoHeaderVisibility` but writes to `uiStore.tabBarVisible`.
- Hide trigger: `y > windowHeight * 0.10` AND active scroll delta
- Show trigger: 150 ms idle timer after last `onScroll` event
- Auto-show whenever `y < 12`
- Returns `{ onScroll, reset }`. `reset()` forces visible on unmount.

### 3.3 MODIFIED — `stores/eventStore.ts`
`toggleSaved` now detects ADD (not REMOVE) and calls `useUIStore.getState().triggerBookmarkPulse()`. Single line inserted after the `set({ savedIds: next })` call. Remove case is silent.

### 3.4 MODIFIED — `components/navigation/GradientTabIcon.tsx`
New optional prop `pulseToken?: number`. When token increments, run halo animation:
- Sequence of 3 beats
- Each beat: scale 0.6 → 1.6, opacity 0.55 → 0, duration 280 ms
- Inter-beat gap: 60 ms
- Implementation: `Animated.sequence([beat, gap, beat, gap, beat])`
- Halo View: absolute, behind icon, circular, accent color from gradient stops (#7B4DFF base)
- `useNativeDriver: true` for both scale and opacity

### 3.5 MODIFIED — `app/(tabs)/_layout.tsx`
Replace static `Tabs` with `Tabs tabBar={(props) => <EchoAnimatedTabBar {...props} pulseToken={...} />}`.
`EchoAnimatedTabBar` is an inline component that:
- Subscribes to `uiStore.tabBarVisible`
- Wraps `<BottomTabBar />` (from `@react-navigation/bottom-tabs`) in `Animated.View`
- Animates `opacity 1↔0` and `translateY 0↔120` over 220 ms
- `pointerEvents='none'` when hidden
- Passes `bookmarkPulseToken` to wallet tab via custom prop on the tab icon callback (achieved by reading the token in the wallet's `tabBarIcon` lambda directly via `useUIStore`)

### 3.6 MODIFIED — `app/(tabs)/index.tsx` (Home)
- Add inline title block at top of ScrollView (after `paddingTop: headerHeight`):
  ```
  Discover     (H1, 32/40)
  Events curated for you   (caption, textMuted)
  ```
  Same lineHeight fix applies.
- Combine existing `handleHeaderScroll` and new `useEchoTabBarVisibility().onScroll` into one `handleScroll`.
- Bottom spacer: 118 → 148.
- On unmount: call `tabBarVisibility.reset()` (and `setTabBarVisible(true)`) so other tabs aren't stuck hidden.

### 3.7 MODIFIED — `app/(tabs)/search.tsx`
**Header (1A):**
- Make `ModeSwitchHeader` overlay absolute (matches Home pattern).
- Add `paddingTop: headerHeight` to ScrollView `contentContainerStyle`.
- Add `lineHeight: 40` to `styles.screenTitle`.

**Intent row (8C):**
- Remove `{ label: '21+', query: '21+ events near me' }` from `INTENT_CHIPS`.
- Replace with `{ label: 'Free', query: 'free events near me' }`.

**Narrow block (8C + 9B):**
- `21+` prepended to `NARROW_CHIPS` rendering as a special **toggle** chip, not a query-trigger.
- `isAgeRestricted = filters.age === '21'`
- Tap: `setFilters({ ...filters, age: isAgeRestricted ? 'all' : '21' })` then `runSearch(draftQuery)`.
- Active visual: filled white-08 bg → accent border (`borderColor: accent`), icon dot inside.
- Other narrow chips keep one-shot query behavior.

**Recent ways to search section (remove):**
- Delete lines 319–324 entirely (the `suggestionsBlock` View).
- `suggestions` state can stay (still used internally) but UI surface removed.

**Clear actions (7C):**
- **X icon** inside input row, just before mic button. Visible when `query || activeFilterCount > 0 || filters.age === '21'`. Tap → `handleClearAll()`.
- **Sticky "Clear all" pill** rendered just below the input row, above the intent chips. Visible under same condition. Pill renders inline (not absolute) so it scrolls with content. Style: bordered pill, accent-tinted background, `Clear all (3)` style copy showing active count.
- `handleClearAll()`:
  ```
  setQuery('')
  setDraftQuery('')
  setFilters(DEFAULT_FILTERS)
  inputRef.current?.blur()
  runSearch('')
  ```

---

## 4. Style Rules Honored

- No `c.xxx` theme tokens inside `StyleSheet.create()` blocks — all dynamic colors inline via `style={[styles.foo, { color: c.text }]}`.
- No emojis anywhere.
- All new icons use `Ionicons` or `EchoLineIcon` (existing patterns).
- New `useEchoTabBarVisibility` follows the exact API shape as `useEchoHeaderVisibility` for symmetry.
- ZIP root preserved as `echo-mobile/`. No `node_modules`.

---

## 5. Test Matrix (Manual Smoke)

| Scenario | Expected |
|----------|----------|
| Open Home cold | "Discover" + subtitle visible below brand bar, no clip |
| Scroll Home down past 10% | Bottom nav fades + slides down; top header fades |
| Stop scrolling on Home for 150 ms | Both bars re-appear |
| Bookmark a Trending card | Wallet tab icon halo-pulses 3× |
| Switch to Search tab while bar hidden | Bar restored visible |
| Open Search cold | "Search" + subtitle, no top clip |
| Tap "Tonight" chip | Results view opens, X visible inside input, "Clear all (1)" pill visible below |
| Tap X inside input | Returns to default Search view |
| Tap "21+" in narrow block | Chip shows active border, results refresh with age='21' |
| Tap "21+" again | Toggles off, age='all' |
| Open FilterModal → set 21+ there → close | Narrow `21+` chip shows active |
| Tap "Clear all" pill with 21+ active | Age resets to 'all', chip de-activates |
| Search default state | No "Recent ways to search" block visible |
| Intent row | 6 chips: Tonight, This Weekend, Near Me, Music, Food, Free (no 21+) |

---

## 6. Out of Scope (Defer)
- Animating tab bar hide via reanimated (using stock Animated for now — sufficient + zero risk to existing `react-native-reanimated/plugin` last-in-babel rule).
- Pulse on bookmark **removal** (per Q5/Q6 lock, removal is silent).
- Replacing chips beyond `21+`/`Free` swap.
- Profile / Wallet / Host screens (protected, untouched).
