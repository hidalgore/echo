/**
 * GradientHeadline — two-line onboarding headline. Line one in the primary text
 * color, line two in the brand accent (the reference's gradient second line).
 * Dep-free: no masked-view; the accent line keeps the two-tone brand feel.
 */
import { StyleSheet } from 'react-native';
import { Text } from '../ui';
import { useDynamicTheme } from '../../theme/dynamicTheme';

interface Props {
  line1: string;
  line2: string;
  align?: 'left' | 'center';
}

export function GradientHeadline({ line1, line2, align = 'center' }: Props) {
  const { colors: c } = useDynamicTheme();
  return (
    <Text
      variant="display"
      style={[styles.headline, { textAlign: align }]}
      accessibilityRole="header"
    >
      {line1}
      {'\n'}
      <Text variant="display" style={{ color: c.accent }}>{line2}</Text>
    </Text>
  );
}

const styles = StyleSheet.create({
  headline: { letterSpacing: -0.4 },
});
