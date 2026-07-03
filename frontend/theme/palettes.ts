/**
 * ECHO Palettes — Resolved Light + Dark Color Sets
 * ═════════════════════════════════════════════════
 * Pure data file. Both palettes compose from `theme/brand.ts` so brand-color
 * changes propagate without touching this file.
 *
 * Structure-level (surface, text, hairline) colors are tuned per mode and
 * stay here. Brand-level (primary, cyan, magenta) values come from brand.ts.
 *
 * Consumers:
 *   - theme/dynamicTheme.tsx → resolves light vs dark at runtime
 *   - theme/tokens.ts        → exports `colors` (dark palette only — canonical)
 */
import { brandDark, brandLight } from './brand';

// ─── Palette shape ──────────────────────────────────────────────────────────
export type Palette = {
  // Surfaces
  bg: string;
  bgElevated: string;
  bgCard: string;
  bgCard2: string;
  sheet: string;
  overlayDim: string;

  // Text
  text: string;
  textHigh: string;
  textMedium: string;
  textLow: string;
  textMuted: string;

  // Lines
  hairline: string;
  hairlineStrong: string;
  divider: string;
  border: string;

  // Brand accents (resolved from brand layer)
  accent: string;
  accent2: string;
  accentSoft: string;
  echoBlue: string;
  echoBlueAccessible: string;
  echoBlueSoft: string;
  echoPink: string;
  echoPinkSoft: string;
  echoMagenta: string;
  echoMagentaSoft: string;
  echoOrange: string;
  echoOrangeSoft: string;
  echoGold: string;
  echoGoldSoft: string;

  // Semantic
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  danger: string;
  dangerSoft: string;

  // Component surfaces
  surface: string;
  surface2: string;
  surface3: string;
  unreadRowBg: string;
  imageFade: string;
  glass: string;
  glassBorder: string;
  scrim: string;

  // Ticket / age
  ticketActive: string;
  ticketSaved: string;
  ticketPast: string;
  age21: string;
  age18: string;

  // Compatibility text aliases (used by some legacy screens)
  textSecondary: string;
  textTertiary: string;
  textDisabled: string;

  // Circle state colors
  paidGreen: string;
  paidGreenSoft: string;
  pendingAmber: string;
  pendingAmberSoft: string;
  inviteBlue: string;
  inviteBlueSoft: string;
  declinedRed: string;
  declinedRedSoft: string;
  neutralGray: string;
  neutralGraySoft: string;

  // Convenience aliases
  sheetBg: string;
  cardBg: string;
};

// ─── Brand-soft helper (low-opacity tint of a brand hex) ────────────────────
// Produces a transparent overlay of a brand color suitable for soft pill
// backgrounds. Kept as a pure helper so palettes stay declarative.
function soft(hex: string, alpha: number): string {
  // Accepts "#RRGGBB"
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ─── Dark Palette (canonical) ──────────────────────────────────────────────
export const dark: Palette = {
  // Surfaces
  bg: '#0F1115',
  bgElevated: '#141821',
  bgCard: '#161B24',
  bgCard2: '#1A202B',
  sheet: '#11151D',
  overlayDim: 'rgba(0,0,0,0.48)',

  // Text — ice-blue tinted for ECHO brand readability
  text: '#E6FCFF',
  textHigh: 'rgba(230,252,255,0.94)',
  textMedium: 'rgba(230,252,255,0.82)',
  textLow: 'rgba(230,252,255,0.68)',
  textMuted: 'rgba(230,252,255,0.56)',

  // Lines
  hairline: 'rgba(255,255,255,0.10)',
  hairlineStrong: 'rgba(255,255,255,0.16)',
  divider: 'rgba(255,255,255,0.10)',
  border: 'rgba(255,255,255,0.10)',

  // Brand
  accent: brandDark.primary,
  accent2: brandDark.primary2,
  accentSoft: soft(brandDark.primary, 0.14),
  echoBlue: brandDark.cyan,
  echoBlueAccessible: brandDark.cyanAccessible,
  echoBlueSoft: soft(brandDark.cyan, 0.14),
  echoPink: brandDark.magenta,
  echoPinkSoft: soft(brandDark.magenta, 0.12),
  echoMagenta: brandDark.magenta,
  echoMagentaSoft: soft(brandDark.magenta, 0.12),
  echoOrange: brandDark.orange,
  echoOrangeSoft: soft(brandDark.orange, 0.12),
  echoGold: brandDark.gold,
  echoGoldSoft: soft(brandDark.gold, 0.14),

  // Semantic
  success: brandDark.success,
  successSoft: soft(brandDark.success, 0.14),
  warning: brandDark.warning,
  warningSoft: soft(brandDark.warning, 0.14),
  danger: brandDark.danger,
  dangerSoft: 'rgba(255,69,58,0.14)',

  // Component surfaces
  surface: '#141821',
  surface2: 'rgba(255,255,255,0.05)',
  surface3: 'rgba(255,255,255,0.08)',
  unreadRowBg: 'rgba(255,255,255,0.04)',
  imageFade: 'rgba(0,0,0,0.08)',
  glass: 'rgba(20,24,33,0.94)',
  glassBorder: 'rgba(255,255,255,0.10)',
  scrim: 'rgba(0,0,0,0.42)',

  // Ticket / age
  ticketActive: brandDark.success,
  ticketSaved: brandDark.primary,
  ticketPast: 'rgba(255,255,255,0.42)',
  age21: brandDark.orange,
  age18: brandDark.cyan,

  // Compatibility
  textSecondary: 'rgba(255,255,255,0.74)',
  textTertiary: 'rgba(255,255,255,0.50)',
  textDisabled: 'rgba(255,255,255,0.30)',

  // Circle state
  paidGreen: brandDark.success,
  paidGreenSoft: soft(brandDark.success, 0.15),
  pendingAmber: brandDark.warningAlt,
  pendingAmberSoft: soft(brandDark.warningAlt, 0.15),
  inviteBlue: brandDark.info,
  inviteBlueSoft: soft(brandDark.info, 0.15),
  declinedRed: brandDark.danger,
  declinedRedSoft: soft(brandDark.danger, 0.15),
  neutralGray: '#6B7280',
  neutralGraySoft: 'rgba(107,114,128,0.15)',

  // Aliases
  sheetBg: '#11151D',
  cardBg: '#13171F',
};

// ─── Light Palette ──────────────────────────────────────────────────────────
export const light: Palette = {
  bg: '#F5F3EE',
  bgElevated: '#FFFFFF',
  bgCard: 'rgba(255,255,255,0.88)',
  bgCard2: 'rgba(248,245,239,0.92)',
  sheet: '#FFFFFF',
  overlayDim: 'rgba(35,40,52,0.18)',

  text: '#151821',
  textHigh: 'rgba(21,24,33,0.96)',
  textMedium: 'rgba(21,24,33,0.82)',
  textLow: 'rgba(21,24,33,0.66)',
  textMuted: 'rgba(21,24,33,0.52)',

  hairline: 'rgba(41,47,61,0.10)',
  hairlineStrong: 'rgba(41,47,61,0.16)',
  divider: 'rgba(0,0,0,0.08)',
  border: 'rgba(0,0,0,0.10)',

  accent: brandLight.primary,
  accent2: brandLight.primary2,
  accentSoft: soft(brandLight.primary, 0.10),
  echoBlue: brandLight.cyan,
  echoBlueAccessible: brandLight.cyanAccessible,
  echoBlueSoft: soft(brandLight.cyan, 0.10),
  echoPink: brandLight.magenta,
  echoPinkSoft: soft(brandLight.magenta, 0.08),
  echoMagenta: brandLight.magenta,
  echoMagentaSoft: soft(brandLight.magenta, 0.08),
  echoOrange: brandLight.orange,
  echoOrangeSoft: soft(brandLight.orange, 0.08),
  echoGold: brandLight.gold,
  echoGoldSoft: soft(brandLight.gold, 0.10),

  success: brandLight.success,
  successSoft: soft(brandLight.success, 0.10),
  warning: brandLight.warning,
  warningSoft: soft(brandLight.warning, 0.10),
  danger: brandLight.danger,
  dangerSoft: soft(brandLight.danger, 0.08),

  surface: 'rgba(255,255,255,0.92)',
  surface2: 'rgba(0,0,0,0.03)',
  surface3: 'rgba(0,0,0,0.05)',
  unreadRowBg: soft(brandLight.primary, 0.04),
  imageFade: 'rgba(255,255,255,0.10)',
  glass: 'rgba(255,255,255,0.78)',
  glassBorder: 'rgba(79,86,102,0.14)',
  scrim: 'rgba(21,24,33,0.18)',

  ticketActive: brandLight.success,
  ticketSaved: brandLight.primary,
  ticketPast: 'rgba(21,24,33,0.32)',
  age21: '#B76A14',
  age18: brandLight.cyanAccessible,

  textSecondary: 'rgba(21,24,33,0.70)',
  textTertiary: 'rgba(21,24,33,0.48)',
  textDisabled: 'rgba(21,24,33,0.28)',

  paidGreen: brandLight.success,
  paidGreenSoft: soft(brandLight.success, 0.10),
  pendingAmber: brandLight.warningAlt,
  pendingAmberSoft: soft(brandLight.warningAlt, 0.10),
  inviteBlue: brandLight.info,
  inviteBlueSoft: soft(brandLight.info, 0.10),
  declinedRed: brandLight.danger,
  declinedRedSoft: soft(brandLight.danger, 0.10),
  neutralGray: '#6B7280',
  neutralGraySoft: 'rgba(107,114,128,0.10)',

  sheetBg: '#FFFFFF',
  cardBg: '#FFFFFF',
};
