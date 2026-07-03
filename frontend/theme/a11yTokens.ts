/**
 * theme/tokens.ts
 * ═══════════════
 * ECHO centralized design system — STATIC LITERAL tokens (build decision 2A).
 *
 * These are plain compile-time literals, so they are safe to use INSIDE
 * StyleSheet.create() and do NOT violate the locked rule "theme tokens never go
 * inside StyleSheet.create()" — that rule targets RUNTIME theme refs (c.xxx /
 * brand.xxx) which mutate per render. Static literals do not.
 *
 * Rule: never hardcode arbitrary values in components — reference these tokens.
 */

// ─── Typography (min body = 16; RN scales these with OS text size) ───────────
export const TYPE = {
  'text-xs': { fontSize: 12, lineHeight: 16 },
  'text-sm': { fontSize: 14, lineHeight: 20 },
  'text-md': { fontSize: 16, lineHeight: 24 }, // body floor
  'text-lg': { fontSize: 20, lineHeight: 28 },
  'text-xl': { fontSize: 28, lineHeight: 34 },
  'text-2xl': { fontSize: 40, lineHeight: 44 },
} as const;
export type TypeToken = keyof typeof TYPE;

/** ≥18px (or ≥14px bold) qualifies as "large text" for the 3:1 contrast tier. */
export const LARGE_TEXT_MIN = 18;

// ─── Spacing scale ───────────────────────────────────────────────────────────
export const SPACE = { 4: 4, 8: 8, 12: 12, 16: 16, 24: 24, 32: 32, 40: 40, 48: 48 } as const;
export type SpaceToken = keyof typeof SPACE;

// ─── Radius ──────────────────────────────────────────────────────────────────
export const RADIUS = { sm: 8, md: 14, lg: 20, xl: 28, full: 999 } as const;
export type RadiusToken = keyof typeof RADIUS;

// ─── Shadow (cross-platform: iOS shadow* + Android elevation) ────────────────
export const SHADOW = {
  card: { shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 3 },
  modal: { shadowColor: '#000', shadowOpacity: 0.28, shadowRadius: 28, shadowOffset: { width: 0, height: 16 }, elevation: 12 },
  elevated: { shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 40, shadowOffset: { width: 0, height: 24 }, elevation: 20 },
} as const;
export type ShadowToken = keyof typeof SHADOW;

// ─── Color (AA-verified pairings; see /docs audit) ───────────────────────────
export const COLOR = {
  // surfaces
  cream: '#FBF7F2', cream2: '#F3ECE3',
  dark: '#0F1115', darkCard: '#16181D',
  line: 'rgba(19,21,26,0.10)', darkLine: 'rgba(255,255,255,0.08)',
  // text (all AA on their intended surfaces)
  ink: '#13151A', ink2: '#4A4F5C',     // on cream/white: 17:1 / 7.7:1
  on: '#F4F5F7', on2: '#9AA0AD',         // on dark: 17:1 / 7.2:1
  // actions — primaryCta passes AA body with white text (5.70:1)
  primaryCta: '#7C3AED',
  // brand accent: DECORATIVE only (gradients, glows). 4.23:1 w/ white — never
  // use behind body-size white text.
  brandAccent: '#8B5CF6',
  cyan: '#22D3EE',
  // status (always paired with an icon + text — never color alone)
  success: '#34D399', warning: '#FBBF24', danger: '#F87171', info: '#60A5FA',
} as const;

// ─── Minimum tap targets (one-handed mobile) ─────────────────────────────────
export const TOUCH = { iosMin: 44, androidMin: 48, recommended: 48 } as const;
