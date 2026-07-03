import { View, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii } from '../../theme/tokens';
import { Text, Card } from '../../components/ui';
import { useModeStore } from '../../stores/modeStore';

export default function CreativeProfileScreen() {
  const { setRole } = useModeStore();

  const handleExit = () => {
    Alert.alert('Exit Creative Mode', 'Switch back to attendee?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Exit', onPress: () => { setRole('attendee'); router.replace('/(tabs)'); }},
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}><Text variant="display">Profile</Text></View>
      <ScrollView style={styles.scroll}>
        <Card style={styles.profileCard}>
          <View style={styles.avatar}><Ionicons name="person" size={40} color="#22C55E" /></View>
          <Text variant="title">Creative Artist</Text>
          <Text variant="bodySmall" color="textSecondary">Audio • Visual</Text>
          <View style={styles.statsRow}>
            <View style={styles.stat}><Text variant="title">12.4K</Text><Text variant="caption" color="textSecondary">Plays</Text></View>
            <View style={styles.stat}><Text variant="title">8</Text><Text variant="caption" color="textSecondary">Events</Text></View>
            <View style={styles.stat}><Text variant="title">4.9</Text><Text variant="caption" color="textSecondary">Rating</Text></View>
          </View>
        </Card>
        <TouchableOpacity style={styles.exitBtn} onPress={handleExit}>
          <Ionicons name="exit-outline" size={22} color={colors.danger} />
          <Text color="danger" style={{ marginLeft: 8 }}>Exit Creative Mode</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 16 },
  scroll: { flex: 1, paddingHorizontal: 20 },
  profileCard: { padding: 24, alignItems: 'center' },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.surface2, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  statsRow: { flexDirection: 'row', marginTop: 24, width: '100%' },
  stat: { flex: 1, alignItems: 'center' },
  exitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, marginTop: 24 },
});
