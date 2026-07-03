/**
 * OnboardingPermissionCard — explain-first permission card (spec §9.9).
 * Explains the permission, then triggers the native prompt only on tap.
 * Shows a fallback line once denied; never blocks app entry.
 */
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../ui';
import { useDynamicTheme } from '../../theme/dynamicTheme';
import { radii } from '../../theme/tokens';
import type { PermissionState } from '../../services/onboarding/onboardingTypes';

interface Props {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
  state: PermissionState;
  fallback?: string;
  allowLabel: string;
  notNowLabel: string;
  onAllow: () => void;
  onNotNow: () => void;
}

export function OnboardingPermissionCard({
  icon, title, body, state, fallback, allowLabel, notNowLabel, onAllow, onNotNow,
}: Props) {
  const { colors: c } = useDynamicTheme();
  const resolved = state === 'granted' || state === 'denied' || state === 'limited';
  const granted = state === 'granted';

  return (
    <View style={[styles.card, { backgroundColor: c.cardBg, borderColor: c.hairline }]}>
      <View style={styles.topRow}>
        <View style={[styles.iconWrap, { backgroundColor: c.accentSoft }]}>
          <Ionicons name={icon} size={20} color={c.accent} />
        </View>
        <View style={styles.textWrap}>
          <Text variant="eventTitle">{title}</Text>
          <Text variant="meta" color="textMedium" style={styles.body}>{body}</Text>
        </View>
        {resolved ? (
          <Ionicons
            name={granted ? 'checkmark-circle' : 'remove-circle-outline'}
            size={22}
            color={granted ? c.success : c.textLow}
          />
        ) : null}
      </View>

      {resolved && !granted && fallback ? (
        <Text variant="caption" color="textMedium" style={styles.fallback}>{fallback}</Text>
      ) : null}

      {!resolved ? (
        <View style={styles.actions}>
          <TouchableOpacity
            onPress={onNotNow}
            accessibilityRole="button"
            accessibilityLabel={notNowLabel}
            style={[styles.actionBtn, styles.notNow]}
          >
            <Text variant="actionText" color="textMedium">{notNowLabel}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onAllow}
            accessibilityRole="button"
            accessibilityLabel={`${allowLabel} ${title}`}
            style={[styles.actionBtn, { backgroundColor: c.accent }]}
          >
            <Text variant="actionText" style={{ color: '#FFFFFF' }}>{allowLabel}</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: radii.lg, padding: 16, gap: 12 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  iconWrap: { width: 40, height: 40, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  textWrap: { flex: 1 },
  body: { marginTop: 3 },
  fallback: { marginTop: 2 },
  actions: { flexDirection: 'row', gap: 10 },
  actionBtn: { flex: 1, minHeight: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  notNow: { borderWidth: 1, borderColor: 'transparent' },
});
