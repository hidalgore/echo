/**
 * Welcome (onboarding reference, screen 1) — cinematic entry. One understanding
 * moment, no sign-up here.
 */
import { useEffect } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { Text, Button } from '../../components/ui';
import { EchoLogoMark } from '../../components/wallet/EchoLogoMark';
import { OnboardingShell } from '../../components/onboarding/OnboardingShell';
import { EclipseHero } from '../../components/onboarding/EclipseHero';
import { GradientHeadline } from '../../components/onboarding/GradientHeadline';
import { useOnboardingStore } from '../../stores/onboardingStore';
import { ONBOARDING_ROUTES } from '../../services/onboarding/onboardingRoutes';
import { trackOnboarding } from '../../services/onboarding/onboardingAnalytics';
import { ONBOARDING_COPY } from '../../services/onboarding/onboardingCopy';

export default function Welcome() {
  const completeStep = useOnboardingStore((s) => s.completeStep);
  const copy = ONBOARDING_COPY.welcome;

  useEffect(() => {
    trackOnboarding('onboarding_screen_viewed', { screen: ONBOARDING_ROUTES.welcome });
  }, []);

  const onPrimary = () => {
    completeStep(ONBOARDING_ROUTES.welcome);
    router.push(ONBOARDING_ROUTES.echoPass as any);
  };

  const onLogin = () => router.push('/(auth)/sign-in' as any);

  return (
    <OnboardingShell
      footer={
        <View style={styles.footer}>
          <Button title={copy.primary} onPress={onPrimary} />
          <TouchableOpacity onPress={onLogin} accessibilityRole="button" style={styles.secondary}>
            <Text variant="actionText" color="accent">{copy.secondary}</Text>
          </TouchableOpacity>
        </View>
      }
    >
      <View style={styles.hero}>
        <EclipseHero size={210} />
        <View style={styles.wordmark}>
          <EchoLogoMark width={150} height={50} />
        </View>
      </View>

      <GradientHeadline line1={copy.title1} line2={copy.title2} />
      <Text variant="body" color="textMedium" style={styles.sub}>{copy.sub}</Text>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', marginTop: 12, marginBottom: 26 },
  wordmark: { marginTop: 18 },
  sub: { textAlign: 'center', marginTop: 14, lineHeight: 24, paddingHorizontal: 8 },
  footer: { gap: 12 },
  secondary: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
});
