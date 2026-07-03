import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Alert } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, radius, SCREEN_HORIZONTAL_PADDING } from '../../theme/hostTokens';
import { PrimaryButton } from '../../components/host/PrimaryButton';
import { SecondaryButton } from '../../components/host/SecondaryButton';
import { useHostStore } from '../../stores/hostStore';
import { mockFlyerDraft } from '../../services/hostMock';
import { EVENT_DETAIL_VIDEO_MAX_SECONDS, isEventDetailVideoDurationAllowed } from '../../constants/eventMedia';

export default function PublishScreen() {
  const insets = useSafeAreaInsets();
  const { activeDraft, publishDraft } = useHostStore();
  const draft = activeDraft || mockFlyerDraft;

  const publishConfirmed = () => { const event = publishDraft(); if (event) router.replace({ pathname: '/(host)/success', params: { eventId: event.id } }); else router.replace('/(host)/success'); };
  const handlePublish = () => {
    if (draft.eventDetailMediaType === 'video' && !isEventDetailVideoDurationAllowed(draft.eventDetailMediaDurationSeconds)) {
      Alert.alert('Event Details video too long', `Event Details video is locked to ${EVENT_DETAIL_VIDEO_MAX_SECONDS} seconds max. Choose a shorter video before publishing.`);
      return;
    }
    Alert.alert(
      'Publish and lock policies?',
      `Before this event is posted, confirm these locked settings:

Age: ${draft.ageRequirement}
Refunds: Not allowed unless configured in the full Create Event flow
Transfers: Not allowed unless configured in the full Create Event flow
Media: Home uses still flyer; Event Details video is locked to ${EVENT_DETAIL_VIDEO_MAX_SECONDS} seconds max

After the event is published, age restriction, refund policy, and ticket transfer policy cannot be edited for this event.`,
      [
        { text: 'Review Again', style: 'cancel' },
        { text: 'Publish & Lock', onPress: publishConfirmed },
      ],
    );
  };
  const visLabel = draft.visibility === 'public' ? 'Public' : draft.visibility === 'private' ? 'Private' : 'Invite Only';

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}><Text style={styles.backArrow}>{'\u2190'}</Text></TouchableOpacity>
      <View style={styles.content}>
        <Text style={styles.title}>Ready to Publish?</Text>
        <View style={styles.card}>
          <Text style={styles.eventTitle}>{draft.title}</Text>
          <Text style={styles.meta}>{draft.venue}</Text>
          <Text style={styles.meta}>{draft.date} {'\u00B7'} {draft.startTime}</Text>
          <View style={styles.divider} />
          {[['Price', `$${draft.price}`], ['Capacity', `${draft.capacity}`], ['Age', draft.ageRequirement], ['Visibility', visLabel], ['Event Details media', draft.eventDetailMediaType === 'video' ? `Video (${EVENT_DETAIL_VIDEO_MAX_SECONDS}s max)` : 'Photo']].map(([label, value]) => (
            <View key={label} style={styles.row}><Text style={styles.rowLabel}>{label}</Text><Text style={styles.rowValue}>{value}</Text></View>
          ))}
        </View>
        <View style={styles.lockNotice}>
          <Text style={{ fontSize: 16, marginRight: 8 }}>{'\u{1F512}'}</Text>
          <Text style={styles.lockText}>Some settings lock after publish. Age restriction, refund policy, and transfer rules cannot be changed once live.</Text>
        </View>
        <View style={{ flex: 1 }} />
        <PrimaryButton label="Publish & Lock Event" onPress={handlePublish} />
        <SecondaryButton label="Back to Edit" onPress={() => router.back()} variant="ghost" style={{ marginTop: 12, marginBottom: 32 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  backBtn: { paddingHorizontal: SCREEN_HORIZONTAL_PADDING, paddingTop: 12, minWidth: 44, minHeight: 44, justifyContent: 'center' },
  backArrow: { fontSize: 24, color: colors.textSecondary },
  content: { flex: 1, paddingHorizontal: SCREEN_HORIZONTAL_PADDING, paddingTop: 24 },
  title: { ...typography.displayLg, color: colors.textPrimary, marginBottom: 24, textAlign: 'center' },
  card: { backgroundColor: colors.surface, borderRadius: radius.base, padding: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 20 },
  eventTitle: { ...typography.displayMd, color: colors.textPrimary, marginBottom: 4 },
  meta: { fontSize: 13, color: colors.textTertiary, marginBottom: 2 },
  divider: { height: 1, backgroundColor: colors.borderSubtle, marginVertical: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  rowLabel: { fontSize: 13, color: colors.textTertiary },
  rowValue: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  lockNotice: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: colors.accentAmber + '10', borderRadius: 12, borderWidth: 1, borderColor: colors.accentAmber + '20', padding: 12, marginBottom: 24 },
  lockText: { fontSize: 13, color: colors.textSecondary, flex: 1, lineHeight: 20 },
});
