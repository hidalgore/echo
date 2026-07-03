import { Stack } from 'expo-router';
import { useDynamicTheme } from '../../theme/dynamicTheme';

export default function CircleLayout() {
  const { colors: c } = useDynamicTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: c.bg },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="[id]" />
      <Stack.Screen name="success" options={{ animation: 'fade', gestureEnabled: false }} />
      <Stack.Screen name="invite" options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="recipient/[token]" options={{ animation: 'slide_from_right' }} />
    </Stack>
  );
}
