import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { colors } from '../../theme/tokens';
import { GradientTabIcon } from '../../components/navigation/GradientTabIcon';

export default function CreativeLayout() {
  const creativeColor = '#22C55E';
  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: colors.text,
      tabBarInactiveTintColor: colors.textTertiary,
      tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.divider, borderTopWidth: 1, paddingTop: 8, paddingBottom: Platform.OS === 'ios' ? 24 : 8, height: Platform.OS === 'ios' ? 84 : 60 },
      tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
      headerShown: false,
    }}>
      <Tabs.Screen name="overview" options={{ title: 'Overview', tabBarIcon: ({ color, focused }) => <GradientTabIcon name="grid-outline" focused={focused} color={color} size={22} /> }} />
      <Tabs.Screen name="content" options={{ title: 'Content', tabBarIcon: ({ color, focused }) => <GradientTabIcon name="images-outline" focused={focused} color={color} size={22} /> }} />
      <Tabs.Screen name="events" options={{ title: 'Events', tabBarIcon: ({ color, focused }) => <GradientTabIcon name="calendar-outline" focused={focused} color={color} size={22} /> }} />
      <Tabs.Screen name="earnings" options={{ title: 'Earnings', tabBarIcon: ({ color, focused }) => <GradientTabIcon name="cash-outline" focused={focused} color={color} size={22} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color, focused }) => <GradientTabIcon name="person-outline" focused={focused} color={color} size={22} /> }} />
    </Tabs>
  );
}
