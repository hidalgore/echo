import { useEffect, useMemo } from 'react';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDynamicTheme } from '../../../theme/dynamicTheme';
import { GradientTabIcon } from '../../../components/navigation/GradientTabIcon';
import { useEventStore } from '../../../stores/eventStore';
import { useHostProfileStore } from '../../../stores/hostProfileStore';
import { isHappeningNow, startsWithinHours, isExpired } from '../../../utils/event';
import { isDemoHostEvent } from '../../../services/mockHostEventSuite';

export default function HostTabLayout() {
  const { colors, isDark } = useDynamicTheme();
  const insets = useSafeAreaInsets();
  const hydrateEvents = useEventStore((s) => s.hydrate);
  const events = useEventStore((s) => s.events);
  const hydrateHost = useHostProfileStore((s) => s.hydrate);
  const hostName = useHostProfileStore((s) => s.profile.displayName);

  useEffect(() => {
    void hydrateEvents();
    void hydrateHost();
  }, [hydrateEvents, hydrateHost]);

  const doorEligibleEvent = useMemo(() => {
    const hostedEvents = events.filter((event) => {
      const matchesHost = !hostName || (event.host_name || '').trim() === hostName.trim() || String(event.id).startsWith('evt_host_') || isDemoHostEvent(event.id);
      return matchesHost && !isExpired(event) && (isHappeningNow(event) || startsWithinHours(event, 2));
    });

    return hostedEvents.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())[0] || null;
  }, [events, hostName]);

  const doorHref = doorEligibleEvent
    ? { pathname: '/(host)/(tabs)/door', params: { id: doorEligibleEvent.id } }
    : null;

  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: colors.tabActiveIcon,
      tabBarInactiveTintColor: colors.tabInactiveIcon,
      tabBarStyle: {
        position: 'absolute',
        left: 16,
        right: 16,
        bottom: Math.max(insets.bottom, 12),
        height: 68,
        paddingTop: 10,
        paddingBottom: 8,
        paddingHorizontal: 8,
        borderRadius: 28,
        backgroundColor: isDark ? 'rgba(10,14,20,0.82)' : 'rgba(255,255,255,0.76)',
        borderTopWidth: 0,
        borderWidth: 1,
        borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(17,24,39,0.08)',
        shadowColor: isDark ? '#000000' : '#111827',
        shadowOpacity: isDark ? 0.32 : 0.12,
        shadowRadius: 22,
        shadowOffset: { width: 0, height: 10 },
        elevation: 18,
      },
      tabBarLabelStyle: { display: 'none' },
      tabBarItemStyle: { paddingVertical: 0, alignItems: 'center', justifyContent: 'center' },
      headerShown: false,
      tabBarShowLabel: false,
    }}>
      <Tabs.Screen name="overview" options={{ title: 'Dashboard', tabBarIcon: ({ color, focused }) => <GradientTabIcon name="grid-outline" focused={focused} color={color} size={28} /> }} />
      <Tabs.Screen name="events" options={{ title: 'Events', tabBarIcon: ({ color, focused }) => <GradientTabIcon name="calendar-outline" focused={focused} color={color} size={28} /> }} />
      <Tabs.Screen name="door" options={{ href: doorHref as never, title: 'Door', tabBarStyle: { display: 'none' }, tabBarIcon: ({ color, focused }) => <GradientTabIcon name="radio-outline" focused={focused} color={color} size={30} /> }} />
      <Tabs.Screen name="payouts" options={{ title: 'Payouts', tabBarIcon: ({ color, focused }) => <GradientTabIcon name="cash-outline" focused={focused} color={color} size={28} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color, focused }) => <GradientTabIcon name="person-outline" focused={focused} color={color} size={28} /> }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
    </Tabs>
  );
}
