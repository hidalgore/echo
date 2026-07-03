# ECHO Past Events Mock Closeout Reports v1

## Purpose
Host Events must always show functional Past Events during demo/dev builds, even before real closeout reports exist.

## Locked behavior
- Host Events shows four mock Past Events when no real ended host events are available.
- Past Event cards expand/collapse when tapped.
- If a real closeout report exists, the card uses real closeout data and labels the panel `Closeout Report`.
- If no real closeout report exists, the card shows `Report Preview` and sample analytics.
- Report Preview includes Checked In, No-show, Attendance, Denied, Scan Success, and Entry Trust Score.
- PDF, CSV, and Analytics download pills remain visible and tappable.
- Real past events are preserved and shown before mock preview events.

## Source file
- `app/(host)/(tabs)/events.tsx`
