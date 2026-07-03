# ECHO Happening Now Fan Deck Standard v1

## Purpose
Happening Now is the hero discovery surface. The carousel must feel smooth, fluid, alive, and premium.

## Locked behavior
1. Happening Now uses a large fan-deck hero card, not small grid cards.
2. Cards should fan in a circular/arc posture with visible depth.
3. Swipe threshold should be low enough to feel responsive.
4. Spring motion should be fast but controlled:
   - damping around 20
   - stiffness around 285
   - mass around 0.52
5. Gesture behavior:
   - activeOffsetX([-8, 8])
   - failOffsetY([-14, 14])
6. Front card should rotate subtly during swipe, not aggressively.
7. The card should reset quickly after transition so the deck feels alive.
8. The fan deck is a hero item and should receive more screen real estate than standard event rails.
