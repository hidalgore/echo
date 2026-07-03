# ECHO Host Dashboard Safe Bottom Padding v1

## Purpose
Host Dashboard content must remain fully visible above the floating Host bottom navigation.

## Locked implementation
- Dashboard ScrollView contentContainerStyle must include safe-area aware bottom padding.
- Required padding:
  `paddingBottom: insets.bottom + 120`

## Acceptance criteria
1. The bottom-most dashboard card is visible.
2. Content is not overlapped by the floating nav.
3. The user can scroll past the final card with breathing room.
4. Applies to `app/(host)/(tabs)/overview.tsx`.
