/**
 * Permissions (spec §9.9) — explain first, request only on tap, never block
 * entry. Location / Notifications / Wallet only. Fallback line after denial.
 */
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Text, Button } from '../../components/ui';
import { OnboardingShell } from '../../components/onboarding/OnboardingShell';
import { OnboardingPermissionCard } from '../../components/onboarding/OnboardingPermissionCard';
import { useOnboardingStore } from '../../stores/onboardingStore';
import { useLocationStore } from '../../stores/locationStore';
import { ONBOARDING_ROUTES, progressForRoute } from '../../services/onboarding/onboardingRoutes';
import { trackOnboarding } from '../../services/onboarding/onboardingAnalytics';
import { ONBOARDING_COPY } from '../../services/onboarding/onboardingCopy';

export default function Permissions() {
  const permissions = useOnboardingStore((s) => s.state.permissions);
  const wallet = useOnboardingStore((s) => s.state.wallet);
  const setPermission = useOnboardingStore((s) => s.setPermission);
  const setWallet = useOnboardingStore((s) => s.setWallet);
  const completeStep = useOnboardingStore((s) => s.completeStep);
  const copy = ONBOARDING_COPY.permissions;
  const progress = progressForRoute(ONBOARDING_ROUTES.permissions);

  useEffect(() => {
    trackOnboarding('onboarding_screen_viewed', { screen: ONBOARDING_ROUTES.permissions });
  }, []);

  const allowLocation = async () => {
    setPermission('location', 'requested');
    await useLocationStore.getState().initialize();
    const loc = useLocationStore.getState().location;
    setPermission('location', loc ? 'granted' : 'denied');
  };

  const onNext = () => {
    completeStep(ONBOARDING_ROUTES.permissions);
    router.push(ONBOARDING_ROUTES.complete as any);
  };

  return (
    <OnboardingShell
      progress={progress}
      footer={<Button title={copy.next} onPress={onNext} />}
    >
      <Text variant="display" style={styles.title}>{copy.title}</Text>

      <View style={styles.cards}>
        <OnboardingPermissionCard
          icon="location-outline"
          title={copy.location.title}
          body={copy.location.body}
          state={permissions.location}
          fallback={copy.fallback.locationDenied}
          allowLabel={copy.allow}
          notNowLabel={copy.notNow}
          onAllow={allowLocation}
          onNotNow={() => setPermission('location', 'denied')}
        />
        <OnboardingPermissionCard
          icon="notifications-outline"
          title={copy.notifications.title}
          body={copy.notifications.body}
          state={permissions.notifications}
          fallback={copy.fallback.notificationsDenied}
          allowLabel={copy.allow}
          notNowLabel={copy.notNow}
          onAllow={() => setPermission('notifications', 'granted')}
          onNotNow={() => setPermission('notifications', 'denied')}
        />
        <OnboardingPermissionCard
          icon="wallet-outline"
          title={copy.wallet.title}
          body={copy.wallet.body}
          state={wallet === 'pass_added' ? 'granted' : wallet === 'wallet_skipped' ? 'denied' : permissions.wallet}
          fallback={copy.fallback.walletUnavailable}
          allowLabel={copy.allow}
          notNowLabel={copy.notNow}
          onAllow={() => { setPermission('wallet', 'granted'); setWallet('available'); }}
          onNotNow={() => { setPermission('wallet', 'denied'); setWallet('wallet_skipped'); }}
        />
      </View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: 16, marginBottom: 24 },
  cards: { gap: 14 },
});
