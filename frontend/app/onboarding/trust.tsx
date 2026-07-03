/**
 * Trust (spec §9.6) — explains verified access in plain language. No forced
 * age verification here; optional Trust Ring sheet.
 */
import { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Text, Button } from '../../components/ui';
import { useDynamicTheme } from '../../theme/dynamicTheme';
import { radii } from '../../theme/tokens';
import { OnboardingShell } from '../../components/onboarding/OnboardingShell';
import { TrustRingExplainerSheet } from '../../components/onboarding/TrustRingExplainerSheet';
import { useOnboardingStore } from '../../stores/onboardingStore';
import { ONBOARDING_ROUTES, progressForRoute } from '../../services/onboarding/onboardingRoutes';
import { trackOnboarding } from '../../services/onboarding/onboardingAnalytics';
import { ONBOARDING_COPY } from '../../services/onboarding/onboardingCopy';

const CARD_ICONS = ['shield-checkmark-outline', 'finger-print-outline', 'lock-closed-outline'] as const;

export default function Trust() {
  const { colors: c } = useDynamicTheme();
  const completeStep = useOnboardingStore((s) => s.completeStep);
  const [sheetOpen, setSheetOpen] = useState(false);
  const copy = ONBOARDING_COPY.trust;
  const progress = progressForRoute(ONBOARDING_ROUTES.trust);
  const cards = [copy.cards.verified, copy.cards.ageGated, copy.cards.hostControlled];

  useEffect(() => {
    trackOnboarding('onboarding_screen_viewed', { screen: ONBOARDING_ROUTES.trust });
  }, []);

  const onNext = () => {
    completeStep(ONBOARDING_ROUTES.trust);
    router.push(ONBOARDING_ROUTES.eventEnergy as any);
  };

  return (
    <OnboardingShell progress={progress} footer={<Button title={copy.next} onPress={onNext} />}>
      <Text variant="display" style={styles.title}>{copy.title}</Text>
      <Text variant="body" color="textMedium" style={styles.body}>{copy.body}</Text>

      <View style={styles.cards}>
        {cards.map((card, i) => (
          <View key={card.title} style={[styles.card, { backgroundColor: c.cardBg, borderColor: c.hairline }]}>
            <View style={[styles.iconWrap, { backgroundColor: c.accentSoft }]}>
              <Ionicons name={CARD_ICONS[i]} size={20} color={c.accent} />
            </View>
            <View style={styles.cardText}>
              <Text variant="eventTitle">{card.title}</Text>
              <Text variant="meta" color="textMedium" style={styles.cardBody}>{card.body}</Text>
            </View>
          </View>
        ))}
      </View>

      <TouchableOpacity onPress={() => setSheetOpen(true)} accessibilityRole="button" style={styles.sheetTrigger}>
        <Ionicons name="information-circle-outline" size={16} color={c.accent} />
        <Text variant="actionText" color="accent">{copy.sheetTrigger}</Text>
      </TouchableOpacity>

      <TrustRingExplainerSheet visible={sheetOpen} onClose={() => setSheetOpen(false)} />
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: 16 },
  body: { marginTop: 12, lineHeight: 24 },
  cards: { marginTop: 24, gap: 12 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, borderRadius: radii.lg, padding: 16 },
  iconWrap: { width: 40, height: 40, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  cardText: { flex: 1 },
  cardBody: { marginTop: 3 },
  sheetTrigger: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 20, minHeight: 44, justifyContent: 'center' },
});
