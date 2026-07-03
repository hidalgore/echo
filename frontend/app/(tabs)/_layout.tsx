import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDynamicTheme } from '../../theme/dynamicTheme';
import { GradientTabIcon } from '../../components/navigation/GradientTabIcon';
import { useUIStore } from '../../stores/uiStore';

/**
 * v59.3 — Custom animated tab bar.
 * ───────────────────────────────────
 * Renders a minimal tab bar from the props expo-router passes via the
 * `tabBar` prop. Avoids importing @react-navigation/bottom-tabs (transitive
 * dep) so the build stays decoupled.
 *
 * Subscribes to uiStore.tabBarVisible; fades + slides the bar out of view
 * when Home requests it via the scroll-hide hook. All other tabs leave
 * tabBarVisible at true on unmount, so the bar always restores cleanly.
 */
function EchoAnimatedTabBar({ state, descriptors, navigation }: any) {
  const { colors, isDark } = useDynamicTheme();
  const insets = useSafeAreaInsets();
  const visible = useUIStore((s) => s.tabBarVisible);
  const opacity = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: visible ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: visible ? 0 : 120,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible, opacity, translateY]);

  return (
    <Animated.View
      pointerEvents={visible ? 'auto' : 'none'}
      style={[
        styles.barOuter,
        {
          bottom: Math.max(insets.bottom, 12),
          backgroundColor: isDark ? 'rgba(15,17,21,0.78)' : 'rgba(255,255,255,0.76)',
          borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(17,24,39,0.08)',
          shadowColor: isDark ? '#000000' : '#111827',
          shadowOpacity: isDark ? 0.32 : 0.12,
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const onLongPress = () => {
          navigation.emit({ type: 'tabLongPress', target: route.key });
        };

        const renderIcon =
          options.tabBarIcon ??
          (() => null);

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel ?? route.name}
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.tabItem}
          >
            {renderIcon({ focused: isFocused, color: isFocused ? colors.accent : colors.tabInactiveIcon, size: 28 })}
          </Pressable>
        );
      })}
    </Animated.View>
  );
}

export default function TabsLayout() {
  const pulseToken = useUIStore((s) => s.bookmarkPulseToken);

  return (
    <Tabs
      tabBar={(props) => <EchoAnimatedTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <GradientTabIcon name="home" focused={focused} color={color} size={28} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color, focused }) => (
            <GradientTabIcon name="search" focused={focused} color={color} size={28} />
          ),
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: 'Wallet',
          tabBarIcon: ({ color, focused }) => (
            <GradientTabIcon name="wallet" focused={focused} color={color} size={28} pulseToken={pulseToken} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <GradientTabIcon name="profile" focused={focused} color={color} size={28} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  barOuter: {
    position: 'absolute',
    left: 16,
    right: 16,
    height: 68,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 10,
    paddingBottom: 8,
    paddingHorizontal: 8,
    borderRadius: 28,
    borderTopWidth: 0,
    borderWidth: 1,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 18,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 0,
  },
});
