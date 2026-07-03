# ECHO Floating Bottom Navigation Standard v1

## Purpose
Maintain a premium floating bottom navigation that respects the device safe area and never sits too close to the bottom edge.

## Rules
1. Bottom navigation must use `useSafeAreaInsets()`.
2. Bottom offset should be `Math.max(insets.bottom, 12)`.
3. Floating base should be transparent/frosted, not a heavy solid block.
4. Active icons must be sharp and premium:
   - no circular plate around icons
   - clean gradient underline for active state
   - icon lines remain visually crisp
5. Screen scroll content should include enough bottom padding so content is not hidden by the floating nav.
6. Preferred tab bar dimensions:
   - left/right: 16
   - height: 76
   - radius: 28
   - background: rgba surface
   - border: subtle 1px
   - shadow/elevation: restrained premium float


## v1.1 Attendee icon-only refinement

1. Attendee bottom navigation must match Host mode behavior: icons only, no labels.
2. The floating base remains transparent/frosted and safe-area aware.
3. Icons must not sit inside circular plates.
4. Active state is shown with:
   - clean ECHO-gradient icon state
   - tight gradient underline only
5. Gradient should remain crisp and controlled:
   - preferred active underline colors: #20C7FF → #7B4DFF → #E63DAD
   - avoid wide rainbow bands on small icons
6. Bottom nav height should stay compact for icon-only mode:
   - preferred height: 68
   - bottom offset: Math.max(insets.bottom, 12)
