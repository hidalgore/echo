/**
 * Choose How to Pay — Image 4 Design
 * ════════════════════════════════════
 * Split from purchase.tsx. Quantity already selected on Event Details.
 * Shows: ECHO Circle (recommended) vs Pay for All.
 * Single ticket (qty=1) routes to single-checkout.tsx instead.
 */
import React, { useState, useMemo } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, StatusBar, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../../components/ui';
import { CircleEventCard, GradientCTA } from '../../components/circle';
import { EchoMark } from '../../components/shared/EchoMark';
import { MOCK_EVENTS } from '../../services/mock';
import { useEventStore } from '../../stores/eventStore';
import { useCircleStore } from '../../stores/circleStore';
import { createFreshCircle } from '../../services/circleMock';
import { CONFIG } from '../../constants/config';
import { colors } from '../../theme/tokens';
import { useDynamicTheme } from '../../theme/dynamicTheme';
import { routeToCheckout } from '../../utils/checkoutRouting';
import { formatDate, formatTime } from '../../utils/format';
import { computeCheckoutFees } from '../../services/pricingEngine';
import { DonationCard } from '../../components/checkout/DonationCard';
import { useDonationStore } from '../../stores/donationStore';
import { buildDonationRecord, computeDonationProcessingFee } from '../../services/donationCampaignService';
import type { DonationSelection } from '../../types/nonprofitDonation';

import { ScreenBackButton } from '../../components/shared/ScreenBackButton';
type PurchaseMode = 'circle' | 'pay_all';
type CheckoutSelection = { id: string; name?: string; price?: number; quantity: number };

const fmt = (n: number) => `$${n.toFixed(0)}`;

export default function ChoosePaymentScreen() {
  const { colors: c } = useDynamicTheme();
  const insets = useSafeAreaInsets();
  const { eventId, qty: qtyStr, quantity: quantityStr, selections } = useLocalSearchParams<{
    eventId: string;
    qty?: string;
    quantity?: string;
    selections?: string;
  }>();
  // Live discovery serves backend events the bundled corpus doesn't know —
  // resolve through the store (it falls back to MOCK_EVENTS internally).
  const storeEvent = useEventStore((state) => state.getEventById(eventId ?? ''));
  const event = storeEvent || MOCK_EVENTS.find(e => e.id === eventId) || MOCK_EVENTS[0];
  const ticketPrice = event?.ticket_types?.[0]?.price ?? 40;

  const selectedTickets = useMemo<CheckoutSelection[]>(() => {
    if (!selections) return [];
    try {
      const parsed = JSON.parse(selections);
      return Array.isArray(parsed) ? parsed.filter((ticket: CheckoutSelection) => ticket && Number(ticket.quantity) > 0) : [];
    } catch {
      return [];
    }
  }, [selections]);

  const qty = selectedTickets.length
    ? selectedTickets.reduce((sum, ticket) => sum + (Number(ticket.quantity) || 1), 0)
    : Math.max(2, parseInt(qtyStr || quantityStr || '2', 10) || 2);
  const subtotal = selectedTickets.length
    ? selectedTickets.reduce((sum, ticket) => sum + (Number(ticket.price) || ticketPrice) * (Number(ticket.quantity) || 1), 0)
    : ticketPrice * qty;
  const organizerTicketPrice = selectedTickets[0]?.price ?? ticketPrice;

  const [mode, setMode] = useState<PurchaseMode>('circle');
  const [donationSelection, setDonationSelection] = useState<DonationSelection>({ amount: 0, type: 'fixed' });
  const { createCircle } = useCircleStore();

  const pricing = useMemo(() => {
    if (mode === 'circle') {
      const cf = computeCheckoutFees(organizerTicketPrice);
      return { label: `${fmt(organizerTicketPrice)} for 1 ticket now`, total: cf.total, perPerson: organizerTicketPrice, friendNote: `Friends claim and pay for their assigned tickets separately.` };
    }
    const cf = computeCheckoutFees(subtotal);
    return { label: `${fmt(subtotal)} for ${qty} tickets`, total: cf.total, perPerson: qty > 0 ? subtotal / qty : ticketPrice, friendNote: '' };
  }, [mode, ticketPrice, qty, subtotal, organizerTicketPrice]);

  const donationAmount = Math.max(0, donationSelection.amount || 0);
  const donationProcessingFee = computeDonationProcessingFee(donationAmount);
  const displayedTotal = pricing.total + donationAmount + donationProcessingFee;

  const continueCheckout = () => {
    if (mode === 'circle') {
      // Locked sequence: organizer pays for exactly 1 ticket first, then ECHO Circle is created and friends are invited.
      // This prevents a group invite from existing before the organizer owns a valid paid ticket.
      routeToCheckout({
        eventId: event.id,
        quantity: qty,
        selections,
        mode: 'circle_organizer',
        donationAmount,
        donationType: donationSelection.type,
      });
    } else {
      // Pay for all — continue into canonical checkout confirmation.
      routeToCheckout({ eventId: event.id, quantity: qty, selections, mode: 'pay_all', donationAmount, donationType: donationSelection.type });
    }
  };

  const handleContinue = () => {
    if (donationAmount > 0 && event.donation_campaign) {
      Alert.alert(
        'Donation added',
        `You’re donating $${donationAmount.toFixed(2)} to ${event.donation_campaign.causeTitle}. ${mode === 'circle' ? 'This applies only to your ticket purchase.' : 'This donation is added once to your full order.'}`,
        [
          { text: 'Edit Donation', style: 'cancel' },
          { text: 'Continue', onPress: continueCheckout },
        ],
      );
      return;
    }
    continueCheckout();
  };

  const ctaLabel = mode === 'circle' ? 'Start ECHO Circle' : `Pay ${fmt(displayedTotal)}`;

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        contentContainerStyle={[s.scroll, { paddingBottom: 160 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[s.checkoutHeader, { paddingTop: insets.top + 24 }]}>
          <View style={[s.checkoutBackBtn, { top: insets.top + 24 }]}>
            <ScreenBackButton />
          </View>
          <Text style={s.checkoutTitle}>Choose how to pay</Text>
          <Text style={s.checkoutSubtitle}>Select an option to continue your checkout. Donations remain optional and separate.</Text>
        </View>

        {/* Event summary card */}
        <View style={s.section}>
          <CircleEventCard
            imageUrl={event.image_url}
            title={event.title}
            venue={event.venue_name}
            city={event.venue_address?.split(',')[1]?.trim() || 'Seattle'}
            dateLabel={`${formatDate(event.start_time)} · ${formatTime(event.start_time)}`}
            countLabel={`${qty} tickets`}
          />
        </View>

        <View style={s.section}>
          <DonationCard
            campaign={event.donation_campaign}
            selection={donationSelection}
            baseTotal={pricing.total}
            onSelect={setDonationSelection}
            context={mode === 'circle' ? 'circle' : 'pay_for_all'}
          />
        </View>

        {/* ── ECHO Circle Card (selected/recommended) ── */}
        <TouchableOpacity
          style={s.section}
          onPress={() => setMode('circle')}
          activeOpacity={0.88}
          accessibilityRole="button"
          accessibilityState={{ selected: mode === 'circle' }}
          accessibilityLabel="Select ECHO Circle. You pay for one ticket now and friends claim separately."
        >
          <LinearGradient
            colors={mode === 'circle'
              ? ['rgba(32,199,255,0.40)', 'rgba(123,77,255,0.40)', 'rgba(236,72,153,0.35)', 'rgba(245,158,11,0.45)']
              : ['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.04)', 'rgba(255,255,255,0.04)', 'rgba(255,255,255,0.06)']
            }
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={s.optionBorder}
          >
            <View style={s.optionInner}>
              {/* Top: recommendation + check */}
              <View style={s.optionTopRow}>
                <View style={s.recommendPill}>
                  <Text style={s.recommendText}>Recommended for groups</Text>
                </View>
                <View style={[s.radioOuter, mode === 'circle' && s.radioSelected]}>
                  {mode === 'circle' && <Ionicons name="checkmark" size={16} color="#7B4DFF" />}
                </View>
              </View>

              {/* Circle ring motif + title */}
              <View style={s.circleRow}>
                <View style={s.circleLogo}>
                  <EchoMark size={52} imageStyle={s.echoCircleIcon} />
                </View>
                <View style={s.circleInfo}>
                  <Text style={s.circleTitle}>ECHO Circle</Text>
                  <Text style={s.circleSub}>You'll only pay for your ticket now.{'\n'}Friends claim and pay separately.</Text>
                </View>
              </View>

              {/* Price + time strip */}
              <View style={s.priceTimeRow}>
                <View style={s.priceBlock}>
                  <Ionicons name="pricetag-outline" size={18} color="#10B981" />
                  <View>
                    <Text style={s.priceLabel}>From {fmt(ticketPrice)}</Text>
                    <Text style={s.priceSub}>per person</Text>
                  </View>
                </View>
                <View style={s.dividerVert} />
                <View style={s.priceBlock}>
                  <Ionicons name="time-outline" size={18} color="#10B981" />
                  <View>
                    <Text style={s.priceLabel}>60 min</Text>
                    <Text style={s.priceSub}>claim window</Text>
                  </View>
                </View>
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* ── Pay for All Card (de-emphasized) ── */}
        <TouchableOpacity
          style={s.section}
          onPress={() => setMode('pay_all')}
          activeOpacity={0.88}
          accessibilityRole="button"
          accessibilityState={{ selected: mode === 'pay_all' }}
          accessibilityLabel="Select Pay for all. Cover all tickets now."
        >
          <View style={[s.payAllCard, mode === 'pay_all' && s.payAllSelected]}>
            <View style={s.payAllIcon}>
              <Ionicons name="card-outline" size={24} color={mode === 'pay_all' ? '#20C7FF' : 'rgba(255,255,255,0.35)'} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.payAllTitle}>Pay for all</Text>
              <Text style={s.payAllSub}>{qty === 2 ? 'Cover both tickets now.' : 'Cover all tickets now.'}</Text>
            </View>
            <View style={[s.radioOuter, mode === 'pay_all' && s.radioSelected]}>
              {mode === 'pay_all' && <Ionicons name="checkmark" size={16} color="#7B4DFF" />}
            </View>
          </View>
        </TouchableOpacity>

        {/* ── Today you pay strip ── */}
        <View style={s.section}>
          <View style={s.todayCard}>
            <View>
              <Text style={s.todayLabel}>Today you pay</Text>
              <Text style={s.todayDetail}>{mode === 'circle' ? `1 ticket reserved now · friends pay their own` : `${qty} tickets now`}</Text>
            </View>
            <Text style={s.todayAmount}>{fmt(mode === 'circle' ? ticketPrice : ticketPrice * qty)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* ── Bottom CTA ── */}
      <View style={[s.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        <GradientCTA label={ctaLabel} onPress={handleContinue} />
        <TouchableOpacity
          style={s.altLink}
          onPress={() => setMode(mode === 'circle' ? 'pay_all' : 'circle')}
          activeOpacity={0.82}
          accessibilityRole="button"
          accessibilityLabel={mode === 'circle' ? 'Switch to Pay for all' : 'Switch to ECHO Circle'}
        >
          <Text style={s.altLinkText}>
            {mode === 'circle' ? 'Pay for all instead' : 'Start ECHO Circle instead'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0F1115' },
  scroll: { paddingHorizontal: 20 },
  section: { marginBottom: 16 },
  checkoutHeader: { alignItems: 'center', paddingHorizontal: 28, paddingBottom: 22 },
  checkoutBackBtn: { position: 'absolute', left: 20, zIndex: 10 },
  checkoutTitle: { color: '#F7F8FA', fontSize: 28, lineHeight: 34, fontWeight: '800', textAlign: 'center', letterSpacing: -0.45, marginHorizontal: 58 },
  checkoutSubtitle: { color: 'rgba(255,255,255,0.68)', fontSize: 15, lineHeight: 22, textAlign: 'center', marginTop: 6, maxWidth: 320 },

  // Option border
  optionBorder: { borderRadius: 24, padding: 1.5 },
  optionInner: { borderRadius: 22.5, backgroundColor: '#0F1115', padding: 20, gap: 18 },
  optionTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  recommendPill: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 12, backgroundColor: 'rgba(123,77,255,0.18)' },
  recommendText: { color: '#C084FC', fontSize: 13, fontWeight: '700' },

  // Radio
  radioOuter: {
    width: 30, height: 30, borderRadius: 15, borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center',
  },
  radioSelected: { borderColor: '#7B4DFF', backgroundColor: 'rgba(123,77,255,0.10)' },

  // Circle logo motif
  circleRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  circleLogo: { width: 64, height: 64, alignItems: 'center', justifyContent: 'center', borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.055)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  echoCircleIcon: { shadowColor: '#20C7FF', shadowOpacity: 0.25, shadowRadius: 10, shadowOffset: { width: 0, height: 0 } },
  circleInfo: { flex: 1 },
  circleTitle: { color: '#F7F8FA', fontSize: 23, lineHeight: 28, fontWeight: '700', marginBottom: 4 },
  circleSub: { color: 'rgba(255,255,255,0.66)', fontSize: 15, lineHeight: 22 },

  // Price/time strip
  priceTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  priceBlock: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  dividerVert: { width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.08)' },
  priceLabel: { color: '#F7F8FA', fontSize: 16, fontWeight: '700' },
  priceSub: { color: 'rgba(255,255,255,0.60)', fontSize: 13 },

  // Pay for all
  payAllCard: {
    flexDirection: 'row', alignItems: 'center', gap: 16, padding: 20,
    borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
  },
  payAllSelected: { borderColor: 'rgba(32,199,255,0.35)', backgroundColor: 'rgba(32,199,255,0.04)' },
  payAllIcon: {
    width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  payAllTitle: { color: '#F7F8FA', fontSize: 18, fontWeight: '700' },
  payAllSub: { color: 'rgba(255,255,255,0.62)', fontSize: 15, lineHeight: 20, marginTop: 2 },

  // Today you pay
  todayCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 20, borderRadius: 20,
    backgroundColor: 'rgba(123,77,255,0.06)', borderWidth: 1, borderColor: 'rgba(123,77,255,0.12)',
  },
  todayLabel: { color: '#F7F8FA', fontSize: 16, fontWeight: '700' },
  todayDetail: { color: 'rgba(255,255,255,0.66)', fontSize: 14, lineHeight: 20, marginTop: 2, maxWidth: 220 },
  todayAmount: { color: '#F7F8FA', fontSize: 34, fontWeight: '700' },

  // Bottom
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 20, paddingTop: 12,
    backgroundColor: '#0F1115', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.10)',
  },
  altLink: { alignItems: 'center', marginTop: 14 },
  altLinkText: { color: '#C084FC', fontSize: 16, fontWeight: '700' },
});
