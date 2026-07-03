/**
 * Discover (spec §9.4) — preview of Picked for You. Calm, privacy-safe reason
 * labels only. Max 3-5 cards. Skip allowed.
 */
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Text, Button } from '../../components/ui';
import { OnboardingShell } from '../../components/onboarding/OnboardingShell';
import { useDynamicTheme } from '../../theme/dynamicTheme';
import { radii } from '../../theme/tokens';
import { useOnboardingStore } from '../../stores/onboardingStore';
import { ONBOARDING_ROUTES, progressForRoute } from '../../services/onboarding/onboardingRoutes';
import { trackOnboarding } from '../../services/onboarding/onboardingAnalytics';
import { ONBOARDING_COPY } from '../../services/onboarding/onboardingCopy';
import { DISCOVER_PREVIEW_CARDS } from '../../services/onboarding/onboardingMockData';

export default function Discover() {
  const { colors: c } = useDynamicTheme();
  const completeStep = useOnboardingStore((s) => s.completeStep);
  const skipStep = useOnboardingStore((s) => s.skipStep);
  const copy = ONBOARDING_COPY.discover;
  const progress = progressForRoute(ONBOARDING_ROUTES.discover);

  useEffect(() => {
    trackOnboarding('onboarding_screen_viewed', { screen: ONBOARDING_ROUTES.discover });
  }, []);

  const advance = () => router.push(ONBOARDING_ROUTES.accessDemo as any);
  const onNext = () => {
    completeStep(ONBOARDING_ROUTES.discover);
    advance();
  };
  const onSkip = () => {
    skipStep(ONBOARDING_ROUTES.discover);
    advance();
  };

  return (
    <OnboardingShell
      progress={progress}
      onSkip={onSkip}
      skipLabel={copy.skip}
      footer={<Button title={copy.next} onPress={onNext} />}
    >
      <Text variant="display" style={styles.title}>{copy.title}</Text>
      <Text variant="body" color="textMedium" style={styles.body}>{copy.body}</Text>

      <View style={styles.cards}>
        {DISCOVER_PREVIEW_CARDS.map((card) => (
          <View key={card.id} style={[styles.card, { backgroundColor: c.cardBg, borderColor: c.hairline }]}>
            {/* Image replaced by neutral media block in onboarding preview */}
            <View style={[styles.media, { backgroundColor: c.bgElevated }]} />
            <View style={styles.cardBody}>
              <Text variant="eventTitle">{card.title}</Text>
              <Text variant="meta" color="textMedium" style={styles.meta}>{card.meta}</Text>
              <View style={[styles.reason, { backgroundColor: c.accentSoft }]}>
                <Text variant="caption" color="accent">{card.reason}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: 16 },
  body: { marginTop: 12, lineHeight: 24 },
  cards: { marginTop: 24, gap: 14 },
  card: { flexDirection: 'row', borderWidth: 1, borderRadius: radii.eventCard, overflow: 'hidden' },
  media: { width: 88 },
  cardBody: { flex: 1, padding: 14, gap: 4 },
  meta: { marginTop: 2 },
  reason: { alignSelf: 'flex-start', marginTop: 8, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radii.pill },
});
