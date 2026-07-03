/**
 * Account / Guest (spec §9.8) — no forced sign-up. Guest can browse; account
 * gates appear only when needed.
 * Phase 1: Apple/Google/Email resolve via the app's existing mock auth and keep
 * the onboarding flow linear (Account -> Permissions -> Pass -> Complete). Real
 * OAuth/email providers wire in a later phase (flagged in build notes).
 */
import { useEffect } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../../components/ui';
import { useDynamicTheme } from '../../theme/dynamicTheme';
import { radii } from '../../theme/tokens';
import { OnboardingShell } from '../../components/onboarding/OnboardingShell';
import { useOnboardingStore } from '../../stores/onboardingStore';
import { ONBOARDING_ROUTES, progressForRoute } from '../../services/onboarding/onboardingRoutes';
import { trackOnboarding } from '../../services/onboarding/onboardingAnalytics';
import { ONBOARDING_COPY } from '../../services/onboarding/onboardingCopy';
import type { AccountState } from '../../services/onboarding/onboardingTypes';

export default function Account() {
  const { colors: c } = useDynamicTheme();
  const setAccount = useOnboardingStore((s) => s.setAccount);
  const completeStep = useOnboardingStore((s) => s.completeStep);
  const copy = ONBOARDING_COPY.account;
  const progress = progressForRoute(ONBOARDING_ROUTES.account);

  useEffect(() => {
    trackOnboarding('onboarding_screen_viewed', { screen: ONBOARDING_ROUTES.account });
  }, []);

  const choose = (account: AccountState) => {
    setAccount(account);
    completeStep(ONBOARDING_ROUTES.account);
    router.push(ONBOARDING_ROUTES.permissions as any);
  };

  const Option = ({ icon, label, onPress, primary }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void; primary?: boolean }) => (
    <TouchableOpacity
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      activeOpacity={0.85}
      style={[styles.option, { borderColor: c.hairline, backgroundColor: primary ? c.cardBg : 'transparent' }]}
    >
      <Ionicons name={icon} size={18} color={c.text} />
      <Text variant="actionText">{label}</Text>
    </TouchableOpacity>
  );

  return (
    <OnboardingShell progress={progress}>
      <Text variant="display" style={styles.title}>{copy.title}</Text>

      <View style={styles.options}>
        <Option icon="logo-apple" label={copy.apple} onPress={() => choose('oauth_connected')} primary />
        <Option icon="logo-google" label={copy.google} onPress={() => choose('oauth_connected')} primary />
        <Option icon="mail-outline" label={copy.email} onPress={() => choose('email_started')} primary />
        <Option icon="person-outline" label={copy.guest} onPress={() => choose('guest')} />
      </View>

      <Text variant="caption" color="textMedium" style={styles.gate}>{copy.gate}</Text>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: 16, marginBottom: 24 },
  options: { gap: 12 },
  option: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, minHeight: 52, borderWidth: 1, borderRadius: radii.md },
  gate: { textAlign: 'center', marginTop: 18 },
});
