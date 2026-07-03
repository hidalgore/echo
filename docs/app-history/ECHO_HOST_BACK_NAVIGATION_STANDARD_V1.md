# ECHO Host Back Navigation Standard v1

## Update
Pushed HOST-mode screens now expose a clear back affordance while primary HOST bottom-navigation screens remain clean.

## Rules
- Show a back button on HOST screens that are reached from another HOST screen or settings/action flow.
- Do not show a back button on primary HOST bottom-navigation screens: Dashboard, Events, Payouts, Profile, and Door.
- Door Mode remains intentionally immersive and excludes the back button.
- Pushed HOST screens using `ModeSwitchHeader` should pass `showBack`.
- Processing and success screens that do not use the standard header receive a top-left premium back control.

## Updated surfaces
- Host Notifications
- Edit Host Profile
- Host Passcode
- Payout Settings
- Social & Promotion
- Promotion History
- Host Support
- Flyer Processing
- Event Published Success

## Navigation behavior
- Standard pushed screens call `router.back()`.
- Event Published Success routes back to Host Events to avoid returning into the completed create flow.
