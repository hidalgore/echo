import { Stack } from 'expo-router';
export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
    <Stack.Screen name="welcome" />
    <Stack.Screen name="intro-carousel" />
    <Stack.Screen name="sign-in" />
    <Stack.Screen name="email-sign-in" />
    <Stack.Screen name="create-account" />
  </Stack>;
}
