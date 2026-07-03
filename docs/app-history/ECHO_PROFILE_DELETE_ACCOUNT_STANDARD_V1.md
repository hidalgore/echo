# ECHO Profile Delete Account Standard v1

## Purpose
ECHO mode Profile must allow users to scroll to the bottom and delete their account if they choose.

## Locked behavior
1. Delete Account appears at the bottom of the ECHO mode Profile screen.
2. The ScrollView must include enough bottom padding so Delete Account is fully reachable above the floating bottom navigation.
3. Delete Account must be separated from normal settings with an “Account Removal” area.
4. The action must open a two-step destructive confirmation modal.
5. Final confirmation requires typing DELETE.
6. Delete Account must not be placed near common settings actions where it can be tapped accidentally.
7. This belongs to ECHO attendee mode Profile, separate from Host mode profile controls.

## Current implementation
- `app/(tabs)/profile.tsx`
- Bottom padding: `150 + insets.bottom`
- Modal steps: confirm → type DELETE → deleteAccount() → sign-in
