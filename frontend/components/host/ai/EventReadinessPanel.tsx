import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, radius } from '../../../theme/hostTokens';
import { Text } from '../../ui';

export type ReadinessStatus = 'Strong' | 'Good' | 'Needs Attention' | 'Incomplete';

type Row = { label: string; status: ReadinessStatus };

type Props = {
  /** Accept either explicit summary/rows OR a fields record (from getReadinessFields) */
  summary?: ReadinessStatus;
  rows?: Row[];
  fields?: Record<string, boolean>;
  onPress?: () => void;
};

/** Derive readable label from field key */
function fieldLabel(key: string): string {
  const labels: Record<string, string> = {
    title: 'Event Title',
    description: 'Description',
    tickets: 'Ticketing',
    image: 'Cover Image',
    payout: 'Payout Setup',
  };
  return labels[key] || key.charAt(0).toUpperCase() + key.slice(1);
}

/** Derive rows + summary from a Record<string, boolean> */
function deriveFromFields(fields: Record<string, boolean>): { summary: ReadinessStatus; rows: Row[] } {
  const entries = Object.entries(fields);
  const rows: Row[] = entries.map(([key, ok]) => ({
    label: fieldLabel(key),
    status: ok ? 'Strong' : 'Incomplete',
  }));

  const doneCount = entries.filter(([, ok]) => ok).length;
  const total = entries.length;
  const ratio = total > 0 ? doneCount / total : 0;

  let summary: ReadinessStatus = 'Incomplete';
  if (ratio === 1) summary = 'Strong';
  else if (ratio >= 0.75) summary = 'Good';
  else if (ratio >= 0.4) summary = 'Needs Attention';

  return { summary, rows };
}

export function EventReadinessPanel({ summary: summaryProp, rows: rowsProp, fields, onPress }: Props) {
  const { summary, rows } = (rowsProp && summaryProp)
    ? { summary: summaryProp, rows: rowsProp }
    : fields
      ? deriveFromFields(fields)
      : { summary: 'Incomplete' as ReadinessStatus, rows: [] };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Event Readiness</Text>
          <Text style={[styles.summary, summaryColor[summary]]}>{summary}</Text>
        </View>
        <TouchableOpacity style={styles.cta} onPress={onPress} activeOpacity={0.85}>
          <Text style={styles.ctaText}>Improve with AI</Text>
        </TouchableOpacity>
      </View>
      {rows.length > 0 && (
        <View style={styles.rows}>
          {rows.map((row) => (
            <View key={row.label} style={styles.row}>
              <Text style={styles.rowLabel}>{row.label}</Text>
              <Text style={[styles.rowStatus, summaryColor[row.status]]}>{row.status}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const summaryColor = StyleSheet.create({
  Strong: { color: colors.accentGreen },
  Good: { color: colors.accentCyan },
  'Needs Attention': { color: colors.accentAmber },
  Incomplete: { color: colors.textSecondary },
});

const styles = StyleSheet.create({
  card: { backgroundColor: 'rgba(24,27,34,0.96)', borderRadius: radius.xl, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', padding: 18, marginTop: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { color: colors.textPrimary, fontSize: 18, fontWeight: '700', marginBottom: 4 },
  summary: { fontSize: 13, fontWeight: '700' },
  cta: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: 'rgba(255,255,255,0.05)' },
  ctaText: { color: colors.textPrimary, fontSize: 13, fontWeight: '700' },
  rows: { gap: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowLabel: { color: colors.textSecondary, fontSize: 14 },
  rowStatus: { fontSize: 14, fontWeight: '700' },
});
