# ECHO Host Door Mode Screen v2

## Purpose
Door Mode is the host-facing live entry screen. It is used to check in attendees by tapping an NFC phone or ECHO Disc in the circular target area.

## Locked header behavior
1. Header label next to hamburger must show:
   - `ECHO` in attendee mode
   - `HOST` in host mode
2. Do not show ECHO label in Host mode.

## Locked Door Mode design
1. Use a large central NFC target ring as the primary interaction.
2. The circular target is the scan area for tap phone / ECHO Disc.
3. Avoid duplicate information.
4. Screen hierarchy:
   - Event title
   - Venue
   - Date/time
   - NFC target ring
   - Checked In / Remaining counts
   - Scan status
   - Age restriction footer
   - Minimal secondary controls
5. Do not show long checklists during active scan state.
6. Ready state copy:
   - target: `TAP PHONE / OR DISC`
   - status: `READY`
   - NFC copy: `NFC ACTIVE`
7. Scanning, approved, denied, offline, paused, and closed are visual state changes on the same screen.

## Interaction rules
1. Tapping the target starts Door Mode from startup.
2. When ready, tapping the target simulates/initiates approved scan.
3. Denied test, Offline, Pause, and Close controls are secondary and visually de-emphasized.
4. Keep focus on the target ring.


## v2.1 Safe-area + passcode update

1. Header and footer spacing must mirror ECHO mode safe-area handling.
2. Host bottom nav uses floating safe-area offset: `Math.max(insets.bottom, 12)`.
3. Door Mode content must fit above the floating nav without clipping operational controls.
4. Paused Door Mode requires passcode to resume.
5. Passcode is set on first pause and managed from Host Profile.


## v2.2 Door nav trigger + larger tap icon

1. Door Mode appears in Host bottom navigation only when an event is live or within 2 hours of start time.
2. Door icon sits between Events and Payouts.
3. Central Tap Phone visual includes a large phone/NFC state icon.
4. Tap Phone icon size is increased by 50% for clearer staff targeting.
5. Spacing must remain tight enough for full Door Mode visibility above floating navigation.


## v2.3 Larger target + compact stats

1. Checked In and Remaining counts are secondary, compact stats.
2. Remove `NFC ACTIVE` line from Door Mode to reduce duplicate status language.
3. If the event is 21+, display `21+` in the top-right of the event header block.
4. Use the freed vertical space to enlarge the central Tap Phone target circle.
5. Target ring dimensions:
   - outer touch area around 352x352
   - glow around 382x382
   - ring around 320x320
6. Target icon remains large and centered for easier staff aiming/tapping.


## v2.4 Options menu + attendee sheets

1. Door Mode bottom controls are removed from the main screen.
2. Three-dot options menu sits under the 21+ badge.
3. Options menu includes:
   - Test Door Mode
   - Offline Mode / Return Online
   - Close Door Mode
4. Checked In and Remaining stats are tappable.
5. Tapping Checked In opens a bottom sheet of checked-in attendees.
6. Tapping Remaining opens a bottom sheet of not-yet-checked-in attendees.
7. Venue/location and date/time are removed from top of Door Mode to reduce duplication and increase target area.
8. 21+ badge is increased by 10%.
9. Central tap target may be slightly larger because secondary controls moved into sheets/menus.


## v2.5 Locked operation mode

1. Remove normal header from Door Mode.
2. Remove bottom navigation from Door Mode.
3. Exit is only available through three-dot options menu.
4. Exit requires confirmation overlay.
5. Add bottom-left Close Event CTA.
6. Add bottom-right Pause Door / Resume CTA.
7. Resume requires a 6-digit passcode configured in Host Profile.
8. Door screen remains focused on live check-in and cannot be exited accidentally.


## v2.6 Brightness + embossed target

1. Door Mode sets device brightness to maximum where supported.
2. Event top row layout:
   - left: age badge
   - center: event title
   - right: three-dot options
3. Event title supports two-line centered wrapping with font shrinking.
4. Tap target has an embossed 3D treatment and stronger contrast.
5. Pause CTA blends into the screen as gray.
6. Resume CTA remains green for clear recovery.
7. Closing event from CTA returns host to Dashboard after confirmation.


## v2.7 Max brightness + enhanced emboss polish

1. Brightness is explicitly set to max on Door Mode mount.
2. Brightness is re-applied after a short delay.
3. Tap circle 3D/emboss visual is increased by ~25% without increasing circle size.
4. Close Event and Pause/Resume bottom CTAs are raised slightly with additional bottom padding.
