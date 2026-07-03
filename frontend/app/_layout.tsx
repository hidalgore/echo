import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { colors } from '../theme/tokens';
import { DynamicThemeProvider, useDynamicTheme } from '../theme/dynamicTheme';
import { useAuthStore } from '../stores/authStore';
import { installAppLogging, NavigationTransitionLogger, logEvent } from '../services/logging';

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
    <DynamicThemeProvider>
      <RootInner />
    </DynamicThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  loading: { flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' },
});
