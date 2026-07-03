import { Stack } from 'expo-router';

export default function HostLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0F1115' },
      }}
    />
  );
}
