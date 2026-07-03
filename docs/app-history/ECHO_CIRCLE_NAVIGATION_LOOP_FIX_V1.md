# ECHO Circle Navigation Loop Fix v1

## Problem
Users could get caught in a loop while trying to invite friends because Circle routes used mixed push/replace behavior and invite screens could return users backward through checkout/success instead of forward to the Circle Hub.

## Locked route behavior

1. Checkout → Circle Invite must use `router.replace`, not `router.push`.
2. Circle Success → Circle Invite must include the active circle id in route params.
3. Circle Invite → Circle Hub must use `router.replace`, not `router.push`.
4. Circle Invite back button should return to the Circle Hub, not previous checkout/success screen.
5. Circle Hub → Circle Invite must pass the active circle id.
6. Circle Invite must validate that the route id matches the active store circle id.
7. Invite action must guard against double-tap navigation with `isNavigating`.
8. Send Invite CTA must disable when:
   - no friend is selected
   - navigation is already in progress
   - no open slots remain

## Canonical route chain

Checkout / Circle Success
→ `/circle/invite?id=[circle.id]`
→ `/circle/[circle.id]`

No back-stack loop should send the user back through checkout or success after invites are sent.
