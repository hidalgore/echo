import React from 'react';
import { Text as RNText, TextProps as RNTextProps } from 'react-native';
import { typography } from '../../theme/tokens';
import { useDynamicTheme, type DynamicPalette } from '../../theme/dynamicTheme';

type Variant = 
  | 'headerLocation' | 'sheetTitle' | 'sectionTitle' | 'eventTitle' 
  | 'meta' | 'price' | 'groupLabel' 
  | 'notifTitle' | 'notifBody' | 'notifTime' | 'actionText'
  | 'display' | 'displayM' | 'title' | 'body' | 'bodySmall' | 'label' | 'caption';

type Color = 'text' | 'textHigh' | 'textMedium' | 'textLow' | 'textMuted' | 'textSecondary' | 'textTertiary' | 'textDisabled' | 'accent' | 'success' | 'warning' | 'danger';

interface TextProps extends RNTextProps {
  variant?: Variant;
  color?: Color;
}

const variantStyles: Record<Variant, any> = {
  headerLocation: typography.headerLocation,
  sheetTitle: typography.sheetTitle,
  sectionTitle: typography.sectionTitle,
  eventTitle: typography.eventTitle,
  meta: typography.meta,
  price: typography.price,
  groupLabel: typography.groupLabel,
  notifTitle: typography.notifTitle,
  notifBody: typography.notifBody,
  notifTime: typography.notifTime,
  actionText: typography.actionText,
  display: typography.DISPLAY_L,
  displayM: typography.DISPLAY_M,
  title: typography.TITLE,
  body: typography.BODY_M,
  bodySmall: typography.CAPTION,
  label: typography.LABEL,
  caption: typography.CAPTION,
};

function resolveColor(c: DynamicPalette, color?: Color): string {
  if (!color) return c.text;
  const map: Record<Color, string> = {
    text: c.text, textHigh: c.textHigh, textMedium: c.textMedium,
    textLow: c.textLow, textMuted: c.textMuted, textSecondary: c.textSecondary,
    textTertiary: c.textTertiary, textDisabled: c.textDisabled,
    accent: c.accent, success: c.success, warning: c.warning, danger: c.danger,
  };
  return map[color] ?? c.text;
}

export function Text({ variant = 'body', color, style, ...props }: TextProps) {
  const { colors: c } = useDynamicTheme();
  const variantStyle = variantStyles[variant];
  const textColor = resolveColor(c, color);

  return (
    <RNText
      style={[variantStyle, { color: textColor }, style]}
      {...props}
    />
  );
}
