/**
 * Your ECHO Pass (onboarding reference, screen 2) — "Tap in with confidence."
 * Shows the real EchoWalletPassCard with a clearly-demo event pass so the NFC /
 * entry-ready / verified language reads exactly as it will in the wallet.
 */
import { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Text, Button } from '../../components/ui';
import { OnboardingShell } from '../../components/onboarding/OnboardingShell';
import { GradientHeadline } from '../../components/onboarding/GradientHeadline';
import { EchoWalletPassCard } from '../../components/wallet/EchoWalletPassCard';
import { createEventPassMock, type EchoWalletPass } from '../../services/appleWalletPassService';
import { useOnboardingStore } from '../../stores/onboardingStore';
import { ONBOARDING_ROUTES, progressForRoute } from '../../services/onboarding/onboardingRoutes';
import { trackOnboarding } from '../../services/onboarding/onboardingAnalytics';
import { ONBOARDING_COPY } from '../../services/onboarding/onboardingCopy';

export default function EchoPass() {
  const completeStep = useOnboardingStore((s) => s.completeStep);
  const copy = ONBOARDING_COPY.echoPass;
  const progress = progressForRoute(ONBOARDING_ROUTES.echoPass);

  const demoPass = useMemo<EchoWalletPass>(() => ({
    ...createEventPassMock('ready'),
    eventName: 'Nightfall Festival',
    venueName: 'The Warehouse \u00b7 Seattle',
    eventDateTime: 'Jun 15 \u00b7 8:00 PM',
    ageRequirement: '21+',
    ageVerified: true,
  }), []);

  useEffect(() => {
    trackOnboarding('onboarding_screen_viewed', { screen: ONBOARDING_ROUTES.echoPass });
    trackOnboarding('demo_pass_viewed', {});
  }, []);

  const onNext = () => {
    completeStep(ONBOARDING_ROUTES.echoPass);
    router.push(ONBOARDING_ROUTES.circle as any);
  };

  return (
    <OnboardingShell progress={progress} footer={<Button title={copy.next} onPress={onNext} />}>
      <Text variant="label" color="textMedium" style={styles.eyebrow}>{copy.eyebrow}</Text>
      <GradientHeadline line1={copy.title1} line2={copy.title2} />
      <Text variant="body" color="textMedium" style={styles.sub}>{copy.sub}</Text>

      <View style={styles.passWrap}>
        <EchoWalletPassCard pass={demoPass} />
      </View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  eyebrow: { textAlign: 'center', marginTop: 8, marginBottom: 10, letterSpacing: 1 },
  sub: { textAlign: 'center', marginTop: 12, lineHeight: 24, paddingHorizontal: 8 },
  passWrap: { marginTop: 28 },
});
