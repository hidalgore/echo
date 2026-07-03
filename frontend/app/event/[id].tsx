import { useEffect, useMemo, useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Dimensions, Platform, Share, Linking, ViewStyle, TextStyle } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, radii, spacing } from '../../theme/tokens';
import { Text, Glass } from '../../components/ui';
import { useEventStore } from '../../stores/eventStore';
import { useTicketStore } from '../../stores/ticketStore';
import { useVerificationStore } from '../../stores/verificationStore';
import { useHostStore, getHostIdFromName } from '../../stores/hostStore';
import { AgeGateSheet } from '../../components/verification/AgeGateSheet';
import { EchoMark } from '../../components/shared/EchoMark';
import { EchoDonateGlyph } from '../../components/icons/EchoDonateGlyph';
import { EnergyCard } from '../../components/social';
import { EventHeroMedia } from '../../components/event';
import { getSocialEnergy } from '../../services/socialEnergyService';
import { formatDate, formatTime, formatPrice } from '../../utils/format';
import { getAgeLabel, getStartingPrice, isHappeningNow } from '../../utils/event';
import { routeToCheckout } from '../../utils/checkoutRouting';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenBackButton } from '../../components/shared/ScreenBackButton';
import { WebEventDetailPage } from '../../components/web/WebEventDetailPage';
const { width: SCREEN_WIDTH } = Dimensions.get('window');
type DetailTab = 'details' | 'tickets';
type TicketQuantities = Record<string, number>;

export default function EventDetailScreen() {
  const insets = useSafeAreaInsets();
  const safeHeaderHeight = insets.top + 64;
  const { id } = useLocalSearchParams();
  const eventId = id as string;
  const { getEventById, isSaved, toggleSaved, canSaveEvent } = useEventStore();
  const { hasPurchasedEvent } = useTicketStore();
  const { requiresVerification } = useVerificationStore();
  const { getHostById, toggleFollow, initializeHosts } = useHostStore();
  const event = getEventById(eventId);

  // v59: Web-only event detail variant. Native flow below is untouched.
  if (Platform.OS === 'web') {
    if (event) {
      return <WebEventDetailPage event={event} />;
    }
    return null;
  }
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [activeTab, setActiveTab] = useState<DetailTab>('details');
  const [ticketQuantities, setTicketQuantities] = useState<TicketQuantities>({});
  const [showAgeGate, setShowAgeGate] = useState(false);

  useEffect(() => { initializeHosts(); }, [initializeHosts]);

  const hostId = getHostIdFromName(event?.host_name);
  const host = getHostById(hostId);

  // Derive Social Energy (respects host override per spec)
  const socialEnergy = useMemo(() => event ? getSocialEnergy(event) : null, [event]);

  const selectedTickets = useMemo(() => {
    if (!event) return [];
    return event.ticket_types
      .map((ticket) => ({ ...ticket, quantity: ticketQuantities[ticket.id] || 0 }))
      .filter((ticket) => ticket.quantity > 0);
  }, [event, ticketQuantities]);

  const totalSelected = selectedTickets.reduce((sum, ticket) => sum + ticket.quantity, 0);
  const subtotal = selectedTickets.reduce((sum, ticket) => sum + ticket.price * ticket.quantity, 0);
  const firstSelected = selectedTickets[0];

  if (!event) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text variant="title">Event not found</Text>
          <TouchableOpacity style={styles.backLink} onPress={() => router.back()}>
            <Text color="accent">Go back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const eventUrl = `https://getechoaccess.com/events/${event.id}`;
  const ageLabel = getAgeLabel(event.age_restriction);
  const purchased = hasPurchasedEvent(event.id);
  const saveEnabled = canSaveEvent(event.id);
  const saved = isSaved(event.id);
  const priceLabel = getStartingPrice(event) === 0 ? 'Free' : formatPrice(getStartingPrice(event));
  const locationLabel = event.venue_address.split(',').slice(-2).join(',').trim();
  const eventDetailMediaUri = event.detail_media_url || event.image_url || `https://picsum.photos/seed/${event.id}/800/500`;
  const eventDetailMediaType = event.detail_media_type === 'video' ? 'video' : 'image';
  const eventDetailPosterUri = event.detail_media_poster_url || event.image_url;

  const openDirections = () => {
    const address = encodeURIComponent(event.venue_address);
    if (Platform.OS === 'ios') Linking.openURL(`maps://maps.apple.com/?daddr=${address}`);
    else Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${address}`);
  };

  const handleShare = async () => {
    await Share.share({
      message: `Check out ${event.title} on ECHO. ${formatDate(event.start_time)} at ${event.venue_name}. ${eventUrl}`,
      url: eventUrl,
      title: event.title,
    });
  };

  const updateTicketQuantity = (ticketId: string, delta: number, max: number) => {
    setTicketQuantities((prev) => {
      const next = Math.max(0, Math.min(max, (prev[ticketId] || 0) + delta));
      return { ...prev, [ticketId]: next };
    });
  };

  const handlePrimaryAction = () => {
    if (purchased) {
      router.push('/(tabs)/wallet');
      return;
    }
    if (activeTab === 'details') {
      setActiveTab('tickets');
      return;
    }
    if (!firstSelected || totalSelected < 1) return;
    const ageReq = event.age_restriction as 0 | 18 | 21;
    if (ageReq > 0 && requiresVerification(ageReq)) {
      setShowAgeGate(true);
      return;
    }
    routeToCheckout({
      eventId: event.id,
      ticketTypeId: firstSelected.id,
      quantity: totalSelected,
      selectedTickets: selectedTickets.map((ticket) => ({
        id: ticket.id,
        name: ticket.name,
        price: ticket.price,
        quantity: ticket.quantity,
      })),
    });
  };

  const footerLabel = purchased
    ? 'Already purchased'
    : activeTab === 'details'
      ? 'Starting at'
      : totalSelected > 0
        ? `${totalSelected} selected`
        : 'Select tickets';

  const footerValue = purchased
    ? 'In Wallet'
    : activeTab === 'details'
      ? priceLabel
      : totalSelected > 0
        ? (subtotal === 0 ? 'Free' : formatPrice(subtotal))
        : priceLabel;

  const ctaCopy = purchased
    ? 'Open Wallet'
    : activeTab === 'details'
      ? 'Choose Tickets'
      : totalSelected >= 2
        ? 'Continue'
        : 'Get Ticket';

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingTop: safeHeaderHeight }]}
        showsVerticalScrollIndicator={false}
        bounces={false}
        stickyHeaderIndices={[3]}
      >
        <View style={[styles.headerShell, { height: safeHeaderHeight, paddingTop: insets.top + 8 }]}>
          <ScreenBackButton variant="floating" />
          <Text variant="meta" style={styles.headerTitle}>Event Details</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconButton} onPress={() => toggleSaved(event.id)} disabled={!saveEnabled && !saved}>
              <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={22} color={saved ? colors.accent2 : colors.text} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={handleShare}>
              <Ionicons name="share-outline" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        <LinearGradient colors={[...gradients.echo]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroGlow}>
          <View style={styles.ticketHeroCard}>
            <View style={styles.ticketMetaRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.ticketMetaLabel} numberOfLines={1}>{event.venue_name}</Text>
                <Text style={styles.ticketMetaSub} numberOfLines={1}>{locationLabel}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.ticketMetaLabel}>{formatDate(event.start_time)}</Text>
                <Text style={styles.ticketMetaSub}>{formatTime(event.start_time)}</Text>
              </View>
            </View>
            <EventHeroMedia
              uri={eventDetailMediaUri}
              type={eventDetailMediaType}
              posterUri={eventDetailPosterUri}
              style={styles.heroImage}
              fallbackSeed={event.id}
            />
            <LinearGradient colors={['rgba(15,17,21,0)', 'rgba(15,17,21,0.72)']} style={styles.imageFade} />
            <View style={styles.heroBottomMeta}>
              <Text style={styles.categoryText}>{event.category || 'EVENT'}</Text>
              <Text variant="display" style={styles.title}>{event.title}</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.badgesContainer}>
          <View style={styles.badgesRow}>
            {isHappeningNow(event) && <Badge label="Happening now" tone="blue" />}
            {!!ageLabel && <Badge label={ageLabel} tone="amber" />}
            {event.host_verified && <Badge label="Verified host" tone="purple" />}
          </View>
        </View>

        <View style={styles.stickyTabsShell}>
          <View style={styles.tabsRow}>
            <TabButton label="Details" active={activeTab === 'details'} onPress={() => setActiveTab('details')} />
            <TabButton label="Tickets" active={activeTab === 'tickets'} onPress={() => setActiveTab('tickets')} count={totalSelected} />
          </View>
        </View>

        <View style={styles.content}>
          {activeTab === 'details' ? (
            <>
              <View style={styles.priceRow}>
                <Text variant="caption" color="textMuted">Starting at</Text>
                <Text variant="title">{priceLabel}</Text>
              </View>

              <View style={styles.section}>
                <Text variant="eventTitle" style={styles.sectionTitle}>ABOUT EVENT</Text>
                <Text variant="meta" color="textMedium" style={styles.description} numberOfLines={showFullDescription ? undefined : 4}>{event.description}</Text>
                <TouchableOpacity onPress={() => setShowFullDescription((prev) => !prev)} style={styles.readMoreBtn}>
                  <Text variant="meta" style={{ fontWeight: '600' }}>{showFullDescription ? 'Show less' : 'Read more'}</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.venueMapSection}>
                <View style={styles.venueMapHeader}>
                  <View style={styles.venueMapTitleRow}>
                    <Ionicons name="location-outline" size={18} color={colors.textMedium} />
                    <Text variant="eventTitle" style={styles.venueMapTitle}>Venue Map</Text>
                  </View>
                  <Text variant="caption" color="textMuted">Neighborhood View</Text>
                </View>
                <TouchableOpacity style={styles.neighborhoodMapCard} onPress={openDirections} activeOpacity={0.86}>
                  <View style={styles.mapCanvasLight}>
                    {/* Water bodies — pushed to corners */}
                    <View style={[styles.mapWater, { left: -36, bottom: -48 }]} />
                    <View style={[styles.mapWater, { right: -52, top: -44, opacity: 0.42 }]} />
                    <View style={[styles.mapWater, { left: -22, top: 132, opacity: 0.32 }]} />
                    {/* Parks distributed across now-larger area */}
                    <View style={[styles.mapPark, { right: 28, top: 12 }]} />
                    <View style={[styles.mapPark, { left: 64, bottom: 36 }]} />
                    <View style={[styles.mapParkSmall, { left: 14, top: 22 }]} />
                    <View style={[styles.mapParkSmall, { left: 94, top: 24 }]} />
                    <View style={[styles.mapParkSmall, { left: 152, top: 88 }]} />
                    <View style={[styles.mapParkSmall, { right: 24, top: 134 }]} />
                    {/* Row 1 — top edge */}
                    <View style={[styles.mapBlock, { left: 8, top: 8, width: 30, height: 16 }]} />
                    <View style={[styles.mapBlock, { left: 44, top: 8, width: 34, height: 16 }]} />
                    <View style={[styles.mapBlock, { left: 84, top: 8, width: 36, height: 16 }]} />
                    <View style={[styles.mapBlock, { left: 126, top: 8, width: 32, height: 16 }]} />
                    <View style={[styles.mapBlock, { left: 164, top: 8, width: 30, height: 16 }]} />
                    <View style={[styles.mapBlock, { right: 36, top: 8, width: 30, height: 16 }]} />
                    <View style={[styles.mapBlock, { right: 8, top: 8, width: 22, height: 16 }]} />
                    {/* Row 2 */}
                    <View style={[styles.mapBlock, { left: 8, top: 32, width: 34, height: 18 }]} />
                    <View style={[styles.mapBlock, { left: 48, top: 32, width: 40, height: 18 }]} />
                    <View style={[styles.mapBlock, { left: 94, top: 32, width: 32, height: 18 }]} />
                    <View style={[styles.mapBlock, { left: 132, top: 32, width: 34, height: 18 }]} />
                    <View style={[styles.mapBlock, { right: 56, top: 32, width: 28, height: 18 }]} />
                    <View style={[styles.mapBlock, { right: 22, top: 32, width: 26, height: 18 }]} />
                    {/* Row 3 — middle area (where pin sits) */}
                    <View style={[styles.mapBlock, { left: 8, top: 58, width: 28, height: 16 }]} />
                    <View style={[styles.mapBlock, { left: 42, top: 58, width: 38, height: 16 }]} />
                    <View style={[styles.mapBlock, { right: 90, top: 58, width: 30, height: 16 }]} />
                    <View style={[styles.mapBlock, { right: 54, top: 58, width: 32, height: 16 }]} />
                    <View style={[styles.mapBlock, { right: 8, top: 58, width: 40, height: 16 }]} />
                    {/* Row 4 */}
                    <View style={[styles.mapBlock, { left: 8, top: 82, width: 32, height: 18 }]} />
                    <View style={[styles.mapBlock, { left: 46, top: 82, width: 36, height: 18 }]} />
                    <View style={[styles.mapBlock, { left: 88, top: 82, width: 34, height: 18 }]} />
                    <View style={[styles.mapBlock, { right: 80, top: 82, width: 32, height: 18 }]} />
                    <View style={[styles.mapBlock, { right: 42, top: 82, width: 34, height: 18 }]} />
                    <View style={[styles.mapBlock, { right: 8, top: 82, width: 28, height: 18 }]} />
                    {/* Row 5 */}
                    <View style={[styles.mapBlock, { left: 8, top: 108, width: 38, height: 18 }]} />
                    <View style={[styles.mapBlock, { left: 52, top: 108, width: 40, height: 18 }]} />
                    <View style={[styles.mapBlock, { left: 98, top: 108, width: 32, height: 18 }]} />
                    <View style={[styles.mapBlock, { right: 70, top: 108, width: 34, height: 18 }]} />
                    <View style={[styles.mapBlock, { right: 30, top: 108, width: 34, height: 18 }]} />
                    {/* Row 6 — bottom */}
                    <View style={[styles.mapBlock, { left: 8, top: 134, width: 30, height: 18 }]} />
                    <View style={[styles.mapBlock, { left: 44, top: 134, width: 36, height: 18 }]} />
                    <View style={[styles.mapBlock, { left: 86, top: 134, width: 38, height: 18 }]} />
                    <View style={[styles.mapBlock, { left: 130, top: 134, width: 34, height: 18 }]} />
                    <View style={[styles.mapBlock, { right: 56, top: 134, width: 30, height: 18 }]} />
                    <View style={[styles.mapBlock, { right: 18, top: 134, width: 32, height: 18 }]} />
                    {/* Row 7 — far bottom (newly visible at zoom-out) */}
                    <View style={[styles.mapBlock, { left: 14, top: 162, width: 28, height: 16 }]} />
                    <View style={[styles.mapBlock, { left: 48, top: 162, width: 32, height: 16 }]} />
                    <View style={[styles.mapBlock, { left: 86, top: 162, width: 34, height: 16 }]} />
                    <View style={[styles.mapBlock, { right: 88, top: 162, width: 30, height: 16 }]} />
                    <View style={[styles.mapBlock, { right: 50, top: 162, width: 34, height: 16 }]} />
                    {/* Major angled roads */}
                    <View style={[styles.mapMajorRoad, { top: 38, transform: [{ rotate: '-6deg' }] }]} />
                    <View style={[styles.mapMajorRoad, { top: 92, transform: [{ rotate: '4deg' }], opacity: 0.72 }]} />
                    <View style={[styles.mapMajorRoad, { top: 158, transform: [{ rotate: '-3deg' }], opacity: 0.58 }]} />
                    {/* Horizontal grid roads — denser at zoom-out */}
                    <View style={[styles.mapRoad, { top: 26 }]} />
                    <View style={[styles.mapRoad, { top: 52 }]} />
                    <View style={[styles.mapRoad, { top: 78 }]} />
                    <View style={[styles.mapRoad, { top: 102 }]} />
                    <View style={[styles.mapRoad, { top: 128 }]} />
                    <View style={[styles.mapRoad, { top: 156 }]} />
                    <View style={[styles.mapRoad, { top: 184 }]} />
                    {/* Vertical grid roads */}
                    <View style={[styles.mapRoadVertical, { left: 40 }]} />
                    <View style={[styles.mapRoadVertical, { left: 84 }]} />
                    <View style={[styles.mapRoadVertical, { left: 128 }]} />
                    <View style={[styles.mapRoadVertical, { right: 124 }]} />
                    <View style={[styles.mapRoadVertical, { right: 80 }]} />
                    <View style={[styles.mapRoadVertical, { right: 36 }]} />
                    {/* Area labels — repositioned for zoomed-out view */}
                    <Text style={[styles.mapAreaLabel, { left: 14, top: 14 }]}>DOWNTOWN</Text>
                    <Text style={[styles.mapAreaLabel, { right: 14, top: 50 }]}>VENUE DISTRICT</Text>
                    <Text style={[styles.mapAreaLabel, { left: 14, bottom: 18 }]}>WATERFRONT</Text>
                    <Text style={[styles.mapAreaLabel, { right: 18, bottom: 14 }]}>SOUTH SIDE</Text>
                    <Text style={[styles.mapAreaLabel, { left: 92, top: 96 }]}>OLD TOWN</Text>
                    <Text style={[styles.mapStreetLabel, { left: 52, top: 40 }]}>Pioneer Ave</Text>
                    <Text style={[styles.mapStreetLabel, { right: 18, top: 138 }]}>Central Way</Text>
                    <Text style={[styles.mapStreetLabel, { left: 60, top: 154 }]}>Harbor Blvd</Text>
                    <View style={styles.echoMapPin}>
                      <View style={styles.echoMapPinShadow} />
                      <LinearGradient colors={[...gradients.echo]} style={styles.echoMapPinHead}>
                        <View style={styles.echoMapPinInner}>
                          <EchoMark size={16} />
                        </View>
                      </LinearGradient>
                      <LinearGradient colors={[colors.accent2, colors.warning]} style={styles.echoMapPinPoint} />
                    </View>
                  </View>
                </TouchableOpacity>
                <View style={styles.venueFooterBlock}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.venueFooterTitle} numberOfLines={1}>{event.venue_name}</Text>
                    <Text style={styles.venueFooterAddress} numberOfLines={1}>{event.venue_address}</Text>
                  </View>
                  <TouchableOpacity style={styles.directionsPill} onPress={openDirections}>
                    <Ionicons name="navigate-outline" size={14} color={colors.echoBlueAccessible} />
                    <Text style={styles.directionsPillText}>Directions</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <Glass style={styles.organizerCard}>
                <View style={styles.organizerHeader}>
                  <TouchableOpacity activeOpacity={0.86} onPress={() => router.push(`/host/${hostId}`)} style={{ flex: 1 }}>
                    <Text variant="caption" color="textMuted">Hosted by</Text>
                    <Text variant="eventTitle" style={{ marginTop: 2 }}>{event.host_name || 'Verified Host'}</Text>
                    {host ? <Text variant="caption" color="textMuted" style={{ marginTop: 8 }}>{host.rating.toFixed(1)} • {host.isTrusted ? 'Trusted Host' : 'Host'} • {host.attendeeCount} attendees</Text> : null}
                  </TouchableOpacity>
                  {host ? (
                    <TouchableOpacity style={styles.followHostBtn} onPress={() => toggleFollow(host.id)}>
                      <Text variant="caption" style={{ fontWeight: '700' }}>{host.isFollowing ? 'Following' : 'Follow'}</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
                <Text variant="caption" color="textMuted" style={{ marginTop: 12 }}>Verified host details, wallet-first access, and ECHO trust checks are shown before checkout.</Text>

              </Glass>

              {event.donation_campaign ? (
                <TouchableOpacity
                  style={styles.donationIndicator}
                  onPress={() => setActiveTab('tickets')}
                  activeOpacity={0.86}
                >
                  <View style={styles.donationIndicatorIcon}>
                    <EchoDonateGlyph size={20} active />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text variant="meta" style={{ fontWeight: '700' }}>Supports {event.donation_campaign.nonprofitName}</Text>
                    <Text variant="caption" color="textMuted" style={{ marginTop: 2 }}>{event.donation_campaign.causeTitle} · Optional donation at checkout</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              ) : null}

              <Glass style={styles.trustCard}>
                <Ionicons name="shield-checkmark-outline" size={18} color={colors.echoBlueAccessible} />
                <View style={{ flex: 1 }}>
                  <Text variant="meta" style={{ fontWeight: '700' }}>Wallet-first secure entry</Text>
                  <Text variant="caption" color="textMuted" style={{ marginTop: 4 }}>NFC is primary. QR appears only as a fallback when needed.</Text>
                </View>
              </Glass>

              {socialEnergy ? <EnergyCard energy={socialEnergy} style={{ marginTop: 14 }} /> : null}
            </>
          ) : (
            <View style={styles.section}>
              <View style={styles.ticketSectionHeader}>
                <View>
                  <Text variant="eventTitle" style={styles.sectionTitle}>Select tickets</Text>
                  <Text variant="caption" color="textMuted">Mix ticket tiers, then choose ECHO Circle or pay for all.</Text>
                </View>
                {totalSelected > 0 ? <Text variant="caption" style={styles.selectedPill}>{totalSelected} selected</Text> : null}
              </View>
              {event.ticket_types.map((ticket) => {
                const qty = ticketQuantities[ticket.id] || 0;
                const max = Math.min(ticket.available || 0, 10);
                const soldOut = max <= 0;
                return (
                  <View key={ticket.id} style={[styles.ticketOption, qty > 0 && styles.ticketOptionSelected, soldOut && styles.ticketOptionDisabled]}>
                    <View style={{ flex: 1 }}>
                      <View style={styles.ticketTitleRow}>
                        <Text variant="meta" style={{ fontWeight: '800' }}>{ticket.name}</Text>
                        <Ionicons name="information-circle-outline" size={15} color={colors.textMuted} />
                      </View>
                      <Text variant="caption" color="textMuted" style={{ marginTop: 4 }}>{soldOut ? 'Sold out' : `${ticket.available} remaining`}</Text>
                      <Text variant="title" style={{ marginTop: 8 }}>{ticket.price === 0 ? 'Free' : formatPrice(ticket.price)}</Text>
                    </View>
                    <View style={styles.stepperWrap}>
                      <TouchableOpacity style={[styles.stepBtn, qty <= 0 && styles.stepBtnDisabled]} disabled={qty <= 0} onPress={() => updateTicketQuantity(ticket.id, -1, max)}>
                        <Ionicons name="remove" size={18} color={qty <= 0 ? colors.textDisabled : colors.text} />
                      </TouchableOpacity>
                      <Text style={styles.stepQty}>{qty}</Text>
                      <TouchableOpacity style={[styles.stepBtn, (soldOut || qty >= max) && styles.stepBtnDisabled]} disabled={soldOut || qty >= max} onPress={() => updateTicketQuantity(ticket.id, 1, max)}>
                        <Ionicons name="add" size={18} color={soldOut || qty >= max ? colors.textDisabled : colors.text} />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
              {totalSelected >= 2 ? (
                <Glass style={styles.circleHint}>
                  <Ionicons name="people-outline" size={18} color={colors.accent2} />
                  <Text variant="caption" color="textMedium" style={{ flex: 1 }}>Next step: choose Start ECHO Circle or Pay for All. Organizer pays for one ticket now when Circle is selected.</Text>
                </Glass>
              ) : null}
            </View>
          )}
          <View style={{ height: 120 }} />
        </View>
      </ScrollView>

      <View style={styles.footerBar}>
        <View>
          <Text variant="caption" color="textMuted">{footerLabel}</Text>
          <Text variant="title">{footerValue}</Text>
        </View>
        <TouchableOpacity style={[styles.primaryButton, purchased && styles.primaryButtonWallet, activeTab === 'tickets' && totalSelected < 1 && !purchased && styles.primaryButtonDisabled]} onPress={handlePrimaryAction} disabled={activeTab === 'tickets' && totalSelected < 1 && !purchased}>
          <Text variant="meta" style={{ fontWeight: '800' }}>{ctaCopy}</Text>
        </TouchableOpacity>
      </View>

      <AgeGateSheet
        visible={showAgeGate}
        onClose={() => setShowAgeGate(false)}
        eventTitle={event.title}
        ageRequirement={(event.age_restriction || 21) as 18 | 21}
        eventId={event.id}
        checkoutReturnParams={{
          qty: String(totalSelected),
          quantity: String(totalSelected),
          ticketTypeId: firstSelected?.id,
          selections: JSON.stringify(selectedTickets.map((ticket) => ({ id: ticket.id, name: ticket.name, price: ticket.price, quantity: ticket.quantity }))),
        }}
      />
    </View>
  );
}

function Badge({ label, tone }: { label: string; tone: 'blue' | 'amber' | 'purple' }) {
  const map = { blue: { bg: colors.echoBlueSoft, text: colors.echoBlueAccessible }, amber: { bg: colors.warningSoft, text: colors.warning }, purple: { bg: colors.accentSoft, text: colors.accent2 } }[tone];
  return <View style={[styles.badge, { backgroundColor: map.bg }]}><Text variant="caption" style={{ color: map.text, fontWeight: '800' }}>{label}</Text></View>;
}

function TabButton({ label, active, onPress, count }: { label: string; active: boolean; onPress: () => void; count?: number }) {
  const content = (
    <Text variant="caption" style={[styles.tabText, active && styles.tabTextActive]}>
      {label}{count ? ` (${count})` : ''}
    </Text>
  );

  if (!active) {
    return (
      <TouchableOpacity onPress={onPress} style={styles.tabButton} activeOpacity={0.75}>
        {content}
      </TouchableOpacity>
    );
  }

  // Active tab: ECHO gradient edge (cyan → purple → pink)
  return (
    <TouchableOpacity onPress={onPress} style={styles.tabButtonActiveWrap} activeOpacity={0.85}>
      <LinearGradient
        colors={[...gradients.echo]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.tabGradientBorder}
      >
        <View style={styles.tabButtonActiveInner}>
          {content}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  scrollContent: { paddingTop: 64 },
  headerShell: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, minHeight: 64, paddingHorizontal: 24, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(15,17,21,0.92)' },
  headerTitle: { position: 'absolute', left: 74, right: 74, textAlign: 'center', fontWeight: '800', color: colors.text, fontSize: 20 },
  headerActions: { flexDirection: 'row', gap: 8 },
  iconButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.055)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  heroGlow: { marginHorizontal: 16, marginTop: 14, padding: 1, borderRadius: 30, opacity: 0.96, shadowColor: '#20C7FF', shadowOpacity: 0.18, shadowRadius: 18, shadowOffset: { width: 0, height: 0 } },
  ticketHeroCard: { borderRadius: 29, overflow: 'hidden', backgroundColor: '#121822', padding: 16, minHeight: 430 },
  ticketMetaRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 16, marginBottom: 14 },
  ticketMetaLabel: { fontSize: 14, lineHeight: 18, fontWeight: '700', color: colors.textHigh },
  ticketMetaSub: { marginTop: 2, fontSize: 12, lineHeight: 16, fontWeight: '500', color: colors.textMuted },
  heroImage: { width: '100%', height: Math.min(SCREEN_WIDTH * 0.92, 330), borderRadius: 24, backgroundColor: colors.surface },
  imageFade: { position: 'absolute', left: 16, right: 16, bottom: 16, height: 168, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  heroBottomMeta: { position: 'absolute', left: 30, right: 30, bottom: 42, alignItems: 'flex-start', paddingBottom: 2 },
  categoryText: { fontSize: 11, fontWeight: '800', letterSpacing: 4.2, color: colors.textMedium, textTransform: 'uppercase', marginBottom: 8 },
  badgesContainer: { paddingHorizontal: spacing.screenPaddingX, paddingTop: 18 },
  content: { paddingHorizontal: spacing.screenPaddingX, paddingTop: 0 },
  badgesRow: { flexDirection: 'row', gap: 8, marginBottom: 14, flexWrap: 'wrap' },
  badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: radii.pill },
  title: { color: colors.text, textAlign: 'left', alignSelf: 'stretch', lineHeight: 48, paddingBottom: 3 },
  stickyTabsShell: { paddingHorizontal: spacing.screenPaddingX, paddingTop: 8, paddingBottom: 10, backgroundColor: 'rgba(15,17,21,0.98)', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)', zIndex: 20 },
  tabsRow: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: colors.hairline, borderRadius: radii.pill, padding: 4 },
  tabButton: { flex: 1, height: 40, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center' },
  tabButtonActiveWrap: { flex: 1, height: 40, borderRadius: radii.pill },
  tabGradientBorder: { flex: 1, borderRadius: radii.pill, padding: 1.5 },
  tabButtonActiveInner: { flex: 1, borderRadius: radii.pill - 1.5, backgroundColor: '#15171C', alignItems: 'center', justifyContent: 'center' },
  tabText: { fontWeight: '800', color: colors.textMuted },
  tabTextActive: { color: colors.text },
  priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.hairline },
  section: { marginTop: 22 },
  sectionTitle: { marginBottom: 10, letterSpacing: 3.2, textTransform: 'uppercase', color: colors.textMedium },
  description: { lineHeight: 22 },
  readMoreBtn: { alignSelf: 'flex-start', marginTop: 10 },
  organizerCard: { marginTop: 18, padding: 16, backgroundColor: colors.bgCard },
  organizerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  followHostBtn: { borderWidth: 1, borderColor: colors.hairline, borderRadius: radii.pill, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: 'rgba(255,255,255,0.04)' },
  mapCard: { marginTop: 14, height: 160, borderRadius: 16, overflow: 'hidden', backgroundColor: '#0C1018', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', position: 'relative' },
  mapGrid: { ...StyleSheet.absoluteFillObject },
  mapRoadH: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.07)' } as ViewStyle,
  mapRoadV: { position: 'absolute', top: 0, bottom: 0, width: 1, backgroundColor: 'rgba(255,255,255,0.07)' } as ViewStyle,
  mapPinWrap: { position: 'absolute', top: '38%', left: '47%', alignItems: 'center' } as ViewStyle,
  mapPinRing: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(123,77,255,0.15)', borderWidth: 1, borderColor: 'rgba(123,77,255,0.30)' },
  mapPinPulse: { width: 48, height: 48, borderRadius: 24, position: 'absolute', top: -8, left: -8, backgroundColor: 'rgba(123,77,255,0.06)', borderWidth: 1, borderColor: 'rgba(123,77,255,0.08)' },
  mapBottom: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 10, backgroundColor: 'rgba(12,16,24,0.92)', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' },
  mapTextWrap: { flex: 1, marginRight: 12 },
  mapVenue: { fontSize: 13, fontWeight: '700', color: '#F5F7FB' },
  mapAddress: { fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 },
  mapDirectionsBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: 'rgba(123,77,255,0.12)', borderWidth: 1, borderColor: 'rgba(123,77,255,0.20)' },
  mapDirectionsText: { fontSize: 12, fontWeight: '700', color: colors.accent2 },
  venueMapSection: { marginTop: 26 },
  venueMapHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  venueMapTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  venueMapTitle: { marginBottom: 0, color: colors.textHigh },
  neighborhoodMapCard: { height: 214, borderRadius: 22, overflow: 'hidden', backgroundColor: '#EEF2F7', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  mapCanvasLight: { flex: 1, position: 'relative', overflow: 'hidden', backgroundColor: '#EFF3F8' },
  mapBlock: { position: 'absolute', borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.48)', borderWidth: 1, borderColor: 'rgba(180,190,204,0.25)' } as ViewStyle,
  mapWater: { position: 'absolute', width: 56, height: 72, borderRadius: 28, backgroundColor: 'rgba(82,178,230,0.20)' } as ViewStyle,
  mapPark: { position: 'absolute', width: 40, height: 24, borderRadius: 8, backgroundColor: 'rgba(116,178,125,0.24)' } as ViewStyle,
  mapParkSmall: { position: 'absolute', width: 32, height: 18, borderRadius: 6, backgroundColor: 'rgba(116,178,125,0.18)' } as ViewStyle,
  mapRoad: { position: 'absolute', left: -8, right: -8, height: 4, backgroundColor: 'rgba(255,255,255,0.88)', borderTopWidth: 1, borderBottomWidth: 1, borderColor: 'rgba(174,184,196,0.35)' } as ViewStyle,
  mapMajorRoad: { position: 'absolute', left: -32, right: -32, height: 7, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderBottomWidth: 1, borderColor: 'rgba(142,153,168,0.44)' } as ViewStyle,
  mapRoadVertical: { position: 'absolute', top: -12, bottom: -12, width: 4, backgroundColor: 'rgba(255,255,255,0.88)', borderLeftWidth: 1, borderRightWidth: 1, borderColor: 'rgba(174,184,196,0.35)' } as ViewStyle,
  mapAreaLabel: { position: 'absolute', color: '#5F6B7A', fontSize: 8, fontWeight: '800', letterSpacing: 0.8 } as TextStyle,
  mapStreetLabel: { position: 'absolute', color: '#7A8594', fontSize: 7, fontWeight: '600', transform: [{ rotate: '-18deg' }] } as TextStyle,
  echoMapPin: { position: 'absolute', left: '50%', top: '50%', marginLeft: -15, marginTop: -34, width: 30, height: 42, alignItems: 'center' } as ViewStyle,
  echoMapPinShadow: { position: 'absolute', bottom: 3, width: 24, height: 7, borderRadius: 12, backgroundColor: 'rgba(15,17,21,0.22)', transform: [{ scaleX: 1.10 }] },
  echoMapPinHead: { width: 32, height: 32, borderRadius: 16, padding: 3, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.28, shadowRadius: 8, shadowOffset: { width: 0, height: 5 } },
  echoMapPinInner: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#0F1115', alignItems: 'center', justifyContent: 'center' },
  echoMapPinPoint: { width: 12, height: 12, borderRadius: 3, marginTop: -6, transform: [{ rotate: '45deg' }] },
  venueFooterBlock: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12 },
  venueFooterTitle: { fontSize: 24, fontWeight: '500', color: colors.textHigh, letterSpacing: -0.4 },
  venueFooterAddress: { fontSize: 14, color: colors.textMuted, marginTop: 4 },
  directionsPill: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: radii.pill, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: 'rgba(32,199,255,0.10)', borderWidth: 1, borderColor: 'rgba(32,199,255,0.18)' },
  directionsPillText: { color: colors.echoBlueAccessible, fontSize: 12, fontWeight: '800' },
  trustCard: { marginTop: 14, padding: 14, flexDirection: 'row', gap: 12, alignItems: 'center', backgroundColor: 'rgba(32,199,255,0.07)' },
  donationIndicator: { marginTop: 14, padding: 14, flexDirection: 'row', gap: 12, alignItems: 'center', backgroundColor: 'rgba(16,185,129,0.06)', borderWidth: 1, borderColor: 'rgba(16,185,129,0.12)' },
  donationIndicatorIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(32,199,255,0.10)' },
  ticketSectionHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 12 },
  selectedPill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: radii.pill, overflow: 'hidden', backgroundColor: colors.accentSoft, color: colors.accent2, fontWeight: '800' },
  ticketOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14, padding: 16, borderWidth: 1, borderColor: colors.hairline, borderRadius: radii.xl, marginBottom: 12, backgroundColor: colors.surface },
  ticketOptionSelected: { borderColor: 'rgba(123,77,255,0.56)', backgroundColor: 'rgba(123,77,255,0.12)' },
  ticketOptionDisabled: { opacity: 0.48 },
  ticketTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stepperWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: radii.pill, padding: 4, borderWidth: 1, borderColor: colors.hairline },
  stepBtn: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(230,252,255,0.12)' },
  stepBtnDisabled: { backgroundColor: 'rgba(255,255,255,0.03)' },
  stepQty: { minWidth: 20, textAlign: 'center', fontSize: 15, fontWeight: '800', color: colors.text },
  circleHint: { marginTop: 4, padding: 14, flexDirection: 'row', gap: 10, alignItems: 'center', backgroundColor: colors.bgCard },
  footerBar: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 12, paddingBottom: Platform.OS === 'ios' ? 34 : 22, backgroundColor: 'rgba(15,17,21,0.98)', borderTopWidth: 1, borderColor: colors.hairline },
  primaryButton: { minWidth: 146, alignItems: 'center', justifyContent: 'center', borderRadius: radii.pill, backgroundColor: colors.accent, paddingHorizontal: 18, paddingVertical: 14 },
  primaryButtonDisabled: { backgroundColor: 'rgba(255,255,255,0.10)' },
  primaryButtonWallet: { backgroundColor: colors.echoBlue },
  errorContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  backLink: { marginTop: 16 },
});
