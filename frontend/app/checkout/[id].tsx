/**
 * /checkout/[id] — Web checkout page for a specific event.
 *
 * Locked v59 sections:
 * - Ticket summary
 * - Buyer info
 * - Quantity selector
 * - ECHO Circle option (leader pays first, then invites)
 * - Donation option (only if event has donation_campaign)
 * - Age verification status (before payment)
 * - Payment placeholder
 * - Order summary using computeCheckoutFees() (5% platform + 2.9% + $0.30 processing, tax separate)
 * - "Complete Reservation" CTA (NOT "Buy Ticket")
 * - Wallet pass delivery copy
 * - Secure checkout copy
 *
 * Mock-only payment. Real Stripe integration is a SWAP-POINT.
 */
import React, { useMemo, useState } from 'react';
import { Platform, StyleSheet, Text, TextInput, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { brand } from '../../theme/brand';
import { WebShell } from '../../components/web/WebShell';
import { WebSection } from '../../components/web/WebSection';
import { getPublicWebEvents } from '../../services/webPlatformMock';
import { computeCheckoutFees } from '../../services/pricingEngine';
import type { Event } from '../../types';

export default function CheckoutPage() {
  if (Platform.OS !== 'web') return null;
  const params = useLocalSearchParams<{ id?: string }>();
  const { width } = useWindowDimensions();
  const compact = width < 880;

  // Fallback: pull first event if id missing/unknown.
  const event: Event | undefined = useMemo(() => {
    const list = getPublicWebEvents(50);
    return list.find((e) => e.id === params.id) ?? list[0];
  }, [params.id]);

  const ticketTypes = event?.ticket_types ?? [];
  const [tierIdx, setTierIdx] = useState(0);
  const [qty, setQty] = useState(1);
  const [useCircle, setUseCircle] = useState(false);
  const [donate, setDonate] = useState(false);
  const [donationAmount, setDonationAmount] = useState(10);

  const selectedTier = ticketTypes[tierIdx];
  const tierPriceDollars = selectedTier ? selectedTier.price / 100 : 0;
  const subtotal = tierPriceDollars * qty;
  const fees = computeCheckoutFees(subtotal, false);
  const donationTotal = donate ? donationAmount : 0;
  const grandTotal = fees.total + donationTotal;

  const ageRestricted = !!event?.age_restriction && event.age_restriction > 0;
  const ageLabel = event?.age_restriction ? `${event.age_restriction}+` : null;
  const hasDonation = !!event?.donation_campaign;

  if (!event) {
    return (
      <WebShell>
        <WebSection align="center"><Text style={{ color: '#FFFFFF' }}>Event not found.</Text></WebSection>
      </WebShell>
    );
  }

  return (
    <WebShell ambient>
      {/* Header */}
      <WebSection align="left" paddingVertical={40} maxWidth={1100}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
          <Ionicons name="chevron-back" size={16} color="rgba(255,255,255,0.7)" />
          <Text style={styles.backLinkText}>Back to event</Text>
        </TouchableOpacity>
        <Text style={styles.eyebrow}>RESERVATION</Text>
        <Text style={styles.title}>{event.title}</Text>
        <Text style={styles.sub}>{event.venue_name}</Text>
      </WebSection>

      {/* Body two-col */}
      <WebSection align="left" paddingVertical={40} maxWidth={1100}>
        <View style={[styles.grid, compact && { flexDirection: 'column' }]}>
          {/* LEFT: form */}
          <View style={[styles.colMain, compact && { width: '100%' }]}>
            {/* Tier select */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Choose your tier</Text>
              {ticketTypes.length === 0 && (
                <Text style={styles.muted}>No tiers configured for this event.</Text>
              )}
              {ticketTypes.map((t, i) => (
                <TouchableOpacity
                  key={t.id ?? i}
                  onPress={() => setTierIdx(i)}
                  style={[styles.tierRow, tierIdx === i && styles.tierRowActive]}
                >
                  <View style={[styles.radio, tierIdx === i && styles.radioActive]}>
                    {tierIdx === i && <View style={styles.radioDot} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.tierName}>{t.name}</Text>
                    <Text style={styles.tierMeta}>{t.description ?? 'Standard reservation'}</Text>
                  </View>
                  <Text style={styles.tierPrice}>${(t.price / 100).toFixed(2)}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Quantity + Circle */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Quantity</Text>
              <View style={styles.qtyRow}>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => setQty(Math.max(1, qty - 1))}
                >
                  <Ionicons name="remove" size={18} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.qtyValue}>{qty}</Text>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => setQty(Math.min(8, qty + 1))}
                >
                  <Ionicons name="add" size={18} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.qtyHint}>Max 8 per reservation</Text>
              </View>

              {qty >= 2 && (
                <TouchableOpacity
                  onPress={() => setUseCircle(!useCircle)}
                  style={[styles.toggleCard, useCircle && styles.toggleCardActive]}
                >
                  <View style={[styles.toggleBox, useCircle && styles.toggleBoxActive]}>
                    {useCircle && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.toggleTitle}>Start an ECHO Circle</Text>
                    <Text style={styles.toggleBody}>
                      You pay for your spot first, then invite up to {qty - 1} {qty - 1 === 1 ? 'friend' : 'friends'}. Each pays their own way. 1-hour timer.
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>

            {/* Age verification */}
            {ageRestricted && (
              <View style={[styles.card, styles.ageCard]}>
                <View style={styles.ageHeader}>
                  <Ionicons name="shield-checkmark-outline" size={18} color={brand.cyanAccessible} />
                  <Text style={styles.sectionTitle}>Age verification \u2014 {ageLabel}</Text>
                </View>
                <Text style={styles.muted}>
                  Age verification happens before payment when required, so checkout stays clean, compliant, and trusted.
                </Text>
                <TouchableOpacity onPress={() => router.push('/verify-age' as never)} style={styles.verifyBtn}>
                  <Text style={styles.verifyBtnText}>Verify age to continue</Text>
                  <Ionicons name="chevron-forward" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            )}

            {/* Donation */}
            {hasDonation && (
              <View style={styles.card}>
                <View style={styles.donateHeader}>
                  <Ionicons name="heart-outline" size={18} color={brand.cyanAccessible} />
                  <Text style={styles.sectionTitle}>Add a donation</Text>
                </View>
                <Text style={styles.muted}>
                  Supports {event.donation_campaign?.causeTitle ?? event.donation_campaign?.nonprofitName ?? 'this host\u2019s nonprofit cause'}. Optional. You\u2019ll receive a receipt after checkout.
                </Text>
                <View style={styles.donateChips}>
                  {[5, 10, 25, 50].map((amt) => {
                    const active = donate && donationAmount === amt;
                    return (
                      <TouchableOpacity
                        key={amt}
                        onPress={() => { setDonate(true); setDonationAmount(amt); }}
                        style={[styles.donateChip, active && styles.donateChipActive]}
                      >
                        <Text style={[styles.donateChipText, active && styles.donateChipTextActive]}>${amt}</Text>
                      </TouchableOpacity>
                    );
                  })}
                  <TouchableOpacity
                    onPress={() => setDonate(false)}
                    style={[styles.donateChip, !donate && styles.donateChipActive]}
                  >
                    <Text style={[styles.donateChipText, !donate && styles.donateChipTextActive]}>No donation</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Buyer info */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Your info</Text>
              <View style={[styles.rowSplit, compact && { flexDirection: 'column' }]}>
                <View style={[{ flex: 1 }, compact && { marginBottom: 12, width: '100%' }]}>
                  <Text style={styles.fieldLabel}>First name</Text>
                  <TextInput placeholder="Alex" placeholderTextColor="rgba(255,255,255,0.35)" style={styles.input} />
                </View>
                <View style={[{ flex: 1 }, compact && { width: '100%' }]}>
                  <Text style={styles.fieldLabel}>Last name</Text>
                  <TextInput placeholder="Rivera" placeholderTextColor="rgba(255,255,255,0.35)" style={styles.input} />
                </View>
              </View>
              <View style={{ marginTop: 12 }}>
                <Text style={styles.fieldLabel}>Email</Text>
                <TextInput placeholder="you@email.com" placeholderTextColor="rgba(255,255,255,0.35)" style={styles.input} />
              </View>
            </View>

            {/* Payment (mock) */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Payment</Text>
              <View style={styles.cardField}>
                <Ionicons name="card-outline" size={18} color="rgba(255,255,255,0.45)" />
                <Text style={styles.cardFieldPlaceholder}>Card number \u00B7 MM/YY \u00B7 CVC</Text>
              </View>
              <View style={styles.secureRow}>
                <Ionicons name="lock-closed-outline" size={14} color="rgba(255,255,255,0.55)" />
                <Text style={styles.secureText}>PCI-compliant processor. Card details never touch ECHO servers.</Text>
              </View>
            </View>
          </View>

          {/* RIGHT: order summary */}
          <View style={[styles.colSide, compact && { width: '100%' }]}>
            <View style={styles.summaryCard}>
              <Text style={styles.sectionTitle}>Order summary</Text>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{selectedTier?.name ?? 'Ticket'} \u00D7 {qty}</Text>
                <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Service & processing fee</Text>
                <Text style={styles.summaryValue}>${fees.serviceFee.toFixed(2)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Tax</Text>
                <Text style={styles.summaryValue}>${fees.tax.toFixed(2)}</Text>
              </View>
              {donate && (
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: brand.cyanAccessible }]}>Donation</Text>
                  <Text style={[styles.summaryValue, { color: brand.cyanAccessible }]}>${donationAmount.toFixed(2)}</Text>
                </View>
              )}

              <View style={styles.divider} />
              <View style={styles.summaryRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>${grandTotal.toFixed(2)}</Text>
              </View>

              <TouchableOpacity
                onPress={() => router.push('/wallet' as never)}
                style={styles.completeBtn}
              >
                <Text style={styles.completeBtnText}>Complete Reservation</Text>
                <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
              </TouchableOpacity>

              <View style={styles.deliveryRow}>
                <Ionicons name="card-outline" size={14} color="rgba(255,255,255,0.55)" />
                <Text style={styles.deliveryText}>
                  Your ECHO Access Pass will be ready in your wallet. Add to Apple or Google Wallet from there.
                </Text>
              </View>
            </View>
          </View>
        </View>
      </WebSection>
    </WebShell>
  );
}

const styles = StyleSheet.create({
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  backLinkText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    fontWeight: '500',
  },
  eyebrow: {
    color: brand.cyanAccessible,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
    marginBottom: 6,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  sub: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 14,
  },
  grid: {
    flexDirection: 'row',
    gap: 24,
    alignItems: 'flex-start',
  },
  colMain: { flex: 1.5 },
  colSide: { flex: 1 },
  card: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 18,
    padding: 22,
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginBottom: 14,
  },
  muted: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 14,
  },
  tierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 8,
  },
  tierRowActive: {
    borderColor: 'rgba(123,77,255,0.45)',
    backgroundColor: 'rgba(123,77,255,0.10)',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.30)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: {
    borderColor: brand.cyanAccessible,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: brand.cyanAccessible,
  },
  tierName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  tierMeta: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
  },
  tierPrice: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  qtyBtn: {
    width: 38,
    height: 38,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    minWidth: 28,
    textAlign: 'center',
  },
  qtyHint: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 12,
    marginLeft: 8,
  },
  toggleCard: {
    flexDirection: 'row',
    gap: 14,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginTop: 16,
  },
  toggleCardActive: {
    backgroundColor: 'rgba(32,199,255,0.06)',
    borderColor: 'rgba(32,199,255,0.30)',
  },
  toggleBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.30)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleBoxActive: {
    backgroundColor: brand.cyanAccessible,
    borderColor: brand.cyanAccessible,
  },
  toggleTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  toggleBody: {
    color: 'rgba(255,255,255,0.62)',
    fontSize: 13,
    lineHeight: 19,
  },
  ageCard: {
    backgroundColor: 'rgba(32,199,255,0.05)',
    borderColor: 'rgba(32,199,255,0.18)',
  },
  ageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  verifyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  verifyBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  donateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  donateChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  donateChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  donateChipActive: {
    backgroundColor: 'rgba(32,199,255,0.16)',
    borderColor: brand.cyanAccessible,
  },
  donateChipText: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 13,
    fontWeight: '600',
  },
  donateChipTextActive: {
    color: '#FFFFFF',
  },
  fieldLabel: {
    color: 'rgba(255,255,255,0.62)',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    color: '#FFFFFF',
    fontSize: 14,
  },
  rowSplit: {
    flexDirection: 'row',
    gap: 12,
  },
  cardField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    borderRadius: 12,
  },
  cardFieldPlaceholder: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 14,
  },
  secureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
  secureText: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
  },
  summaryCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    padding: 24,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 13,
  },
  summaryValue: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginVertical: 12,
  },
  totalLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  totalValue: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  completeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: brand.primary,
    paddingVertical: 14,
    borderRadius: 999,
    marginTop: 16,
  },
  completeBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  deliveryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 14,
  },
  deliveryText: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
  },
});
