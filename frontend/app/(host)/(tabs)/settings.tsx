import { View, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme/tokens';
import { Text, Card } from '../../../components/ui';
import { ModeSwitchHeader } from '../../../components/navigation/ModeSwitchHeader';
import { useModeStore } from '../../../stores/modeStore';

export default function HostSettingsScreen() {
  const { setRole } = useModeStore();

  const handleExit = () => {
    Alert.alert('Exit Host Mode', 'Switch back to attendee?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Exit', onPress: () => { setRole('attendee'); router.replace('/(tabs)'); }},
    ]);
  };

  return (
    <View style={styles.container}>
      <ModeSwitchHeader title="Settings" showNotification showBack />
      <ScrollView style={styles.scroll}>
        <Card style={styles.menu}>
          {[
            { icon: 'business-outline', label: 'Organization Profile', href: '/(host)/edit-profile' },
            { icon: 'megaphone-outline', label: 'Social & Promotion', href: '/(host)/social-settings' },
            { icon: 'card-outline', label: 'Payout Settings', href: '/(host)/payout-settings' },
          ].map((item, i) => (
            <TouchableOpacity key={i} style={styles.menuItem} onPress={() => item.href && router.push(item.href as never)}>
              <Ionicons name={item.icon as never} size={22} color={colors.text} />
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
            </TouchableOpacity>
          ))}
        </Card>
        <TouchableOpacity style={styles.exitBtn} onPress={handleExit}>
          <Ionicons name="exit-outline" size={22} color={colors.danger} />
          <Text color="danger" style={{ marginLeft: 8 }}>Exit Host Mode</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1, paddingHorizontal: 20 },
  menu: { overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.divider },
  menuLabel: { flex: 1, marginLeft: 12, color: colors.text, fontSize: 16 },
  exitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, marginTop: 24 },
});
