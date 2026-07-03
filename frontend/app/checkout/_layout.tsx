import { Stack } from 'expo-router';
import { useDynamicTheme } from '../../theme/dynamicTheme';

export default function CheckoutLayout() {
  const { colors: c } = useDynamicTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: c.bg },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="choose-payment" />
      <Stack.Screen name="single-checkout" />
    </Stack>
  );
}
