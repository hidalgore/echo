/**
 * EchodPromptCard
 * ═══════════════
 * Inline ECHO'd Experience prompt shown on past ticket cards.
 * States: not_started, draft, submitted.
 */
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/tokens';
import { Text } from '../ui';
import { useEchodStore } from '../../stores/echodStore';
import type { EchodSubmissionStatus } from '../../types/echod';

type Props = {
  ticketId: string;
  eventId: string;
};

export function EchodPromptCard({ ticketId, eventId }: Props) {
  const status = useEchodStore((s) => s.getStatus)(ticketId);

  const handlePress = () => {
    router.push({ pathname: '/echod', params: { ticketId, eventId } });
  };

  if (status === 'submitted_public' || status === 'submitted_host_only' || status === 'submitted_private') {
    const sublabel = status === 'submitted_public' ? 'Public submission'
      : status === 'submitted_host_only' ? 'Private feedback'
      : 'Private feedback';

    return (
      <View style={styles.submitted}>
        <Ionicons name="checkmark-circle" size={16} color="#10B981" />
        <View style={styles.submittedContent}>
          <Text style={styles.submittedTitle}>Experience shared</Text>
          <Text style={styles.submittedSub}>{sublabel}</Text>
        </View>
      </View>
    );
  }

  const isDraft = status === 'draft';

  return (
    <View style={styles.container}>
      <View style={styles.divider} />
      <View style={styles.row}>
        <View style={styles.iconWrap}>
          <Ionicons name="star-outline" size={16} color="rgba(123,77,255,0.80)" />
        </View>
        <View style={styles.textBlock}>
          <Text style={styles.title}>
            {isDraft ? 'Finish ECHO\'d Experience' : 'ECHO\'d Experience'}
          </Text>
          <Text style={styles.subtitle}>Share feedback from your verified attendance</Text>
        </View>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.shareBtn} onPress={handlePress} activeOpacity={0.85}>
          <Text style={styles.shareBtnText}>{isDraft ? 'Continue' : 'Share'}</Text>
        </TouchableOpacity>
        {!isDraft ? (
          <Text style={styles.laterText}>Maybe later</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingTop: 4 },
  divider: { height: 1, backgroundColor: colors.hairline, marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(123,77,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  textBlock: { flex: 1 },
  title: { fontSize: 14, fontWeight: '700', color: colors.textHigh },
  subtitle: { fontSize: 12, color: colors.textMuted, marginTop: 3, lineHeight: 16 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 12 },
  shareBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  shareBtnText: { fontSize: 13, fontWeight: '700', color: colors.textHigh },
  laterText: { fontSize: 13, color: colors.textMuted },
  submitted: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  submittedContent: { flex: 1 },
  submittedTitle: { fontSize: 13, fontWeight: '600', color: '#10B981' },
  submittedSub: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
});
