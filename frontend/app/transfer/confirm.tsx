/**
 * Transfer — Screen 2: Review & Confirm → Success state
 * ══════════════════════════════════════════════════════
 * Shows: ticket summary, recipient card, transfer terms
 * CTA: "Confirm Transfer" → success state (same screen)
 *
 * Success: animated gradient ring → "Transfer Sent" → Back to Wallet
 *
 * On confirm: ticket.status updated to 'transferred' in store.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View, ScrollView, StyleSheet, TouchableOpacity,
  StatusBar, Animated,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/tokens';
import { Text } from '../../components/ui';
import { useTicketStore } from '../../stores/ticketStore';
import { useEventStore } from '../../stores/eventStore';
import { formatDate, formatTime } from '../../utils/format';
import { logEvent, useValueTransitionLogger } from '../../services/logging';

import { ScreenBackButton } from '../../components/shared/ScreenBackButton';
// ─── Success view ─────────────────────────────────────────────────────────────

function TransferSuccessView({
  recipientName,
  eventTitle,
}: {
  recipientName: string;
  eventTitle: string;
}) {
  const insets = useSafeAreaInsets();
  const ringScale   = useRef(new Animated.Value(0.55)).current;
  const ringOpacity = useRef(new Animated.Value(0)).current;
  const contentFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(ringScale, {
          toValue: 1, tension: 55, friction: 9, useNativeDriver: true,
        }),
        Animated.timing(ringOpacity, {
          toValue: 1, duration: 400, useNativeDriver: true,
        }),
      ]),
      Animated.timing(contentFade, {
        toValue: 1, duration: 350, useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={[sv.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      <View style={sv.inner}>

        {/* Gradient ring */}
        <Animated.View style={[sv.ringWrap, { opacity: ringOpacity, transform: [{ scale: ringScale }] }]}>
          <LinearGradient
            colors={['#20C7FF', '#7B4DFF', '#E63DAD', '#F59E0B']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={sv.ringGradient}
          >
            <View style={sv.ringInner}>
              <Ionicons name="swap-horizontal" size={48} color="#FFF" />
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Text */}
        <Animated.View style={[sv.textBlock, { opacity: contentFade }]}>
          <Text style={sv.heading}>Transfer Sent</Text>
          <Text style={sv.subtitle}>
            {recipientName} has 48 hours to accept your ticket for {eventTitle}.
          </Text>
        </Animated.View>

        {/* Info strip */}
        <Animated.View style={[sv.infoStrip, { opacity: contentFade }]}>
          <InfoItem icon="lock-closed-outline" text="Ticket locked from your wallet while pending" />
          <InfoItem icon="time-outline"         text="Auto-cancelled if not accepted in 48 hours" />
          <InfoItem icon="notifications-outline" text="You'll be notified when accepted or declined" />
        </Animated.View>

        {/* CTAs */}
        <Animated.View style={[sv.ctaBlock, { opacity: contentFade }]}>
          <TouchableOpacity
            style={sv.primaryBtn}
            onPress={() => router.replace('/(tabs)/wallet')}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#20C7FF', '#7B4DFF', '#E63DAD']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={sv.primaryGradient}
            >
              <Ionicons name="wallet-outline" size={18} color="#FFF" />
              <Text style={sv.primaryText}>Back to Wallet</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

function InfoItem({ icon, text }: { icon: any; text: string }) {
  return (
    <View style={sv.infoItem}>
      <Ionicons name={icon} size={14} color={colors.textMuted} />
      <Text style={sv.infoText}>{text}</Text>
    </View>
  );
}

// ─── Review & Confirm Screen ──────────────────────────────────────────────────

export default function TransferConfirmScreen() {
  const insets = useSafeAreaInsets();
  const {
    ticketId,
    recipientName,
    recipientHandle,
    method,
  } = useLocalSearchParams<{
    ticketId: string;
    recipientName: string;
    recipientHandle: string;
    method: 'contact' | 'echo_id';
  }>();

  const [confirming, setConfirming] = useState(false);
  const [success,    setSuccess]    = useState(false);

  useValueTransitionLogger('transfer.confirm', 'confirming', confirming, { logInitial: true });
  useValueTransitionLogger('transfer.confirm', 'success', success);

  const getTicketById = useTicketStore(s => s.getTicketById);
  const getEventById  = useEventStore(s => s.getEventById);
  const ticket        = getTicketById(ticketId);
  const event         = ticket ? getEventById(ticket.event_id) : undefined;

  const handleConfirm = async () => {
    logEvent('transfer.confirm', 'confirm_pressed', {
      ticketId,
      recipientName,
      method,
    });

    setConfirming(true);
    // Mock 1.2s processing
    await new Promise(r => setTimeout(r, 1200));
    setConfirming(false);
    logEvent('transfer.confirm', 'transfer_marked_pending', {
      ticketId,
      recipientName,
      method,
    });
    setSuccess(true);
    // In production: PATCH /tickets/:id { status: 'transferred', recipient: recipientHandle }
  };

  if (success) {
    return (
      <TransferSuccessView
        recipientName={recipientName || 'Recipient'}
        eventTitle={event?.title || 'this event'}
      />
    );
  }

  return (
    <View style={[c.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />

      {/* ── Header ── */}
      <View style={c.header}>
        <ScreenBackButton />
        <Text style={c.headerTitle}>Review Transfer</Text>
        <View style={c.headerSpacer} />
      </View>

      <ScrollView
        style={c.scroll}
        contentContainerStyle={[c.content, { paddingBottom: 120 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Ticket being transferred ── */}
        <Text style={c.sectionLabel}>TICKET</Text>
        {event && (
          <View style={c.card}>
            <View style={c.cardRow}>
              <LinearGradient
                colors={['rgba(6,182,212,0.8)', 'rgba(139,92,246,0.7)', 'rgba(236,72,153,0.7)']}
                style={c.ticketIconBg}
              >
                <Ionicons name="ticket-outline" size={18} color="#FFF" />
              </LinearGradient>
              <View style={c.cardBody}>
                <Text style={c.cardTitle} numberOfLines={1}>{event.title}</Text>
                <Text style={c.cardMeta}>
                  {formatDate(event.start_time)} · {formatTime(event.start_time)}
                </Text>
                <Text style={c.cardMeta} numberOfLines={1}>{event.venue_name}</Text>
              </View>
            </View>
          </View>
        )}

        {/* ── Recipient ── */}
        <Text style={[c.sectionLabel, { marginTop: 22 }]}>SENDING TO</Text>
        <View style={c.card}>
          <View style={c.cardRow}>
            <View style={c.recipientAvatar}>
              <Text style={c.recipientAvatarText}>
                {(recipientName || '?')[0].toUpperCase()}
              </Text>
            </View>
            <View style={c.cardBody}>
              <Text style={c.cardTitle}>{recipientName}</Text>
              <Text style={c.cardMeta}>{recipientHandle}</Text>
              <View style={c.methodPill}>
                <Ionicons
                  name={method === 'contact' ? 'people-outline' : 'at-outline'}
                  size={11}
                  color={colors.textMuted}
                />
                <Text style={c.methodPillText}>
                  {method === 'contact' ? 'Contact' : 'ECHO ID'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Transfer terms ── */}
        <Text style={[c.sectionLabel, { marginTop: 22 }]}>TRANSFER TERMS</Text>
        <View style={c.termsCard}>
          <TermsRow icon="lock-closed-outline"   text="Ticket removed from your wallet immediately" />
          <TermsRow icon="time-outline"           text={`Recipient has 48 hours to accept`} />
          <TermsRow icon="refresh-outline"        text="Auto-returns to you if not accepted" />
          <TermsRow icon="swap-horizontal-outline" text="Transfer cannot be cancelled once accepted" />
        </View>

        {/* ── Warning ── */}
        <View style={c.warningRow}>
          <Ionicons name="information-circle-outline" size={15} color="rgba(255,149,0,0.80)" />
          <Text style={c.warningText}>
            Only transfer to people you trust. Transfers are irreversible once accepted.
          </Text>
        </View>
      </ScrollView>

      {/* ── Confirm CTA ── */}
      <View style={[c.footer, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity
          style={[c.ctaBtn, confirming && c.ctaBtnProcessing]}
          onPress={confirming ? undefined : handleConfirm}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={confirming
              ? ['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.06)']
              : ['#20C7FF', '#7B4DFF', '#E63DAD']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={c.ctaGradient}
          >
            <Ionicons
              name={confirming ? 'hourglass-outline' : 'swap-horizontal-outline'}
              size={18}
              color={confirming ? colors.textMuted : '#FFF'}
            />
            <Text style={[c.ctaText, confirming && c.ctaTextDim]}>
              {confirming ? 'Processing...' : 'Confirm Transfer'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()} style={c.cancelBtn}>
          <Text style={c.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function TermsRow({ icon, text }: { icon: any; text: string }) {
  return (
    <View style={c.termsRow}>
      <Ionicons name={icon} size={15} color={colors.textMuted} />
      <Text style={c.termsText}>{text}</Text>
    </View>
  );
}

// ─── Confirm styles ───────────────────────────────────────────────────────────

const c = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0F1115' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)',
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: '#FFF' },
  headerSpacer: { width: 40 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 20 },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', letterSpacing: 1.2,
    color: colors.textMuted, marginBottom: 10,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    padding: 14,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  ticketIconBg: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  cardMeta:  { fontSize: 12, color: colors.textMuted, marginTop: 3 },
  recipientAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(139,92,246,0.20)',
    alignItems: 'center', justifyContent: 'center',
  },
  recipientAvatarText: { fontSize: 17, fontWeight: '700', color: '#C4B5FD' },
  methodPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    marginTop: 5, alignSelf: 'flex-start',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
  },
  methodPillText: { fontSize: 10, fontWeight: '600', color: colors.textMuted },
  // Terms
  termsCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    padding: 14, gap: 12,
  },
  termsRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  termsText: { flex: 1, fontSize: 13, color: colors.textMuted, lineHeight: 18 },
  // Warning
  warningRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    marginTop: 16,
    padding: 12, borderRadius: 12,
    backgroundColor: 'rgba(255,149,0,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,149,0,0.15)',
  },
  warningText: { flex: 1, fontSize: 12, color: 'rgba(255,149,0,0.80)', lineHeight: 17 },
  // Footer
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 20, paddingTop: 14,
    backgroundColor: '#0F1115',
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)',
  },
  ctaBtn: { borderRadius: 18, overflow: 'hidden', marginBottom: 8 },
  ctaBtnProcessing: { opacity: 0.6 },
  ctaGradient: {
    height: 54, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  ctaText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
  ctaTextDim: { color: colors.textMuted },
  cancelBtn: { paddingVertical: 12, alignItems: 'center' },
  cancelText: { fontSize: 14, color: colors.textMuted },
});

// ─── Success styles ───────────────────────────────────────────────────────────

const sv = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0F1115' },
  inner: {
    flex: 1, alignItems: 'center',
    paddingHorizontal: 28, paddingTop: 64,
  },
  ringWrap: { marginBottom: 36 },
  ringGradient: {
    width: 148, height: 148, borderRadius: 74,
    padding: 3, alignItems: 'center', justifyContent: 'center',
  },
  ringInner: {
    width: '100%', height: '100%', borderRadius: 999,
    backgroundColor: '#0F1115',
    alignItems: 'center', justifyContent: 'center',
  },
  textBlock: { alignItems: 'center', marginBottom: 28 },
  heading: { fontSize: 26, fontWeight: '700', color: '#FFF', marginBottom: 10, textAlign: 'center' },
  subtitle: { fontSize: 15, color: 'rgba(255,255,255,0.55)', textAlign: 'center', lineHeight: 22 },
  infoStrip: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    padding: 16, gap: 12, marginBottom: 28,
  },
  infoItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  infoText: { flex: 1, fontSize: 13, color: colors.textMuted, lineHeight: 18 },
  ctaBlock: { width: '100%' },
  primaryBtn: { borderRadius: 18, overflow: 'hidden' },
  primaryGradient: {
    height: 56, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  primaryText: { fontSize: 17, fontWeight: '700', color: '#FFF' },
});
