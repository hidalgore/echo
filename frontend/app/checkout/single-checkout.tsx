/**
 * Single Ticket Checkout — Simplified Flow
 * ══════════════════════════════════════════
 * For qty=1 only. Event card + price breakdown + Pay Now CTA.
 * No Circle selector, no path choice.
 *
 * Phase 3 / W5: behind EXPO_PUBLIC_ECHO_CHECKOUT_MODE=live the payment runs
 * the real S-05 sequence (create intent -> Stripe card token -> confirm) via
 * getPorts().checkout, and the price/tickets recorded come from the server.
 * Mock mode keeps the local simulated payment + client-side hold untouched.
 */
import React, { useMemo, useState } from 'react';
import { useDynamicTheme } from '../../theme/dynamicTheme';
import { View, ScrollView, StyleSheet, StatusBar, TouchableOpacity, Alert, Platform } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../../components/ui';
import { CircleEventCard, GradientCTA } from '../../components/circle';
import { MOCK_EVENTS } from '../../services/mock';
import { getPorts } from '../../services/api/ports';
import { newIdempotencyKey } from '../../services/api/apiClient';
import { useEventStore } from '../../stores/eventStore';
import { CardPaymentField, collectCardPaymentToken } from '../../components/checkout/StripeCheckout';
import { CONFIG } from '../../constants/config';
import { useTicketStore } from '../../stores/ticketStore';
import { computeCheckoutFees } from '../../services/pricingEngine';
import { createFreshCircle } from '../../services/circleMock';
import { useCircleStore } from '../../stores/circleStore';
import { createInventoryHold, completeInventoryHold, releaseInventoryHold } from '../../services/inventoryHoldService';
import { DonationCard } from '../../components/checkout/DonationCard';
import { useDonationStore } from '../../stores/donationStore';
import { buildDonationRecord, computeDonationProcessingFee } from '../../services/donationCampaignService';
import type { DonationSelection } from '../../types/nonprofitDonation';
import { formatDate, formatTime } from '../../utils/format';

import { ScreenBackButton } from '../../components/shared/ScreenBackButton';
const fmt = (n: number) => `$${n.toFixed(2)}`;

type CheckoutSelection = { id: string; name?: string; price?: number; quantity: number };

export default function SingleCheckoutScreen() {
    const { colors: c, isDark } = useDynamicTheme();
  const insets = useSafeAreaInsets();
  const { eventId, qty: qtyStr, quantity: quantityStr, mode, selections, donationAmount: donationAmountParam, donationType: donationTypeParam } = useLocalSearchParams<{
    eventId: string;
    qty?: string;
    quantity?: string;
    mode?: string;
    selections?: string;
    donationAmount?: string;
    donationType?: string;
  }>();
  // Live discovery serves backend events the bundled corpus doesn't know —
  // resolve through the store (it falls back to MOCK_EVENTS internally).
  const storeEvent = useEventStore((state) => state.getEventById(eventId ?? ''));
  const event = storeEvent || MOCK_EVENTS.find(e => e.id === eventId) || MOCK_EVENTS[0];
  const liveCheckout = CONFIG.CHECKOUT_MODE === 'live';
  const fallbackPrice = event?.ticket_types?.[0]?.price ?? 40;
  const qty = Math.max(1, Number.parseInt(qtyStr || quantityStr || '1', 10) || 1);
  const isCircleOrganizer = mode === 'circle_organizer';
  const [processing, setProcessing] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);
  const [donationSelection, setDonationSelection] = useState<DonationSelection>({ amount: Number(donationAmountParam) || 0, type: (donationTypeParam as DonationSelection['type']) || 'fixed' });

  const selectedTickets = useMemo<CheckoutSelection[]>(() => {
    if (!selections) return [];
    try {
      const parsed = JSON.parse(selections);
      return Array.isArray(parsed) ? parsed.filter((ticket: CheckoutSelection) => ticket && Number(ticket.quantity) > 0) : [];
    } catch {
      return [];
    }
  }, [selections]);

  const organizerTicket = selectedTickets[0];
  const checkoutQty = isCircleOrganizer ? 1 : qty;
  const subtotal = selectedTickets.length
    ? isCircleOrganizer
      ? (Number(organizerTicket?.price) || fallbackPrice)
      : selectedTickets.reduce((sum, ticket) => sum + (Number(ticket.price) || fallbackPrice) * (Number(ticket.quantity) || 1), 0)
    : fallbackPrice * checkoutQty;
  const pricing = computeCheckoutFees(subtotal);
  const donationAmount = Math.max(0, donationSelection.amount || 0);
  const donationProcessingFee = computeDonationProcessingFee(donationAmount);
  const fee = pricing.serviceFee;
  const tax = pricing.tax;
  const total = pricing.total + donationAmount + donationProcessingFee;
  const countLabel = isCircleOrganizer
    ? `1 ticket now · ${qty} Circle spots`
    : `${qty} ticket${qty === 1 ? '' : 's'}`;
  const checkoutTitle = mode === 'pay_all' ? 'Pay for all tickets' : isCircleOrganizer ? 'Start ECHO Circle' : 'Confirm & pay';

  /** Live path: real S-05 intent -> card token -> confirm. Returns the
   *  server-truth numbers for the local wallet record, or null when the flow
   *  stopped with the user already informed. */
  const payViaCheckoutPort = async () => {
    const checkout = getPorts().checkout;
    const created = await checkout.createIntent(
      {
        event_id: event.id,
        ticket_type_id: selectedTickets[0]?.id || event.ticket_types?.[0]?.id,
        quantity: checkoutQty,
        donation_cents: donationAmount > 0 ? Math.round(donationAmount * 100) : undefined,
        client_context: {
          platform: Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web',
          locale: 'en-US',
        },
      },
      newIdempotencyKey(),
    );
    if (!created.ok) {
      Alert.alert('Checkout unavailable', created.error.message);
      return null;
    }
    const intent = created.data;
    if (intent.status === 'requires_verification') {
      // Locked gate: no payment before verification (server enforces it too).
      Alert.alert(
        'Age verification required',
        'This event requires age verification before payment.',
        [
          { text: 'Not now', style: 'cancel' },
          { text: 'Verify age', onPress: () => router.push('/verify-age' as never) },
        ],
      );
      return null;
    }
    const card = await collectCardPaymentToken();
    if (!card.ok) {
      Alert.alert('Payment method needed', card.message);
      return null;
    }
    const confirmed = await checkout.confirmPayment(
      intent.echo_id,
      { type: 'card', token: card.token },
      newIdempotencyKey(),
    );
    if (!confirmed.ok) {
      Alert.alert('Payment failed', confirmed.error.message);
      return null;
    }
    return {
      ticketOrderId: confirmed.data.tickets[0]?.echo_id ?? `tkt_${Date.now()}`,
      totalDollars: intent.total_cents / 100,
      subtotalDollars: intent.subtotal_cents / 100,
      feeDollars: intent.fees_cents / 100,
    };
  };

  const completePayment = async () => {
    setProcessing(true);
    let holdId: string | null = null;
    try {
      let ticketOrderId = `tkt_${Date.now()}`;
      let paidTotal = total;
      let paidSubtotal = subtotal;
      let paidFee = fee;

      if (liveCheckout) {
        const purchase = await payViaCheckoutPort();
        if (!purchase) {
          setProcessing(false);
          return;
        }
        ticketOrderId = purchase.ticketOrderId;
        paidTotal = purchase.totalDollars;
        paidSubtotal = purchase.subtotalDollars;
        paidFee = purchase.feeDollars;
      } else {
        // Mock-only client hold simulation of the production sequence (the
        // real hold is server-side from Phase 3 on).
        const hold = await createInventoryHold({
          eventId: event.id,
          ticketTypeId: selectedTickets[0]?.id || event.ticket_types?.[0]?.id || 'general',
          quantity: checkoutQty,
        });
        holdId = hold.id;

        // Simulate payment
        await new Promise(r => setTimeout(r, 1200));
      }
      const { addTicket } = useTicketStore.getState();
      const circleId = isCircleOrganizer ? `circle_${Date.now()}` : undefined;
      const donationRecord = event.donation_campaign && donationAmount > 0
        ? buildDonationRecord({
            campaign: event.donation_campaign,
            eventId: event.id,
            eventName: event.title,
            donorName: 'Demo User',
            donorEmail: 'demo@echo.events',
            selection: donationSelection,
            ticketOrderId,
            circleId,
            source: isCircleOrganizer ? 'circle' : mode === 'pay_all' ? 'pay_for_all' : 'checkout',
          })
        : null;
      if (donationRecord) useDonationStore.getState().addDonation(donationRecord);

      addTicket({
        id: ticketOrderId,
        event_id: event.id,
        user_id: 'user_current',
        ticket_type_id: selectedTickets[0]?.id || event.ticket_types?.[0]?.id || 'general',
        status: 'active',
        // Real scanning credentials are server-signed and land in Phase 4;
        // this local code only feeds the wallet preview.
        qr_code: `ECHO-${event.id}-${Date.now()}`,
        nfc_credential: `nfc_${event.id}_${Date.now()}`,
        purchased_at: new Date().toISOString(),
        price_paid: paidTotal,
        quantity: checkoutQty,
        total_quantity: checkoutQty,
        ticket_mix: selectedTickets.length
          ? [{
              tier_id: organizerTicket?.id || event.ticket_types?.[0]?.id || 'general',
              name: organizerTicket?.name || 'Ticket',
              quantity: checkoutQty,
              unit_price: Number(organizerTicket?.price) || fallbackPrice,
              subtotal: paidSubtotal,
            }]
          : [{ tier_id: event.ticket_types?.[0]?.id || 'general', name: 'General Admission', quantity: checkoutQty, unit_price: fallbackPrice, subtotal: paidSubtotal }],
        subtotal: paidSubtotal,
        fees: paidFee,
        total: paidTotal,
        donation_summary: donationRecord,
        payment_status: 'paid',
        access_status: 'active',
        grouped_ticket_record: mode === 'pay_all' && qty > 1,
        circle: isCircleOrganizer && circleId ? {
          circle_id: circleId,
          role: 'organizer',
          total_slots: qty,
          claimed_slots: 1,
          closes_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
          user_status: 'paid',
          participants: [{ id: 'mem_org', name: 'You', role: 'organizer', status: 'paid', ticketCount: 1, isCurrentUser: true }],
        } : null,
      });

      if (holdId) await completeInventoryHold(holdId);

      if (isCircleOrganizer && circleId) {
        const freshCircle = createFreshCircle({
          circleId,
          eventId: event.id,
          eventTitle: event.title,
          eventDate: formatDate(event.start_time),
          eventTime: formatTime(event.start_time),
          eventVenue: event.venue_name,
          eventImageUrl: event.image_url || `https://picsum.photos/seed/${event.id}/800/500`,
          eventStartISO: event.start_time,
          totalTickets: qty,
          pricePerTicket: Number(organizerTicket?.price) || fallbackPrice,
        });
        useCircleStore.getState().createCircle(freshCircle);
        setProcessing(false);
        router.replace({ pathname: '/circle/invite', params: { id: freshCircle.id } });
        return;
      }

      setProcessing(false);
      router.replace('/(tabs)/wallet');
    } catch (error) {
      if (holdId) await releaseInventoryHold(holdId);
      setProcessing(false);
      Alert.alert(
        'Checkout paused',
        liveCheckout
          ? 'ECHO could not finish saving your reservation. Check your wallet before retrying — your ticket hold releases automatically if the payment did not go through.'
          : 'ECHO could not complete the mock checkout. Your ticket hold was released.',
      );
    }
  };

  const handlePay = () => {
    if (liveCheckout && !cardComplete) {
      Alert.alert('Payment method needed', 'Enter your card details to complete the reservation.');
      return;
    }
    if (donationAmount > 0 && event.donation_campaign) {
      Alert.alert(
        'Donation added',
        `You’re donating ${fmt(donationAmount)} to ${event.donation_campaign.causeTitle}. Your donation is optional and will appear separately on your receipt.`,
        [
          { text: 'Edit Donation', style: 'cancel' },
          { text: 'Continue to Payment', onPress: completePayment },
        ],
      );
      return;
    }
    void completePayment();
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        contentContainerStyle={[s.scroll, { paddingBottom: 160 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[s.headerBar, { paddingTop: insets.top + 12 }]}>
          <ScreenBackButton />
          <Text style={[s.headerTitle, { color: c.text }]}>{checkoutTitle}</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Event card */}
        <View style={s.section}>
          <CircleEventCard
            imageUrl={event.image_url}
            title={event.title}
            venue={event.venue_name}
            city={event.venue_address?.split(',')[1]?.trim() || 'Seattle'}
            dateLabel={`${formatDate(event.start_time)} · ${formatTime(event.start_time)}`}
            countLabel={countLabel}
          />
        </View>

        <View style={s.section}>
          <DonationCard
            campaign={event.donation_campaign}
            selection={donationSelection}
            baseTotal={pricing.total}
            onSelect={setDonationSelection}
            context={isCircleOrganizer ? 'circle' : mode === 'pay_all' ? 'pay_for_all' : 'single'}
          />
        </View>

        {/* Price breakdown */}
        <View style={s.section}>
          <View style={s.priceCard}>
            <Text style={s.priceTitle}>Order summary</Text>
            {selectedTickets.length ? (isCircleOrganizer ? (
              <PriceRow
                label={`${organizerTicket?.name || 'Organizer ticket'} x 1`}
                value={fmt(subtotal)}
              />
            ) : selectedTickets.map((ticket) => (
              <PriceRow
                key={ticket.id}
                label={`${ticket.name || 'Ticket'} x ${Number(ticket.quantity) || 1}`}
                value={fmt((Number(ticket.price) || fallbackPrice) * (Number(ticket.quantity) || 1))}
              />
            ))) : (
              <PriceRow label={`General Admission x ${checkoutQty}`} value={fmt(subtotal)} />
            )}
            {isCircleOrganizer ? <Text style={s.donationNote}>Organizer pays for one ticket now. Friends claim and pay separately after invites are sent.</Text> : null}
            {donationAmount > 0 && event.donation_campaign ? (
              <>
                <View style={s.priceDivider} />
                <PriceRow label="Donation" value="" muted />
                <PriceRow label={event.donation_campaign.causeTitle} value={fmt(donationAmount)} />
                <PriceRow label="Donation processing" value={fmt(donationProcessingFee)} muted />
              </>
            ) : null}
            <View style={s.priceDivider} />
            <PriceRow label="Service & processing fee" value={fmt(fee)} muted />
            <PriceRow label="Sales tax" value={fmt(tax)} muted />
            {donationAmount > 0 ? <Text style={s.donationNote}>Donation is optional and tracked separately from ticket revenue.</Text> : null}
            <View style={s.priceDivider} />
            <PriceRow label="Total" value={fmt(total)} bold />
          </View>
        </View>

        {/* Payment method: live checkout collects a real card via the Stripe
            seam; mock keeps the static preview. */}
        <View style={s.section}>
          {liveCheckout ? (
            <View style={s.paymentMethod}>
              <View style={{ flex: 1 }}>
                <Text style={s.paymentLabel}>Payment method</Text>
                <CardPaymentField onComplete={setCardComplete} />
              </View>
            </View>
          ) : (
            <TouchableOpacity style={s.paymentMethod} activeOpacity={0.82}>
              <View style={s.paymentIcon}>
                <Ionicons name="card-outline" size={20} color="#20C7FF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.paymentLabel}>Payment method</Text>
                <Text style={s.paymentValue}>Visa ····4242</Text>
              </View>
              <Text style={s.paymentChange}>Change</Text>
              <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.25)" />
            </TouchableOpacity>
          )}
        </View>

        {/* Trust strip */}
        <View style={s.trustRow}>
          <Ionicons name="lock-closed-outline" size={16} color="rgba(255,255,255,0.30)" />
          <Text style={s.trustText}>Secure checkout · Processed by Stripe</Text>
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={[s.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        <GradientCTA label={isCircleOrganizer ? `Pay ${fmt(total)} & Invite` : `Pay ${fmt(total)}`} onPress={handlePay} loading={processing} icon="lock-closed" showArrow={false} />
        <View style={s.secureRow}>
          <Ionicons name="shield-checkmark-outline" size={14} color="rgba(255,255,255,0.30)" />
          <Text style={s.secureText}>Secure checkout</Text>
        </View>
      </View>
    </View>
  );
}

function PriceRow({ label, value, muted, bold }: { label: string; value: string; muted?: boolean; bold?: boolean }) {
  return (
    <View style={s.priceRow}>
      <Text style={[s.priceLabel, muted && s.priceMuted, bold && s.priceBold]}>{label}</Text>
      <Text style={[s.priceValue, muted && s.priceMuted, bold && s.priceBold]}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0F1115' },
  headerBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 16 },
  headerBack: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', textAlign: 'center' },
  scroll: { paddingHorizontal: 20 },
  section: { marginBottom: 14 },

  priceCard: {
    padding: 20, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
  },
  priceTitle: { color: '#F7F8FA', fontSize: 18, fontWeight: '700', marginBottom: 14 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  priceLabel: { color: 'rgba(255,255,255,0.55)', fontSize: 15 },
  priceValue: { color: '#F7F8FA', fontSize: 15, fontWeight: '500' },
  priceMuted: { color: 'rgba(255,255,255,0.40)' },
  priceBold: { color: '#F7F8FA', fontSize: 18, fontWeight: '700' },
  priceDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginVertical: 8 },

  paymentMethod: {
    flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18,
    borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
  },
  paymentIcon: {
    width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(32,199,255,0.08)',
  },
  paymentLabel: { color: 'rgba(255,255,255,0.40)', fontSize: 12 },
  paymentValue: { color: '#F7F8FA', fontSize: 16, fontWeight: '600', marginTop: 2 },
  paymentChange: { color: '#20C7FF', fontSize: 14, fontWeight: '600', marginRight: 4 },

  trustRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8 },
  trustText: { color: 'rgba(255,255,255,0.30)', fontSize: 13 },
  donationNote: { color: 'rgba(255,255,255,0.36)', fontSize: 11.5, lineHeight: 16, marginTop: 4 },

  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 20, paddingTop: 12,
    backgroundColor: '#0F1115', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.10)',
  },
  secureRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12 },
  secureText: { color: 'rgba(255,255,255,0.30)', fontSize: 13 },
});
