/**
 * Access Demo (spec §9.5) — try the Demo ECHO Pass. NFC-primary glow, QR
 * fallback when unsupported. Reduce-Motion users can continue without
 * interacting. Demo cannot be mistaken for a real ticket.
 */
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Text, Button } from '../../components/ui';
import { OnboardingShell } from '../../components/onboarding/OnboardingShell';
import { EchoPassDemoCard } from '../../components/onboarding/EchoPassDemoCard';
import { useOnboardingStore } from '../../stores/onboardingStore';
import { ONBOARDING_ROUTES, progressForRoute } from '../../services/onboarding/onboardingRoutes';
import { trackOnboarding } from '../../services/onboarding/onboardingAnalytics';
import { ONBOARDING_COPY } from '../../services/onboarding/onboardingCopy';

export default function AccessDemo() {
  const state = useOnboardingStore((s) => s.state);
  const completeStep = useOnboardingStore((s) => s.completeStep);
  const [demoDone, setDemoDone] = useState(false);
  const copy = ONBOARDING_COPY.accessDemo;
  const progress = progressForRoute(ONBOARDING_ROUTES.accessDemo);

  useEffect(() => {
    trackOnboarding('onboarding_screen_viewed', { screen: ONBOARDING_ROUTES.accessDemo });
    trackOnboarding('demo_pass_viewed', {});
  }, []);

  const onSuccess = () => {
    setDemoDone(true);
    trackOnboarding('demo_pass_interacted', {});
  };

  const onNext = () => {
    completeStep(ONBOARDING_ROUTES.accessDemo);
    router.push(ONBOARDING_ROUTES.trust as any);
  };

  return (
    <OnboardingShell
      progress={progress}
      footer={<Button title={copy.next} onPress={onNext} />}
    >
      <Text variant="display" style={styles.title}>{copy.title}</Text>
      <Text variant="body" color="textMedium" style={styles.body}>{copy.body}</Text>

      <View style={styles.demo}>
        <EchoPassDemoCard nfcSupported={state.deviceCapabilities.nfcSupported} onSuccess={onSuccess} />
      </View>

      {demoDone ? (
        <Text variant="actionText" color="accent" style={styles.final}>{copy.final}</Text>
      ) : null}
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: 16 },
  body: { marginTop: 12, lineHeight: 24 },
  demo: { marginTop: 28 },
  final: { textAlign: 'center', marginTop: 20 },
});
