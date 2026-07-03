import { useMemo, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  ImageBackground,
  Dimensions,
  Modal,
  Pressable,
  Alert,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, gradients } from '../../theme/tokens';
import { Text } from '../../components/ui';
import { useTicketStore } from '../../stores/ticketStore';
import { useEventStore } from '../../stores/eventStore';
import { addToCalendar, openDirections } from '../../services/ticketActions';
import type { EchoCircleParticipant, Event, Ticket } from '../../types';
import { formatDate, formatTime } from '../../utils/format';
import { isExpired } from '../../utils/event';
import { PostEventSection } from '../../components/wallet/PostEventSection';
import { EchodPromptCard } from '../../components/wallet/EchodPromptCard';
import { ScreenBackButton } from '../../components/shared/ScreenBackButton';
import {
  formatCountdown,
  getCircleSummaryLabel,
  getMinutesUntilCircleClose,
  getMinutesUntilEvent,
  isTransferAvailable,
  shouldCollapseCircle,
} from '../../utils/ticket';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=1400&auto=format&fit=crop';

export default function TicketDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const getTicketById = useTicketStore((state) => state.getTicketById);
  const getEventById = useEventStore((state) => state.getEventById);
  const ticket = getTicketById(id);
  const event = ticket ? getEventById(ticket.event_id) : undefined;

  const [selectedParticipant, setSelectedParticipant] = useState<EchoCircleParticipant | null>(null);
  const [participants, setParticipants] = useState<EchoCircleParticipant[]>(ticket?.circle?.participants ?? []);
  const [menuVisible, setMenuVisible] = useState(false);
  const [circleStatusVisible, setCircleStatusVisible] = useState(false);
  const [qrVisible, setQrVisible] = useState(false);
  const [nfcAttempts, setNfcAttempts] = useState(0);
  const [scanState, setScanState] = useState<'ready' | 'scanning' | 'retry' | 'fallback'>('ready');

  const transferEnabled = useMemo(() => {
    if (!ticket || !event) return false;
    return isTransferAvailable(ticket, event);
  }, [ticket, event]);

  if (!ticket || !event) {
    return (
      <View style={styles.emptyState}>
        <Text variant="displayM">Ticket unavailable</Text>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => router.back()}>
          <Text variant="meta">Back to Wallet</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const circle = ticket.circle ? { ...ticket.circle, participants } : null;
  const collapseCircle = shouldCollapseCircle(event);
  const showCirclePrimary = !!circle && !collapseCircle;
  const circleCountdown = formatCountdown(getMinutesUntilCircleClose(circle));
  const entryReady = getMinutesUntilEvent(event) <= 60 && ticket.status === 'active' && circle?.user_status !== 'awaiting';
  const summaryLabel = getCircleSummaryLabel(circle);
  const currentUserIsOrganizer = circle?.role === 'organizer';

  const handleTransfer = () => {
    setMenuVisible(false);
    if (!transferEnabled) {
      Alert.alert('Transfer unavailable', 'Tickets can only be transferred up to 30 minutes before the event starts.');
      return;
    }
    router.push(`/transfer/${ticket.id}`);
  };

  const handleParticipantPress = (participant: EchoCircleParticipant) => {
    if (!currentUserIsOrganizer) return;
    if (participant.isCurrentUser) return;
    if (participant.status !== 'awaiting' && participant.status !== 'declined') return;
    setSelectedParticipant(participant);
  };

  const handleSendReminder = () => {
    if (!selectedParticipant) return;
    Alert.alert('Reminder sent', `A payment reminder was sent to ${selectedParticipant.name}.`);
    setSelectedParticipant(null);
  };

  const handleRemoveMember = () => {
    if (!selectedParticipant) return;
    setParticipants((prev) => prev.filter((p) => p.id !== selectedParticipant.id));
    Alert.alert('Member removed', `${selectedParticipant.name} was removed from the circle.`);
    setSelectedParticipant(null);
  };

  const handleInviteReplacement = () => {
    if (!selectedParticipant) return;
    setParticipants((prev) => prev.map((p) => p.id === selectedParticipant.id
      ? { ...p, name: 'New Invite Pending', status: 'awaiting', avatar_url: null }
      : p));
    Alert.alert('Replacement invite ready', 'Replacement invite flow is staged. The slot is now marked as awaiting a new member.');
    setSelectedParticipant(null);
  };

  const handleViewCircleStatus = () => {
    setMenuVisible(false);
    setCircleStatusVisible(true);
  };

  const handleDirections = async () => {
    setMenuVisible(false);
    await openDirections(`${event.venue_name}, ${event.venue_address}`);
  };

  const handleCalendar = () => {
    setMenuVisible(false);
    Alert.alert('Add to calendar', 'Choose your calendar service.', [
      { text: 'Apple Calendar', onPress: () => addToCalendar(event, 'apple') },
      { text: 'Google Calendar', onPress: () => addToCalendar(event, 'google') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleShowQr = () => {
    setMenuVisible(false);
    setQrVisible(true);
    setScanState('fallback');
  };

  const handleNfcTap = () => {
    if (!entryReady) {
      Alert.alert('Entry not ready', 'NFC becomes primary 1 hour before the event starts.');
      return;
    }
    const nextAttempts = nfcAttempts + 1;
    setNfcAttempts(nextAttempts);
    if (nextAttempts >= 3) {
      setScanState('fallback');
      setQrVisible(true);
      Alert.alert('Backup QR ready', 'Three unsuccessful NFC attempts detected. Backup QR is now available.');
      return;
    }
    setScanState('retry');
    Alert.alert('Try again', `NFC tap was unsuccessful. Attempt ${nextAttempts} of 3.`);
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#080A10', '#0A0D17', '#090B12']} style={StyleSheet.absoluteFill} />
      <View style={[styles.header, { paddingTop: insets.top + 10, minHeight: insets.top + 64 }]}>
        <ScreenBackButton variant="floating" />
        <View style={styles.headerCenter}>
          <Text style={styles.headerBrand}>ECHO</Text>
          <Text style={styles.headerScreen}>Ticket</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {showCirclePrimary ? (
          <EchoCircleCard
            title={event.title}
            subtitle={`${formatDate(event.start_time)} • ${formatTime(event.start_time)} • ${event.venue_name}`}
            circle={circle!}
            countdown={circleCountdown}
            isOrganizer={!!currentUserIsOrganizer}
            onParticipantPress={handleParticipantPress}
          />
        ) : (
          <NfcReadyCard
            event={event}
            ticket={ticket}
            entryReady={entryReady}
            circleSummary={summaryLabel}
            transferEnabled={transferEnabled}
            scanState={scanState}
            nfcAttempts={nfcAttempts}
            onMenuPress={() => setMenuVisible(true)}
            onNfcTap={handleNfcTap}
          />
        )}

        <View style={styles.trustRow}>
          <Text variant="caption" color="textMuted">
            {showCirclePrimary
              ? 'Circle context remains primary until 60 minutes before event start.'
              : qrVisible || scanState === 'fallback'
                ? 'Backup QR available after three unsuccessful NFC taps.'
                : 'NFC-first entry • QR remains secondary and appears on fallback.'}
          </Text>
        </View>

        {/* ── ECHO'd Experience Module (past events — detail page entry point) ── */}
        {(ticket.status === 'used' || ticket.status === 'checked_in' || isExpired(event)) && (
          <View style={styles.echodModule}>
            <EchodPromptCard ticketId={ticket.id} eventId={event.id} />
          </View>
        )}

        {/* ── Post-Event Section (past events only) ── */}
        {(ticket.status === 'used' || ticket.status === 'checked_in' || isExpired(event)) && (
          <PostEventSection
            ticketId={ticket.id}
            eventId={event.id}
            eventDate={event.start_time}
            eventVenueName={event.venue_name}
          />
        )}
      </ScrollView>

      <TicketMenuSheet
        visible={menuVisible}
        event={event}
        transferEnabled={transferEnabled}
        onClose={() => setMenuVisible(false)}
        onViewCircleStatus={handleViewCircleStatus}
        onDirections={handleDirections}
        onCalendar={handleCalendar}
        onTransfer={handleTransfer}
        onShowQr={handleShowQr}
      />

      <QrSheet visible={qrVisible} onClose={() => setQrVisible(false)} qrValue={ticket.qr_code} />


      <Modal visible={circleStatusVisible} transparent animationType="slide" onRequestClose={() => setCircleStatusVisible(false)}>
        <Pressable style={styles.sheetOverlay} onPress={() => setCircleStatusVisible(false)}>
          <Pressable style={styles.circleStatusSheet} onPress={() => {}}>
            <View style={styles.sheetHandle} />
            <Text variant="sheetTitle" style={styles.sheetTitle}>Circle Status</Text>
            {circle ? (
              <ScrollView showsVerticalScrollIndicator={false}>
                <EchoCircleCard
                  title={event.title}
                  subtitle={`${formatDate(event.start_time)} • ${formatTime(event.start_time)} • ${event.venue_name}`}
                  circle={circle}
                  countdown={circleCountdown}
                  isOrganizer={!!currentUserIsOrganizer}
                  onParticipantPress={handleParticipantPress}
                />
              </ScrollView>
            ) : (
              <Text variant="caption" color="textMuted" style={{ textAlign: 'center' }}>No Echo Circle is attached to this ticket.</Text>
            )}
            <TouchableOpacity style={styles.closeBtn} onPress={() => setCircleStatusVisible(false)} activeOpacity={0.86}>
              <Text variant="meta">Close</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <ParticipantActionSheet
        participant={selectedParticipant}
        visible={!!selectedParticipant}
        onClose={() => setSelectedParticipant(null)}
        onSendReminder={handleSendReminder}
        onRemove={handleRemoveMember}
        onInviteReplacement={handleInviteReplacement}
      />
    </View>
  );
}

function EchoCircleCard({ title, subtitle, circle, countdown, isOrganizer, onParticipantPress }: any) {
  const progress = Math.max(0, Math.min(1, circle.claimed_slots / circle.total_slots));

  return (
    <View style={styles.circleWrap}>
      <Text style={styles.eventHeading}>{title}</Text>
      <Text variant="meta" color="textMuted" style={styles.eventSubheading}>{subtitle}</Text>

      <View style={styles.divider} />
      <Text style={styles.circleEyebrow}>ECHO CIRCLE</Text>
      <View style={styles.countdownHeader}>
        <View style={styles.rule} />
        <Text variant="meta" color="textMuted">Circle closes in</Text>
        <View style={styles.rule} />
      </View>

      <LinearGradient colors={[...gradients.echo]} style={styles.circleRingOuter}>
        <View style={styles.circleRingInner}>
          <View style={[styles.progressArcMask, { opacity: 0.18 + progress * 0.45 }]} />
          <Text style={styles.circleCount}>{circle.claimed_slots} of {circle.total_slots}</Text>
          <Text style={styles.circleLabel}>Tickets Claimed</Text>
          <Text style={styles.circleCountdown}>{countdown}</Text>
        </View>
      </LinearGradient>

      <View style={styles.participantCard}>
        {circle.participants.map((participant: EchoCircleParticipant) => {
          const canManage = isOrganizer && !participant.isCurrentUser && (participant.status === 'awaiting' || participant.status === 'declined');
          return (
            <TouchableOpacity
              key={participant.id}
              style={styles.participantRow}
              activeOpacity={canManage ? 0.82 : 1}
              onPress={() => canManage && onParticipantPress(participant)}
            >
              {participant.avatar_url ? (
                <Image source={{ uri: participant.avatar_url }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback]}>
                  <Ionicons name={participant.status === 'declined' ? 'close' : 'person-add'} size={16} color={participant.status === 'declined' ? colors.echoPink : colors.warning} />
                </View>
              )}

              <View style={styles.participantTextWrap}>
                <Text style={styles.participantName}>
                  {participant.name}{participant.isCurrentUser ? ' (Organizer)' : ''}
                </Text>
                <Text variant="caption" color="textMuted">
                  {participant.isCurrentUser
                    ? "You're the organizer. You're in control."
                    : participant.status === 'awaiting'
                      ? 'Reserved spot. Payment still pending.'
                      : participant.status === 'declined'
                        ? 'Invite declined. Tap to remove or replace.'
                        : 'Claimed and reserved.'}
                </Text>
              </View>

              <View style={styles.participantStatus}>
                {participant.status === 'paid' ? (
                  <>
                    <Ionicons name="checkmark" size={14} color={colors.success} />
                    <Text style={[styles.participantStatusText, { color: colors.success }]}>Paid</Text>
                  </>
                ) : participant.status === 'awaiting' ? (
                  <>
                    <Ionicons name="hourglass-outline" size={14} color={colors.warning} />
                    <Text style={[styles.participantStatusText, { color: colors.warning }]}>Awaiting</Text>
                    {canManage ? <Ionicons name="chevron-down" size={14} color={colors.textMuted} /> : null}
                  </>
                ) : (
                  <>
                    <Ionicons name="close" size={14} color={colors.echoPink} />
                    <Text style={[styles.participantStatusText, { color: colors.echoPink }]}>Declined</Text>
                    {canManage ? <Ionicons name="chevron-down" size={14} color={colors.textMuted} /> : null}
                  </>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <LinearGradient colors={[...gradients.echo]} start={{ x: 0, y: 0.2 }} end={{ x: 1, y: 1 }} style={styles.primaryCtaWrap}>
        <TouchableOpacity style={styles.primaryCta} activeOpacity={0.86} onPress={() => Alert.alert('Circle management', 'Remaining-ticket purchase flow is ready for secure checkout wiring.')}>
          <Text style={styles.primaryCtaText}>Purchase Remaining Tickets</Text>
        </TouchableOpacity>
      </LinearGradient>

      <View style={styles.secureFoot}>
        <Ionicons name="lock-closed-outline" size={12} color={colors.textMuted} />
        <Text variant="caption" color="textMuted">All paid tickets are reserved.</Text>
      </View>
    </View>
  );
}

function NfcReadyCard({ event, ticket, entryReady, circleSummary, transferEnabled, scanState, nfcAttempts, onMenuPress, onNfcTap }: {
  event: Event;
  ticket: Ticket;
  entryReady: boolean;
  circleSummary: string | null;
  transferEnabled: boolean;
  scanState: 'ready' | 'scanning' | 'retry' | 'fallback';
  nfcAttempts: number;
  onMenuPress: () => void;
  onNfcTap: () => void;
}) {
  // Dynamic status
  const isCheckedIn = ticket.status === 'checked_in';
  const statusLabel = isCheckedIn ? 'CHECKED IN' : entryReady ? 'READY' : 'UPCOMING';
  const statusColor = isCheckedIn ? '#10B981' : entryReady ? '#10B981' : '#F59E0B';
  const statusSub = isCheckedIn
    ? 'Entry complete'
    : entryReady
      ? 'Hold near reader'
      : `Entry opens at ${formatTime(event.start_time)}`;

  return (
    <View style={styles.nfcCard}>
      {/* Glass card */}
      <View style={styles.glassCard}>
        {/* Status */}
        <View style={styles.statusRow}>
          <Text style={[styles.statusLabel, { color: statusColor }]}>{statusLabel}</Text>
          <TouchableOpacity onPress={onMenuPress} style={styles.menuBtnSmall} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="ellipsis-horizontal" size={18} color="rgba(255,255,255,0.45)" />
          </TouchableOpacity>
        </View>
        <Text style={styles.statusSub}>{statusSub}</Text>

        {/* Event flyer with NFC icon overlay */}
        <View style={styles.flyerContainer}>
          <ImageBackground
            source={{ uri: event.image_url || FALLBACK_IMAGE }}
            style={styles.flyerImage}
            imageStyle={styles.flyerImageInner}
          >
            <LinearGradient
              colors={['rgba(10,12,18,0.08)', 'rgba(10,12,18,0.30)', 'rgba(10,12,18,0.60)']}
              locations={[0, 0.6, 1]}
              style={styles.flyerOverlay}
            />
            {/* Status pill overlaid top-left of flyer */}
            <View style={styles.flyerStatusPill}>
              <Text style={[styles.flyerStatusText, { color: statusColor }]}>{statusLabel}</Text>
            </View>
            {/* Age badge overlaid top-right of flyer */}
            {event.age_restriction ? (
              <View style={styles.flyerAgeBadge}>
                <Text style={styles.flyerAgeText}>{event.age_restriction}+</Text>
              </View>
            ) : null}
          </ImageBackground>
          {/* NFC icon overlay — bottom-right of flyer */}
          <TouchableOpacity
            onPress={onNfcTap}
            activeOpacity={0.85}
            style={[styles.nfcIconOverlay, entryReady && styles.nfcIconOverlayReady]}
            accessibilityLabel="NFC tap to enter"
          >
            <Ionicons name="wifi" size={22} color={entryReady ? '#10B981' : 'rgba(255,255,255,0.70)'} style={{ transform: [{ rotate: '45deg' }] }} />
          </TouchableOpacity>
        </View>

        {/* Event info card */}
        <View style={styles.eventInfoCard}>
          <View style={styles.eventTitleRow}>
            <Text style={styles.eventInfoTitle} numberOfLines={1}>{event.title}</Text>
            {event.age_restriction ? (
              <View style={styles.ageBadge}>
                <Text style={styles.ageBadgeText}>{event.age_restriction}+</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.eventInfoDate}>{formatDate(event.start_time)} · {formatTime(event.start_time)}</Text>
          <View style={styles.eventLocationRow}>
            <Ionicons name="location-outline" size={14} color="rgba(255,255,255,0.55)" />
            <Text style={styles.eventInfoVenue}>{event.venue_name}</Text>
            <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.30)" />
          </View>
        </View>

        {/* Circle summary if applicable */}
        {circleSummary ? (
          <View style={styles.circleSummaryStrip}>
            <Ionicons name="people-outline" size={14} color={colors.textHigh} />
            <Text variant="caption" style={styles.circleSummaryText}>{circleSummary}</Text>
          </View>
        ) : null}
      </View>

      {/* Trust footer */}
      <View style={styles.trustFooter}>
        <Ionicons name="lock-closed-outline" size={12} color="rgba(255,255,255,0.22)" />
        <Text style={styles.trustFooterText}>Secure entry · Cryptographically verified · Offline capable</Text>
      </View>
    </View>
  );
}

function TicketMenuSheet({ visible, onClose, onViewCircleStatus, onDirections, onShowQr, onCalendar, onTransfer, transferEnabled }: any) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.menuOverlay} onPress={onClose}>
        <Pressable style={styles.ticketMenuSheet} onPress={() => {}}>
          <ActionTile icon="people-outline" label="View Circle Status" onPress={onViewCircleStatus} />
          <ActionTile icon="navigate-outline" label="Directions" onPress={onDirections} />
          <ActionTile icon="qr-code-outline" label="Show QR Code" onPress={onShowQr} />
          <ActionTile icon="calendar-outline" label="Add to Calendar" onPress={onCalendar} />
          <ActionTile icon="swap-horizontal-outline" label="Transfer Ticket" disabled={!transferEnabled} onPress={onTransfer} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function QrSheet({ visible, onClose, qrValue }: { visible: boolean; onClose: () => void; qrValue: string }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.sheetOverlay} onPress={onClose}>
        <Pressable style={styles.qrSheet} onPress={() => {}}>
          <View style={styles.sheetHandle} />
          <Text variant="sheetTitle" style={styles.sheetTitle}>Backup QR</Text>
          <PseudoQrCode value={qrValue} />
          <Text variant="caption" color="textMuted" style={styles.qrHelp}>System-generated fallback only • NFC remains primary whenever available</Text>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.86}>
            <Text variant="meta">Close</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function ParticipantActionSheet({ visible, participant, onClose, onSendReminder, onRemove, onInviteReplacement }: any) {
  if (!participant) return null;
  const isAwaiting = participant.status === 'awaiting';
  const isDeclined = participant.status === 'declined';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.menuOverlay} onPress={onClose}>
        <Pressable style={styles.menuSheet} onPress={() => {}}>
          <Text variant="sheetTitle" style={styles.menuTitle}>{participant.name}</Text>
          <Text variant="caption" color="textMuted" style={styles.menuSubtitle}>
            {isAwaiting ? 'Awaiting payment. Organizer controls are available.' : 'Invite declined. You can remove this member or invite a replacement.'}
          </Text>

          {isAwaiting ? <ActionTile icon="notifications-outline" label="Send Reminder" onPress={onSendReminder} /> : null}
          {(isAwaiting || isDeclined) ? <ActionTile icon="person-remove-outline" label="Remove Member" onPress={onRemove} /> : null}
          {(isAwaiting || isDeclined) ? <ActionTile icon="person-add-outline" label="Invite Another Member" onPress={onInviteReplacement} /> : null}

          <TouchableOpacity style={styles.menuCloseBtn} onPress={onClose} activeOpacity={0.86}>
            <Text variant="meta">Done</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function ActionTile({ icon, label, onPress, disabled = false }: any) {
  return (
    <TouchableOpacity style={[styles.actionTile, disabled && styles.actionTileDisabled]} onPress={onPress} disabled={disabled} activeOpacity={0.82}>
      <Ionicons name={icon as never} size={18} color={disabled ? colors.textMuted : colors.textHigh} />
      <Text variant="meta" style={[styles.actionTileText, disabled && { color: colors.textMuted }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={14} color={colors.textMuted} style={{ marginLeft: 'auto' }} />
    </TouchableOpacity>
  );
}

function PseudoQrCode({ value }: { value: string }) {
  const cells = useMemo(() => buildPseudoQr(value), [value]);
  return (
    <View style={styles.qrMatrix}>
      {cells.map((cell, index) => (
        <View key={`${index}-${cell ? '1' : '0'}`} style={[styles.qrPixel, !cell && styles.qrPixelOff]} />
      ))}
    </View>
  );
}

function buildPseudoQr(value: string) {
  const size = 29;
  const matrix = Array.from({ length: size * size }, () => false);
  const setFinder = (x: number, y: number) => {
    for (let row = 0; row < 7; row += 1) {
      for (let col = 0; col < 7; col += 1) {
        const onBorder = row === 0 || row === 6 || col === 0 || col === 6;
        const onCenter = row >= 2 && row <= 4 && col >= 2 && col <= 4;
        matrix[(y + row) * size + (x + col)] = onBorder || onCenter;
      }
    }
  };
  setFinder(1, 1);
  setFinder(size - 8, 1);
  setFinder(1, size - 8);

  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }

  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      const protectedZone =
        (row >= 1 && row <= 7 && col >= 1 && col <= 7) ||
        (row >= 1 && row <= 7 && col >= size - 8 && col <= size - 2) ||
        (row >= size - 8 && row <= size - 2 && col >= 1 && col <= 7);
      if (protectedZone) continue;
      const index = row * size + col;
      const noise = ((hash >> ((row + col) % 24)) & 1) === 1;
      const rhythm = ((row * 7 + col * 11 + value.length) % 5) < 2;
      matrix[index] = noise !== rhythm;
    }
  }
  return matrix;
}

function getTicketTimingLabel(startTime: string) {
  const start = new Date(startTime);
  const today = new Date();
  if (start.toDateString() === today.toDateString()) return 'TONIGHT';
  return formatDate(startTime);
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#06080D' },
  emptyState: {
    flex: 1,
    backgroundColor: '#06080D',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  secondaryButton: {
    height: 44,
    paddingHorizontal: 18,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  header: {
    paddingTop: 0,
    paddingHorizontal: 22,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  headerCenter: { alignItems: 'center' },
  headerBrand: { color: colors.textHigh, fontSize: 20, fontWeight: '700', letterSpacing: 3.2 },
  headerScreen: { color: colors.textMuted, fontSize: 12, letterSpacing: 0.8, marginTop: 2, textTransform: 'uppercase' },
  headerSpacer: { width: 44 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 34 },
  trustRow: { paddingTop: 16, alignItems: 'center' },

  eventHeading: { color: colors.textHigh, fontSize: 18, fontWeight: '600', textAlign: 'center', marginTop: 6 },
  eventSubheading: { textAlign: 'center', marginTop: 4 },
  divider: { height: 1, backgroundColor: colors.hairline, marginVertical: 18 },
  echodModule: { marginTop: 8, marginBottom: 4, padding: 16, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 20, borderWidth: 1, borderColor: colors.hairline },
  circleWrap: {
    borderRadius: 28,
    padding: 20,
    backgroundColor: 'rgba(13,16,24,0.95)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  circleEyebrow: {
    color: colors.textMuted,
    textAlign: 'center',
    letterSpacing: 2.2,
    fontSize: 11,
    fontWeight: '700',
  },
  countdownHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  rule: { flex: 1, height: 1, backgroundColor: colors.hairline },
  circleRingOuter: { alignSelf: 'center', padding: 1.5, borderRadius: 500, marginTop: 8 },
  circleRingInner: {
    width: 236,
    height: 236,
    borderRadius: 999,
    backgroundColor: '#0B0E15',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  progressArcMask: {
    position: 'absolute',
    inset: 14,
    borderRadius: 999,
    backgroundColor: 'rgba(6,182,212,0.2)',
  },
  circleCount: { color: colors.textHigh, fontSize: 28, fontWeight: '700' },
  circleLabel: { color: colors.textMuted, fontSize: 13, marginTop: 4, letterSpacing: 0.4 },
  circleCountdown: { color: colors.textHigh, fontSize: 42, fontWeight: '700', marginTop: 10, letterSpacing: 1 },
  participantCard: {
    marginTop: 22,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: colors.hairline,
    overflow: 'hidden',
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  avatarFallback: { backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
  participantTextWrap: { flex: 1, gap: 3 },
  participantName: { color: colors.textHigh, fontSize: 15, fontWeight: '600' },
  participantStatus: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  participantStatusText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.4 },
  primaryCtaWrap: { marginTop: 22, borderRadius: 999, padding: 1 },
  primaryCta: { height: 54, borderRadius: 999, backgroundColor: '#0A0D13', alignItems: 'center', justifyContent: 'center' },
  primaryCtaText: { color: colors.textHigh, fontWeight: '700', fontSize: 15, letterSpacing: 0.3 },
  secureFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 14 },

  nfcCard: {
    marginHorizontal: 20,
  },
  glassCard: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(18,22,30,0.95)',
    paddingHorizontal: 24,
    paddingTop: 22,
    paddingBottom: 24,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusLabel: { fontSize: 18, fontWeight: '800', letterSpacing: 2 },
  statusSub: { fontSize: 14, color: 'rgba(255,255,255,0.55)', marginTop: 4 },
  menuBtnSmall: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.06)' },
  // Ring
  ringTouch: { alignSelf: 'center', marginVertical: 28 },
  flyerContainer: { position: 'relative', marginVertical: 16, borderRadius: 20, overflow: 'hidden' },
  flyerImage: { width: '100%', aspectRatio: 4 / 3 } as ViewStyle,
  flyerImageInner: { borderRadius: 20 },
  flyerOverlay: { ...StyleSheet.absoluteFillObject, borderRadius: 20 },
  flyerStatusPill: { position: 'absolute', top: 12, left: 12, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.55)' },
  flyerStatusText: { fontSize: 12, fontWeight: '800', letterSpacing: 1.6 },
  flyerAgeBadge: { position: 'absolute', top: 12, right: 12, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.55)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  flyerAgeText: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.80)' },
  nfcIconOverlay: { position: 'absolute', bottom: 14, right: 14, width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(15,17,21,0.82)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  nfcIconOverlayReady: { borderColor: 'rgba(16,185,129,0.50)', backgroundColor: 'rgba(16,185,129,0.12)' },
  ringOuter: { position: 'relative', overflow: 'hidden' },
  ringQuad: { position: 'absolute', width: '50%', height: '50%' } as ViewStyle,
  ringInner: { position: 'absolute', top: 4, left: 4, backgroundColor: '#0F1115', alignItems: 'center', justifyContent: 'center' },
  ringIcon: { width: 72, height: 72 },
  // Event info
  eventInfoCard: {
    borderRadius: 16, padding: 16, backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  eventTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  eventInfoTitle: { flex: 1, fontSize: 20, fontWeight: '700', color: '#F5F7FB' },
  ageBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', backgroundColor: 'rgba(255,255,255,0.06)' },
  ageBadgeText: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.80)' },
  eventInfoDate: { fontSize: 15, color: 'rgba(255,255,255,0.65)', marginTop: 8 },
  eventLocationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  eventInfoVenue: { flex: 1, fontSize: 14, color: 'rgba(255,255,255,0.55)' },
  // Circle summary
  circleSummaryStrip: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginTop: 14, paddingVertical: 10, paddingHorizontal: 14,
    borderRadius: 12, backgroundColor: 'rgba(123,77,255,0.08)',
    borderWidth: 1, borderColor: 'rgba(123,77,255,0.18)',
  },
  circleSummaryText: { color: colors.textHigh },
  // Trust footer
  trustFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 16 },
  trustFooterText: { fontSize: 11, color: 'rgba(255,255,255,0.22)' },

  inlineStatusText: { color: colors.textHigh },

  actionTile: {
    minHeight: 52,
    borderRadius: 16,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: colors.hairline,
    marginBottom: 10,
  },
  actionTileDisabled: { opacity: 0.45 },
  actionTileText: { color: colors.textHigh },
  menuOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.52)', justifyContent: 'flex-end' },
  menuSheet: {
    marginHorizontal: 16,
    marginBottom: 18,
    borderRadius: 24,
    padding: 16,
    backgroundColor: '#0E121A',
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  ticketMenuSheet: {
    marginLeft: 'auto',
    marginRight: 16,
    marginTop: 110,
    width: 228,
    borderRadius: 20,
    padding: 12,
    backgroundColor: '#0E121A',
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  menuTitle: { color: colors.textHigh, marginBottom: 6 },
  menuSubtitle: { marginBottom: 14 },
  menuCloseBtn: {
    height: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginTop: 8,
  },

  sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.54)', justifyContent: 'flex-end' },
  qrSheet: {
    backgroundColor: '#0C1017',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderColor: colors.hairline,
    alignItems: 'center',
  },
  circleStatusSheet: {
    backgroundColor: '#0C1017',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderColor: colors.hairline,
    maxHeight: '86%',
  },
  sheetHandle: { width: 54, height: 5, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.16)', marginBottom: 18 },
  sheetTitle: { color: colors.textHigh, marginBottom: 18 },
  qrMatrix: {
    width: 232,
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 18,
    marginTop: 4,
  },
  qrPixel: { width: 7.17, height: 7.17, backgroundColor: '#000000' },
  qrPixelOff: { backgroundColor: '#FFFFFF' },
  qrHelp: { textAlign: 'center', marginTop: 14, marginBottom: 14 },
  closeBtn: {
    height: 48,
    minWidth: 144,
    paddingHorizontal: 18,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: colors.hairline,
  },
});
