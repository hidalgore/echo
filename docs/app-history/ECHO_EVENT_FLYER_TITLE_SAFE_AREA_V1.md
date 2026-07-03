# ECHO Event Flyer Title Safe Area v1

## Purpose
Prevent event titles from being clipped by flyer/image/card edges on Event Details and all flyer-based event cards.

## Rules
1. Overlay titles must sit inside the rounded image with enough bottom padding.
2. Minimum bottom inset for overlay title block: 40–44 px.
3. Category label should have at least 8 px gap above title.
4. Large event title line-height must be explicit.
5. Gradient fade should be tall enough to support title readability and safe spacing.
6. For large hero flyer overlays:
   - `imageFade.height >= 160`
   - `heroBottomMeta.bottom >= 40`
   - `title.lineHeight >= 48`
   - `title.paddingBottom >= 3`
