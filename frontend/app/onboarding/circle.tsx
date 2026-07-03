/**
 * Bring Your Circle (onboarding reference, screen 3) — demo of ECHO Circle group
 * access. Illustrative only: shows a "spots claimed" ring + invite affordance so
 * the user understands group entry before they ever create a real Circle.
 */
import { useEffect } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Text, Button } from '../../components/ui';
import { useDynamicTheme } from '../../theme/dynamicTheme';
import { radii } from '../../theme/tokens';
import { OnboardingShell } from '../../components/onboarding/OnboardingShell';
import { GradientHeadline } from '../../components/onboarding/GradientHeadline';
import { CircleProgressRing } from '../../components/circle/CircleProgressRing';
import { useOnboardingStore } from '../../stores/onboardingStore';
import { ONBOARDING_ROUTES, progressForRoute } from '../../services/onboarding/onboardingRoutes';
import { trackOnboarding } from '../../services/onboarding/onboardingAnalytics';
import { ONBOARDING_COPY } from '../../services/onboarding/onboardingCopy';
import { CIRCLE_DEMO } from '../../services/onboarding/onboardingMockData';

export default function CircleBeat() {
  const { colors: c } = useDynamicTheme();
  const completeStep = useOnboardingStore((s) => s.completeStep);
  const skipStep = useOnboardingStore((s) => s.skipStep);
  const copy = ONBOARDING_COPY.circle;
  const progress = progressForRoute(ONBOARDING_ROUTES.circle);
  const claimed = CIRCLE_DEMO.members.filter((m) => m.claimed).length;

  useEffect(() => {
    trackOnboarding('onboarding_screen_viewed', { screen: ONBOARDING_ROUTES.circle });
  }, []);

  const advance = () => router.push(ONBOARDING_ROUTES.eventEnergy as any);
  const onNext = () => { completeStep(ONBOARDING_ROUTES.circle); advance(); };
  const onSkip = () => { skipStep(ONBOARDING_ROUTES.circle); advance(); };

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

      <View style={styles.ringWrap}>
        <CircleProgressRing progress={claimed / CIRCLE_DEMO.total} size={188} strokeWidth={10} />
        <View style={styles.ringCenter} pointerEvents="none">
          <Text variant="title">{`${claimed} of ${CIRCLE_DEMO.total}`}</Text>
          <Text variant="meta" color="textMedium">{copy.spotsClaimed}</Text>
        </View>
      </View>

      <View style={styles.avatars}>
        {CIRCLE_DEMO.members.map((m) => (
          <View key={m.id} style={styles.avatarItem}>
            {m.claimed ? (
              <>
                <View style={[styles.avatar, { backgroundColor: c.accentSoft, borderColor: c.accent }]}>
                  <Text variant="body" color="accent">{m.initials}</Text>
                </View>
                <View style={[styles.checkBadge, { backgroundColor: c.success, borderColor: c.bg }]}>
                  <Ionicons name="checkmark" size={11} color="#FFFFFF" />
                </View>
              </>
            ) : (
              <View style={[styles.avatar, styles.avatarEmpty, { borderColor: c.hairlineStrong }]}>
                <Ionicons name="add" size={20} color={c.textMedium} />
              </View>
            )}
          </View>
        ))}
      </View>

      <TouchableOpacity
        onPress={onNext}
        accessibilityRole="button"
        accessibilityLabel={`${copy.invite}. ${copy.inviteSub}`}
        activeOpacity={0.85}
        style={[styles.inviteRow, { backgroundColor: c.cardBg, borderColor: c.hairline }]}
      >
        <View style={[styles.inviteIcon, { backgroundColor: c.accentSoft }]}>
          <Ionicons name="people-outline" size={20} color={c.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="eventTitle">{copy.invite}</Text>
          <Text variant="meta" color="textMedium" style={styles.inviteSub}>{copy.inviteSub}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={c.textLow} />
      </TouchableOpacity>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  eyebrow: { textAlign: 'center', marginTop: 8, marginBottom: 10, letterSpacing: 1 },
  sub: { textAlign: 'center', marginTop: 12, lineHeight: 24, paddingHorizontal: 8 },
  ringWrap: { alignItems: 'center', justifyContent: 'center', marginTop: 26 },
  ringCenter: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', gap: 2 },
  avatars: { flexDirection: 'row', justifyContent: 'center', gap: 14, marginTop: 22 },
  avatarItem: { width: 48, height: 48 },
  avatar: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  avatarEmpty: { borderStyle: 'dashed' },
  checkBadge: { position: 'absolute', right: -2, bottom: -2, width: 18, height: 18, borderRadius: 9, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  inviteRow: { flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, borderRadius: radii.lg, padding: 14, marginTop: 26 },
  inviteIcon: { width: 40, height: 40, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  inviteSub: { marginTop: 2 },
});
