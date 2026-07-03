/**
 * OnboardingChoiceCard — tappable path/option card (Choose Path screen).
 */
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../ui';
import { useDynamicTheme } from '../../theme/dynamicTheme';
import { radii } from '../../theme/tokens';

interface Props {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
  onPress: () => void;
  selected?: boolean;
}

export function OnboardingChoiceCard({ icon, title, body, onPress, selected }: Props) {
  const { colors: c } = useDynamicTheme();
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${body}`}
      style={[
        styles.card,
        { backgroundColor: c.cardBg, borderColor: selected ? c.accent : c.hairline },
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: c.accentSoft }]}>
        <Ionicons name={icon} size={22} color={c.accent} />
      </View>
      <View style={styles.textWrap}>
        <Text variant="eventTitle">{title}</Text>
        <Text variant="meta" color="textMedium" style={styles.body}>{body}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={c.textLow} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: 16,
    minHeight: 72,
    gap: 14,
  },
  iconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  textWrap: { flex: 1 },
  body: { marginTop: 3 },
});
