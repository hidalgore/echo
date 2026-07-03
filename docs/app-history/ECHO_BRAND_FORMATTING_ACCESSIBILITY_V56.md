# ECHO Brand, Formatting, and Accessibility Pass — v56

## Locked intent
This pass keeps the v55 interactive web homepage and v54 market logic guardrails intact while tightening brand usage, spacing, and readability across the web preview and the mobile Choose How to Pay reference screen.

## Website brand usage
- The website header now uses the real ECHO wordmark asset instead of a text-built approximation.
- Compact layouts use the ECHO icon mark instead of forcing the full wordmark into narrow space.
- The phone preview wallet/access element now uses the ECHO icon mark to keep brand language consistent.
- ECHO icon = small utility, wallet, access, signal, NFC moments.
- ECHO wordmark = header, hero, official brand identity moments.

## Website interactivity retained
The page remains interactive:
- Header nav
- Start Hosting
- Explore Events
- Trust pills
- Search rail
- Phone preview chips
- Phone event card
- Wallet card
- Bottom tab preview
- Public event cards
- Save/bookmark toggles
- Host platform cards
- Login route buttons

## Spacing and visual polish
- Header spacing increased for a more premium desktop/tablet feel.
- Hero spacing tightened slightly so the page does not feel overly stretched.
- Logo dimensions are fixed to prevent distortion.
- Text-built logo arcs were removed to avoid unprofessional rendering differences across web/native.

## Accessibility and readability updates
- Increased several low-opacity text colors from ~45–62% white to stronger 66–84% white where the text communicates functional information.
- Increased small web UI text sizes where appropriate.
- Added button accessibility roles and labels to core web CTA / chip components.
- Added selected accessibility state to selectable pills and secondary buttons.
- Improved mobile checkout subtitle and secondary text contrast.
- Improved tap-target clarity for the mobile payment option cards.

## Mobile Choose How to Pay updates
- Header top spacing increased to avoid the back button crowding the centered title.
- Title size/line-height adjusted for better readability on smaller phones.
- Subtitle contrast and line height improved.
- ECHO Circle card icon container upgraded with a subtle border and stronger surface.
- Secondary text on the Circle card, Pay for All card, and Today You Pay card raised in contrast.
- Alternate action link contrast and font weight increased.

## Remaining recommendations
1. Run the app on at least three viewport widths: phone, tablet/narrow web, desktop.
2. Confirm the uploaded logo asset has transparent padding cropped correctly; if not, export a tighter SVG/PNG logo pack.
3. Add a centralized `EchoLogo` component later with approved sizes: header wordmark, compact icon, access mark, and footer mark.
4. Run a visual accessibility pass for all screens with font sizes below 12 and text opacity below 60%.
5. Avoid ultra-heavy `900` font weight on large blocks if the selected app font does not render it consistently on Android.

## Drift guardrail
This pass does not change product strategy, routes, mock data, payment logic, Search AI, Circle logic, or Access Pass behavior. It only improves brand presentation, interaction affordance, spacing, and readability.
