# ECHO Host Bottom Padding + Door Mode Guardrails v1

## Host tab bottom padding
Updated primary Host Mode tab screens to preserve content above the floating bottom navigation.

Affected screens:
- `app/(host)/(tabs)/events.tsx`
- `app/(host)/(tabs)/payouts.tsx`
- `app/(host)/(tabs)/profile.tsx`

Standard:
- Scroll content bottom padding uses `insets.bottom + 120`.
- This prevents the final card/action row from being hidden behind the floating host tab bar.

## Payout hero readability
Updated the Payouts hero amount treatment so large payout totals remain readable:
- Single-line amount lock.
- `adjustsFontSizeToFit` with safe minimum scale.
- Increased weight, improved contrast, and subtle ECHO glow.

## Door Mode access guardrails
Door Mode is a critical live-entry surface and should not be casually opened outside operational windows.

Rules implemented:
1. Door Mode is inactive when the selected event is more than 2 hours before start time.
2. The locked state explains that Door Mode opens 2 hours before the event.
3. The locked state routes the host back to Events.
4. Door Mode brightness boost does not run while the screen is locked.
5. If the host has not created a Door Mode passcode, ECHO prompts them before entering Door Mode.
6. The passcode must be exactly 6 digits.
7. The passcode protects resume-from-pause behavior during live entry.
8. Door Mode brightness is only set to max after the screen is inside the valid operational window and a passcode exists.

Primary file:
- `app/(host)/(tabs)/door.tsx`
