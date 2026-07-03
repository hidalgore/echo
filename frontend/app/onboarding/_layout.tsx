import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="index" options={{ animation: 'fade' }} />
      <Stack.Screen name="welcome" />
      <Stack.Screen name="choose-path" />
      <Stack.Screen name="discover" />
      <Stack.Screen name="access-demo" />
      <Stack.Screen name="trust" />
      <Stack.Screen name="event-energy" />
      <Stack.Screen name="account" />
      <Stack.Screen name="permissions" />
      <Stack.Screen name="echo-pass" />
      <Stack.Screen name="circle" />
      <Stack.Screen name="complete" />
      <Stack.Screen name="resume" />
    </Stack>
  );
}
