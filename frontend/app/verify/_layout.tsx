import { Stack } from 'expo-router';
import { colors } from '../../theme/tokens';

export default function VerifyLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="method" />
      <Stack.Screen name="selfie" />
      <Stack.Screen name="id-scan" />
      <Stack.Screen name="processing" options={{ gestureEnabled: false }} />
      <Stack.Screen name="result" options={{ gestureEnabled: false }} />
    </Stack>
  );
}
