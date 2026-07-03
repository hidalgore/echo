/**
 * FirstActionPrompt — single contextual prompt shown after Home loads (spec §16).
 * One meaningful first action; not random.
 */
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../ui';
import { useDynamicTheme } from '../../theme/dynamicTheme';
import { radii } from '../../theme/tokens';

interface Props {
  title: string;
  ctaLabel: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  onDismiss?: () => void;
}

export function FirstActionPrompt({ title, ctaLabel, icon = 'sparkles-outline', onPress, onDismiss }: Props) {
  const { colors: c } = useDynamicTheme();
  return (
    <View style={[styles.card, { backgroundColor: c.cardBg, borderColor: c.hairline }]}>
      <View style={styles.row}>
        <Ionicons name={icon} size={20} color={c.accent} />
        <Text variant="eventTitle" style={styles.title}>{title}</Text>
        {onDismiss ? (
          <TouchableOpacity onPress={onDismiss} accessibilityRole="button" accessibilityLabel="Dismiss" hitSlop={10}>
            <Ionicons name="close" size={18} color={c.textLow} />
          </TouchableOpacity>
        ) : null}
      </View>
      <TouchableOpacity
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={ctaLabel}
        activeOpacity={0.9}
        style={[styles.cta, { backgroundColor: c.accent }]}
      >
        <Text variant="actionText" style={{ color: '#FFFFFF' }}>{ctaLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: radii.lg, padding: 16, gap: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { flex: 1 },
  cta: { minHeight: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
