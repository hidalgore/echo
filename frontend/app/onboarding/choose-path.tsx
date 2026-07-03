/**
 * Choose Path (spec §9.3) — path selection doesn't lock account type.
 */
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Text } from '../../components/ui';
import { OnboardingShell } from '../../components/onboarding/OnboardingShell';
import { OnboardingChoiceCard } from '../../components/onboarding/OnboardingChoiceCard';
import { useOnboardingStore } from '../../stores/onboardingStore';
import { ONBOARDING_ROUTES, progressForRoute } from '../../services/onboarding/onboardingRoutes';
import { trackOnboarding } from '../../services/onboarding/onboardingAnalytics';
import { ONBOARDING_COPY } from '../../services/onboarding/onboardingCopy';

export default function ChoosePath() {
  const setUserPath = useOnboardingStore((s) => s.setUserPath);
  const completeStep = useOnboardingStore((s) => s.completeStep);
  const copy = ONBOARDING_COPY.choosePath;
  const progress = progressForRoute(ONBOARDING_ROUTES.choosePath);

  useEffect(() => {
    trackOnboarding('onboarding_screen_viewed', { screen: ONBOARDING_ROUTES.choosePath });
  }, []);

  const go = (path: 'explore_events' | 'claim_invite' | 'host_events', route: string) => {
    setUserPath(path);
    completeStep(ONBOARDING_ROUTES.choosePath);
    router.push(route as any);
  };

  return (
    <OnboardingShell progress={progress}>
      <Text variant="display" style={styles.title}>{copy.title}</Text>
      <View style={styles.cards}>
        <OnboardingChoiceCard icon="compass-outline" title={copy.explore.title} body={copy.explore.body} onPress={() => go('explore_events', ONBOARDING_ROUTES.discover)} />
        {/* Phase 1: invite + host route into the standard flow; Phase 2 wires claim/host-intro screens. */}
        <OnboardingChoiceCard icon="mail-open-outline" title={copy.invite.title} body={copy.invite.body} onPress={() => go('claim_invite', ONBOARDING_ROUTES.accessDemo)} />
        <OnboardingChoiceCard icon="megaphone-outline" title={copy.host.title} body={copy.host.body} onPress={() => go('host_events', ONBOARDING_ROUTES.discover)} />
      </View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: 16, marginBottom: 24 },
  cards: { gap: 12 },
});
