/**
 * ECHO Host Design Tokens
 * Extends the main token system with host-specific semantic colors.
 * Both consumer and host use #0F1115 dark base — smooth crossfade is natural.
 *
 * v51: hostTypography moved to theme/typography.ts so font-family swaps cover
 * host components too. Kept color tokens here since host semantics differ.
 */

import { Platform } from 'react-native';
import { colors as mainColors, spacing as mainSpacing, radii, sizes } from './tokens';
import { hostTypography as hostTypo, typography as mainTypo } from './typography';

// Re-export shared values directly
export { radii, sizes };
export const spacing = {
  ...mainSpacing,
  base: mainSpacing.md,     // 16
  xxs: 2,
  section: 48,
};

// Host-specific color extensions
export const hostColors = {
  // Inherit all base colors
  ...mainColors,

  // Semantic aliases used by host components
  bg: mainColors.bg,
  surface: mainColors.surface2,
  surfaceElevated: 'rgba(255,255,255,0.06)',
  surfaceHover: 'rgba(255,255,255,0.08)',
  overlay: mainColors.overlayDim,

  textPrimary: mainColors.text,
  textSecondary: mainColors.textMedium,
  textTertiary: mainColors.textMuted,
  textDisabled: 'rgba(255,255,255,0.30)',

  border: mainColors.hairline,
  borderSubtle: 'rgba(255,255,255,0.06)',
  borderFocus: '#6366F1',

  // Accents
  accentBlue: '#3B82F6',
  accentViolet: '#7B4DFF',
  accentMagenta: '#E63DAD',
  accentGreen: '#10B981',
  accentAmber: '#F59E0B',
  accentCyan: '#20C7FF',
  accentRed: '#EF4444',

  // Status
  statusLive: '#10B981',
  statusUpcoming: '#3B82F6',
  statusDraft: '#F59E0B',
  statusPast: 'rgba(255,255,255,0.50)',
  statusClosed: 'rgba(255,255,255,0.30)',

  // Health
  healthSellingWell: '#10B981',
  healthSlowSales: '#F59E0B',
  healthNearCapacity: '#E63DAD',
  healthDraft: 'rgba(255,255,255,0.50)',
  healthCompleted: 'rgba(255,255,255,0.50)',

  // Semantic
  success: mainColors.success,
  warning: mainColors.warning,
  error: mainColors.danger,
  info: '#3B82F6',

  // Components
  cardBg: mainColors.surface2,
  inputBg: mainColors.surface2,
  pillBg: 'rgba(255,255,255,0.06)',
  pillActiveBg: '#FFFFFF',
  pillActiveText: mainColors.bg,
  badgeBg: 'rgba(255,255,255,0.08)',
};

// Host typography — sourced from theme/typography.ts so a typeface change
// in fontFamily there flows through every host component automatically.
export const hostTypography = hostTypo;

export const SCREEN_HORIZONTAL_PADDING = mainSpacing.screenPaddingX;
export const TAP_TARGET_MIN = sizes.minTouchTarget;

export const hostShadows = {
  card: Platform.OS === 'web'
    ? { boxShadow: '0px 2px 8px rgba(0,0,0,0.15)' }
    : {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
      },
  elevated: Platform.OS === 'web'
    ? { boxShadow: '0px 4px 16px rgba(0,0,0,0.25)' }
    : {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 8,
      },
};

// Alias for host component compatibility
export const radius = { xs: 4, sm: 8, md: 12, base: 16, lg: 20, xl: 24, pill: 999 };
export const colors = hostColors;
export const typography = {
  ...hostTypography,
  // Legacy v11 mappings for backward compat (control.tsx, door.tsx)
  DISPLAY_L: mainTypo.DISPLAY_L,
  DISPLAY_M: mainTypo.DISPLAY_M,
  TITLE: mainTypo.TITLE,
  BODY_L: mainTypo.BODY_L,
  BODY_M: mainTypo.BODY_M,
  LABEL: mainTypo.LABEL,
  CAPTION: mainTypo.CAPTION,
  headerLocation: mainTypo.headerLocation,
  sheetTitle: mainTypo.sheetTitle,
  sectionTitle: mainTypo.sectionTitle,
  eventTitle: mainTypo.eventTitle,
  meta: mainTypo.meta,
  price: mainTypo.price,
  groupLabel: mainTypo.groupLabel,
  actionText: mainTypo.actionText,
};
export const shadows = hostShadows;
