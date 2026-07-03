import { View, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../../components/ui';
import { colors, spacing } from '../../theme/tokens';

export default function CreativeOverviewScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Creative Overview</Text>
        <Text style={styles.subtitle}>Your creative dashboard</Text>
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🎨</Text>
          <Text style={styles.emptyTitle}>Coming Soon</Text>
          <Text style={styles.emptyBody}>
            Your creative analytics and content performance will appear here.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: spacing.screenPaddingX, paddingTop: 16, paddingBottom: 12 },
  title: { fontSize: 28, fontWeight: '700', color: colors.textHigh },
  subtitle: { fontSize: 14, color: colors.textMuted, marginTop: 4 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.screenPaddingX, paddingBottom: 40 },
  emptyState: { alignItems: 'center', marginTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '600', color: colors.textHigh, marginBottom: 8 },
  emptyBody: { fontSize: 15, color: colors.textMuted, textAlign: 'center', maxWidth: 280, lineHeight: 22 },
});
