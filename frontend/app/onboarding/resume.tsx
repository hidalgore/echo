/**
 * Resume (spec §14) — returning incomplete users continue, skip to Home, or
 * start over. Resumes from the last completed meaningful step.
 */
import { useEffect } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { Text, Button } from '../../components/ui';
import { useDynamicTheme } from '../../theme/dynamicTheme';
import { OnboardingShell } from '../../components/onboarding/OnboardingShell';
import { useOnboardingStore } from '../../stores/onboardingStore';
import { ONBOARDING_ROUTES, nextRoute } from '../../services/onboarding/onboardingRoutes';
import { trackOnboarding } from '../../services/onboarding/onboardingAnalytics';
import { ONBOARDING_COPY } from '../../services/onboarding/onboardingCopy';

export default function Resume() {
  const { colors: c } = useDynamicTheme();
  const state = useOnboardingStore((s) => s.state);
  const completeOnboarding = useOnboardingStore((s) => s.completeOnboarding);
  const reset = useOnboardingStore((s) => s.reset);
  const copy = ONBOARDING_COPY.resume;

  useEffect(() => {
    trackOnboarding('onboarding_screen_viewed', { screen: ONBOARDING_ROUTES.resume });
  }, []);

  const onContinue = () => {
    const last = state.lastCompletedStep;
    const target = (last && nextRoute(last)) || ONBOARDING_ROUTES.welcome;
    router.replace(target as any);
  };

  const onSkip = async () => {
    await completeOnboarding();
    router.replace('/(tabs)');
  };

  const onRestart = async () => {
    await reset();
    router.replace(ONBOARDING_ROUTES.welcome as any);
  };

  return (
    <OnboardingShell
      footer={
        <View style={styles.footer}>
          <Button title={copy.continue} onPress={onContinue} />
          <TouchableOpacity onPress={onSkip} accessibilityRole="button" style={styles.link}>
            <Text variant="actionText" color="textMedium">{copy.skip}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onRestart} accessibilityRole="button" style={styles.link}>
            <Text variant="actionText" color="accent">{copy.restart}</Text>
          </TouchableOpacity>
        </View>
      }
    >
      <Text variant="display" style={styles.title}>{copy.title}</Text>
      <Text variant="body" color="textMedium" style={styles.body}>
        {state.lastCompletedStep ? 'Pick up where you left off.' : 'Start setting up your ECHO experience.'}
      </Text>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: 24 },
  body: { marginTop: 12, lineHeight: 24 },
  footer: { gap: 12 },
  link: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
});
