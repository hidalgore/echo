/**
 * Create Event — 4-Step Flow
 * ══════════════════════════
 * Basics → Ticketing → Details → Review
 * Real inputs. AI wired. Autosave on every field.
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Switch, Image, Alert, Platform, Modal, FlatList,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, shadows } from '../../theme/hostTokens';
import { Text } from '../../components/ui';
import { EventHeroMedia } from '../../components/event';
import {
  useEventDraftStore,
  STEP_ORDER, CATEGORY_OPTIONS, MAX_CATEGORIES,
  type CreateEventStep, type EventCategory, type AgeRestriction, type TicketingModel, type EventDraftForm,
} from '../../stores/eventDraftStore';
import { useModeStore } from '../../stores/modeStore';
import { useHostProfileStore } from '../../stores/hostProfileStore';
import { useAuthStore } from '../../stores/authStore';
import { useEventStore } from '../../stores/eventStore';
import { useLocationStore } from '../../stores/locationStore';
import { useHostAIStore } from '../../stores/hostAIStore';
import { AIEventStartCard } from '../../components/host/ai/AIEventStartCard';
import { AITitleSuggestions, AIDescriptionSuggestions } from '../../components/host/ai/AISuggestions';
import { AIPricingGuidanceCard } from '../../components/host/ai/AIPricingGuidanceCard';
import { EventReadinessPanel } from '../../components/host/ai/EventReadinessPanel';
import { PromotionReadyCard } from '../../components/host/ai/PromotionReadyCard';
import { AIClarityGuardrail } from '../../components/host/ai/CreateEventAI';
import { SchedulingIntelligencePanel } from '../../components/host/scheduling';
import { computeSchedulingIntelligence } from '../../utils/schedulingIntelligence';
import type { SchedulingIntelligenceResult } from '../../types/dashboard';
import type { NonprofitDonationCampaign } from '../../types/nonprofitDonation';
import { searchVenueSuggestions, type VenueSuggestion } from '../../services/venues';
import {
  EVENT_DETAIL_VIDEO_MAX_LABEL,
  formatEventDetailVideoDuration as getEventDetailVideoDurationLabel,
  isEventDetailVideoDurationAllowed,
  normalizeEventDetailVideoDurationSeconds,
} from '../../constants/eventMedia';

const buildPublishedDonationCampaign = (draft: EventDraftForm, nonprofitName: string): NonprofitDonationCampaign | null => {
  if (!draft.donationCampaign.enabled) return null;
  return {
    id: `camp_${Date.now()}`,
    nonprofitName,
    causeTitle: draft.donationCampaign.causeTitle.trim(),
    causeDescription: draft.donationCampaign.causeDescription.trim(),
    goalAmount: draft.donationCampaign.goalAmount,
    raisedAmount: 0,
    donorCount: 0,
    suggestedAmounts: draft.donationCampaign.suggestedAmounts,
    impactLabels: draft.donationCampaign.impactLabels,
    publicPageEnabled: draft.donationCampaign.publicPageEnabled,
    allowPublicNameOptIn: false,
    closesAtEventCloseout: true,
    status: 'active',
  };
};


const STEP_LABELS: Record<CreateEventStep, string> = {
  basics: 'Basics',
  ticketing: 'Ticketing',
  details: 'Details',
  review: 'Review',
};

export default function CreateEventScreen() {
  const insets = useSafeAreaInsets();
  const store = useEventDraftStore();
  const { draft, step, isDirty } = store;
  const [showAIStart, setShowAIStart] = useState(!isDirty);

  const progress = store.getProgress();

  const handleNext = () => {
    if (!store.canAdvance()) return;
    store.nextStep();
  };

  const handleBack = () => {
    if (store.getStepIndex() === 0) {
      if (isDirty) {
        Alert.alert('Save draft?', 'Your progress will be saved.', [
          { text: 'Discard', style: 'destructive', onPress: () => { store.resetDraft(); router.back(); } },
          { text: 'Save & Exit', onPress: () => router.back() },
        ]);
      } else {
        router.back();
      }
      return;
    }
    store.prevStep();
  };

  const publishEvent = () => {
    const { capabilities } = useModeStore.getState();
    const { payout, profile } = useHostProfileStore.getState();
    const { user } = useAuthStore.getState();
    const isPaid = draft.ticketingModel === 'paid';
    const isVerifiedNonprofit = profile.hostType === 'nonprofit' && profile.hostAccessStatus === 'active';

    if (isPaid && !capabilities.canPublishPaidEvents) {
      if (payout.payoutStatus !== 'connected') {
        router.push('/(host)/payout-required');
        return;
      }
      Alert.alert('Publishing restricted', 'Your HOST account cannot publish paid events at this time.');
      return;
    }
    if (!isPaid && !capabilities.canPublishFreeEvents) {
      Alert.alert('Publishing restricted', 'Your HOST account cannot publish events at this time.');
      return;
    }

    if (draft.donationCampaign.enabled && !isVerifiedNonprofit) {
      Alert.alert('Nonprofit verification required', 'Donation campaigns are available only to verified nonprofit hosts. Turn donations off or complete nonprofit host verification.');
      return;
    }

    const hostName = profile.displayName?.trim() || user?.name?.trim() || 'ECHO Host';
    const cityDisplay = draft.city?.trim() || 'Seattle, WA';
    const publishedEvent = useEventStore.getState().publishHostedEvent({
      title: draft.title.trim(),
      description: draft.description.trim() || 'Newly published on ECHO. Tap through for tickets, details, and trusted entry.',
      venueName: draft.venue.trim(),
      venueAddress: `${draft.venue.trim()}, ${cityDisplay}`,
      cityDisplay,
      date: draft.date,
      startTime: draft.startTime,
      endTime: draft.endTime,
      category: draft.categories[0] || 'Other',
      imageUrl: draft.coverImageUri || undefined,
      detailMediaUrl: draft.eventDetailMediaUri || draft.coverImageUri || undefined,
      detailMediaType: draft.eventDetailMediaType || 'image',
      detailMediaPosterUrl: draft.coverImageUri || undefined,
      detailMediaDurationSeconds: draft.eventDetailMediaType === 'video' ? draft.eventDetailMediaDurationSeconds : null,
      ageRestriction: draft.ageRestriction === 'all_ages' ? null : parseInt(draft.ageRestriction, 10),
      allowRefunds: draft.allowRefunds,
      allowTransfers: draft.allowTransfers,
      ticketTypes: draft.tickets.map((ticket) => ({
        name: ticket.name.trim() || 'General Admission',
        price: draft.ticketingModel === 'free' ? 0 : ticket.price,
        available: ticket.quantity,
      })),
      hostName,
      hostVerified: true,
      donationCampaign: buildPublishedDonationCampaign(draft, hostName),
    });

    store.resetDraft();
    router.replace({ pathname: '/(host)/success', params: { eventId: publishedEvent.id } });
  };

  const handlePublish = () => {
    if (draft.eventDetailMediaType === 'video' && !isEventDetailVideoDurationAllowed(draft.eventDetailMediaDurationSeconds)) {
      Alert.alert(
        'Event Details video too long',
        `ECHO Event Details videos are locked to ${EVENT_DETAIL_VIDEO_MAX_LABEL} max. Your selected video is ${getEventDetailVideoDurationLabel(draft.eventDetailMediaDurationSeconds)}. Choose a shorter video before publishing.`
      );
      return;
    }
    if (!store.isPublishReady()) return;

    const ageLabel = draft.ageRestriction === 'all_ages' ? 'All Ages' : draft.ageRestriction;
    Alert.alert(
      'Create event and lock policies?',
      `Before this event is posted, confirm these locked settings:

Age: ${ageLabel}
Refunds: ${draft.allowRefunds ? 'Allowed' : 'Not allowed'}
Transfers: ${draft.allowTransfers ? 'Allowed' : 'Not allowed'}
Donations: ${draft.donationCampaign.enabled ? 'Enabled until event closeout' : 'Off'}
Event Details video length: ${EVENT_DETAIL_VIDEO_MAX_LABEL} max

After the event is created, age restriction, refund policy, and ticket transfer policy cannot be edited for this event.`,
      [
        { text: 'Review Again', style: 'cancel' },
        { text: 'Create & Lock Event', style: 'default', onPress: publishEvent },
      ],
    );
  };

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={handleBack} style={s.backBtn} activeOpacity={0.85}>
          <Ionicons name={store.getStepIndex() === 0 ? 'close' : 'chevron-back'} size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.headerTitle}>Create Event</Text>
          <Text style={s.headerStep}>{STEP_LABELS[step]}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Progress */}
      <View style={s.progressRow}>
        {STEP_ORDER.map((st, i) => (
          <View key={st} style={[s.progressSeg, i <= store.getStepIndex() && s.progressSegActive]} />
        ))}
      </View>

      {/* Step content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[s.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* AI Start Card — only on basics step when form is empty */}
        {step === 'basics' && showAIStart && !isDirty && (
          <View style={s.aiCardWrap}>
            <AIEventStartCard
              onUpload={() => { setShowAIStart(false); router.push('/(host)/flyer-upload'); }}
              onPaste={() => { setShowAIStart(false); router.push('/(host)/flyer-processing'); }}
              onManual={() => setShowAIStart(false)}
            />
          </View>
        )}

        {step === 'basics' && <BasicsStep />}
        {step === 'ticketing' && <TicketingStep />}
        {step === 'details' && <DetailsStep />}
        {step === 'review' && <ReviewStep onPublish={handlePublish} />}
      </ScrollView>

      {/* Footer CTA */}
      {step !== 'review' && (
        <View style={[s.footer, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity
            style={[s.primaryBtn, !store.canAdvance() && s.primaryBtnDisabled]}
            onPress={handleNext}
            activeOpacity={0.88}
            disabled={!store.canAdvance()}
          >
            <Text style={[s.primaryBtnText, !store.canAdvance() && { opacity: 0.4 }]}>Continue</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// STEP 1: BASICS
// ═══════════════════════════════════════════════════════════════════════════

// ── Date helpers (US standard: MM/DD/YYYY) ──────────────────────────────
function toUSDate(iso: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  if (!y || !m || !d) return iso;
  return `${m}/${d}/${y}`;
}
function toISO(us: string): string {
  if (!us) return '';
  const [m, d, y] = us.split('/');
  if (!y || !m || !d) return us;
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

// ── Mini Calendar Component ─────────────────────────────────────────────
function MiniCalendar({ selected, onSelect, onClose }: {
  selected: string; // YYYY-MM-DD
  onSelect: (iso: string) => void;
  onClose: () => void;
}) {
  const today = new Date();
  const [viewMonth, setViewMonth] = useState(
    selected ? new Date(selected + 'T00:00:00') : today
  );

  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const monthLabel = viewMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const todayISO = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const prevMonth = () => setViewMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setViewMonth(new Date(year, month + 1, 1));

  return (
    <View style={calStyles.wrap}>
      {/* Month nav */}
      <View style={calStyles.navRow}>
        <TouchableOpacity onPress={prevMonth} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={calStyles.monthLabel}>{monthLabel}</Text>
        <TouchableOpacity onPress={nextMonth} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-forward" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Weekday headers */}
      <View style={calStyles.weekRow}>
        {WEEKDAYS.map((wd) => (
          <Text key={wd} style={calStyles.weekDay}>{wd}</Text>
        ))}
      </View>

      {/* Day grid */}
      <View style={calStyles.dayGrid}>
        {cells.map((day, i) => {
          if (day === null) return <View key={`e${i}`} style={calStyles.dayCell} />;

          const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const isSelected = iso === selected;
          const isToday = iso === todayISO;
          const isPast = iso < todayISO;

          return (
            <TouchableOpacity
              key={iso}
              style={[
                calStyles.dayCell,
                isSelected && calStyles.dayCellSelected,
                isToday && !isSelected && calStyles.dayCellToday,
              ]}
              onPress={() => { if (!isPast) { onSelect(iso); onClose(); } }}
              activeOpacity={isPast ? 1 : 0.7}
              disabled={isPast}
            >
              <Text style={[
                calStyles.dayText,
                isSelected && calStyles.dayTextSelected,
                isPast && calStyles.dayTextPast,
                isToday && !isSelected && calStyles.dayTextToday,
              ]}>{day}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const calStyles = StyleSheet.create({
  wrap: { backgroundColor: 'rgba(24,27,34,0.98)', borderRadius: radius.xl, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  navRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  monthLabel: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  weekRow: { flexDirection: 'row', marginBottom: 8 },
  weekDay: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '600', color: colors.textTertiary },
  dayGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  dayCellSelected: { backgroundColor: colors.accentCyan, borderRadius: 999 },
  dayCellToday: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.20)', borderRadius: 999 },
  dayText: { fontSize: 14, color: colors.textPrimary, fontWeight: '500' },
  dayTextSelected: { color: colors.bg, fontWeight: '700' },
  dayTextPast: { color: 'rgba(255,255,255,0.18)' },
  dayTextToday: { color: colors.accentCyan, fontWeight: '700' },
});

function DatePickerField({
  label,
  value,
  onSelect,
  required,
  minimumDate,
}: {
  label: string;
  value: string;
  onSelect: (date: string) => void;
  required?: boolean;
  minimumDate?: string;
}) {
  const [showCalendar, setShowCalendar] = useState(false);
  const minDate = minimumDate || '';

  const handleSelect = (date: string) => {
    if (minDate && date < minDate) return;
    onSelect(date);
    setShowCalendar(false);
  };

  return (
    <View>
      <Label text={label} required={required} />
      <TouchableOpacity
        style={[s.input, { justifyContent: 'center', flexDirection: 'row', alignItems: 'center' }]}
        onPress={() => setShowCalendar((prev) => !prev)}
        activeOpacity={0.82}
      >
        <Text style={{ flex: 1, fontSize: 16, color: value ? colors.textPrimary : colors.textTertiary }}>
          {value ? toUSDate(value) : 'MM/DD/YYYY'}
        </Text>
        <Ionicons name="calendar-outline" size={18} color={colors.textTertiary} />
      </TouchableOpacity>

      {showCalendar ? (
        <View style={{ marginTop: 10 }}>
          <MiniCalendar
            selected={value}
            onSelect={handleSelect}
            onClose={() => setShowCalendar(false)}
          />
        </View>
      ) : null}
    </View>
  );
}

// ── Time Grid Component (Option C) ──────────────────────────────────────

const PM_TIMES = [
  '5:00 PM', '5:30 PM', '6:00 PM', '6:30 PM',
  '7:00 PM', '7:30 PM', '8:00 PM', '8:30 PM',
  '9:00 PM', '9:30 PM', '10:00 PM', '10:30 PM',
  '11:00 PM', '11:30 PM',
];

const AM_TIMES = [
  '6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM',
  '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM',
  '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM',
  '4:00 PM', '4:30 PM',
];

function TimeGridPicker({ value, onSelect, label }: {
  value: string;
  onSelect: (time: string) => void;
  label: string;
}) {
  const [showGrid, setShowGrid] = useState(false);
  const [showAM, setShowAM] = useState(false);
  const [customMode, setCustomMode] = useState(false);
  const [customHour, setCustomHour] = useState('');
  const [customMin, setCustomMin] = useState('00');
  const [customPeriod, setCustomPeriod] = useState<'AM' | 'PM'>('PM');

  const times = showAM ? AM_TIMES : PM_TIMES;
  const periodLabel = showAM ? 'Showing AM times' : 'Showing PM times';

  const handleCustomConfirm = () => {
    const h = parseInt(customHour, 10);
    if (isNaN(h) || h < 1 || h > 12) return;
    const formatted = `${h}:${customMin} ${customPeriod}`;
    onSelect(formatted);
    setCustomMode(false);
    setShowGrid(false);
  };

  return (
    <View>
      <Label text={label} required={label === 'Start time'} />
      <TouchableOpacity
        style={[s.input, { justifyContent: 'center' }]}
        onPress={() => setShowGrid(!showGrid)}
        activeOpacity={0.82}
      >
        <Text style={{ fontSize: 16, color: value ? colors.textPrimary : colors.textTertiary }}>
          {value || (label === 'Start time' ? '7:00 PM' : '11:00 PM')}
        </Text>
      </TouchableOpacity>

      {showGrid && (
        <View style={tgStyles.container}>
          {/* AM/PM toggle */}
          <View style={tgStyles.toggleRow}>
            <TouchableOpacity
              style={[tgStyles.toggleBtn, !showAM && tgStyles.toggleBtnActive]}
              onPress={() => { setShowAM(false); setCustomMode(false); }}
              activeOpacity={0.82}
            >
              <Text style={[tgStyles.toggleText, !showAM && tgStyles.toggleTextActive]}>PM</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[tgStyles.toggleBtn, showAM && tgStyles.toggleBtnActive]}
              onPress={() => { setShowAM(true); setCustomMode(false); }}
              activeOpacity={0.82}
            >
              <Text style={[tgStyles.toggleText, showAM && tgStyles.toggleTextActive]}>AM</Text>
            </TouchableOpacity>
          </View>

          <Text style={tgStyles.periodHint}>{periodLabel}</Text>

          {!customMode ? (
            <>
              {/* Time grid */}
              <View style={tgStyles.grid}>
                {times.map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[tgStyles.cell, value === t && tgStyles.cellActive]}
                    onPress={() => { onSelect(t); setShowGrid(false); }}
                    activeOpacity={0.82}
                  >
                    <Text style={[tgStyles.cellText, value === t && tgStyles.cellTextActive]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Custom option */}
              <TouchableOpacity
                style={tgStyles.customBtn}
                onPress={() => setCustomMode(true)}
                activeOpacity={0.82}
              >
                <Ionicons name="time-outline" size={16} color={colors.accentCyan} />
                <Text style={tgStyles.customBtnText}>Custom time</Text>
              </TouchableOpacity>
            </>
          ) : (
            /* Custom time entry */
            <View style={tgStyles.customWrap}>
              <View style={tgStyles.customRow}>
                <TextInput
                  style={tgStyles.customInput}
                  value={customHour}
                  onChangeText={(v) => setCustomHour(v.replace(/[^0-9]/g, '').slice(0, 2))}
                  placeholder="H"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="number-pad"
                  maxLength={2}
                />
                <Text style={tgStyles.customColon}>:</Text>
                <TextInput
                  style={tgStyles.customInput}
                  value={customMin}
                  onChangeText={(v) => setCustomMin(v.replace(/[^0-9]/g, '').slice(0, 2))}
                  placeholder="MM"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="number-pad"
                  maxLength={2}
                />
                {/* AM/PM segment */}
                <View style={tgStyles.periodSeg}>
                  <TouchableOpacity
                    style={[tgStyles.periodBtn, customPeriod === 'AM' && tgStyles.periodBtnActive]}
                    onPress={() => setCustomPeriod('AM')}
                  >
                    <Text style={[tgStyles.periodBtnText, customPeriod === 'AM' && tgStyles.periodBtnTextActive]}>AM</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[tgStyles.periodBtn, customPeriod === 'PM' && tgStyles.periodBtnActive]}
                    onPress={() => setCustomPeriod('PM')}
                  >
                    <Text style={[tgStyles.periodBtnText, customPeriod === 'PM' && tgStyles.periodBtnTextActive]}>PM</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={tgStyles.customActions}>
                <TouchableOpacity onPress={() => setCustomMode(false)}>
                  <Text style={tgStyles.customCancel}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={tgStyles.customConfirm} onPress={handleCustomConfirm} activeOpacity={0.88}>
                  <Text style={tgStyles.customConfirmText}>Set Time</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const tgStyles = StyleSheet.create({
  container: { marginTop: 10, backgroundColor: 'rgba(24,27,34,0.98)', borderRadius: radius.xl, padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  toggleRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  toggleBtn: { flex: 1, height: 36, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  toggleBtnActive: { backgroundColor: colors.accentCyan, borderColor: colors.accentCyan },
  toggleText: { fontSize: 14, fontWeight: '700', color: colors.textTertiary },
  toggleTextActive: { color: colors.bg },
  periodHint: { fontSize: 11, color: colors.textTertiary, textAlign: 'center', marginBottom: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cell: { width: '23%', paddingVertical: 10, borderRadius: radius.lg, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  cellActive: { backgroundColor: 'rgba(32,199,255,0.12)', borderColor: 'rgba(32,199,255,0.35)' },
  cellText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  cellTextActive: { color: colors.accentCyan },
  customBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12, paddingVertical: 10 },
  customBtnText: { fontSize: 13, fontWeight: '600', color: colors.accentCyan },
  customWrap: { gap: 14, paddingTop: 4 },
  customRow: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center' },
  customInput: { width: 52, height: 48, borderRadius: radius.lg, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', color: colors.textPrimary, fontSize: 20, fontWeight: '700', textAlign: 'center' },
  customColon: { fontSize: 24, fontWeight: '700', color: colors.textPrimary },
  periodSeg: { flexDirection: 'row', marginLeft: 8, borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)' },
  periodBtn: { paddingHorizontal: 14, paddingVertical: 12, backgroundColor: 'rgba(255,255,255,0.04)' },
  periodBtnActive: { backgroundColor: colors.accentCyan },
  periodBtnText: { fontSize: 14, fontWeight: '700', color: colors.textTertiary },
  periodBtnTextActive: { color: colors.bg },
  customActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  customCancel: { fontSize: 14, color: colors.textTertiary, paddingVertical: 8 },
  customConfirm: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: radius.pill, backgroundColor: colors.accentCyan },
  customConfirmText: { fontSize: 14, fontWeight: '700', color: colors.bg },
});


function VenuePicker({
  value,
  cityValue,
  onChangeText,
  onSelectSuggestion,
}: {
  value: string;
  cityValue: string;
  onChangeText: (value: string) => void;
  onSelectSuggestion: (venue: VenueSuggestion) => void;
}) {
  const { location } = useLocationStore();
  const [focused, setFocused] = useState(false);
  const suggestions = useMemo(
    () => searchVenueSuggestions(value, cityValue || location?.display),
    [value, cityValue, location?.display]
  );

  const shouldShow = focused && suggestions.length > 0;

  return (
    <View>
      <Label text="Venue" required />
      <TextInput
        style={s.input}
        value={value}
        onChangeText={onChangeText}
        placeholder="Start typing a venue name"
        placeholderTextColor={colors.textTertiary}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 120)}
        autoCapitalize="words"
      />
      {shouldShow ? (
        <View style={s.venueSuggestWrap}>
          {suggestions.map((venue) => (
            <TouchableOpacity
              key={venue.id}
              style={s.venueSuggestRow}
              activeOpacity={0.85}
              onPress={() => {
                onSelectSuggestion(venue);
                setFocused(false);
              }}
            >
              <View style={s.venueSuggestIcon}>
                <Ionicons name="location-outline" size={15} color={colors.accentCyan} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.venueSuggestTitle}>{venue.name}</Text>
                <Text style={s.venueSuggestMeta}>{venue.address}</Text>
              </View>
              <Text style={s.venueSuggestCity}>{venue.displayCity}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}
    </View>
  );
}

// ── Basics Step ─────────────────────────────────────────────────────────

function BasicsStep() {
  const { draft, setTitle, toggleCategory, setVenue, setCity, setDate, setStartTime, setEndTime, setAgeRestriction } = useEventDraftStore();

  const isMaxCategories = draft.categories.length >= MAX_CATEGORIES;
  const handleVenueSelect = useCallback((venue: VenueSuggestion) => {
    setVenue(venue.name);
    setCity(venue.displayCity);
  }, [setVenue, setCity]);

  return (
    <View>
      {/* Title */}
      <Label text="Event title" required />
      <TextInput
        style={s.input}
        value={draft.title}
        onChangeText={setTitle}
        placeholder="Give your event a strong name"
        placeholderTextColor={colors.textTertiary}
        autoCapitalize="words"
      />
      <AITitleSuggestions onSelect={setTitle} />

      {/* Category — multi-select, max 3 */}
      <Label text={`Category (select up to ${MAX_CATEGORIES})`} required />
      {draft.categories.length >= MAX_CATEGORIES && (
        <Text style={s.catMaxNote}>Maximum {MAX_CATEGORIES} categories selected</Text>
      )}
      <View style={s.chipGrid}>
        {CATEGORY_OPTIONS.map((cat) => {
          const isActive = draft.categories.includes(cat);
          const isDisabled = !isActive && isMaxCategories;
          return (
            <TouchableOpacity
              key={cat}
              style={[s.chip, isActive && s.chipActive, isDisabled && s.chipDisabled]}
              onPress={() => toggleCategory(cat)}
              activeOpacity={isDisabled ? 1 : 0.82}
              disabled={isDisabled}
            >
              <Text style={[s.chipText, isActive && s.chipTextActive, isDisabled && s.chipTextDisabled]}>{cat}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <VenuePicker
        value={draft.venue}
        cityValue={draft.city}
        onChangeText={setVenue}
        onSelectSuggestion={handleVenueSelect}
      />

      {!!draft.city && (
        <View style={s.locationPillRow}>
          <View style={s.locationPill}>
            <Ionicons name="location" size={12} color={colors.accentCyan} />
            <Text style={s.locationPillText}>{draft.city}</Text>
          </View>
          <Text style={s.locationHint}>Auto-filled from selected venue</Text>
        </View>
      )}

      {/* City */}
      <Label text="City" />
      <TextInput
        style={s.input}
        value={draft.city}
        onChangeText={setCity}
        placeholder="City, State"
        placeholderTextColor={colors.textTertiary}
      />

      <DatePickerField
        label="Date"
        required
        value={draft.date}
        onSelect={setDate}
      />

      {/* Time row — Time Grid Pickers */}
      <View style={s.timeRow}>
        <View style={{ flex: 1 }}>
          <TimeGridPicker value={draft.startTime} onSelect={setStartTime} label="Start time" />
        </View>
        <View style={{ flex: 1 }}>
          <TimeGridPicker value={draft.endTime} onSelect={setEndTime} label="End time" />
        </View>
      </View>

      <AgeRestrictionLockCard />

      {/* ── Scheduling Intelligence ── */}
      {draft.categories.length > 0 && draft.city && draft.date && draft.startTime ? (
        <SchedulingIntelligenceSection
          category={draft.categories[0]}
          city={draft.city}
          date={draft.date}
          time={draft.startTime}
          onSelectDate={(date) => setDate(date)}
        />
      ) : null}
    </View>
  );
}

/** Scheduling Intelligence sub-component for BasicsStep */
function SchedulingIntelligenceSection({
  category, city, date, time, onSelectDate,
}: {
  category: string; city: string; date: string; time: string;
  onSelectDate: (date: string) => void;
}) {
  const [result, setResult] = React.useState<SchedulingIntelligenceResult | null>(null);
  const [dismissed, setDismissed] = React.useState(false);

  React.useEffect(() => {
    // Recompute when inputs change
    setDismissed(false);
    const timer = setTimeout(() => {
      const r = computeSchedulingIntelligence(category, city, date, time);
      setResult(r);
    }, 300);
    return () => clearTimeout(timer);
  }, [category, city, date, time]);

  if (!result || dismissed) return null;

  // Only show if saturation is at least moderate
  if (result.pulse.saturationLevel === 'low') return null;

  return (
    <View style={{ marginTop: 16 }}>
      <SchedulingIntelligencePanel
        result={result}
        onSelectDate={(d) => onSelectDate(d)}
        onKeepCurrent={() => setDismissed(true)}
      />
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// STEP 2: TICKETING
// ═══════════════════════════════════════════════════════════════════════════


function AgeRestrictionLockCard() {
  const { draft, setAgeRestriction } = useEventDraftStore();
  const is18 = draft.ageRestriction === '18+';
  const is21 = draft.ageRestriction === '21+';

  const toggle18 = (value: boolean) => setAgeRestriction(value ? '18+' : 'all_ages');
  const toggle21 = (value: boolean) => setAgeRestriction(value ? '21+' : 'all_ages');

  return (
    <View style={s.policyCard}>
      <View style={s.policyHeaderRow}>
        <View style={{ flex: 1 }}>
          <Text style={s.policyTitle}>Age requirement</Text>
          <Text style={s.policySubtitle}>Choose whether this event requires age verification. This locks after event creation.</Text>
        </View>
        <View style={s.lockPill}>
          <Ionicons name="lock-closed" size={11} color={colors.accentAmber} />
          <Text style={s.lockPillText}>Locks</Text>
        </View>
      </View>

      <View style={s.policyRow}>
        <View style={{ flex: 1 }}>
          <Text style={s.policyLabel}>18+ event</Text>
          <Text style={s.policyValue}>{is18 ? 'Age verification required' : 'Off'}</Text>
        </View>
        <Switch
          value={is18}
          onValueChange={toggle18}
          trackColor={{ false: 'rgba(255,255,255,0.16)', true: 'rgba(32,199,255,0.35)' }}
          thumbColor={is18 ? colors.accentCyan : '#F5F5F5'}
        />
      </View>

      <View style={[s.policyRow, s.policyRowLast]}>
        <View style={{ flex: 1 }}>
          <Text style={s.policyLabel}>21+ event</Text>
          <Text style={s.policyValue}>{is21 ? 'Age verification required' : 'Off'}</Text>
        </View>
        <Switch
          value={is21}
          onValueChange={toggle21}
          trackColor={{ false: 'rgba(255,255,255,0.16)', true: 'rgba(32,199,255,0.35)' }}
          thumbColor={is21 ? colors.accentCyan : '#F5F5F5'}
        />
      </View>

      <View style={s.lockNoticeMini}>
        <Ionicons name="shield-checkmark" size={14} color={colors.accentAmber} />
        <Text style={s.lockNoticeMiniText}>
          Current setting: {draft.ageRestriction === 'all_ages' ? 'All Ages' : draft.ageRestriction}. You will confirm this again before posting.
        </Text>
      </View>
    </View>
  );
}

function TicketingStep() {
  const { draft, setTicketingModel, updateTicket, addTicketTier, removeTicketTier, setAllowRefunds, setAllowTransfers } = useEventDraftStore();

  return (
    <View>
      {/* Free / Paid toggle */}
      <Label text="Ticket model" />
      <View style={s.toggleRow}>
        <TogglePill label="Free" active={draft.ticketingModel === 'free'} onPress={() => setTicketingModel('free')} />
        <TogglePill label="Paid" active={draft.ticketingModel === 'paid'} onPress={() => setTicketingModel('paid')} />
      </View>

      {draft.ticketingModel === 'free' ? (
        <View style={s.freeNote}>
          <Ionicons name="checkmark-circle" size={18} color="#10B981" />
          <Text style={s.freeNoteText}>Free event. No payment or payout setup required.</Text>
        </View>
      ) : (
        <>
          {/* Ticket tiers */}
          {draft.tickets.map((tier, idx) => (
            <View key={tier.id} style={s.tierCard}>
              <View style={s.tierHeader}>
                <Text style={s.tierLabel}>Tier {idx + 1}</Text>
                {draft.tickets.length > 1 && (
                  <TouchableOpacity onPress={() => removeTicketTier(tier.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="trash-outline" size={16} color={colors.textTertiary} />
                  </TouchableOpacity>
                )}
              </View>

              <Label text="Ticket name" required />
              <TextInput
                style={s.input}
                value={tier.name}
                onChangeText={(v) => updateTicket(tier.id, { name: v })}
                placeholder="e.g. General Admission"
                placeholderTextColor={colors.textTertiary}
              />

              <View style={s.timeRow}>
                <View style={{ flex: 1 }}>
                  <Label text="Price ($)" required />
                  <TextInput
                    style={s.input}
                    value={tier.price > 0 ? String(tier.price) : ''}
                    onChangeText={(v) => updateTicket(tier.id, { price: Number(v) || 0 })}
                    placeholder="0"
                    placeholderTextColor={colors.textTertiary}
                    keyboardType="numeric"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Label text="Quantity" required />
                  <TextInput
                    style={s.input}
                    value={tier.quantity > 0 ? String(tier.quantity) : ''}
                    onChangeText={(v) => updateTicket(tier.id, { quantity: Number(v) || 0 })}
                    placeholder="100"
                    placeholderTextColor={colors.textTertiary}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={s.timeRow}>
                <View style={{ flex: 1 }}>
                  <DatePickerField
                    label="Sales start"
                    value={tier.salesStart}
                    onSelect={(v) => updateTicket(tier.id, { salesStart: v })}
                    minimumDate={draft.date || undefined}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <DatePickerField
                    label="Sales end"
                    value={tier.salesEnd}
                    onSelect={(v) => updateTicket(tier.id, { salesEnd: v })}
                    minimumDate={tier.salesStart || draft.date || undefined}
                  />
                </View>
              </View>
            </View>
          ))}

          {/* Add tier */}
          <TouchableOpacity style={s.addTierBtn} onPress={addTicketTier} activeOpacity={0.82}>
            <Ionicons name="add" size={18} color={colors.accentCyan} />
            <Text style={s.addTierText}>Add another tier</Text>
          </TouchableOpacity>

          {/* AI Pricing Guidance */}
          {draft.tickets[0]?.price > 0 && (
            <AIPricingGuidanceCard price={draft.tickets[0].price} eventType={draft.categories[0] || 'Music'} />
          )}
        </>
      )}

      <View style={s.policyCard}>
        <View style={s.policyHeaderRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.policyTitle}>Ticket policies</Text>
            <Text style={s.policySubtitle}>
              Refunds and transfers default to off until the host explicitly approves them. These lock after event creation.
            </Text>
          </View>
          <View style={s.lockPill}>
            <Ionicons name="lock-closed" size={11} color={colors.accentAmber} />
            <Text style={s.lockPillText}>Locks</Text>
          </View>
        </View>

        <View style={s.policyRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.policyLabel}>Allow refunds</Text>
            <Text style={s.policyValue}>{draft.allowRefunds ? 'Yes' : 'No'}</Text>
          </View>
          <Switch
            value={draft.allowRefunds}
            onValueChange={setAllowRefunds}
            trackColor={{ false: 'rgba(255,255,255,0.16)', true: 'rgba(32,199,255,0.35)' }}
            thumbColor={draft.allowRefunds ? colors.accentCyan : '#F5F5F5'}
          />
        </View>

        <View style={[s.policyRow, s.policyRowLast]}>
          <View style={{ flex: 1 }}>
            <Text style={s.policyLabel}>Allow ticket transfers</Text>
            <Text style={s.policyValue}>{draft.allowTransfers ? 'Yes' : 'No'}</Text>
          </View>
          <Switch
            value={draft.allowTransfers}
            onValueChange={setAllowTransfers}
            trackColor={{ false: 'rgba(255,255,255,0.16)', true: 'rgba(32,199,255,0.35)' }}
            thumbColor={draft.allowTransfers ? colors.accentCyan : '#F5F5F5'}
          />
        </View>
      </View>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// STEP 3: DETAILS
// ═══════════════════════════════════════════════════════════════════════════

function DetailsStep() {
  const { draft, setDescription, setCoverImageUri, setEventDetailMedia, setNotes } = useEventDraftStore();
  const [descFocused, setDescFocused] = useState(false);

  const handlePickImage = async () => {
    try {
      let ImagePicker: any = null;
      try { ImagePicker = require('expo-image-picker'); } catch {}

      if (!ImagePicker) {
        setCoverImageUri('https://picsum.photos/seed/event-cover/800/500');
        return;
      }
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Allow photo access to add a cover image.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.85,
        allowsEditing: true,
        aspect: [16, 9],
      });
      if (!result.canceled && result.assets?.[0]) {
        const uri = result.assets[0].uri;
        setCoverImageUri(uri);
        if (!draft.eventDetailMediaUri) setEventDetailMedia(uri, 'image');
      }
    } catch {
      Alert.alert('Error', 'Could not access photos.');
    }
  };

  const handlePickEventDetailMedia = async () => {
    try {
      let ImagePicker: any = null;
      try { ImagePicker = require('expo-image-picker'); } catch {}

      if (!ImagePicker) {
        const fallback = 'https://picsum.photos/seed/event-detail-media/900/600';
        setEventDetailMedia(fallback, 'image');
        if (!draft.coverImageUri) setCoverImageUri(fallback);
        return;
      }
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Allow photo library access to add Event Details media.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        quality: 0.9,
        allowsEditing: false,
        selectionLimit: 1,
      });
      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        const type = asset.type === 'video' ? 'video' : 'image';
        const durationSeconds = type === 'video' ? normalizeEventDetailVideoDurationSeconds(asset.duration) : null;
        if (type === 'video' && !isEventDetailVideoDurationAllowed(durationSeconds)) {
          Alert.alert(
            'Video too long',
            `Event Details videos are locked to ${EVENT_DETAIL_VIDEO_MAX_LABEL} max. This video is ${getEventDetailVideoDurationLabel(durationSeconds)}. Choose a shorter video.`
          );
          return;
        }
        setEventDetailMedia(asset.uri, type, durationSeconds);
        if (type === 'image' && !draft.coverImageUri) setCoverImageUri(asset.uri);
        if (type === 'video' && !draft.coverImageUri) {
          Alert.alert('Static cover still needed', 'Home cards use a still photo only. Add a cover image so the Home screen never shows video.');
        }
      }
    } catch {
      Alert.alert('Error', 'Could not access media.');
    }
  };

  return (
    <View>
      {/* Description */}
      <Label text="Event description" />
      <View style={[s.textAreaWrap, descFocused && s.textAreaFocused]}>
        <TextInput
          style={s.textArea}
          value={draft.description}
          onChangeText={setDescription}
          placeholder="Tell guests what to expect — atmosphere, lineup, dress code, anything that helps them decide."
          placeholderTextColor={colors.textTertiary}
          multiline
          textAlignVertical="top"
          onFocus={() => setDescFocused(true)}
          onBlur={() => setDescFocused(false)}
        />
      </View>
      <AIDescriptionSuggestions onSelect={setDescription} />

      {/* AI Clarity Guardrail */}
      {draft.description.length > 20 && (
        <AIClarityGuardrail description={draft.description} />
      )}

      {/* Home cover image */}
      <Label text="Home cover image / flyer" />
      {draft.coverImageUri ? (
        <TouchableOpacity style={s.coverPreview} onPress={handlePickImage} activeOpacity={0.85}>
          <Image source={{ uri: draft.coverImageUri }} style={s.coverImage} />
          <View style={s.coverOverlay}>
            <Ionicons name="camera-outline" size={20} color="#FFFFFF" />
            <Text style={s.coverChangeText}>Change</Text>
          </View>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={s.coverUpload} onPress={handlePickImage} activeOpacity={0.82}>
          <Ionicons name="image-outline" size={28} color={colors.textTertiary} />
          <Text style={s.coverUploadText}>Upload still cover image</Text>
          <Text style={s.coverUploadSub}>Required for Home cards · 16:9 recommended</Text>
        </TouchableOpacity>
      )}

      {/* Event Details media */}
      <Label text="Event Details media" />
      {draft.eventDetailMediaUri ? (
        <TouchableOpacity style={s.coverPreview} onPress={handlePickEventDetailMedia} activeOpacity={0.85}>
          <EventHeroMedia
            uri={draft.eventDetailMediaUri}
            type={draft.eventDetailMediaType || 'image'}
            posterUri={draft.coverImageUri}
            style={s.coverImage}
            fallbackSeed="host-detail-media"
          />
          <View style={s.coverOverlay}>
            <Ionicons name={draft.eventDetailMediaType === 'video' ? 'videocam-outline' : 'image-outline'} size={20} color="#FFFFFF" />
            <Text style={s.coverChangeText}>{draft.eventDetailMediaType === 'video' ? 'Change video' : 'Change media'}</Text>
          </View>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={s.coverUpload} onPress={handlePickEventDetailMedia} activeOpacity={0.82}>
          <Ionicons name="albums-outline" size={28} color={colors.textTertiary} />
          <Text style={s.coverUploadText}>Add photo or video</Text>
          <Text style={s.coverUploadSub}>Only appears on Event Details · Home stays still · Video max {EVENT_DETAIL_VIDEO_MAX_LABEL}</Text>
        </TouchableOpacity>
      )}

      {draft.eventDetailMediaType === 'video' ? (
        <Text style={s.mediaPolicyText}>Event Details video length limit: {EVENT_DETAIL_VIDEO_MAX_LABEL}{draft.eventDetailMediaDurationSeconds ? ` · Selected: ${getEventDetailVideoDurationLabel(draft.eventDetailMediaDurationSeconds)}` : ''}</Text>
      ) : null}

      {/* Notes */}
      <Label text="Additional notes" />
      <TextInput
        style={s.input}
        value={draft.notes}
        onChangeText={setNotes}
        placeholder="Private notes, special instructions, etc."
        placeholderTextColor={colors.textTertiary}
      />
    </View>
  );
}


function DonationSetupCard() {
  const { profile } = useHostProfileStore();
  const { draft, updateDonationCampaign, updateDonationImpactLabel } = useEventDraftStore();
  const donation = draft.donationCampaign;
  const isVerifiedNonprofit = profile.hostType === 'nonprofit' && profile.hostAccessStatus === 'active';

  return (
    <View style={s.donationCard}>
      <View style={s.policyHeaderRow}>
        <View style={{ flex: 1 }}>
          <Text style={s.policyTitle}>Nonprofit donations</Text>
          <Text style={s.policySubtitle}>
            Optional, mission-led donations appear during checkout and stay open until official event closeout.
          </Text>
        </View>
        <View style={[s.lockPill, isVerifiedNonprofit ? s.verifiedPill : null]}>
          <Ionicons name={isVerifiedNonprofit ? 'checkmark-circle' : 'shield-outline'} size={11} color={isVerifiedNonprofit ? '#10B981' : colors.accentAmber} />
          <Text style={[s.lockPillText, isVerifiedNonprofit ? { color: '#10B981' } : null]}>{isVerifiedNonprofit ? 'Verified' : 'Locked'}</Text>
        </View>
      </View>

      {!isVerifiedNonprofit ? (
        <View style={s.lockNoticeMini}>
          <Ionicons name="information-circle-outline" size={14} color={colors.accentAmber} />
          <Text style={s.lockNoticeMiniText}>Donation campaigns are visible only to verified nonprofit hosts. Apply as a nonprofit host to unlock this checkout layer.</Text>
        </View>
      ) : (
        <>
          <View style={s.policyRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.policyLabel}>Accept donations during checkout</Text>
              <Text style={s.policyValue}>Campaign page defaults on · no public donor list</Text>
            </View>
            <Switch
              value={donation.enabled}
              onValueChange={(enabled) => updateDonationCampaign({ enabled })}
              trackColor={{ false: 'rgba(255,255,255,0.16)', true: 'rgba(32,199,255,0.35)' }}
              thumbColor={donation.enabled ? colors.accentCyan : '#F5F5F5'}
            />
          </View>

          {donation.enabled ? (
            <View style={s.donationFields}>
              <Label text="Cause title" required />
              <TextInput
                style={s.input}
                value={donation.causeTitle}
                onChangeText={(causeTitle) => updateDonationCampaign({ causeTitle })}
                placeholder="Youth Scholarship Fund"
                placeholderTextColor={colors.textTertiary}
              />

              <Label text="Cause description" required />
              <TextInput
                style={[s.textArea, s.donationTextArea]}
                value={donation.causeDescription}
                onChangeText={(causeDescription) => updateDonationCampaign({ causeDescription })}
                placeholder="Tell attendees what their optional donation supports."
                placeholderTextColor={colors.textTertiary}
                multiline
              />

              <Label text="Fundraising goal" required />
              <TextInput
                style={s.input}
                value={donation.goalAmount > 0 ? String(donation.goalAmount) : ''}
                onChangeText={(goalAmount) => updateDonationCampaign({ goalAmount: Number(goalAmount) || 0 })}
                placeholder="5000"
                placeholderTextColor={colors.textTertiary}
                keyboardType="numeric"
              />

              <View style={s.donationPreviewCard}>
                <Text style={s.donationPreviewEyebrow}>ATTENDEE CHECKOUT PREVIEW</Text>
                <Text style={s.donationPreviewTitle}>Make an impact</Text>
                <Text style={s.donationPreviewBody}>Verified Nonprofit · Receipt included · Tracked separately</Text>
                <Text style={s.donationPreviewCause}>{donation.causeTitle || 'Cause title'}</Text>
                <View style={s.donationAmountRow}>
                  <View style={s.noThanksPill}><Text style={s.noThanksText}>No thanks</Text></View>
                  <View style={s.amountPill}><Text style={s.amountPillText}>Round up</Text></View>
                  {donation.suggestedAmounts.map((amount) => (
                    <View key={amount} style={s.amountPill}><Text style={s.amountPillText}>${amount}</Text></View>
                  ))}
                  <View style={s.amountPill}><Text style={s.amountPillText}>Custom</Text></View>
                </View>
              </View>

              {donation.impactLabels.map((item) => (
                <View key={item.amount} style={s.impactLabelRow}>
                  <Text style={s.impactAmount}>${item.amount}</Text>
                  <TextInput
                    style={[s.input, s.impactInput]}
                    value={item.label}
                    onChangeText={(label) => updateDonationImpactLabel(item.amount, label)}
                    placeholder="Impact label"
                    placeholderTextColor={colors.textTertiary}
                  />
                </View>
              ))}

              <View style={s.policyRow}>
                <View style={{ flex: 1 }}>
                  <Text style={s.policyLabel}>Public campaign page</Text>
                  <Text style={s.policyValue}>Default on. Guests can view progress by email or Wallet Impact.</Text>
                </View>
                <Switch
                  value={donation.publicPageEnabled}
                  onValueChange={(publicPageEnabled) => updateDonationCampaign({ publicPageEnabled })}
                  trackColor={{ false: 'rgba(255,255,255,0.16)', true: 'rgba(32,199,255,0.35)' }}
                  thumbColor={donation.publicPageEnabled ? colors.accentCyan : '#F5F5F5'}
                />
              </View>
            </View>
          ) : null}
        </>
      )}
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// STEP 4: REVIEW
// ═══════════════════════════════════════════════════════════════════════════

function ReviewStep({ onPublish }: { onPublish: () => void }) {
  const { draft, getReadinessFields, isPublishReady } = useEventDraftStore();
  const fields = getReadinessFields();

  return (
    <View>
      {/* Event summary card */}
      <View style={s.reviewCard}>
        {draft.coverImageUri ? (
          <Image source={{ uri: draft.coverImageUri }} style={s.reviewCover} />
        ) : null}
        <View style={s.reviewBody}>
          <Text style={s.reviewTitle}>{draft.title || 'Untitled Event'}</Text>
          <Text style={s.reviewMeta}>{draft.venue}{draft.city ? ` · ${draft.city}` : ''}</Text>
          <Text style={s.reviewMeta}>{toUSDate(draft.date)} · {draft.startTime}{draft.endTime ? ` – ${draft.endTime}` : ''}</Text>
          {draft.ageRestriction !== 'all_ages' && (
            <View style={s.reviewBadge}>
              <Text style={s.reviewBadgeText}>{draft.ageRestriction}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Ticketing summary */}
      <View style={s.reviewSection}>
        <Text style={s.reviewSectionTitle}>Ticketing</Text>
        <Text style={s.reviewValue}>
          {draft.ticketingModel === 'free'
            ? 'Free event'
            : draft.tickets.map((t) => `${t.name}: $${t.price} × ${t.quantity}`).join('\n')}
        </Text>
      </View>

      {/* Description preview */}
      {draft.description ? (
        <View style={s.reviewSection}>
          <Text style={s.reviewSectionTitle}>Description</Text>
          <Text style={s.reviewValue} numberOfLines={4}>{draft.description}</Text>
        </View>
      ) : null}

      <View style={s.reviewSection}>
        <Text style={s.reviewSectionTitle}>Event media</Text>
        <Text style={s.reviewValue}>
          Home: still cover photo only
          {'\n'}
          Event Details: {draft.eventDetailMediaType === 'video' ? `video hero (${EVENT_DETAIL_VIDEO_MAX_LABEL} max${draft.eventDetailMediaDurationSeconds ? ` · ${getEventDetailVideoDurationLabel(draft.eventDetailMediaDurationSeconds)}` : ''})` : draft.eventDetailMediaUri ? 'photo hero' : 'uses cover photo'}
        </Text>
      </View>

      <View style={s.reviewSection}>
        <Text style={s.reviewSectionTitle}>Locked event policies</Text>
        <Text style={s.reviewValue}>
          Age: {draft.ageRestriction === 'all_ages' ? 'All Ages' : draft.ageRestriction}
          {'\n'}
          Refunds: {draft.allowRefunds ? 'Allowed' : 'Not allowed'}
          {'\n'}
          Transfers: {draft.allowTransfers ? 'Allowed' : 'Not allowed'}
        </Text>
      </View>

      <View style={s.reviewLockNotice}>
        <Ionicons name="lock-closed" size={16} color={colors.accentAmber} />
        <Text style={s.reviewLockNoticeText}>
          These settings are trust and compliance controls. Once you create this event, age requirement, refund policy, and transfer policy cannot be edited for this event.
        </Text>
      </View>

      <DonationSetupCard />

      {/* AI Event Readiness Panel */}
      <EventReadinessPanel fields={fields} />

      {/* Promotion Readiness Card */}
      <PromotionReadyCard
        hasTitle={!!draft.title.trim()}
        hasDescription={!!draft.description.trim()}
        hasImage={!!draft.coverImageUri}
        ticketingComplete={
          draft.ticketingModel === 'free' ||
          draft.tickets.every((t) => t.name.trim().length > 0 && t.price > 0 && t.quantity > 0)
        }
        onGeneratePromo={() => {
          // Future: AI promo copy generation
        }}
        onPreviewShare={() => {
          // Future: share card preview
        }}
      />

      {/* Publish CTA */}
      <View style={s.publishWrap}>
        <TouchableOpacity
          style={[s.publishBtn, !isPublishReady() && s.primaryBtnDisabled]}
          onPress={onPublish}
          activeOpacity={0.88}
          disabled={!isPublishReady()}
        >
          <Text style={s.publishBtnText}>Create & Lock Event</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => useEventDraftStore.getState().prevStep()}>
          <Text style={s.backLink}>Back to edit</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SHARED COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

function Label({ text, required }: { text: string; required?: boolean }) {
  return (
    <Text style={s.label}>
      {text}{required ? <Text style={s.labelReq}> *</Text> : ''}
    </Text>
  );
}

function TogglePill({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={[s.togglePill, active && s.togglePillActive]} onPress={onPress} activeOpacity={0.82}>
      <Text style={[s.togglePillText, active && s.togglePillTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.04)' },
  headerCenter: { alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  headerStep: { fontSize: 12, color: colors.textTertiary, marginTop: 2 },

  // Progress
  progressRow: { flexDirection: 'row', gap: 6, paddingHorizontal: 16, marginTop: 4, marginBottom: 8 },
  progressSeg: { flex: 1, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.08)' },
  progressSegActive: { backgroundColor: colors.accentCyan },

  scrollContent: { paddingHorizontal: 20, paddingTop: 16 },
  aiCardWrap: { marginBottom: 20 },

  // Form elements
  label: { fontSize: 13, fontWeight: '700', color: colors.textSecondary, letterSpacing: 0.4, marginBottom: 8, marginTop: 20 },
  labelReq: { color: colors.accentCyan },
  input: {
    height: 50, borderRadius: radius.lg, paddingHorizontal: 16,
    fontSize: 16, color: colors.textPrimary,
    backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  textAreaWrap: {
    borderRadius: radius.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.04)', padding: 14, minHeight: 120,
  },
  textAreaFocused: { borderColor: 'rgba(255,255,255,0.20)' },
  textArea: { fontSize: 15, color: colors.textPrimary, lineHeight: 22, minHeight: 90, textAlignVertical: 'top' },
  timeRow: { flexDirection: 'row', gap: 12 },

  venueSuggestWrap: { marginTop: 10, marginBottom: 8, borderRadius: radius.xl, overflow: 'hidden', backgroundColor: 'rgba(24,27,34,0.98)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  venueSuggestRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  venueSuggestIcon: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(32,199,255,0.10)' },
  venueSuggestTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  venueSuggestMeta: { fontSize: 12, color: colors.textTertiary, marginTop: 2 },
  venueSuggestCity: { fontSize: 11, fontWeight: '600', color: colors.textSecondary },
  locationPillRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12, marginBottom: 2, flexWrap: 'wrap' },
  locationPill: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: 'rgba(32,199,255,0.10)', borderWidth: 1, borderColor: 'rgba(32,199,255,0.18)' },
  locationPillText: { fontSize: 12, fontWeight: '700', color: colors.accentCyan },
  locationHint: { fontSize: 12, color: colors.textTertiary },

  // Chips
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  chipActive: { backgroundColor: 'rgba(32,199,255,0.12)', borderColor: 'rgba(32,199,255,0.35)' },
  chipDisabled: { opacity: 0.35 },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.textTertiary },
  chipTextActive: { color: colors.accentCyan },
  chipTextDisabled: { color: colors.textTertiary },
  catMaxNote: { fontSize: 11, color: colors.accentAmber, marginBottom: 6 },

  // Toggle
  toggleRow: { flexDirection: 'row', gap: 10 },
  togglePill: {
    flex: 1, height: 48, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  togglePillActive: { backgroundColor: colors.textPrimary, borderColor: colors.textPrimary },
  togglePillText: { fontSize: 15, fontWeight: '700', color: colors.textTertiary },
  togglePillTextActive: { color: colors.bg },

  // Free note
  freeNote: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16, padding: 14, borderRadius: radius.lg, backgroundColor: 'rgba(16,185,129,0.08)', borderWidth: 1, borderColor: 'rgba(16,185,129,0.15)' },
  freeNoteText: { fontSize: 14, color: '#10B981', flex: 1 },

  // Ticket tier
  tierCard: { marginTop: 16, padding: 16, borderRadius: radius.xl, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  tierHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  tierLabel: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  addTierBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', marginTop: 14, paddingVertical: 8, paddingHorizontal: 14, borderRadius: radius.pill, backgroundColor: 'rgba(32,199,255,0.08)' },
  addTierText: { fontSize: 13, fontWeight: '600', color: colors.accentCyan },
  policyCard: {
    marginTop: 18,
    padding: 16,
    borderRadius: radius.xl,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  policyHeaderRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 4 },
  lockPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 5, borderRadius: radius.pill, backgroundColor: 'rgba(245,158,11,0.10)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.22)' },
  lockPillText: { fontSize: 10, fontWeight: '800', color: colors.accentAmber, letterSpacing: 0.5, textTransform: 'uppercase' },
  lockNoticeMini: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 12, padding: 10, borderRadius: radius.md, backgroundColor: 'rgba(245,158,11,0.08)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.16)' },
  lockNoticeMiniText: { flex: 1, fontSize: 11, lineHeight: 16, color: colors.textSecondary },
  policyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  policySubtitle: {
    fontSize: 12,
    color: colors.textTertiary,
    lineHeight: 18,
    marginBottom: 14,
  },
  policyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  policyRowLast: {
    paddingBottom: 4,
  },
  policyLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  policyValue: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 3,
  },

  // Cover image
  coverPreview: { borderRadius: radius.xl, overflow: 'hidden', position: 'relative', height: 180 },
  coverImage: { width: '100%', height: '100%' },
  coverOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14, backgroundColor: 'rgba(0,0,0,0.55)' },
  coverChangeText: { fontSize: 13, fontWeight: '600', color: '#FFFFFF' },
  coverUpload: {
    height: 140, borderRadius: radius.xl, alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.08)', borderStyle: 'dashed',
  },
  coverUploadText: { fontSize: 14, fontWeight: '600', color: colors.textTertiary },
  coverUploadSub: { fontSize: 12, color: colors.textTertiary },
  mediaPolicyText: { fontSize: 12, color: colors.textTertiary, marginTop: 8, lineHeight: 17 },

  // Review
  reviewCard: { borderRadius: radius.xl, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  reviewCover: { width: '100%', height: 160 },
  reviewBody: { padding: 16 },
  reviewTitle: { fontSize: 22, fontWeight: '700', color: colors.textPrimary, marginBottom: 6 },
  reviewMeta: { fontSize: 14, color: colors.textSecondary, marginBottom: 2 },
  reviewBadge: { alignSelf: 'flex-start', marginTop: 8, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  reviewBadgeText: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },
  reviewSection: { marginTop: 16, padding: 16, borderRadius: radius.xl, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  reviewSectionTitle: { fontSize: 13, fontWeight: '700', color: colors.textSecondary, letterSpacing: 0.4, marginBottom: 8 },
  reviewValue: { fontSize: 15, color: colors.textPrimary, lineHeight: 22 },

  reviewLockNotice: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 12, borderRadius: radius.lg, backgroundColor: 'rgba(245,158,11,0.08)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.18)', marginTop: 12, marginBottom: 16 },
  reviewLockNoticeText: { flex: 1, fontSize: 12, color: colors.textSecondary, lineHeight: 18 },

  donationCard: { marginTop: 16, padding: 16, borderRadius: radius.xl, backgroundColor: 'rgba(32,199,255,0.045)', borderWidth: 1, borderColor: 'rgba(32,199,255,0.16)' },
  verifiedPill: { backgroundColor: 'rgba(16,185,129,0.10)', borderColor: 'rgba(16,185,129,0.22)' },
  donationFields: { marginTop: 4 },
  donationTextArea: { minHeight: 88, paddingTop: 14, height: 96, textAlignVertical: 'top', backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: radius.lg, paddingHorizontal: 16 },
  donationPreviewCard: { marginTop: 16, padding: 14, borderRadius: radius.lg, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  donationPreviewEyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 0.9, color: colors.textTertiary, marginBottom: 8 },
  donationPreviewTitle: { fontSize: 17, fontWeight: '800', color: colors.textPrimary },
  donationPreviewBody: { fontSize: 12, color: colors.textTertiary, marginTop: 4 },
  donationPreviewCause: { fontSize: 13, color: colors.textSecondary, marginTop: 10, fontWeight: '700' },
  donationAmountRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  noThanksPill: { paddingHorizontal: 11, paddingVertical: 7, borderRadius: radius.pill, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  noThanksText: { color: colors.textSecondary, fontSize: 12, fontWeight: '700' },
  amountPill: { paddingHorizontal: 11, paddingVertical: 7, borderRadius: radius.pill, backgroundColor: 'rgba(32,199,255,0.10)', borderWidth: 1, borderColor: 'rgba(32,199,255,0.16)' },
  amountPillText: { color: colors.accentCyan, fontSize: 12, fontWeight: '800' },
  impactLabelRow: { flexDirection: 'row', gap: 10, alignItems: 'center', marginTop: 10 },
  impactAmount: { width: 44, color: colors.textSecondary, fontWeight: '800' },
  impactInput: { flex: 1, height: 44 },

  // Publish
  publishWrap: { marginTop: 24, gap: 14, alignItems: 'center' },
  publishBtn: { width: '100%', height: 56, borderRadius: radius.pill, backgroundColor: colors.accentCyan, alignItems: 'center', justifyContent: 'center' },
  publishBtnText: { fontSize: 17, fontWeight: '700', color: colors.bg },
  backLink: { fontSize: 14, color: colors.textTertiary },

  // Footer
  footer: { paddingHorizontal: 20, paddingTop: 12 },
  primaryBtn: { width: '100%', height: 56, borderRadius: radius.pill, backgroundColor: colors.textPrimary, alignItems: 'center', justifyContent: 'center' },
  primaryBtnDisabled: { opacity: 0.3 },
  primaryBtnText: { fontSize: 17, fontWeight: '700', color: colors.bg },
});
