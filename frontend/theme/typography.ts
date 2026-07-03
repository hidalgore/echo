/**
 * ECHO Typography Layer — Single-File Typeface Swap
 * ══════════════════════════════════════════════════
 * Today: system fonts (SF Pro on iOS, Roboto on Android).
 *
 * When a brand typeface is licensed (Inter, Söhne, GT America, etc.):
 *   1. Load the font files via expo-font in app/_layout.tsx:
 *        useFonts({
 *          'Inter-Regular':  require('../assets/fonts/Inter-Regular.ttf'),
 *          'Inter-Medium':   require('../assets/fonts/Inter-Medium.ttf'),
 *          'Inter-SemiBold': require('../assets/fonts/Inter-SemiBold.ttf'),
 *          'Inter-Bold':     require('../assets/fonts/Inter-Bold.ttf'),
 *        });
 *   2. Change the `fontFamily` constants below.
 *   3. Every <Text> in the app inherits the new face because text styles
 *      are composed FROM `fontFamily` — no consumer changes required.
 *
 * IMPORTANT: never hardcode `fontFamily: 'System'` or 'Inter-…' in components.
 * Always import a text style from `typography` or, if you must, import
 * `fontFamily` from here.
 */
import { Platform, TextStyle } from 'react-native';

// ─── Font family layer (rebrand control surface) ────────────────────────────
// Today: system fallback. Replace each value to swap typeface globally.
export const fontFamily = {
  regular:  Platform.select({ ios: 'System',  android: 'sans-serif',         default: 'System' }) as string,
  medium:   Platform.select({ ios: 'System',  android: 'sans-serif-medium',  default: 'System' }) as string,
  semibold: Platform.select({ ios: 'System',  android: 'sans-serif-medium',  default: 'System' }) as string,
  bold:     Platform.select({ ios: 'System',  android: 'sans-serif',         default: 'System' }) as string,
  // Tabular numerics (use in metrics, prices, timers): system fallback today
  mono:     Platform.select({ ios: 'Menlo',   android: 'monospace',          default: 'monospace' }) as string,
} as const;

// ─── Weight → family resolver ──────────────────────────────────────────────
// Maps a numeric/short weight to the corresponding family slot. When using
// system fonts the family is constant and `fontWeight` does the work; when
// a licensed family is loaded each weight is a separate file and the family
// MUST change with the weight.
function familyFor(weight: TextStyle['fontWeight']): string {
  if (weight === '700' || weight === '800' || weight === '900' || weight === 'bold') return fontFamily.bold;
  if (weight === '600')                                                              return fontFamily.semibold;
  if (weight === '500')                                                              return fontFamily.medium;
  return fontFamily.regular;
}

// ─── Style composer ────────────────────────────────────────────────────────
function t(size: number, weight: TextStyle['fontWeight'], lineHeight: number, extra: Partial<TextStyle> = {}): TextStyle {
  return { fontSize: size, fontWeight: weight, lineHeight, fontFamily: familyFor(weight), ...extra };
}

// ─── Canonical text styles ─────────────────────────────────────────────────
// Two naming systems coexist for compatibility:
//   - Semantic v1 (DISPLAY_L, TITLE, BODY_L, LABEL, CAPTION) — preferred
//   - Component-named legacy (headerLocation, sheetTitle, eventTitle…) — kept
// Both compose through familyFor() so a typeface swap is one file.
export const typography = {
  // Semantic v1 (preferred)
  DISPLAY_L:    t(28, '700', 34, { letterSpacing: -0.3 }),
  DISPLAY_M:    t(22, '600', 28, { letterSpacing: -0.2 }),
  TITLE:        t(18, '600', 24),
  BODY_L:       t(16, '400', 22),
  BODY_M:       t(14, '400', 20),
  LABEL:        t(12, '700', 16, { letterSpacing: 0.56, textTransform: 'uppercase' }),
  CAPTION:      t(12, '400', 16),

  // Legacy component-named (preserved for screen-level callers)
  headerLocation: t(16, '600', 20, { letterSpacing: 0.24 }),
  sheetTitle:     t(18, '600', 22),
  sectionTitle:   t(13, '700', 18, { textTransform: 'uppercase', letterSpacing: 0.72 }),
  eventTitle:     t(16, '600', 21),
  meta:           t(13, '400', 18),
  price:          t(15, '600', 20),
  groupLabel:     t(12, '700', 16, { textTransform: 'uppercase', letterSpacing: 0.64 }),
  notifTitle:     t(15, '500', 20),
  notifBody:      t(13, '400', 18),
  notifTime:      t(12, '400', 16),
  actionText:     t(12, '700', 16, { textTransform: 'uppercase', letterSpacing: 0.64 }),
};

// ─── Host typography variants ──────────────────────────────────────────────
// Imported by theme/hostTokens.ts. Same composer for typeface consistency.
export const hostTypography = {
  displayLg: t(28, '700', 34, { letterSpacing: -0.3 }),
  displayMd: t(22, '600', 28, { letterSpacing: -0.2 }),
  bodyLg:    t(17, '500', 24),
  bodyMd:    t(15, '400', 22),
  bodySm:    t(13, '400', 18),
  label:     t(13, '600', 18, { letterSpacing: 0.4,  textTransform: 'uppercase' as const }),
  labelSm:   t(11, '600', 14, { letterSpacing: 0.6,  textTransform: 'uppercase' as const }),
  // Tabular numeric metrics — `mono` family for predictable column alignment.
  // fontVariant kept as plain array (not readonly) for StyleSheet compatibility.
  metric:    { fontSize: 20, fontWeight: '600' as const, lineHeight: 24, fontFamily: fontFamily.mono, fontVariant: ['tabular-nums'] as TextStyle['fontVariant'] },
  metricSm:  { fontSize: 15, fontWeight: '600' as const, lineHeight: 20, fontFamily: fontFamily.mono, fontVariant: ['tabular-nums'] as TextStyle['fontVariant'] },
};
