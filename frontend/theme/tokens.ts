/**
 * ECHO Tokens — Canonical Mobile Token Layer
 * ═══════════════════════════════════════════
 * Dark-first, wallet-first, restrained premium hierarchy.
 *
 * This file used to hardcode every value. v51 split:
 *   - Brand color values     → theme/brand.ts
 *   - Light + dark palettes  → theme/palettes.ts
 *   - Typography composer    → theme/typography.ts
 *
 * tokens.ts NOW exports the canonical (dark-mode) shape that all
 * consumers historically import. Light-mode consumers go through
 * theme/dynamicTheme.tsx → useDynamicTheme() / useThemeColors().
 *
 * NEVER hardcode brand hex values here again — edit theme/brand.ts.
 * NEVER hardcode font families here — edit theme/typography.ts.
 */
import { ViewStyle } from 'react-native';
import { dark } from './palettes';
import { brand } from './brand';

export { typography } from './typography';

// ─── Grid / spacing scale ──────────────────────────────────────────────────
export const grid = {
  base: 8,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
  xxxl: 48,
};

// ─── Colors (canonical dark palette, re-exported from palettes.ts) ─────────
// Shape preserved exactly for backward compatibility with 155 consumer files.
export const colors = dark;

// ─── Gradients ─────────────────────────────────────────────────────────────
// Source values live in theme/brand.ts. Pre-shaped for LinearGradient consumers.
export const gradients = {
  echo: brand.gradient,
  hero: ['rgba(15,17,21,0)', 'rgba(15,17,21,0.84)', '#0F1115'] as const,
};

// ─── Radii ─────────────────────────────────────────────────────────────────
export const radii = {
  eventCard: 16,
  sheetTop: 20,
  thumb: 8,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 28,
  pill: 999,
};

// ─── Sizes ─────────────────────────────────────────────────────────────────
export const sizes = {
  header: { height: 56, icon: 22, iconTouch: 44 },
  timeline: { height: 44, itemGap: 24, underlineHeight: 2 },
  icons: { eventAction: 20, eventActionGap: 16 },
  notification: { sheetHeightPct: 0.92, thumb: 32, rowMinHeight: 60, dividerHeight: 1 },
  badge: { dot: 6, dotOffsetTop: 2, dotOffsetRight: 2 },
  minTouchTarget: 44,
  ticketCardHeight: 132,
};

// ─── Spacing ───────────────────────────────────────────────────────────────
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
  xxxl: 48,
  screenPaddingX: 16,
  sectionTitleTop: 24,
  sectionTitleBottom: 12,
  railBottom: 24,
  notificationSheet: {
    headerPaddingX: 16,
    headerPaddingY: 12,
    groupPaddingTop: 16,
    rowPaddingX: 16,
    rowPaddingY: 12,
  },
};

// ─── Motion ────────────────────────────────────────────────────────────────
export const motion = {
  duration: { tap: 90, sheetOpen: 220, sheetClose: 200, iconState: 120, cardPress: 120 },
  easing: 'cubic-bezier(0.2, 0.0, 0.0, 1.0)',
  tapScale: { down: 0.985, up: 1.0 },
};

// ─── Shadows ───────────────────────────────────────────────────────────────
export const shadows = {
  none: {} as ViewStyle,
};
