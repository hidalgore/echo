/**
 * Personalize (onboarding reference, screen 4) — "Events that fit your vibe."
 * Icon chip grid for interests + a full-width Nearby Events location opt-in.
 * No account required; selections seed recommendation readiness. Skippable.
 */
import { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Text, Button } from '../../components/ui';
import { useDynamicTheme } from '../../theme/dynamicTheme';
import { radii } from '../../theme/tokens';
import { OnboardingShell } from '../../components/onboarding/OnboardingShell';
import { GradientHeadline } from '../../components/onboarding/GradientHeadline';
import { useOnboardingStore } from '../../stores/onboardingStore';
import { useLocationStore } from '../../stores/locationStore';
import { ONBOARDING_ROUTES, progressForRoute } from '../../services/onboarding/onboardingRoutes';
import { trackOnboarding } from '../../services/onboarding/onboardingAnalytics';
import { ONBOARDING_COPY } from '../../services/onboarding/onboardingCopy';
import { INTEREST_CHIPS } from '../../services/onboarding/onboardingMockData';

export default function EventEnergy() {
  const { colors: c } = useDynamicTheme();
  const energy = useOnboardingStore((s) => s.state.energy);
  const setEnergy = useOnboardingStore((s) => s.setEnergy);
  const setPermission = useOnboardingStore((s) => s.setPermission);
  const completeStep = useOnboardingStore((s) => s.completeStep);
  const skipStep = useOnboardingStore((s) => s.skipStep);
  const [detecting, setDetecting] = useState(false);
  const copy = ONBOARDING_COPY.eventEnergy;
  const progress = progressForRoute(ONBOARDING_ROUTES.eventEnergy);
  const nearbyOn = !!energy.city;

  useEffect(() => {
    trackOnboarding('onboarding_screen_viewed', { screen: ONBOARDING_ROUTES.eventEnergy });
  }, []);

  const toggleInterest = (label: string) => {
    const next = energy.interests.includes(label)
      ? energy.interests.filter((x) => x !== label)
      : [...energy.interests, label];
    setEnergy({ interests: next });
  };

  const toggleNearby = async () => {
    if (nearbyOn) { setEnergy({ city: null }); return; }
    setDetecting(true);
    setPermission('location', 'requested');
    await useLocationStore.getState().initialize();
    const loc = useLocationStore.getState().location;
    setDetecting(false);
    if (loc) { setEnergy({ city: loc.display }); setPermission('location', 'granted'); }
    else { setPermission('location', 'denied'); }
  };

  const advance = (route: string) => router.push(route as any);
  const onNext = () => { completeStep(ONBOARDING_ROUTES.eventEnergy); advance(ONBOARDING_ROUTES.account); };
  const onSkip = () => { skipStep(ONBOARDING_ROUTES.eventEnergy); advance(ONBOARDING_ROUTES.account); };

  return (
    <OnboardingShell
      progress={progress}
      onSkip={onSkip}
      skipLabel={copy.skip}
      footer={<Button title={copy.next} onPress={onNext} />}
    >
      <Text variant="label" color="textMedium" style={styles.eyebrow}>{copy.eyebrow}</Text>
      <GradientHeadline line1={copy.title1} line2={copy.title2} />
      <Text variant="body" color="textMedium" style={styles.sub}>{copy.sub}</Text>

      <Text variant="sectionTitle" style={styles.prompt}>{copy.prompt}</Text>

      <View style={styles.grid}>
        {INTEREST_CHIPS.map((chip) => {
          const on = energy.interests.includes(chip.label);
          return (
            <TouchableOpacity
              key={chip.id}
              onPress={() => toggleInterest(chip.label)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              accessibilityLabel={chip.label}
              activeOpacity={0.85}
              style={[styles.chip, { borderColor: on ? c.accent : c.hairline, backgroundColor: on ? c.accentSoft : 'transparent' }]}
            >
              <Ionicons name={chip.icon as any} size={18} color={on ? c.accent : c.textMedium} />
              <Text variant="meta" color={on ? 'accent' : 'textMedium'}>{chip.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity
        onPress={toggleNearby}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: nearbyOn }}
        accessibilityLabel={copy.nearby}
        activeOpacity={0.85}
        style={[styles.nearby, { borderColor: nearbyOn ? c.accent : c.hairline, backgroundColor: nearbyOn ? c.accentSoft : 'transparent' }]}
      >
        <Ionicons name="location-outline" size={18} color={nearbyOn ? c.accent : c.textMedium} />
        <Text variant="meta" color={nearbyOn ? 'accent' : 'textMedium'} style={{ flex: 1 }}>
          {detecting ? 'Finding events near you\u2026' : energy.city ? energy.city : copy.nearby}
        </Text>
        {nearbyOn ? <Ionicons name="checkmark-circle" size={18} color={c.accent} /> : null}
      </TouchableOpacity>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  eyebrow: { textAlign: 'center', marginTop: 8, marginBottom: 10, letterSpacing: 1 },
  sub: { textAlign: 'center', marginTop: 12, lineHeight: 24, paddingHorizontal: 8 },
  prompt: { marginTop: 26, marginBottom: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  chip: { width: '47%', flexGrow: 1, flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 52, paddingHorizontal: 14, borderWidth: 1, borderRadius: radii.md },
  nearby: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 52, paddingHorizontal: 14, borderWidth: 1, borderRadius: radii.md, marginTop: 12 },
});
