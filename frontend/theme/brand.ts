/**
 * ECHO Brand Layer — Single-File Rebrand Control Surface
 * ═══════════════════════════════════════════════════════
 * This is the ONLY file you change to roll the entire app to a new brand.
 *
 *   1) Brand color values live here, named by ROLE (primary, secondary…) AND by
 *      legacy literal name (echoBlue, echoMagenta…). Tokens import both forms.
 *   2) Gradient stops live here.
 *   3) Tokens.ts and dynamicTheme.tsx never hardcode brand hex values — they
 *      reference `brand.*`.
 *
 * To rebrand:
 *   - Update the hex values below.
 *   - Both dark and light palettes pick them up automatically because the
 *      palettes derive from these tokens.
 *
 * Naming convention:
 *   - `primary` is the dominant interactive accent (today: violet #7B4DFF).
 *   - `cyan / magenta / orange / gold` are accent ramp colors used in
 *      gradients, ticket pills, status surfaces. Renamed from `echoBlue` etc.
 *   - Legacy aliases (echoBlue, echoMagenta, echoPink, echoOrange, echoGold)
 *      are exported below for backward compat — DO NOT add new code that
 *      uses the `echoX` names; use `brand.cyan`, `brand.magenta`, etc.
 */

// ─── Dark-mode brand values (canonical) ─────────────────────────────────────
export const brandDark = {
  primary:   '#7B4DFF',   // dominant interactive accent
  primary2:  '#9B7AFF',   // primary hover / press tint

  cyan:      '#20C7FF',   // legacy echoBlue
  cyanAccessible: '#7DDDFF', // higher-contrast cyan for text on dark
  magenta:   '#E63DAD',   // legacy echoMagenta / echoPink
  orange:    '#FF7A1A',   // legacy echoOrange (also age21 indicator)
  gold:      '#FFC247',   // legacy echoGold

  // Semantic
  success:   '#10B981',
  warning:   '#FF9500',
  warningAlt:'#F59E0B',   // amber used in pending/draft states
  danger:    '#EF4444',
  info:      '#3B82F6',

  // Gradient stops (left → right). Used for hero gradients, CTAs, tab icons.
  gradient: ['#20C7FF', '#7B4DFF', '#E63DAD', '#FF5A6E', '#FF7A1A', '#FFC247'] as const,
  gradientBorder: ['#20C7FF', '#7B4DFF', '#E63DAD', '#FF7A1A'] as const,
} as const;

// ─── Light-mode brand values (re-tuned for AA contrast on light surfaces) ──
export const brandLight = {
  primary:   '#5B3FD9',
  primary2:  '#7B4DFF',

  cyan:      '#0EA5D6',
  cyanAccessible: '#0A7CA6',
  magenta:   '#D946A5',
  orange:    '#E9802D',
  gold:      '#C6921F',

  success:   '#0F9F6E',
  warning:   '#B87514',
  warningAlt:'#B87514',
  danger:    '#C83D3D',
  info:      '#2563EB',

  gradient: ['#0EA5D6', '#5B3FD9', '#D946A5', '#E9802D', '#C6921F', '#B87514'] as const,
  gradientBorder: ['#0EA5D6', '#5B3FD9', '#D946A5', '#E9802D'] as const,
} as const;

export type BrandPalette = typeof brandDark;

// ─── Convenience: dark-default export for non-themed callers ────────────────
// `theme/tokens.ts` (canonical dark) uses this. Light callers go through
// dynamicTheme.tsx which resolves dark vs light.
export const brand = brandDark;
