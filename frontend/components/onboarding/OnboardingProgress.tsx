/**
 * OnboardingProgress — minimal step dots for the standard attendee flow.
 */
import { View, StyleSheet } from 'react-native';
import { useDynamicTheme } from '../../theme/dynamicTheme';

interface Props {
  step: number; // 1-based
  total: number;
}

export function OnboardingProgress({ step, total }: Props) {
  const { colors: c } = useDynamicTheme();
  return (
    <View style={styles.row} accessibilityRole="progressbar" accessibilityLabel={`Step ${step} of ${total}`}>
      {Array.from({ length: total }).map((_, i) => {
        const active = i < step;
        return (
          <View
            key={i}
            style={[
              styles.dot,
              { backgroundColor: active ? c.accent : c.hairlineStrong },
              i === step - 1 && styles.dotCurrent,
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  dot: { width: 6, height: 6, borderRadius: 3 },
  dotCurrent: { width: 18, borderRadius: 3 },
});
