import { View, ScrollView, StyleSheet } from 'react-native';
import { colors } from '../../theme/tokens';
import { Text, Card, Button } from '../../components/ui';

export default function CreativeEarningsScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}><Text variant="display">Earnings</Text></View>
      <Card style={styles.balanceCard}>
        <Text variant="caption" color="textSecondary">Available Balance</Text>
        <Text style={styles.balance}>$890.50</Text>
        <Button title="Withdraw" onPress={() => {}} />
      </Card>
      <ScrollView style={styles.scroll}>
        <Text variant="title" style={styles.sectionTitle}>This Month</Text>
        <Card style={styles.summaryCard}>
          <View style={styles.row}><Text color="textSecondary">Content Plays</Text><Text>$456.00</Text></View>
          <View style={styles.row}><Text color="textSecondary">Event Features</Text><Text>$320.00</Text></View>
          <View style={styles.row}><Text color="textSecondary">Tips</Text><Text>$114.50</Text></View>
          <View style={[styles.row, styles.totalRow]}><Text variant="title">Total</Text><Text variant="title" color="success">$890.50</Text></View>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 16 },
  balanceCard: { marginHorizontal: 20, padding: 24, alignItems: 'center', marginBottom: 24 },
  balance: { fontSize: 40, fontWeight: '700', color: '#22C55E', marginVertical: 16 },
  scroll: { flex: 1, paddingHorizontal: 20 },
  sectionTitle: { marginBottom: 16, color: colors.text },
  summaryCard: { padding: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.divider },
  totalRow: { borderBottomWidth: 0, paddingTop: 16 },
});
