# ECHO Host Door Mode Pause Passcode v1

## Purpose
Door Mode is a live access-control surface. If a host pauses Door Mode, scanning cannot resume without a passcode.

## Locked behavior
1. First time a host pauses Door Mode, they must create a Door Mode passcode.
2. The passcode is required to resume Door Mode.
3. Passcode must be at least 4 digits.
4. Door Mode passcode is managed from Host Mode Profile.
5. Host Profile displays passcode status: Set / Not set.
6. Host Profile allows updating or clearing the passcode.
7. Passcode is stored in hostProfileStore for the current mock/local implementation.
8. Production implementation should hash passcode server-side or store securely in device secure storage.

## Door Mode UX
- Pause button opens the passcode modal.
- If no passcode exists: modal says “Set Door Passcode.”
- If passcode exists: modal says “Resume Door Mode.”
- Incorrect passcode blocks resume.
- Modal links to Host Profile for passcode management.

## Screen-fit standard
- Host Door Mode uses the same safe-area header and floating footer spacing as ECHO mode.
- Header is compact enough to keep all operational information visible.
- Door target ring is large, but content must remain fully visible above the floating nav.
