/**
 * ECHO'd Experience — Welcome (1/5)
 * ══════════════════════════════════
 * Set tone before asking for input. Verified attendees only.
 */
import { View, StyleSheet, Image } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/tokens';
import { Text } from '../../components/ui';
import { useEchodStore } from '../../stores/echodStore';
import { useEventStore } from '../../stores/eventStore';
import { formatDate, formatTime } from '../../utils/format';
import { TouchableOpacity } from 'react-native';

export default function EchodWelcome() {
  const insets = useSafeAreaInsets();
  const { ticketId, eventId } = useLocalSearchParams<{ ticketId: string; eventId: string }>();
  const event = useEventStore((s) => s.getEventById)(eventId);
  const startDraft = useEchodStore((s) => s.startDraft);

  const handleStart = () => {
    startDraft(ticketId, eventId);
    router.push({ pathname: '/echod/rating-tags', params: { ticketId, eventId } });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Close */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={22} color={colors.textMuted} />
        </TouchableOpacity>
        <Text style={styles.headerLabel}>ECHO'd Experience</Text>
        <View style={styles.closeBtnSpacer} />
      </View>

      {/* Progress 1/5 */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: '20%' }]} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.headline}>How was your{'\n'}ECHO'd Experience?</Text>
        <Text style={styles.body}>
          You attended this event through ECHO. Share your experience to help hosts improve and help future guests know what to expect.
        </Text>

        {/* Event reference card */}
        {event ? (
          <View style={styles.eventCard}>
            <View style={styles.eventThumb}>
              {event.image_url ? (
                <Image source={{ uri: event.image_url }} style={styles.eventThumbImage} />
              ) : (
                <Ionicons name="musical-notes" size={24} color={colors.textMuted} />
              )}
            </View>
            <View style={styles.eventInfo}>
              <Text style={styles.eventTitle}>{event.title}</Text>
              <Text style={styles.eventVenue}>{event.venue_name}</Text>
              <Text style={styles.eventDate}>{formatDate(event.start_time)} · {formatTime(event.start_time)}</Text>
            </View>
          </View>
        ) : null}

        <View style={styles.verifiedRow}>
          <Ionicons name="shield-checkmark-outline" size={14} color={colors.textMuted} />
          <Text style={styles.verifiedText}>Verified attendees only</Text>
        </View>
      </View>

      {/* CTAs */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity style={styles.primaryBtn} onPress={handleStart} activeOpacity={0.88}>
          <Text style={styles.primaryBtnText}>Start</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.82}>
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  closeBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.04)' },
  closeBtnSpacer: { width: 40 },
  headerLabel: { fontSize: 13, fontWeight: '600', color: colors.textMuted, letterSpacing: 0.8, textTransform: 'uppercase' },
  progressTrack: { height: 4, backgroundColor: 'rgba(255,255,255,0.08)', marginHorizontal: 20, borderRadius: 2, marginTop: 4 },
  progressFill: { height: 4, backgroundColor: 'rgba(255,255,255,0.45)', borderRadius: 2 },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 48, alignItems: 'center' },
  headline: { fontSize: 34, fontWeight: '700', color: colors.textHigh, textAlign: 'center', lineHeight: 42 },
  body: { fontSize: 16, color: colors.textMuted, textAlign: 'center', lineHeight: 24, marginTop: 20, maxWidth: 340 },
  eventCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: colors.hairline, borderRadius: 20, padding: 16, marginTop: 36, width: '100%' },
  eventThumb: { width: 64, height: 64, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  eventThumbImage: { width: 64, height: 64, borderRadius: 14 },
  eventInfo: { flex: 1, marginLeft: 14 },
  eventTitle: { fontSize: 18, fontWeight: '700', color: colors.textHigh },
  eventVenue: { fontSize: 14, color: 'rgba(255,255,255,0.62)', marginTop: 4 },
  eventDate: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
  verifiedRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 20 },
  verifiedText: { fontSize: 13, color: colors.textMuted },
  footer: { paddingHorizontal: 24, gap: 14, alignItems: 'center' },
  primaryBtn: { width: '100%', height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.10)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  primaryBtnText: { fontSize: 17, fontWeight: '700', color: colors.textHigh },
  skipText: { fontSize: 15, color: colors.textMuted },
});
