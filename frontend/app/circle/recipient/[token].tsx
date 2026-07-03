/**
 * ECHO Circle Recipient Flow v1
 * ═════════════════════════════
 * Universal invite flow for app and non-app users.
 *
 * Locked doctrine:
 * - No app download required before purchase.
 * - 18+/21+ events require age verification before checkout/payment.
 * - Checkout is blocked when age verification fails.
 * - Payment CTA: “Pay & Secure Ticket.”
 * - Add to Wallet / View Ticket appear before optional app download.
 * - Recipient Circle Status is separate from organizer Hub.
 */

import React, { useMemo, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Image,
  Platform,
  Share,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../../../components/ui';
import { useDynamicTheme } from '../../../theme/dynamicTheme';
import {
  formatRecipientTimer,
  getMockRecipientInvite,
  getRecipientEdgeCopy,
  quoteRecipientCheckout,
  type RecipientFlowStep,
} from '../../../services/circleRecipientService';
import { formatDate, formatTime } from '../../../utils/format';

const PAYMENT_METHODS = [
  { id: 'wallet', label: Platform.OS === 'android' ? 'Google Pay' : 'Apple Pay', icon: Platform.OS === 'android' ? 'logo-google' : 'logo-apple', group: 'Fast checkout' },
  { id: 'card', label: 'Card', icon: 'card-outline', group: 'Other payment methods' },
] as const;

export default function CircleRecipientInviteScreen() {
  const { colors: c, isDark } = useDynamicTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ token?: string }>();
  const token = Array.isArray(params.token) ? params.token[0] : params.token || 'demo';

  const [step, setStep] = useState<RecipientFlowStep>('invite');
  const [ageVerified, setAgeVerified] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'card'>('wallet');

  const invite = useMemo(() => getMockRecipientInvite(token), [token]);
  const quote = useMemo(() => quoteRecipientCheckout(invite), [invite]);
  const edgeCopy = getRecipientEdgeCopy(invite.status, invite.organizerName);
  const requiresAge = !!invite.ageRequired;

  const progressSteps = requiresAge
    ? ['Invite', 'Verify', 'Pay', 'Ticket']
    : ['Invite', 'Pay', 'Ticket'];

  const stepIndex = step === 'invite' ? 0 : step === 'verify' ? 1 : step === 'checkout' ? (requiresAge ? 2 : 1) : progressSteps.length - 1;

  const continueFromInvite = () => {
    if (requiresAge && !ageVerified) setStep('verify');
    else setStep('checkout');
  };

  const handleVerify = () => {
    setAgeVerified(true);
    setStep('checkout');
  };

  const handlePayment = () => {
    if (requiresAge && !ageVerified) {
      setStep('verify');
      return;
    }
    setStep('confirmed');
  };

  const handleShare = async () => {
    await Share.share({
      message: `${invite.organizerName} saved you a spot for ${invite.event.title}. Claim it here: ${invite.universalUrl}`,
    });
  };

  if (edgeCopy) {
    return (
      <View style={[s.root, { backgroundColor: c.bg, paddingTop: insets.top }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <View style={s.topBar}>
          <Text style={[s.brand, { color: c.accent }]}>E C H O</Text>
          <TouchableOpacity onPress={() => router.replace('/(tabs)')}>
            <Ionicons name="close" size={24} color={c.text} />
          </TouchableOpacity>
        </View>
        <View style={s.edgeWrap}>
          <View style={[s.edgeIcon, { borderColor: c.dangerSoft, backgroundColor: c.surface2 }]}>
            <Ionicons name={edgeCopy.icon} size={36} color={invite.status === 'circle_full' ? c.warning : c.danger} />
          </View>
          <Text style={[s.edgeTitle, { color: c.text }]}>{edgeCopy.title}</Text>
          <Text style={[s.edgeBody, { color: c.textSecondary }]}>{edgeCopy.body}</Text>
          <TouchableOpacity style={s.primaryPressable} onPress={() => router.replace('/(tabs)')}>
            <LinearGradient colors={[c.accent, c.echoBlue, c.echoOrange]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.primaryGradient}>
              <Text style={s.primaryText}>{edgeCopy.primary}</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={[s.secondaryButton, { borderColor: c.hairline, backgroundColor: c.surface2 }]} onPress={() => router.replace('/(tabs)')}>
            <Text style={[s.secondaryText, { color: c.text }]}>{edgeCopy.secondary}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[s.root, { backgroundColor: c.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <ScrollView
        contentContainerStyle={[s.scroll, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.topBar}>
          <Text style={[s.brand, { color: c.accent }]}>E C H O</Text>
          <View style={s.topActions}>
            <TouchableOpacity style={[s.iconButton, { borderColor: c.hairline, backgroundColor: c.surface2 }]} onPress={handleShare}>
              <Ionicons name="share-outline" size={18} color={c.text} />
            </TouchableOpacity>
            <View style={[s.shieldPill, { borderColor: c.hairline, backgroundColor: c.surface2 }]}>
              <Ionicons name="shield-checkmark-outline" size={15} color={c.textSecondary} />
            </View>
          </View>
        </View>

        <ProgressRail steps={progressSteps} activeIndex={stepIndex} />

        {step === 'invite' && (
          <>
            <EventHero invite={invite} />
            <View style={[s.card, { backgroundColor: c.glass, borderColor: c.glassBorder }]}>
              <Text style={[s.inviteHeadline, { color: c.text }]}>{invite.organizerName} saved you a spot.</Text>
              <Text style={[s.bodyCopy, { color: c.textSecondary }]}>
                Join {invite.organizerName}’s Circle for {invite.event.title}.
              </Text>

              <MetricRow icon="people-outline" label="Circle progress" value={`${invite.circle.joinedSlots} of ${invite.circle.totalSlots} joined`} />
              <MetricRow icon="ticket-outline" label="Your ticket" value={`$${invite.ticketTier.price.toFixed(2)}`} />
              <MetricRow icon="time-outline" label="Spot held" value={formatRecipientTimer(invite.circle.secondsRemaining)} accent />

              <View style={[s.noticeBox, { backgroundColor: c.surface2, borderColor: c.hairline }]}>
                <Ionicons name="lock-closed-outline" size={16} color={c.textSecondary} />
                <Text style={[s.noticeText, { color: c.textSecondary }]}>
                  Your spot is reserved. Your ticket is confirmed after {requiresAge ? 'age verification and ' : ''}payment.
                </Text>
              </View>

              <PrimaryButton label={requiresAge ? 'Verify Age' : 'Continue to Checkout'} onPress={continueFromInvite} />
              <TouchableOpacity style={s.linkButton}>
                <Text style={[s.linkText, { color: c.textTertiary }]}>Decline</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {step === 'verify' && (
          <View style={[s.card, s.centerCard, { backgroundColor: c.glass, borderColor: c.glassBorder }]}>
            <LinearGradient colors={[c.accent, c.echoBlue, c.echoOrange]} style={s.ageRing}>
              <View style={[s.ageRingInner, { backgroundColor: c.bg }]}>
                <Text style={[s.ageNumber, { color: c.text }]}>{invite.ageRequired}+</Text>
              </View>
            </LinearGradient>
            <Text style={[s.screenTitle, { color: c.text }]}>Verify age before checkout</Text>
            <Text style={[s.bodyCopy, s.centerText, { color: c.textSecondary }]}>
              This event requires verified {invite.ageRequired}+ access. ECHO verifies eligibility before payment so you never pay for an event you may not be able to attend.
            </Text>

            <VerificationOption icon="id-card-outline" title="Government ID" subtitle="Upload a photo of your ID" onPress={handleVerify} />
            <VerificationOption icon="shield-checkmark-outline" title="Digital identity" subtitle="Use a trusted provider" onPress={handleVerify} />
            <View style={[s.optionRow, { backgroundColor: c.surface2, borderColor: c.hairline, opacity: 0.72 }]}>
              <Ionicons name="lock-closed-outline" size={21} color={c.textTertiary} />
              <View style={{ flex: 1 }}>
                <Text style={[s.optionTitle, { color: c.textTertiary }]}>Required before checkout</Text>
                <Text style={[s.optionSubtitle, { color: c.textDisabled }]}>Verify later is not available for this event.</Text>
              </View>
            </View>

            <View style={[s.noticeBox, { backgroundColor: c.successSoft, borderColor: c.successSoft }]}>
              <Ionicons name="shield-checkmark-outline" size={16} color={c.success} />
              <Text style={[s.noticeText, { color: c.textSecondary }]}>Private by design. ECHO stores only what is needed to confirm eligibility.</Text>
            </View>
          </View>
        )}

        {step === 'checkout' && (
          <View style={[s.card, { backgroundColor: c.glass, borderColor: c.glassBorder }]}>
            <View style={s.checkoutHeader}>
              <Text style={[s.screenTitle, { color: c.text }]}>Secure your ticket.</Text>
              {requiresAge && (
                <View style={[s.verifiedPill, { backgroundColor: c.successSoft, borderColor: c.successSoft }]}>
                  <Ionicons name="checkmark-circle-outline" size={15} color={c.success} />
                  <Text style={[s.verifiedText, { color: c.success }]}>Age verified</Text>
                </View>
              )}
            </View>

            <OrderSummary invite={invite} quote={quote} />

            <View style={s.paymentGroup}>
              <Text style={[s.groupLabel, { color: c.textMuted }]}>Fast checkout</Text>
              <PaymentRow
                icon={PAYMENT_METHODS[0].icon}
                label={PAYMENT_METHODS[0].label}
                selected={paymentMethod === 'wallet'}
                onPress={() => setPaymentMethod('wallet')}
              />
              <Text style={[s.groupLabel, { color: c.textMuted, marginTop: 14 }]}>Other payment methods</Text>
              <PaymentRow
                icon="card-outline"
                label="Card"
                selected={paymentMethod === 'card'}
                onPress={() => setPaymentMethod('card')}
              />
            </View>

            <View style={[s.noticeBox, { backgroundColor: c.surface2, borderColor: c.hairline }]}>
              <Ionicons name="ticket-outline" size={16} color={c.textSecondary} />
              <Text style={[s.noticeText, { color: c.textSecondary }]}>
                Your ticket joins {invite.organizerName}’s Circle after payment. No app required. Wallet pass available after purchase.
              </Text>
            </View>

            <PrimaryButton label="Pay & Secure Ticket" onPress={handlePayment} />
          </View>
        )}

        {step === 'confirmed' && (
          <View style={[s.card, s.centerCard, { backgroundColor: c.glass, borderColor: c.glassBorder }]}>
            <LinearGradient colors={[c.accent, c.echoBlue, c.echoOrange]} style={s.successRing}>
              <View style={[s.successRingInner, { backgroundColor: c.bg }]}>
                <Ionicons name="checkmark" size={42} color={c.text} />
              </View>
            </LinearGradient>
            <Text style={[s.screenTitle, { color: c.text }]}>You’re in.</Text>
            <Text style={[s.bodyCopy, s.centerText, { color: c.textSecondary }]}>
              Your ticket is confirmed. You’ve joined {invite.organizerName}’s Circle.
            </Text>
            <CircleProgress joined={invite.circle.joinedSlots + 1} total={invite.circle.totalSlots} />
            <ConfirmedTicketCard invite={invite} />

            <PrimaryButton label={Platform.OS === 'android' ? 'Add to Google Wallet' : 'Add to Apple Wallet'} onPress={() => {}} />
            <TouchableOpacity style={[s.secondaryButton, { borderColor: c.hairline, backgroundColor: c.surface2 }]} onPress={() => setStep('status')}>
              <Text style={[s.secondaryText, { color: c.text }]}>View Ticket</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.linkButton} onPress={() => setStep('status')}>
              <Text style={[s.linkText, { color: c.accent }]}>View Circle Status</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.linkButton}>
              <Text style={[s.linkText, { color: c.textTertiary }]}>Download ECHO App</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 'status' && (
          <View style={[s.card, { backgroundColor: c.glass, borderColor: c.glassBorder }]}>
            <Text style={[s.screenTitle, { color: c.text }]}>Your ticket is secured.</Text>
            <Text style={[s.bodyCopy, { color: c.textSecondary }]}>
              This is your recipient status view. Your ticket remains confirmed even if the Circle does not fill.
            </Text>
            <CircleProgress joined={invite.circle.joinedSlots + 1} total={invite.circle.totalSlots} />
            {invite.circle.members.map((member) => (
              <View key={member.id} style={[s.memberRow, { borderColor: c.hairline }]}>
                <View style={[s.avatar, { backgroundColor: member.isCurrentUser ? c.accentSoft : c.surface2, borderColor: c.hairline }]}>
                  <Text style={[s.avatarText, { color: member.isCurrentUser ? c.accent : c.text }]}>{member.initials}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.memberName, { color: c.text }]}>{member.name}</Text>
                  <Text style={[s.memberMeta, { color: c.textMuted }]}>
                    {member.state === 'organizer' ? 'Organizer · Confirmed' : member.isCurrentUser ? 'You · Confirmed' : member.state === 'confirmed' ? 'Confirmed' : 'Waiting'}
                  </Text>
                </View>
                <Ionicons
                  name={member.state === 'waiting' ? 'time-outline' : 'checkmark-circle-outline'}
                  size={20}
                  color={member.state === 'waiting' ? c.warning : c.success}
                />
              </View>
            ))}
            <PrimaryButton label="Add to Wallet" onPress={() => {}} />
            <TouchableOpacity style={[s.secondaryButton, { borderColor: c.hairline, backgroundColor: c.surface2 }]} onPress={() => router.replace('/(tabs)/wallet')}>
              <Text style={[s.secondaryText, { color: c.text }]}>Open Wallet</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );

  function ProgressRail({ steps, activeIndex }: { steps: string[]; activeIndex: number }) {
    return (
      <View style={s.progressRail}>
        {steps.map((label, index) => {
          const active = index <= activeIndex;
          return (
            <React.Fragment key={label}>
              <View style={s.progressItem}>
                <View style={[s.progressDot, { backgroundColor: active ? c.accent : c.surface3, borderColor: active ? c.accent : c.hairline }]}>
                  {index < activeIndex && <Ionicons name="checkmark" size={10} color="#fff" />}
                </View>
                <Text style={[s.progressLabel, { color: active ? c.text : c.textMuted }]}>{label}</Text>
              </View>
              {index < steps.length - 1 && <View style={[s.progressLine, { backgroundColor: index < activeIndex ? c.accentSoft : c.hairline }]} />}
            </React.Fragment>
          );
        })}
      </View>
    );
  }

  function EventHero({ invite }: { invite: ReturnType<typeof getMockRecipientInvite> }) {
    return (
      <View style={[s.heroCard, { backgroundColor: c.surface, borderColor: c.glassBorder }]}>
        <Image
          source={{ uri: invite.event.image_url || `https://picsum.photos/seed/${invite.event.id}/800/500` }}
          style={s.heroImage}
          resizeMode="cover"
        />
        <LinearGradient colors={['transparent', isDark ? 'rgba(15,17,21,0.94)' : 'rgba(245,243,238,0.96)']} style={s.heroFade} />
        <View style={s.heroText}>
          <Text style={[s.eventTitle, { color: c.text }]}>{invite.event.title}</Text>
          <Text style={[s.eventMeta, { color: c.textSecondary }]}>{invite.event.venue_name}</Text>
          <Text style={[s.eventMeta, { color: c.textSecondary }]}>
            {formatDate(invite.event.start_time)} · {formatTime(invite.event.start_time)}
          </Text>
          {!!invite.ageRequired && (
            <View style={[s.agePill, { backgroundColor: c.warningSoft, borderColor: c.warningSoft }]}>
              <Text style={[s.agePillText, { color: c.warning }]}>{invite.ageRequired}+ verified access</Text>
            </View>
          )}
        </View>
      </View>
    );
  }

  function MetricRow({ icon, label, value, accent }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string; accent?: boolean }) {
    return (
      <View style={[s.metricRow, { borderColor: c.hairline }]}>
        <Ionicons name={icon} size={18} color={accent ? c.accent : c.textSecondary} />
        <Text style={[s.metricLabel, { color: c.textSecondary }]}>{label}</Text>
        <Text style={[s.metricValue, { color: accent ? c.accent : c.text }]}>{value}</Text>
      </View>
    );
  }

  function VerificationOption({ icon, title, subtitle, onPress }: { icon: keyof typeof Ionicons.glyphMap; title: string; subtitle: string; onPress: () => void }) {
    return (
      <TouchableOpacity style={[s.optionRow, { backgroundColor: c.surface2, borderColor: c.hairline }]} onPress={onPress} activeOpacity={0.84}>
        <Ionicons name={icon} size={22} color={c.text} />
        <View style={{ flex: 1 }}>
          <Text style={[s.optionTitle, { color: c.text }]}>{title}</Text>
          <Text style={[s.optionSubtitle, { color: c.textMuted }]}>{subtitle}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={c.textMuted} />
      </TouchableOpacity>
    );
  }

  function OrderSummary({ invite, quote }: { invite: ReturnType<typeof getMockRecipientInvite>; quote: ReturnType<typeof quoteRecipientCheckout> }) {
    return (
      <View style={[s.orderCard, { backgroundColor: c.surface2, borderColor: c.hairline }]}>
        <View style={s.orderTop}>
          <Image source={{ uri: invite.event.image_url || `https://picsum.photos/seed/${invite.event.id}/200/200` }} style={s.orderThumb} />
          <View style={{ flex: 1 }}>
            <Text style={[s.orderTitle, { color: c.text }]}>1 {invite.ticketTier.name}</Text>
            <Text style={[s.orderMeta, { color: c.textMuted }]}>{invite.event.title}</Text>
            <Text style={[s.orderMeta, { color: c.textMuted }]}>{formatDate(invite.event.start_time)} · {formatTime(invite.event.start_time)}</Text>
          </View>
          <Text style={[s.orderPrice, { color: c.text }]}>${quote.ticketSubtotal.toFixed(2)}</Text>
        </View>
        <View style={[s.feeDivider, { backgroundColor: c.hairline }]} />
        <LineItem label="ECHO fee" value={quote.echoFee} />
        <LineItem label="Processing" value={quote.processingFee} />
        <View style={[s.feeDivider, { backgroundColor: c.hairline }]} />
        <LineItem label="Total due today" value={quote.totalDueToday} strong />
      </View>
    );
  }

  function LineItem({ label, value, strong }: { label: string; value: number; strong?: boolean }) {
    return (
      <View style={s.lineItem}>
        <Text style={[strong ? s.lineStrong : s.lineLabel, { color: strong ? c.text : c.textSecondary }]}>{label}</Text>
        <Text style={[strong ? s.lineStrong : s.lineValue, { color: c.text }]}>${value.toFixed(2)}</Text>
      </View>
    );
  }

  function PaymentRow({ icon, label, selected, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; selected: boolean; onPress: () => void }) {
    return (
      <TouchableOpacity style={[s.paymentRow, { backgroundColor: selected ? c.accentSoft : c.surface2, borderColor: selected ? c.accent : c.hairline }]} onPress={onPress} activeOpacity={0.84}>
        <Ionicons name={icon} size={20} color={selected ? c.accent : c.text} />
        <Text style={[s.paymentLabel, { color: c.text }]}>{label}</Text>
        <Ionicons name={selected ? 'checkmark-circle' : 'ellipse-outline'} size={20} color={selected ? c.accent : c.textMuted} />
      </TouchableOpacity>
    );
  }

  function CircleProgress({ joined, total }: { joined: number; total: number }) {
    const pct = Math.min(1, joined / Math.max(total, 1));
    return (
      <View style={[s.progressCard, { backgroundColor: c.surface2, borderColor: c.hairline }]}>
        <View style={s.progressHeader}>
          <Text style={[s.progressTitle, { color: c.text }]}>Circle progress</Text>
          <Text style={[s.progressTitle, { color: c.text }]}>{joined} of {total} joined</Text>
        </View>
        <View style={[s.progressTrack, { backgroundColor: c.surface3 }]}>
          <LinearGradient colors={[c.accent, c.echoBlue]} style={[s.progressFill, { width: `${pct * 100}%` }]} />
        </View>
      </View>
    );
  }

  function ConfirmedTicketCard({ invite }: { invite: ReturnType<typeof getMockRecipientInvite> }) {
    return (
      <View style={[s.confirmTicket, { borderColor: c.hairline, backgroundColor: c.surface2 }]}>
        <Image source={{ uri: invite.event.image_url || `https://picsum.photos/seed/${invite.event.id}/200/200` }} style={s.confirmThumb} />
        <View style={{ flex: 1 }}>
          <Text style={[s.orderTitle, { color: c.text }]}>{invite.event.title}</Text>
          <Text style={[s.orderMeta, { color: c.textMuted }]}>{invite.ticketTier.name}</Text>
          <Text style={[s.orderMeta, { color: c.success }]}>Confirmed</Text>
        </View>
        <View style={[s.tierBadge, { borderColor: c.accent, backgroundColor: c.accentSoft }]}>
          <Text style={[s.tierText, { color: c.accent }]}>GA</Text>
        </View>
      </View>
    );
  }

  function PrimaryButton({ label, onPress }: { label: string; onPress: () => void }) {
    return (
      <TouchableOpacity style={s.primaryPressable} onPress={onPress} activeOpacity={0.88}>
        <LinearGradient colors={[c.accent, c.echoBlue, c.echoOrange]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.primaryGradient}>
          <Text style={s.primaryText}>{label}</Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  }
}

const s = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 20 },
  topBar: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 },
  topActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  brand: { fontSize: 18, fontWeight: '800', letterSpacing: 8 },
  iconButton: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  shieldPill: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },

  progressRail: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 8, marginBottom: 18 },
  progressItem: { alignItems: 'center', minWidth: 48 },
  progressDot: { width: 18, height: 18, borderRadius: 9, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  progressLabel: { fontSize: 10, fontWeight: '800', marginTop: 5, letterSpacing: 0.2 },
  progressLine: { width: 28, height: 1, marginHorizontal: 2, marginTop: -16 },

  heroCard: { borderWidth: 1, borderRadius: 28, overflow: 'hidden', minHeight: 315, marginBottom: 14 },
  heroImage: { height: 315, width: '100%' },
  heroFade: { ...StyleSheet.absoluteFillObject, top: 90 },
  heroText: { position: 'absolute', left: 20, right: 20, bottom: 18 },
  eventTitle: { fontSize: 34, lineHeight: 38, fontWeight: '800', letterSpacing: -0.8 },
  eventMeta: { fontSize: 14, lineHeight: 20, fontWeight: '600', marginTop: 2 },
  agePill: { alignSelf: 'flex-start', borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, marginTop: 10 },
  agePillText: { fontSize: 12, fontWeight: '900' },

  card: { borderWidth: 1, borderRadius: 28, padding: 18, marginBottom: 18 },
  centerCard: { alignItems: 'center' },
  inviteHeadline: { fontSize: 25, lineHeight: 30, fontWeight: '800', letterSpacing: -0.4, marginBottom: 6 },
  screenTitle: { fontSize: 28, lineHeight: 33, fontWeight: '800', letterSpacing: -0.5, marginBottom: 8 },
  bodyCopy: { fontSize: 15, lineHeight: 22, fontWeight: '500', marginBottom: 14 },
  centerText: { textAlign: 'center' },

  metricRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, gap: 10 },
  metricLabel: { fontSize: 14, fontWeight: '700', flex: 1 },
  metricValue: { fontSize: 14, fontWeight: '900' },

  noticeBox: { flexDirection: 'row', gap: 10, borderWidth: 1, borderRadius: 16, padding: 12, marginTop: 12, marginBottom: 14 },
  noticeText: { flex: 1, fontSize: 12.5, lineHeight: 18, fontWeight: '600' },

  primaryPressable: { alignSelf: 'stretch', marginTop: 4 },
  primaryGradient: { height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: '#fff', fontSize: 16, fontWeight: '900' },
  secondaryButton: { alignSelf: 'stretch', minHeight: 52, borderRadius: 17, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  secondaryText: { fontSize: 15, fontWeight: '800' },
  linkButton: { alignItems: 'center', justifyContent: 'center', paddingVertical: 12 },
  linkText: { fontSize: 15, fontWeight: '800' },

  ageRing: { width: 112, height: 112, borderRadius: 56, padding: 4, marginBottom: 18, alignItems: 'center', justifyContent: 'center' },
  ageRingInner: { width: 104, height: 104, borderRadius: 52, alignItems: 'center', justifyContent: 'center' },
  ageNumber: { fontSize: 31, fontWeight: '900' },

  optionRow: { alignSelf: 'stretch', minHeight: 70, borderRadius: 18, borderWidth: 1, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 13, marginTop: 10 },
  optionTitle: { fontSize: 15, fontWeight: '800' },
  optionSubtitle: { fontSize: 12.5, fontWeight: '600', marginTop: 2 },

  checkoutHeader: { marginBottom: 10 },
  verifiedPill: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6, marginTop: 2 },
  verifiedText: { fontSize: 12, fontWeight: '900' },

  orderCard: { borderRadius: 18, borderWidth: 1, padding: 14, marginBottom: 16 },
  orderTop: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  orderThumb: { width: 60, height: 60, borderRadius: 14 },
  orderTitle: { fontSize: 15, fontWeight: '900' },
  orderMeta: { fontSize: 12.5, fontWeight: '600', marginTop: 2 },
  orderPrice: { fontSize: 14, fontWeight: '900' },
  feeDivider: { height: 1, marginVertical: 12 },
  lineItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 3 },
  lineLabel: { fontSize: 13, fontWeight: '600' },
  lineValue: { fontSize: 13, fontWeight: '700' },
  lineStrong: { fontSize: 16, fontWeight: '900' },

  paymentGroup: { marginBottom: 14 },
  groupLabel: { fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8 },
  paymentRow: { height: 54, borderRadius: 16, borderWidth: 1, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  paymentLabel: { flex: 1, fontSize: 15, fontWeight: '800' },

  successRing: { width: 118, height: 118, borderRadius: 59, padding: 4, marginBottom: 18, alignItems: 'center', justifyContent: 'center' },
  successRingInner: { width: 110, height: 110, borderRadius: 55, alignItems: 'center', justifyContent: 'center' },

  progressCard: { alignSelf: 'stretch', borderRadius: 18, borderWidth: 1, padding: 14, marginVertical: 14 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  progressTitle: { fontSize: 14, fontWeight: '900' },
  progressTrack: { height: 9, borderRadius: 999, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 999 },

  confirmTicket: { alignSelf: 'stretch', borderWidth: 1, borderRadius: 20, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  confirmThumb: { width: 58, height: 58, borderRadius: 14 },
  tierBadge: { width: 40, height: 32, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  tierText: { fontSize: 13, fontWeight: '900' },

  memberRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderTopWidth: 1, paddingVertical: 13 },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  avatarText: { fontSize: 14, fontWeight: '900' },
  memberName: { fontSize: 15, fontWeight: '850' },
  memberMeta: { fontSize: 12.5, fontWeight: '650', marginTop: 2 },

  edgeWrap: { flex: 1, paddingHorizontal: 26, alignItems: 'center', justifyContent: 'center' },
  edgeIcon: { width: 86, height: 86, borderRadius: 43, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  edgeTitle: { fontSize: 28, lineHeight: 34, fontWeight: '900', textAlign: 'center', marginBottom: 8 },
  edgeBody: { fontSize: 16, lineHeight: 23, fontWeight: '600', textAlign: 'center', marginBottom: 18 },
});
