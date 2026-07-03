# ECHO Bottom Sheet Branded Handle Standard v1

## Purpose
All ECHO popup and bottom-sheet handles should visually align with the active bottom navigation underline.

## Locked visual
- Handle uses ECHO gradient:
  `#20C7FF → #7B4DFF → #E63DAD`
- Handle should be subtle and premium:
  - width around 52px
  - height around 3px
  - pill radius
- Handle area may be larger than the visual line to support tapping.

## Interaction
1. Tapping the dimmed backdrop closes the sheet.
2. Tapping the handle area should close the sheet when appropriate.
3. Drag-down-to-close should be supported where gesture handling exists.
4. If gesture handling is not yet wired, document as TODO and preserve tap-outside-to-close.

## Current Door Mode applications
- Door Options sheet
- Checked In attendee sheet
- Remaining attendee sheet
