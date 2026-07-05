import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { colors } from '../theme/tokens';
import { DynamicThemeProvider, useDynamicTheme } from '../theme/dynamicTheme';
import { useAuthStore } from '../stores/authStore';
import { installAppLogging, NavigationTransitionLogger, logEvent } from '../services/logging';
import { CONFIG } from '../constants/config';
import { configureApiClient } from '../services/api/apiClient';
import { bindPorts } from '../services/api/ports';
import { mockPorts } from '../services/api/mockAdapters';
import { httpCheckoutPort, httpDiscoveryPort, httpDoorPort, httpTicketPort } from '../services/api/httpAdapters';
import { refreshSession } from '../services/auth/authService';
import { getAccessTokenSync } from '../services/auth/tokenStorage';
import { PaymentProvider } from '../components/checkout/StripeCheckout';

// Bind the API seam before any screen renders. Http adapters replace mock
// domain-by-domain as backend phases land (the swap is this one binding — no
// screen edits). Phase 1: the auth domain rides the bearer + single-flight
// refresh hooks (tokenStorage/authService). Phase 2: discovery rides the S-03
// http port behind EXPO_PUBLIC_ECHO_DISCOVERY_MODE. Phase 3: checkout rides
// the S-05 http port behind EXPO_PUBLIC_ECHO_CHECKOUT_MODE. Phase 4: tickets
// ride the S-06 http port behind EXPO_PUBLIC_ECHO_TICKET_MODE. Phase 5: door
// mode rides the S-07 http port behind EXPO_PUBLIC_ECHO_DOOR_MODE (mock
// defaults until the operator smokes staging). Every other domain still
// resolves through mockPorts.
configureApiClient({
  baseUrl: CONFIG.API_BASE_URL,
  getAuthToken: getAccessTokenSync,
  refreshAuthToken: refreshSession,
});
bindPorts({
  ...mockPorts,
  ...(CONFIG.DISCOVERY_MODE === 'live' ? { discovery: httpDiscoveryPort } : null),
  ...(CONFIG.CHECKOUT_MODE === 'live' ? { checkout: httpCheckoutPort } : null),
  ...(CONFIG.TICKET_MODE === 'live' ? { ticket: httpTicketPort } : null),
  ...(CONFIG.DOOR_MODE === 'live' ? { door: httpDoorPort } : null),
});

function RootInner() {
  const [ready, setReady] = useState(false);
  const { initialize } = useAuthStore();
  const { colors: c, statusBarStyle } = useDynamicTheme();

  useEffect(() => {
    installAppLogging();
    logEvent('app.bootstrap', 'initializing');

    initialize().then(() => {
      const authState = useAuthStore.getState();
      logEvent('app.bootstrap', 'ready', {
        isAuthenticated: authState.isAuthenticated,
        hasSeenIntro: authState.hasSeenIntro,
      });
      setReady(true);
    }).catch((e) => {
      // Never strand the app on the loading spinner if bootstrap rejects.
      logEvent('app.bootstrap', 'init_failed', { error: String(e) }, 'error');
      setReady(true);
    });
  }, []);

  if (!ready) {
    return (
      <GestureHandlerRootView style={[styles.loading, { backgroundColor: c.bg }]}>
        <ActivityIndicator size="large" color={c.accent} />
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={[styles.container, { backgroundColor: c.bg }]}>
      <StatusBar style={statusBarStyle} />
      <NavigationTransitionLogger />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: c.bg },
          animation: 'slide_from_right',
        }}
      />
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  return (
    // PaymentProvider is a no-op on web and on builds without a Stripe
    // publishable key (components/checkout/StripeCheckout platform split).
    <PaymentProvider>
      <DynamicThemeProvider>
        <RootInner />
      </DynamicThemeProvider>
    </PaymentProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  loading: { flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' },
});
