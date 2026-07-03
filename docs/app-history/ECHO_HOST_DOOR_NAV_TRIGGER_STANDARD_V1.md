# ECHO Host Door Navigation Trigger Standard v1

## Purpose
Door Mode should appear in Host bottom navigation only when it is operationally relevant.

## Locked behavior
1. Door Mode icon appears in Host bottom navigation when a host event is:
   - currently happening, or
   - within 2 hours before event start time.
2. Door Mode icon is placed between Events and Payouts.
3. When no eligible event exists, Door Mode is hidden from the bottom navigation.
4. Eligible event selection prefers the earliest hosted event in the active 2-hour window.
5. Door route receives the eligible event id as a route param.

## Navigation order when Door is eligible
Dashboard → Events → Door → Payouts → Profile

## Navigation order when Door is not eligible
Dashboard → Events → Payouts → Profile
