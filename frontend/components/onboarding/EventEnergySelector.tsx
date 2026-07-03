/**
 * EventEnergySelector — chip-based personalization (spec §9.7).
 * Captures interests (multi), group style (single), budget (single).
 * Location handled by the screen. No account required to personalize.
 */
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from '../ui';
import { useDynamicTheme } from '../../theme/dynamicTheme';
import { radii } from '../../theme/tokens';

interface ChipGroupProps {
  title: string;
  options: string[];
  selected: string[];
  multi?: boolean;
  onToggle: (value: string) => void;
}

function ChipGroup({ title, options, selected, multi, onToggle }: ChipGroupProps) {
  const { colors: c } = useDynamicTheme();
  return (
    <View style={styles.group}>
      <Text variant="sectionTitle" style={styles.groupTitle}>{title}</Text>
      <View style={styles.chips}>
        {options.map((opt) => {
          const on = selected.includes(opt);
          return (
            <TouchableOpacity
              key={opt}
              onPress={() => onToggle(opt)}
              accessibilityRole={multi ? 'checkbox' : 'radio'}
              accessibilityState={{ selected: on, checked: on }}
              accessibilityLabel={opt}
              activeOpacity={0.85}
              style={[
                styles.chip,
                { borderColor: on ? c.accent : c.hairline, backgroundColor: on ? c.accentSoft : 'transparent' },
              ]}
            >
              <Text variant="meta" color={on ? 'accent' : 'textMedium'}>{opt}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

interface Props {
  interestsTitle: string;
  groupTitle: string;
  budgetTitle: string;
  interestOptions: string[];
  groupOptions: string[];
  budgetOptions: string[];
  interests: string[];
  groupStyle: string | null;
  budget: string | null;
  onToggleInterest: (value: string) => void;
  onSelectGroup: (value: string) => void;
  onSelectBudget: (value: string) => void;
}

export function EventEnergySelector(props: Props) {
  return (
    <View style={styles.root}>
      <ChipGroup title={props.interestsTitle} options={props.interestOptions} selected={props.interests} multi onToggle={props.onToggleInterest} />
      <ChipGroup title={props.groupTitle} options={props.groupOptions} selected={props.groupStyle ? [props.groupStyle] : []} onToggle={props.onSelectGroup} />
      <ChipGroup title={props.budgetTitle} options={props.budgetOptions} selected={props.budget ? [props.budget] : []} onToggle={props.onSelectBudget} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 22 },
  group: { gap: 12 },
  groupTitle: { marginBottom: 2 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: { minHeight: 44, paddingHorizontal: 14, justifyContent: 'center', borderWidth: 1, borderRadius: radii.pill },
});
