# ECHO Door Mode Locked Operation Standard v1

## Purpose
Once Door Mode is initiated, it becomes a locked operational access-control surface. Hosts should not accidentally leave the screen through normal navigation while checking in attendees.

## Locked behavior
1. Door Mode screen must not show the normal app header.
2. Door Mode screen must not show the bottom navigation bar.
3. The only way to exit Door Mode is through the three-dot options menu.
4. Exit Door Mode requires an overlay confirmation.
5. Main Door Mode screen bottom CTAs:
   - Bottom-left: Close Event
   - Bottom-right: Pause Door / Resume
6. Close Event is a destructive event closeout action and requires confirmation.
7. Pause Door pauses scanning.
8. Resume requires the 6-digit Door Mode passcode.
9. The Door Mode passcode is set and managed in Host Mode Profile.
10. Resume is blocked when:
   - no passcode is set
   - passcode is not exactly 6 digits
   - passcode does not match the Host Profile passcode

## Navigation rule
Host tab layout may expose Door Mode when an event is live or within two hours, but the Door screen itself hides the tab bar.


## v1.1 Brightness + top-row layout + close-event routing

1. Door Mode requests maximum device brightness on mount.
2. Door Mode restores previous brightness when leaving the screen when brightness APIs are available.
3. 21+ badge moves to the upper-left corner and increases by 15%.
4. Three-dot options button sits in the same top row as 21+ and event title and increases by 10%.
5. Long event titles may wrap to two centered lines and shrink to fit full words.
6. Tap circle receives an embossed / 3D visual treatment:
   - stronger glow
   - raised shadow
   - highlighted top/left edge
   - darker bottom/right edge
7. Pause pill is gray while active.
8. Resume pill remains green.
9. Confirmed Close Event closes the event session and routes to Host Dashboard.


## v1.2 Brightness enforcement + stronger 3D emboss

1. Door Mode must request maximum brightness on screen mount.
2. Door Mode should re-assert max brightness shortly after mount to account for native/device settling.
3. Previous brightness should be restored when Door Mode unmounts if supported.
4. Tap target size must remain stable while the 3D visual effect is strengthened.
5. Emboss effect may be increased through:
   - stronger outer glow
   - stronger shadow opacity/radius
   - stronger top/left highlight
   - stronger bottom/right depth edge
6. Bottom CTAs should sit above the bottom edge with extra safe padding.


## v1.3 All-attendees closeout prompt

1. When all attendees are checked in, Door Mode asks whether the host wants to close the event.
2. Closing the event compiles analytics and attendee data.
3. Attendee list is marked as emailed to the host.
4. Reports become available in Payouts & Reports.
5. Confirmed closeout routes host back to Dashboard.
