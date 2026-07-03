/**
 * theme/motion.ts
 * ═══════════════
 * Global motion standards. Consistent timing, reduced-motion aware, motion used
 * to reinforce hierarchy — never decoration. Target 60fps (drive transforms/
 * opacity only; avoid animating layout).
 *
 * Pure TS so it is tsc-checkable; the reduced-motion read is web-safe and
 * no-ops off-web (callers pass the native AccessibilityInfo result).
 */

/** Locked durations (ms). */
export const DURATION = {
  micro: 180,     // 150–200: taps, toggles, chips
  navigation: 300, // 250–350: route/tab transitions
  modal: 350,      // 300–400: sheets, dialogs
} as const;
export type DurationToken = keyof typeof DURATION;

/** Calm easing — no excessive bounce. */
export const EASING = {
  standard: 'cubic-bezier(0.2, 0, 0, 1)',
  emphasized: 'cubic-bezier(0.3, 0, 0, 1)',
} as const;

/** Web reduced-motion read. On native, pass AccessibilityInfo.isReduceMotionEnabled(). */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Returns 0 when reduced motion is requested, so animations resolve instantly. */
export function durationFor(token: DurationToken, reduced: boolean): number {
  return reduced ? 0 : DURATION[token];
}
