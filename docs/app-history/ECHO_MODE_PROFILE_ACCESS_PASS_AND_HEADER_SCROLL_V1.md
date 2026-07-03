# ECHO Mode Profile Access Pass + Header Scroll v1

## Profile Wallet Pass

ECHO Mode Profile includes an ECHO Access Pass card allowing the user to add the official ECHO card to Apple Wallet on iOS or Google Wallet on Android.

Pass behavior:
- Uses the official ECHO Access pass model.
- NFC is primary.
- QR remains hidden by default.
- Pass syncs to verified ECHO profile state.
- Profile card provides preview and native wallet handoff point.
- The pass is separate from event ticket passes.

## ECHO Mode Header Scroll Behavior

ECHO Mode tab headers should:
- Fade out after the user scrolls down at least 10% of screen height.
- Fade back in after the user scrolls upward at least 15% of screen height.
- Immediately return when the scroll position returns near the top.

Implemented through `useEchoHeaderVisibility` and applied to ECHO Home, Search, Wallet, and Profile screens.
