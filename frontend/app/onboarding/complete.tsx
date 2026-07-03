/**
 * You're Ready (onboarding reference, screen 5) — "You're in. Let's go."
 * Status cards reflect REAL state: a card only shows the verified/active check
 * when it is actually true; otherwise it shows an honest pending line. We never
 * imply age verification or an active pass the user hasn't earned.
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
import { useOnboardingStore } from '../../stores/onboardingStore';
import { ONBOARDING_ROUTES } from '../../services/onboarding/onboardingRoutes';
import { trackOnboarding } from '../../services/onboarding/onboardingAnalytics';
import { ONBOARDING_COPY } from '../../services/onboarding/onboardingCopy';

function StatusCard({ icon, title, body, done }: { icon: keyof typeof Ionicons.glyphMap; title: string; body: string; done: boolean }) {
  const { colors: c } = useDynamicTheme();
  return (
    <View style={[styles.card, { backgroundColor: c.cardBg, borderColor: done ? c.success : c.hairline }]}>
      <View style={[styles.iconWrap, { backgroundColor: done ? c.success : c.bgElevated }]}>
        <Ionicons name={icon} size={18} color={done ? '#FFFFFF' : c.textMedium} />
      </View>
      <View style={{ flex: 1 }}>
        <Text variant="eventTitle">{title}</Text>
        <Text variant="meta" color="textMedium" style={styles.cardBody}>{body}</Text>
      </View>
      <Ionicons
        name={done ? 'checkmark-circle' : 'ellipse-outline'}
        size={20}
        color={done ? c.success : c.textLow}
      />
    </View>
  );
}

export default function Complete() {
  const state = useOnboardingStore((s) => s.state);
  const completeOnboarding = useOnboardingStore((s) => s.completeOnboarding);
  const copy = ONBOARDING_COPY.complete;
  const st = copy.status;

  const ageDone = state.ageEligibility === 'verified_18_plus' || state.ageEligibility === 'verified_21_plus';
  const entryDone = state.wallet === 'pass_added';
  const secureDone = true; // platform guarantee, not user-action dependent

  useEffect(() => {
    trackOnboarding('onboarding_screen_viewed', { screen: ONBOARDING_ROUTES.complete });
  }, []);

  const finish = async () => {
    await completeOnboarding();
    router.replace('/(tabs)');
  };

  return (
    <OnboardingShell
      footer={
        <View style={styles.footer}>
          <Button title={copy.primary} onPress={finish} />
          <TouchableOpacity onPress={finish} accessibilityRole="button" style={styles.secondary}>
            <Text variant="actionText" color="textMedium">{copy.secondary}</Text>
          </TouchableOpacity>
        </View>
      }
    >
      <Text variant="label" color="textMedium" style={styles.eyebrow}>{copy.eyebrow}</Text>
      <GradientHeadline line1={copy.title1} line2={copy.title2} />
      <Text variant="body" color="textMedium" style={styles.sub}>{copy.sub}</Text>

      <View style={styles.cards}>
        <StatusCard icon="shield-checkmark-outline" title={st.ageVerified.title} body={ageDone ? st.ageVerified.done : st.ageVerified.pending} done={ageDone} />
        <StatusCard icon="radio-outline" title={st.entryReady.title} body={entryDone ? st.entryReady.done : st.entryReady.pending} done={entryDone} />
        <StatusCard icon="lock-closed-outline" title={st.privateSecure.title} body={secureDone ? st.privateSecure.done : st.privateSecure.pending} done={secureDone} />
      </View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  eyebrow: { textAlign: 'center', marginTop: 8, marginBottom: 10, letterSpacing: 1 },
  sub: { textAlign: 'center', marginTop: 12, lineHeight: 24, paddingHorizontal: 8 },
  cards: { marginTop: 28, gap: 12 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, borderRadius: radii.lg, padding: 16 },
  iconWrap: { width: 40, height: 40, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  cardBody: { marginTop: 3 },
  footer: { gap: 12 },
  secondary: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
});
