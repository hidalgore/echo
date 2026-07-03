/**
 * ECHO'd Experience — Success (5/5)
 * ═════════════════════════════════
 * Confirmation with warm close. Done / View event / Follow host.
 */
import { View, StyleSheet, Image } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/tokens';
import { Text } from '../../components/ui';
import { useEchodStore } from '../../stores/echodStore';
import { useEventStore } from '../../stores/eventStore';
import { formatDate } from '../../utils/format';
import { TouchableOpacity } from 'react-native';

export default function EchodSuccess() {
  const insets = useSafeAreaInsets();
  const { ticketId, eventId } = useLocalSearchParams<{ ticketId: string; eventId: string }>();
  const event = useEventStore((s) => s.getEventById)(eventId);
  const submission = useEchodStore((s) => s.getSubmission)(ticketId);

  const hasPhotos = (submission?.photos.length ?? 0) > 0;

  const handleDone = () => {
    // Navigate back to wallet root
    router.dismissAll();
    router.replace('/(tabs)/wallet');
  };

  const handleViewEvent = () => {
    router.dismissAll();
    router.push(`/event/${eventId}`);
  };

  const handleFollowHost = () => {
    // Would trigger host follow — for now just go to wallet
    handleDone();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerLabel}>ECHO'd Experience</Text>
      </View>

      {/* Progress 5/5 — full */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: '100%' }]} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Checkmark */}
        <LinearGradient
          colors={['#20C7FF', '#7B4DFF', '#E63DAD']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.checkRing}
        >
          <View style={styles.checkInner}>
            <Ionicons name="checkmark" size={40} color={colors.textHigh} />
          </View>
        </LinearGradient>

        <Text style={styles.headline}>Your ECHO'd Experience{'\n'}was shared</Text>
        <Text style={styles.body}>Thanks for sharing feedback from your verified attendance.</Text>

        {/* Status line */}
        <View style={styles.statusPill}>
          <Ionicons name="checkmark-circle-outline" size={14} color={colors.textMuted} />
          <Text style={styles.statusText}>
            Submission received{hasPhotos ? ' · Photos pending review' : ''}
          </Text>
        </View>

        {/* Event reference */}
        {event ? (
          <View style={styles.eventCard}>
            <View style={styles.eventThumb}>
              {event.image_url ? (
                <Image source={{ uri: event.image_url }} style={styles.eventThumbImage} />
              ) : (
                <Ionicons name="musical-notes" size={20} color={colors.textMuted} />
              )}
            </View>
            <View style={styles.eventInfo}>
              <Text style={styles.eventTitle}>{event.title}</Text>
              <Text style={styles.eventMeta}>{event.venue_name} · {formatDate(event.start_time)}</Text>
            </View>
          </View>
        ) : null}
      </View>

      {/* CTAs */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity style={styles.primaryBtn} onPress={handleDone} activeOpacity={0.88}>
          <Text style={styles.primaryBtnText}>Done</Text>
        </TouchableOpacity>

        <View style={styles.secondaryRow}>
          <TouchableOpacity style={styles.secondaryBtn} onPress={handleViewEvent} activeOpacity={0.82}>
            <Text style={styles.secondaryBtnText}>View event</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={handleFollowHost} activeOpacity={0.82}>
            <Text style={styles.secondaryBtnText}>Follow host</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { alignItems: 'center', paddingVertical: 14 },
  headerLabel: { fontSize: 13, fontWeight: '600', color: colors.textMuted, letterSpacing: 0.8, textTransform: 'uppercase' },
  progressTrack: { height: 4, backgroundColor: 'rgba(255,255,255,0.08)', marginHorizontal: 20, borderRadius: 2, marginTop: 4 },
  progressFill: { height: 4, backgroundColor: 'rgba(255,255,255,0.45)', borderRadius: 2 },
  content: { flex: 1, alignItems: 'center', paddingHorizontal: 24, paddingTop: 56 },
  checkRing: { width: 96, height: 96, borderRadius: 48, padding: 3, marginBottom: 36 },
  checkInner: { flex: 1, borderRadius: 45, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  headline: { fontSize: 30, fontWeight: '700', color: colors.textHigh, textAlign: 'center', lineHeight: 38 },
  body: { fontSize: 16, color: 'rgba(255,255,255,0.55)', textAlign: 'center', marginTop: 16, lineHeight: 24, maxWidth: 300 },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginTop: 28,
  },
  statusText: { fontSize: 13, color: colors.textMuted },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: 20,
    padding: 14,
    marginTop: 28,
    width: '100%',
  },
  eventThumb: { width: 52, height: 52, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  eventThumbImage: { width: 52, height: 52, borderRadius: 12 },
  eventInfo: { flex: 1, marginLeft: 14 },
  eventTitle: { fontSize: 16, fontWeight: '700', color: colors.textHigh },
  eventMeta: { fontSize: 13, color: 'rgba(255,255,255,0.55)', marginTop: 4 },
  footer: { paddingHorizontal: 24, gap: 14, alignItems: 'center' },
  primaryBtn: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: { fontSize: 17, fontWeight: '700', color: colors.textHigh },
  secondaryRow: { flexDirection: 'row', gap: 12, width: '100%' },
  secondaryBtn: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: { fontSize: 14, fontWeight: '600', color: colors.textMuted },
});
