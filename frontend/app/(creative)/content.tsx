import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii } from '../../theme/tokens';
import { Text, Card } from '../../components/ui';

const content = [
  { id: '1', title: 'Sunset Vibes', type: 'Audio', plays: 2340 },
  { id: '2', title: 'Urban Dreams', type: 'Audio', plays: 1890 },
];

export default function CreativeContentScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="display">My Content</Text>
        <TouchableOpacity style={styles.uploadBtn}><Ionicons name="cloud-upload" size={24} color={colors.bg} /></TouchableOpacity>
      </View>
      <ScrollView style={styles.scroll}>
        {content.map((item) => (
          <Card key={item.id} style={styles.contentCard}>
            <View style={styles.icon}><Ionicons name="musical-notes" size={32} color="#22C55E" /></View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text variant="title">{item.title}</Text>
              <Text variant="caption" color="textSecondary">{item.type} • {item.plays} plays</Text>
            </View>
          </Card>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 60, paddingHorizontal: 20, paddingBottom: 16 },
  uploadBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#22C55E', justifyContent: 'center', alignItems: 'center' },
  scroll: { flex: 1, paddingHorizontal: 20 },
  contentCard: { flexDirection: 'row', alignItems: 'center', padding: 16, marginBottom: 12 },
  icon: { width: 56, height: 56, borderRadius: radii.md, backgroundColor: colors.surface2, justifyContent: 'center', alignItems: 'center' },
});
