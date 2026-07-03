# ECHO Search / ECHO AI Screen + Access Pass Background — V53 Build Notes

## Locked Product Direction

The Search tab is now a clean, intentional, intelligent discovery surface. It keeps the user-facing tab name as **Search** while giving the behavior of **Ask ECHO** underneath.

The screen should feel simple on the surface and intelligent underneath. ECHO AI quietly learns from interaction patterns and reduces the amount of manual searching required.

## Search Screen Buildout

Updated `app/(tabs)/search.tsx` with the locked ECHO AI direction:

- Header title remains **Search**.
- Subtitle: **Find the right event faster.**
- Search bar placeholder: **Ask ECHO or search events**.
- Visible intent chips are limited to the clean MVP set:
  - Tonight
  - This Weekend
  - Near Me
  - Music
  - Food
  - 21+
- Default screen now prioritizes **Picked for You** instead of a busy AI prompt wall.
- Picked for You subtitle is locked as **Curated by ECHO AI.**
- Picked cards display respectful reason labels instead of raw tracking language.
- Added **Ask ECHO to narrow it down** chips:
  - Under $50
  - Good for Groups
  - With Food
  - Donation Events
- Search result state uses a short ECHO AI summary instead of a chatbot thread.
- Empty state uses the locked clean copy: **No perfect matches yet.**

## Picked for You Intelligence

Added deterministic MVP scoring in `services/search.ts` through `getPickedForYouEvents()`.

The scoring simulates future ECHO AI behavior using rule-based signals:

- Category affinity
- Host affinity
- Price fit
- Weekend timing
- Donation availability
- Verified host / trending boost
- Group-friendly capacity
- Nearby market signal

This is intentionally MVP-safe. V2 should replace seeded mock behavior with real behavioral events:

- Scroll slowdown
- Card dwell time
- Event detail dwell time
- Clicks
- Saves/bookmarks
- Purchases
- Shares
- Search queries
- Host views/follows
- Hide / not interested actions

## Privacy-Safe AI Language

The UI must never show creepy tracking language.

Do not show:

- “You paused on this event for 12 seconds.”
- “We tracked your scrolling.”
- “You keep clicking nightlife events.”

Use:

- “Similar to events you viewed”
- “Based on your recent interest”
- “Matches your event style”
- “Popular near you”
- “Curated by ECHO AI”

## Why This Pick

Picked for You cards now support a small reason pill. When tapped, the screen opens a lightweight explanation sheet:

**Why ECHO picked this**

The sheet explains the pick using calm language, such as recent interest in live music, weekend timing, or verified hosts.

## Access Pass Background Rule

Updated `services/appleWalletPassService.ts`, `components/wallet/EchoWalletPassCard.tsx`, and `app/(tabs)/profile.tsx`.

Locked rule:

- If the user has a purchased active upcoming ticket, the ECHO Access Pass uses the flyer image from the next upcoming ticketed event as the pass background.
- If the user has no purchased active upcoming ticket, the Access Pass keeps the premium charcoal background.

Implementation details:

- Added optional `backgroundImageUrl` to `EchoWalletPass`.
- Added `getAccessPassForUser()` for Profile Access Pass preview.
- Updated Profile to derive its Access Pass from active tickets and event data.
- Updated `EchoWalletPassCard` to render an event flyer background with a dark scrim while preserving the ECHO mark, NFC action state, verification pill, and bottom event context.

## Expo Go / Something Went Wrong Findings

The uploaded project had an Expo SDK dependency mismatch:

- `react-native-worklets` was set to `0.5.2`.
- Expo SDK 54 expects `react-native-worklets` `0.5.1`.

This was corrected in `package.json` and `package-lock.json` by installing:

```bash
npm install react-native-worklets@0.5.1 --save-exact
```

`npx expo-doctor` then improved from 15/18 checks passing to 16/18 checks passing. The remaining two checks require access to Expo network endpoints and failed because the container could not reach Expo servers, not because of a local project validation failure.

Recommended local reset command:

```bash
rm -rf node_modules .expo
npm install
npx expo start --clear
```

If Expo Go still shows “Something went wrong,” verify:

1. Expo Go is updated and supports SDK 54.
2. The phone and computer are on the same network when using LAN.
3. Try Tunnel mode if LAN fails.
4. Clear Metro cache with `npx expo start --clear`.
5. Watch the Metro terminal for the actual red error message; the phone message alone is too generic.
