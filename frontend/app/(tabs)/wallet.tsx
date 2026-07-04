/**
 * ECHO Wallet — v16 Rebuild
 * ═════════════════════════
 * Theme-aware (light/dark), Circle as priority surface, polished sections.
 * Section order: Circle (if active) → Primary ticket → Upcoming → Following Hosts → Past
 */
import { useEffect, useMemo, useState } from 'react';
import {
  View, ScrollView, StyleSheet, TouchableOpacity, RefreshControl,
  LayoutAnimation, Platform, UIManager, Modal, Pressable, Image, Alert, Animated,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../../components/ui';
import { ActiveTicketCard, SmallTicketCard } from '../../components/wallet';
import { getSocialEnergy } from '../../services/socialEnergyService';
import { CircleWalletCard } from '../../components/circle/CircleWalletCard';
import { useTicketStore } from '../../stores/ticketStore';
import { useEventStore } from '../../stores/eventStore';
import { useHostStore } from '../../stores/hostStore';
import { useVerificationStore } from '../../stores/verificationStore';
import { useCircleStore } from '../../stores/circleStore';
import { useDonationStore } from '../../stores/donationStore';
import { deriveWalletPriority } from '../../services/circleStateModel';
import { formatDate, formatTime, formatPrice } from '../../utils/format';
import { isTransferAvailable } from '../../utils/ticket';
import { getStartingPrice } from '../../utils/event';
import { addToCalendar, openDirections } from '../../services/ticketActions';
import { useDynamicTheme } from '../../theme/dynamicTheme';
import { ModeSwitchHeader } from '../../components/navigation/ModeSwitchHeader';
import { useEchoHeaderVisibility } from '../../components/navigation/useEchoHeaderVisibility';
import type { WalletPriority } from '../../types/circle';
import type { DynamicPalette } from '../../theme/dynamicTheme';
import type { DonationRecord, NonprofitDonationCampaign } from '../../types/nonprofitDonation';
import { formatDonationCurrency, getCampaignProgressPercent } from '../../services/donationCampaignService';
import { WebWalletPage } from '../../components/web/WebWalletPage';
import { useCredentialRotation } from '../../hooks/useCredentialRotation';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function WalletScreen() {
  // v59: Web-only wallet variant. Native flow is untouched below.
  if (Platform.OS === 'web') {
    return <WebWalletPage />;
  }

  const insets = useSafeAreaInsets();
  const { colors: c, isDark } = useDynamicTheme();
  const [refreshing, setRefreshing]     = useState(false);
  const [pastExpanded, setPastExpanded] = useState(false);
  const [menuVisible, setMenuVisible]   = useState(false);
  const [qrVisible, setQrVisible]       = useState(false);
  const { visible: headerVisible, onScroll: handleHeaderScroll, headerAnimatedStyle } = useEchoHeaderVisibility();

  const { fetchTickets, getActiveTickets, getPastTickets } = useTicketStore();
  const { fetchEvents, getEventById, getSavedEvents, toggleSaved } = useEventStore();
  const { initializeHosts, getFollowingHosts }             = useHostStore();
  const { status: verifyStatus, isAgeEligible }            = useVerificationStore();
  const { circle }                                         = useCircleStore();
  const { getUserImpactRecords, getCampaignTotals }         = useDonationStore();

  useEffect(() => {
    fetchTickets();
    fetchEvents();
    initializeHosts();
  }, [fetchTickets, fetchEvents, initializeHosts]);

  const activeTickets  = useMemo(() => getActiveTickets(),   [getActiveTickets, refreshing]);
  const pastTickets    = useMemo(() => getPastTickets(),     [getPastTickets, refreshing]);
  const followingHosts = useMemo(() => getFollowingHosts(), [getFollowingHosts, refreshing]);
  const savedEvents = useMemo(() => getSavedEvents(), [getSavedEvents, refreshing]);
  const impactRecords = useMemo(() => getUserImpactRecords(), [getUserImpactRecords, refreshing]);

  const primaryTicket = activeTickets[0];
  const primaryEvent  = primaryTicket ? getEventById(primaryTicket.event_id) : undefined;
  const upcomingTickets = activeTickets.slice(1);

  const isAgeVerified = useMemo(() => {
    if (verifyStatus !== 'verified' || !primaryEvent?.age_restriction) return false;
    return isAgeEligible(primaryEvent.age_restriction as 0 | 18 | 21);
  }, [verifyStatus, primaryEvent, isAgeEligible]);

  const transferEnabled = useMemo(() => {
    if (!primaryTicket || !primaryEvent) return false;
    return isTransferAvailable(primaryTicket, primaryEvent);
  }, [primaryTicket, primaryEvent]);

  const primarySummary = `${primaryTicket?.quantity || 1} ticket${(primaryTicket?.quantity || 1) > 1 ? 's' : ''} · Verified by ECHO`;

  // Hero logic: active ticket first, then promote next upcoming, else empty
  const heroTicket = primaryTicket || (upcomingTickets.length > 0 ? upcomingTickets[0] : null);
  const heroEvent = heroTicket ? getEventById(heroTicket.event_id) : null;
  const isHeroPromoted = !primaryTicket && !!heroTicket; // upcoming promoted to hero
  const heroSummary = isHeroPromoted
    ? `Unlocks at ${heroEvent ? formatTime(heroEvent.start_time) : ''} · Verified by ECHO`
    : primarySummary;
  const heroStatus = isHeroPromoted ? 'UPCOMING' : 'READY FOR ENTRY';

  // Upcoming list: skip the first one if it was promoted to hero
  const displayUpcoming = isHeroPromoted ? upcomingTickets.slice(1) : upcomingTickets;

  // Circle state
  const walletPriority: WalletPriority = useMemo(() => deriveWalletPriority(!!primaryTicket, circle), [primaryTicket, circle]);
  const hasActiveCircle = !!circle && (circle.status === 'created' || circle.status === 'waiting' || circle.status === 'action_needed' || circle.status === 'complete');

  // Refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchTickets(), fetchEvents()]);
    setRefreshing(false);
  };

  const togglePastExpanded = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setPastExpanded(prev => !prev);
  };

  // Menu handlers
  const handleCalendar = () => {
    setMenuVisible(false);
    if (!primaryEvent) return;
    Alert.alert('Add to calendar', 'Choose your calendar service.', [
      { text: 'Apple Calendar',  onPress: () => addToCalendar(primaryEvent, 'apple') },
      { text: 'Google Calendar', onPress: () => addToCalendar(primaryEvent, 'google') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleDirections = async () => {
    setMenuVisible(false);
    if (!primaryEvent) return;
    await openDirections(`${primaryEvent.venue_name}, ${primaryEvent.venue_address}`);
  };

  const handleShowQr = () => { setMenuVisible(false); setQrVisible(true); };

  const handleTransfer = () => {
    setMenuVisible(false);
    if (!transferEnabled) {
      Alert.alert('Transfer unavailable', 'Tickets can only be transferred up to 30 minutes before the event starts.');
      return;
    }
    if (primaryTicket) router.push(`/transfer/${primaryTicket.id}`);
  };

  return (
    <View style={[st.container, { backgroundColor: c.bg }]}>
      <Animated.View style={headerAnimatedStyle} pointerEvents={headerVisible ? 'auto' : 'none'}>
        <ModeSwitchHeader title="Wallet" topInset={insets.top} showNotification />
      </Animated.View>

      <ScrollView
        style={st.scroll}
        contentContainerStyle={[st.scrollContent, { paddingBottom: 110 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
        onScroll={handleHeaderScroll}
        scrollEventThrottle={16}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.echoBlue} />}
      >
        {/* ── 1. Circle Priority Surface (Spec §7) ────────────────── */}
        {hasActiveCircle && circle && (
          <View style={st.circleSection}>
            <View style={st.circleLabelRow}>
              <View style={[st.circleDot, { backgroundColor: c.accent }]} />
              <Text style={[st.circleLabel, { color: c.textTertiary }]}>ACTIVE CIRCLE</Text>
            </View>
            <CircleWalletCard
              circle={circle}
              onPress={() => router.push(`/circle/${circle.id}`)}
            />
          </View>
        )}

        {/* ── 2. Hero Card: Active ticket, promoted upcoming, or discovery prompt ── */}
        {heroTicket && heroEvent ? (
          <ActiveTicketCard
            ticketId={heroTicket.id}
            eventTitle={heroEvent.title}
            eventDate={formatWalletDate(heroEvent.start_time)}
            eventTime={formatTime(heroEvent.start_time)}
            venue={heroEvent.venue_name}
            ageRestriction={heroEvent.age_restriction}
            isAgeVerified={isHeroPromoted ? false : isAgeVerified}
            imageUrl={heroEvent.image_url}
            statusLabel={heroStatus}
            summaryLabel={heroSummary}
            hasCircle={!isHeroPromoted && hasActiveCircle}
            energy={getSocialEnergy(heroEvent)}
            onCirclePress={() => circle && router.push(`/circle/${circle.id}`)}
            onMenuPress={isHeroPromoted ? undefined : () => setMenuVisible(true)}
          />
        ) : (
          <DiscoveryPrompt c={c} />
        )}

        {/* ── 3. Bookmarked Events ─────────────────────────────────── */}
        <SectionHeader title="Bookmarked Events" c={c} />
        {savedEvents.length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.bookmarkStrip}>
            {savedEvents.map(event => (
              <BookmarkedEventCard
                key={event.id}
                event={event}
                c={c}
                onPress={() => router.push(`/event/${event.id}`)}
                onRemove={() => toggleSaved(event.id)}
              />
            ))}
          </ScrollView>
        ) : (
          <EmptyState
            c={c}
            compact
            title="No bookmarked events"
            body="Save events from Home or Event Details. They’ll appear here until the event starts."
            icon="bookmark-outline"
          />
        )}

        {/* ── 4. Upcoming ──────────────────────────────────────────── */}
        {displayUpcoming.length > 0 && <SectionHeader title="Upcoming" c={c} />}
        {displayUpcoming.length ? (
          displayUpcoming.map(ticket => {
            const event = getEventById(ticket.event_id);
            if (!event) return null;
            return (
              <SmallTicketCard
                key={ticket.id}
                ticketId={ticket.id}
                eventTitle={event.title}
                eventDate={formatWalletDate(event.start_time)}
                eventTime={formatTime(event.start_time)}
                imageUrl={event.image_url}
                ageRestriction={event.age_restriction}
                rightText={`${ticket.quantity || 1} Ticket${(ticket.quantity || 1) > 1 ? 's' : ''}`}
                subLabel={`Unlocks at ${formatTime(event.start_time)}`}
                circleId={ticket.circle?.circle_id}
                circleClaimed={ticket.circle?.claimed_slots}
                circleTotal={ticket.circle?.total_slots}
              />
            );
          })
        ) : primaryTicket ? (
          /* Only show empty upcoming state when hero is an active ticket */
          <>
            <SectionHeader title="Upcoming" c={c} />
            <EmptyState c={c} compact title="No upcoming tickets" body="Future ticketed events will appear here." icon="time-outline" />
          </>
        ) : null}

        {/* ── Impact / Supported Causes ───────────────────────────── */}
        {impactRecords.length ? (
          <>
            <SectionHeader title="Impact" c={c} />
            {impactRecords.slice(0, 3).map((record) => {
              const event = getEventById(record.eventId);
              const campaign = event?.donation_campaign ? getCampaignTotals(event.donation_campaign) : null;
              return (
                <ImpactCampaignCard
                  key={record.id}
                  record={record}
                  campaign={campaign}
                  c={c}
                />
              );
            })}
          </>
        ) : null}

        {/* ── 5. Following Hosts ───────────────────────────────────── */}
        <SectionHeader title="Following Hosts" c={c} />
        {followingHosts.length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.hostStrip}>
            {followingHosts.map(host => (
              <HostAvatarChip
                key={host.id}
                name={host.name}
                avatarUrl={host.avatarUrl}
                isFollowing={host.isFollowing}
                c={c}
                onPress={() => router.push(`/host/${host.id}`)}
              />
            ))}
          </ScrollView>
        ) : (
          <EmptyState c={c} compact title="No followed hosts" body="Follow trusted hosts from event details to track their next ticketed events." icon="people-outline" />
        )}

        {/* ── 6. Past Events ───────────────────────────────────────── */}
        <TouchableOpacity activeOpacity={0.82} style={st.sectionHeaderRow} onPress={togglePastExpanded}>
          <Text style={[st.sectionTitle, { color: c.text }]}>Past Events</Text>
          <Ionicons name={pastExpanded ? 'chevron-up' : 'chevron-down'} size={18} color={c.textTertiary} />
        </TouchableOpacity>

        {pastExpanded ? (
          <View style={st.pastList}>
            {pastTickets.length ? (
              pastTickets.map(ticket => {
                const event = getEventById(ticket.event_id);
                if (!event) return null;
                return (
                  <SmallTicketCard
                    key={ticket.id}
                    ticketId={ticket.id}
                    eventTitle={event.title}
                    eventDate={formatDate(event.start_time)}
                    eventTime={formatTime(event.start_time)}
                    imageUrl={event.image_url}
                    ageRestriction={event.age_restriction}
                    rightText="Attended"
                  />
                );
              })
            ) : (
              <EmptyState c={c} compact title="No past events" body="Attended events will appear here after entry is complete." icon="archive-outline" />
            )}
          </View>
        ) : null}
      </ScrollView>

      {/* ── Sheets ─────────────────────────────────────────────────── */}
      <WalletTicketMenuSheet
        visible={menuVisible}
        transferEnabled={transferEnabled}
        hasCircle={!!hasActiveCircle}
        c={c}
        onClose={() => setMenuVisible(false)}
        onCalendar={handleCalendar}
        onDirections={handleDirections}
        onShowQr={handleShowQr}
        onTransfer={handleTransfer}
        onCircle={() => {
          setMenuVisible(false);
          if (circle) router.push(`/circle/${circle.id}`);
        }}
      />

      <WalletQrSheet visible={qrVisible} ticketId={primaryTicket?.id} c={c} onClose={() => setQrVisible(false)} />
    </View>
  );
}

// ─── Subcomponents ──────────────────────────────────────────────────────────

function SectionHeader({ title, c }: { title: string; c: DynamicPalette }) {
  return (
    <View style={st.sectionHeaderRow}>
      <Text style={[st.sectionTitle, { color: c.text }]}>{title}</Text>
    </View>
  );
}

function EmptyState({ title, body, icon, compact, c }: { title: string; body: string; icon: any; compact?: boolean; c: DynamicPalette }) {
  return (
    <View style={[st.empty, compact && st.emptyCompact, { borderColor: c.border, backgroundColor: c.surface2 }]}>
      <Ionicons name={icon} size={compact ? 26 : 40} color={c.textTertiary} />
      <Text style={[st.emptyTitle, { color: c.text }]}>{title}</Text>
      <Text style={[st.emptyBody, { color: c.textTertiary }]}>{body}</Text>
    </View>
  );
}

function DiscoveryPrompt({ c }: { c: DynamicPalette }) {
  return (
    <View style={[dp.card, { backgroundColor: c.bgCard, borderColor: c.border }]}>
      <View style={[dp.iconWrap, { backgroundColor: c.accentSoft }]}>
        <Ionicons name="sparkles-outline" size={28} color={c.accent} />
      </View>
      <Text style={[dp.title, { color: c.text }]}>Your next event is waiting</Text>
      <Text style={[dp.body, { color: c.textTertiary }]}>
        Browse events near you and secure your tickets. Once purchased, your active ticket will appear right here.
      </Text>
      <TouchableOpacity
        style={[dp.cta, { backgroundColor: c.accent }]}
        onPress={() => router.push('/(tabs)')}
        activeOpacity={0.88}
      >
        <Ionicons name="search-outline" size={18} color="#FFFFFF" />
        <Text style={dp.ctaText}>Discover Events</Text>
      </TouchableOpacity>
      <View style={dp.trustRow}>
        <Ionicons name="shield-checkmark-outline" size={14} color={c.textDisabled} />
        <Text style={[dp.trustText, { color: c.textDisabled }]}>NFC-verified · Wallet-first · Secure checkout</Text>
      </View>
    </View>
  );
}


const dp = StyleSheet.create({
  card: {
    marginHorizontal: 20, borderRadius: 24, padding: 28,
    borderWidth: 1, alignItems: 'center',
  },
  iconWrap: {
    width: 60, height: 60, borderRadius: 30,
    alignItems: 'center', justifyContent: 'center', marginBottom: 18,
  },
  title: { fontSize: 22, fontWeight: '700', textAlign: 'center', marginBottom: 10 },
  body: { fontSize: 15, lineHeight: 22, textAlign: 'center', marginBottom: 22, maxWidth: 280 },
  cta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    height: 52, borderRadius: 999, paddingHorizontal: 28, width: '100%',
  },
  ctaText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  trustRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 16 },
  trustText: { fontSize: 12 },
});


function ImpactCampaignCard({ record, campaign, c }: { record: DonationRecord; campaign: NonprofitDonationCampaign | null; c: DynamicPalette }) {
  const progress = campaign ? getCampaignProgressPercent(campaign) : 0;
  const raised = campaign ? campaign.raisedAmount : record.amount;
  const goal = campaign ? campaign.goalAmount : record.amount;
  const status = campaign?.status === 'goal_exceeded' ? 'Goal exceeded' : campaign?.status === 'goal_reached' ? 'Goal reached' : 'Active';
  return (
    <TouchableOpacity style={[impact.card, { backgroundColor: c.bgCard, borderColor: c.border }]} activeOpacity={0.86}>
      <View style={impact.topRow}>
        <View style={[impact.iconWrap, { backgroundColor: c.accentSoft }]}>
          <Ionicons name="heart-outline" size={19} color={c.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[impact.title, { color: c.text }]}>{campaign?.causeTitle || record.campaignId}</Text>
          <Text style={[impact.sub, { color: c.textTertiary }]}>{record.nonprofitName} · Verified Nonprofit</Text>
        </View>
        <View style={[impact.statusPill, { borderColor: c.border }]}><Text style={[impact.statusText, { color: c.accent }]}>{status}</Text></View>
      </View>
      <Text style={[impact.body, { color: c.textTertiary }]}>Your support: {formatDonationCurrency(record.amount)} · Receipt {record.receiptId}</Text>
      <View style={impact.progressRow}>
        <Text style={[impact.progressText, { color: c.text }]}>{formatDonationCurrency(raised)} raised</Text>
        <Text style={[impact.progressText, { color: c.textTertiary }]}>{progress}% of {formatDonationCurrency(goal)}</Text>
      </View>
      <View style={[impact.track, { backgroundColor: c.surface2 }]}><View style={[impact.fill, { width: `${Math.min(progress, 100)}%`, backgroundColor: c.accent }]} /></View>
      <View style={impact.actionsRow}>
        <Text style={[impact.actionText, { color: c.accent }]}>View Progress</Text>
        <Text style={[impact.actionText, { color: c.textTertiary }]}>View Receipt</Text>
        <Text style={[impact.actionText, { color: c.textTertiary }]}>Share</Text>
      </View>
    </TouchableOpacity>
  );
}


const impact = StyleSheet.create({
  card: { marginHorizontal: 20, marginBottom: 12, borderRadius: 24, padding: 18, borderWidth: 1 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 16, fontWeight: '800' },
  sub: { fontSize: 12, marginTop: 2 },
  statusPill: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999, borderWidth: 1 },
  statusText: { fontSize: 10.5, fontWeight: '900', textTransform: 'uppercase' },
  body: { fontSize: 12.5, lineHeight: 18, marginTop: 12 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  progressText: { fontSize: 12, fontWeight: '800' },
  track: { height: 6, borderRadius: 999, overflow: 'hidden', marginTop: 7 },
  fill: { height: '100%', borderRadius: 999 },
  actionsRow: { flexDirection: 'row', gap: 16, marginTop: 14 },
  actionText: { fontSize: 12, fontWeight: '800' },
});

function HostAvatarChip({ name, avatarUrl, isFollowing, c, onPress }: {
  name: string; avatarUrl?: string; isFollowing: boolean; c: DynamicPalette; onPress: () => void;
}) {
  return (
    <TouchableOpacity style={hc.item} onPress={onPress} activeOpacity={0.82}>
      <View style={hc.avatarWrap}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={[hc.avatar, { borderColor: c.border }]} />
        ) : (
          <View style={[hc.avatar, hc.avatarFallback, { backgroundColor: c.surface2, borderColor: c.border }]}>
            <Ionicons name="person-outline" size={22} color={c.textTertiary} />
          </View>
        )}
        {isFollowing && <View style={[hc.dot, { borderColor: c.bg }]} />}
      </View>
      <Text style={[hc.name, { color: c.textSecondary }]} numberOfLines={1}>{name}</Text>
    </TouchableOpacity>
  );
}

function WalletTicketMenuSheet({ visible, transferEnabled, hasCircle, c, onClose, onCalendar, onDirections, onShowQr, onTransfer, onCircle }: {
  visible: boolean; transferEnabled: boolean; hasCircle: boolean; c: DynamicPalette;
  onClose: () => void; onCalendar: () => void; onDirections: () => void; onShowQr: () => void; onTransfer: () => void; onCircle: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={ms.overlay} onPress={onClose}>
        <Pressable style={[ms.sheet, { backgroundColor: c.bgElevated, borderColor: c.border }]} onPress={() => {}}>
          <MenuTile icon="calendar-outline" label="Add to Calendar" c={c} onPress={onCalendar} />
          <MenuTile icon="navigate-outline" label="Directions" c={c} onPress={onDirections} />
          <MenuTile icon="qr-code-outline" label="Show Barcode" c={c} onPress={onShowQr} />
          <MenuTile icon="swap-horizontal-outline" label="Transfer Ticket" c={c} onPress={onTransfer} disabled={!transferEnabled} />
          {hasCircle && (
            <MenuTile icon="people-outline" label="Manage Circle" c={c} onPress={onCircle} />
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function MenuTile({ icon, label, c, onPress, disabled = false }: {
  icon: any; label: string; c: DynamicPalette; onPress: () => void; disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[ms.tile, { backgroundColor: c.surface2, borderColor: c.border }, disabled && ms.tileDisabled]}
      onPress={onPress} disabled={disabled} activeOpacity={0.82}
    >
      <Ionicons name={icon} size={18} color={disabled ? c.textDisabled : c.text} />
      <Text style={[ms.tileText, { color: disabled ? c.textDisabled : c.text }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={14} color={c.textMuted} style={{ marginLeft: 'auto' }} />
    </TouchableOpacity>
  );
}

function WalletQrSheet({ visible, ticketId, c, onClose }: { visible: boolean; ticketId: string | undefined; c: DynamicPalette; onClose: () => void; }) {
  // Server-minted rotating credential via the ticket port — never the local
  // placeholder qr_code the Phase 3 checkout wrote. Paused while closed.
  const { credential, error } = useCredentialRotation(visible ? ticketId : undefined);
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={qs.overlay} onPress={onClose}>
        <Pressable style={[qs.sheet, { backgroundColor: c.sheet, borderColor: c.border }]} onPress={() => {}}>
          <View style={[qs.handle, { backgroundColor: c.hairlineStrong }]} />
          <Text style={[qs.title, { color: c.text }]}>Barcode</Text>
          <View style={[qs.qrPlaceholder, { backgroundColor: c.surface2, borderColor: c.border }]}>
            <Ionicons name="qr-code-outline" size={96} color={credential ? c.text : c.textDisabled} />
            <Text style={[qs.qrNote, { color: credential ? c.textTertiary : c.textDisabled }]} numberOfLines={1}>
              {credential ? credential.qr_payload : error ?? 'Fetching entry credential…'}
            </Text>
          </View>
          <Text style={[qs.help, { color: c.textTertiary }]}>
            {credential
              ? 'Rotates automatically every ~30s · NFC remains primary whenever available'
              : 'System-generated fallback only · NFC remains primary whenever available'}
          </Text>
          <TouchableOpacity style={[qs.closeBtn, { backgroundColor: c.surface2, borderColor: c.border }]} onPress={onClose} activeOpacity={0.86}>
            <Text style={[qs.closeBtnText, { color: c.text }]}>Close</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function BookmarkedEventCard({ event, c, onPress, onRemove }: {
  event: any; c: DynamicPalette; onPress: () => void; onRemove: () => void;
}) {
  const price = getStartingPrice(event);
  const priceLabel = price === 0 ? 'Free' : formatPrice(price);

  return (
    <TouchableOpacity style={[be.card, { backgroundColor: c.bgCard, borderColor: c.border }]} onPress={onPress} activeOpacity={0.86}>
      <Image
        source={{ uri: event.image_url || `https://picsum.photos/seed/${event.id}/360/240` }}
        style={be.image}
      />
      <TouchableOpacity
        style={[be.removeBtn, { backgroundColor: c.bg, borderColor: c.border }]}
        onPress={onRemove}
        activeOpacity={0.78}
        accessibilityRole="button"
        accessibilityLabel="Remove bookmark"
      >
        <Ionicons name="bookmark" size={17} color={c.accent} />
      </TouchableOpacity>
      <View style={be.content}>
        <Text style={[be.title, { color: c.text }]} numberOfLines={1}>{event.title}</Text>
        <Text style={[be.meta, { color: c.textSecondary }]} numberOfLines={1}>{event.venue_name}</Text>
        <Text style={[be.meta, { color: c.textTertiary }]} numberOfLines={1}>{formatWalletDate(event.start_time)} · {formatTime(event.start_time)}</Text>
        <View style={be.bottomRow}>
          <Text style={[be.price, { color: c.accent }]}>{priceLabel}</Text>
          <Text style={[be.intent, { color: c.textTertiary }]}>Saved</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}


function formatWalletDate(startTime: string) {
  const date = new Date(startTime);
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const st = StyleSheet.create({
  container: { flex: 1 },
  header: { alignItems: 'center', justifyContent: 'center', paddingBottom: 10 },
  headerTitle: { fontSize: 22, fontWeight: '700' },
  scroll: { flex: 1 },
  scrollContent: { paddingTop: 8 },

  // Circle priority section
  circleSection: { marginHorizontal: 20, marginBottom: 12 },
  circleLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  circleDot: { width: 6, height: 6, borderRadius: 3 },
  circleLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1 },

  // Sections
  sectionHeaderRow: {
    marginTop: 26, marginBottom: 10, paddingHorizontal: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  sectionTitle: { fontSize: 16, fontWeight: '700' },

  bookmarkStrip: { paddingHorizontal: 20, paddingVertical: 4, paddingRight: 28 },
  hostStrip: { paddingHorizontal: 20, paddingVertical: 4 },
  pastList: { paddingBottom: 8 },

  empty: {
    marginHorizontal: 20, marginTop: 8, borderRadius: 22, borderWidth: 1,
    paddingHorizontal: 18, paddingVertical: 26, alignItems: 'center',
  },
  emptyCompact: { paddingVertical: 22 },
  emptyTitle: { marginTop: 10, fontSize: 15, fontWeight: '700' },
  emptyBody: { marginTop: 6, fontSize: 13, lineHeight: 18, textAlign: 'center' },
});

const hc = StyleSheet.create({
  item: { alignItems: 'center', marginRight: 18, width: 62 },
  avatarWrap: { position: 'relative', marginBottom: 7 },
  avatar: { width: 52, height: 52, borderRadius: 26, borderWidth: 1.5 },
  avatarFallback: { alignItems: 'center', justifyContent: 'center' },
  dot: { position: 'absolute', bottom: 1, right: 1, width: 12, height: 12, borderRadius: 6, backgroundColor: '#10B981', borderWidth: 2 },
  name: { fontSize: 11, fontWeight: '600', textAlign: 'center', maxWidth: 62 },
});


const be = StyleSheet.create({
  card: {
    width: 210,
    borderRadius: 22,
    borderWidth: 1,
    overflow: 'hidden',
    marginRight: 14,
  },
  image: {
    width: '100%',
    height: 118,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  removeBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 13,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  meta: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  bottomRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  price: {
    fontSize: 13,
    fontWeight: '900',
  },
  intent: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
});

const ms = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.40)', justifyContent: 'flex-start', alignItems: 'flex-end' },
  sheet: { marginRight: 20, marginTop: 170, width: 228, borderRadius: 20, padding: 12, borderWidth: 1 },
  tile: { minHeight: 52, borderRadius: 14, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, marginBottom: 8 },
  tileDisabled: { opacity: 0.42 },
  tileText: { fontSize: 15, fontWeight: '500' },
});

const qs = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.54)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 28, borderTopWidth: 1, alignItems: 'center' },
  handle: { width: 54, height: 5, borderRadius: 999, marginBottom: 18 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 18 },
  qrPlaceholder: { width: 220, height: 220, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  qrNote: { fontSize: 12 },
  help: { fontSize: 12, textAlign: 'center', marginTop: 16, marginBottom: 20, lineHeight: 18 },
  closeBtn: { height: 48, minWidth: 144, paddingHorizontal: 18, borderRadius: 999, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  closeBtnText: { fontSize: 15, fontWeight: '600' },
});
