import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ModeSwitchHeader } from '../../components/navigation/ModeSwitchHeader';
import { IntelligentNotificationCenter } from '../../components/notifications';
import { colors } from '../../theme/tokens';

export default function HostNotificationsScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}> 
      <ModeSwitchHeader title="Host Notifications" topInset={0} showNotification showBack />
      <IntelligentNotificationCenter hostMode />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
});
