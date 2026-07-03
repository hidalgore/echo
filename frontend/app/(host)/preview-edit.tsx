import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, StatusBar, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, SCREEN_HORIZONTAL_PADDING } from '../../theme/hostTokens';
import { EventPreviewCard } from '../../components/host/EventPreviewCard';
import { QuickEditRow, BottomActionBar } from '../../components/host/QuickEditRow';
import { quickEditFields, mockFlyerDraft } from '../../services/hostMock';
import { useHostStore } from '../../stores/hostStore';
import { useEventStore } from '../../stores/eventStore';
import type { EventDraft } from '../../types/hostEvents';

const REQUIRED_KEYS: (keyof EventDraft)[] = ['title', 'venue', 'date', 'startTime', 'price', 'capacity', 'ageRequirement', 'visibility'];

export default function PreviewEditScreen() {
  const insets = useSafeAreaInsets();
  const { draftId, eventId } = useLocalSearchParams<{ draftId?: string; eventId?: string }>();
  const { activeDraft, setActiveDraft, updateDraftField } = useHostStore();
  const isNew = draftId === 'new';
  const liveEvent = useEventStore((state) => (eventId ? state.getEventById(eventId) : undefined));
  const isPublishedEdit = !!eventId;

  const [draft, setDraft] = useState<EventDraft>(() => {
    if (liveEvent) {
      const start = new Date(liveEvent.start_time);
      const end = new Date(liveEvent.end_time);
      return {
        id: liveEvent.id,
        title: liveEvent.title,
        venue: liveEvent.venue_name,
        date: start.toLocaleDateString('en-US'),
        startTime: start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        endTime: end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        price: liveEvent.ticket_types[0]?.price ?? 0,
        capacity: liveEvent.ticket_types.reduce((sum, ticket) => sum + ticket.available, 0),
        ageRequirement: liveEvent.age_restriction ? `${liveEvent.age_restriction}+` as EventDraft['ageRequirement'] : 'All Ages',
        visibility: 'public',
        category: liveEvent.category as EventDraft['category'],
        description: liveEvent.description,
        flyerImage: liveEvent.image_url,
        eventDetailMediaUri: liveEvent.detail_media_url || liveEvent.image_url,
        eventDetailMediaType: liveEvent.detail_media_type || 'image',
      };
    }
    return activeDraft || (isNew ? { id: 'draft_new', title: '', venue: '', date: '', startTime: '', price: 0, capacity: 0, ageRequirement: 'All Ages', visibility: 'public' } : { ...mockFlyerDraft });
  });

  const editableFields = useMemo(() => {
    if (!isPublishedEdit) return quickEditFields;
    return quickEditFields.filter((field) => field.key !== 'ageRequirement');
  }, [isPublishedEdit]);

  const canPublish = useMemo(() => REQUIRED_KEYS.every(k => {
    const v = draft[k];
    if (typeof v === 'string') return v.trim().length > 0;
    if (typeof v === 'number') return v > 0;
    return !!v;
  }), [draft]);

  const handleChange = (key: string, value: string) => {
    const numKeys = ['price', 'capacity'];
    setDraft(prev => ({ ...prev, [key]: numKeys.includes(key) ? parseFloat(value) || 0 : value }));
  };

  const getVal = (key: keyof EventDraft): string => {
    const v = draft[key];
    if (v == null) return '';
    if (typeof v === 'number') return v > 0 ? String(v) : '';
    return String(v);
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}><Text style={styles.backArrow}>{'\u2190'}</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/(host)/web-handoff')}><Text style={styles.advancedBtn}>Advanced</Text></TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.preview}><EventPreviewCard draft={draft} /></View>
        <View style={styles.editSection}>
          <Text style={styles.editTitle}>Event Details</Text>
          {isPublishedEdit && liveEvent ? (
            <View style={styles.lockedPolicyCard}>
              <Text style={styles.lockedPolicyTitle}>Locked event policies</Text>
              <Text style={styles.lockedPolicyBody}>
                Age: {liveEvent.age_restriction ? `${liveEvent.age_restriction}+` : 'All Ages'}
                {'\n'}Refunds: {liveEvent.allow_refunds ? 'Allowed' : 'Not allowed'}
                {'\n'}Transfers: {liveEvent.allow_transfers ? 'Allowed' : 'Not allowed'}
              </Text>
              <Text style={styles.lockedPolicyNote}>Age requirement, refund policy, and transfer policy were set during creation and cannot be edited for this event.</Text>
            </View>
          ) : null}
          {editableFields.map(f => <QuickEditRow key={f.key} label={f.label} value={getVal(f.key)} type={f.type} required={f.required} options={f.options} placeholder={f.placeholder} onChange={(v) => handleChange(f.key, v)} />)}
        </View>
      </ScrollView>
      <BottomActionBar
        primaryLabel="Publish Event" onPrimary={() => { setActiveDraft(draft); router.push('/(host)/publish'); }} primaryDisabled={!canPublish}
        secondaryLabel="Save Draft" onSecondary={() => { setActiveDraft(draft); useHostStore.getState().saveDraft(); Alert.alert('Draft Saved'); router.navigate('/(host)'); }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SCREEN_HORIZONTAL_PADDING, paddingTop: 12 },
  backBtn: { minWidth: 44, minHeight: 44, justifyContent: 'center' },
  backArrow: { fontSize: 24, color: colors.textSecondary },
  advancedBtn: { fontSize: 13, fontWeight: '600', color: colors.accentBlue },
  scrollContent: { paddingBottom: 24 },
  preview: { paddingHorizontal: SCREEN_HORIZONTAL_PADDING, paddingTop: 12, paddingBottom: 24 },
  editSection: { paddingHorizontal: SCREEN_HORIZONTAL_PADDING },
  editTitle: { fontSize: 17, fontWeight: '600', color: colors.textSecondary, marginBottom: 12 },
  lockedPolicyCard: { marginBottom: 14, padding: 14, borderRadius: 16, backgroundColor: colors.accentAmber + '10', borderWidth: 1, borderColor: colors.accentAmber + '22' },
  lockedPolicyTitle: { fontSize: 14, fontWeight: '800', color: colors.textPrimary, marginBottom: 6 },
  lockedPolicyBody: { fontSize: 13, color: colors.textSecondary, lineHeight: 20, marginBottom: 8 },
  lockedPolicyNote: { fontSize: 12, color: colors.textTertiary, lineHeight: 18 },
});
