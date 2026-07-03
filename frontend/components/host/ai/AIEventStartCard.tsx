import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadows } from '../../../theme/hostTokens';
import { Text } from '../../ui';

type Props = {
  onUpload?: () => void;
  onPaste?: () => void;
  onManual?: () => void;
};

export function AIEventStartCard({ onUpload, onPaste, onManual }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.iconWrap}><Ionicons name="sparkles-outline" size={18} color={colors.accentCyan} /></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Start faster with AI</Text>
          <Text style={styles.body}>Upload a flyer, paste event details, or describe your event to build the first draft automatically.</Text>
        </View>
      </View>
      <View style={styles.actionStack}>
        <ActionButton icon="image-outline" label="Upload Flyer" onPress={onUpload} primary />
        <ActionButton icon="document-text-outline" label="Paste Details" onPress={onPaste} />
        <ActionButton icon="create-outline" label="Start Manually" onPress={onManual} />
      </View>
    </View>
  );
}

function ActionButton({ icon, label, onPress, primary = false }: { icon: any; label: string; onPress?: () => void; primary?: boolean }) {
  return (
    <TouchableOpacity style={[styles.actionButton, primary && styles.actionButtonPrimary]} onPress={onPress} activeOpacity={0.85}>
      <Ionicons name={icon} size={18} color={primary ? colors.bg : colors.textPrimary} />
      <Text style={[styles.actionLabel, primary && styles.actionLabelPrimary]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(24,27,34,0.94)',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 18,
    ...shadows.card,
  },
  headerRow: { flexDirection: 'row', gap: 14, marginBottom: 18 },
  iconWrap: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(32,199,255,0.10)', alignItems: 'center', justifyContent: 'center',
  },
  title: { color: colors.textPrimary, fontSize: 18, fontWeight: '700', marginBottom: 6 },
  body: { color: colors.textTertiary, fontSize: 14, lineHeight: 20 },
  actionStack: { gap: 10 },
  actionButton: {
    minHeight: 48, borderRadius: radius.pill, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.03)',
    flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14,
  },
  actionButtonPrimary: { backgroundColor: colors.textPrimary, borderColor: colors.textPrimary },
  actionLabel: { color: colors.textPrimary, fontSize: 14, fontWeight: '600' },
  actionLabelPrimary: { color: colors.bg },
});
