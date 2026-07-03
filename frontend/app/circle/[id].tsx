/**
 * ECHO Circle Hub — v21 (Simplified + Theme-Migrated)
 * ═══════════════════════════════════════════════════
 * 3-screen flow: Success → Invite → Hub
 * States: Created → Waiting → Action Needed → Complete → Closed
 * Close Circle confirmation is now inline (no separate screen).
 */
import React, { useEffect, useState } from 'react';
import {
  View, ScrollView, StyleSheet, TouchableOpacity, StatusBar, Modal,
  ViewStyle,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../../components/ui';
import {
  CircleEventCard, CircleStatusCard, GradientCTA,
} from '../../components/circle';
import { useCircleStore } from '../../stores/circleStore';
import { useDonationStore } from '../../stores/donationStore';
import {
  deriveCounts, deriveTimerState, formatTimer,
} from '../../services/circleStateModel';
import { useDynamicTheme } from '../../theme/dynamicTheme';
import { formatDonationCurrency } from '../../services/donationCampaignService';
import type { MemberSlotStatus } from '../../types/circle';

import { ScreenBackButton } from '../../components/shared/ScreenBackButton';
const STATUS_STYLE: Record<MemberSlotStatus, { label: string; color: string; bg: string }> = {
  open:      { label: 'Open',     color: 'rgba(167,175,191,0.70)', bg: 'rgba(167,175,191,0.08)' },
  invited:   { label: 'Invited',  color: '#F59E0B',               bg: 'rgba(245,158,11,0.10)' },
  pending:   { label: 'Pending',  color: '#20C7FF',               bg: 'rgba(32,199,255,0.10)' },
  claimed:   { label: 'Paid',     color: '#10B981',               bg: 'rgba(16,185,129,0.10)' },
  expired:   { label: 'Expired',  color: '#EF4444',               bg: 'rgba(239,68,68,0.10)' },
  released:  { label: 'Released', color: '#6B7280',               bg: 'rgba(107,114,128,0.10)' },
  replaced:  { label: 'Replaced', color: '#6B7280',               bg: 'rgba(107,114,128,0.08)' },
};

export default function CircleHubScreen() {
  const { colors: c, isDark } = useDynamicTheme();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const store = useCircleStore();
  const { circle } = store;
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  // Timer tick — only restart when circle identity changes, not every second
  const timerActive = !!circle && circle.secondsRemaining > 0;
  useEffect(() => {
    if (!timerActive) return;
    const iv = setInterval(() => store.tickTimer(), 1000);
    return () => clearInterval(iv);
  }, [circle?.id, timerActive]);

  if (!circle) {
    return (
      <View style={[s.root, s.centered, { paddingTop: insets.top, backgroundColor: c.bg }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <Text style={[s.errorTitle, { color: c.text }]}>Circle not found</Text>
        <Text style={[s.errorBody, { color: c.textLow }]}>Your ticket remains secure in Wallet.</Text>
        <TouchableOpacity style={[s.fallbackBtn, { backgroundColor: c.accentSoft }]} onPress={() => router.replace('/(tabs)/wallet')}>
          <Text style={{ color: c.accent, fontSize: 16, fontWeight: '700' }}>Go to Wallet</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const counts = deriveCounts(circle);
  const isComplete = circle.status === 'complete';
  const isClosed = circle.status === 'closed';
  const isActive = !isComplete && !isClosed;
  const activeMembers = circle.members.filter(m => m.status !== 'replaced');
  const pendingCount = counts.open + counts.invited + counts.pending + counts.expired;
  const circleDonationRecords = useDonationStore.getState().records.filter((record) => record.circleId === circle.id && record.paymentStatus === 'paid');
  const circleDonationTotal = circleDonationRecords.reduce((sum, record) => sum + record.amount, 0);

  const headerTitle = isComplete ? 'Circle complete' : isClosed ? 'Circle closed' : 'Circle in progress';
  const headerSubtitle = isComplete
    ? 'Everyone is confirmed.'
    : isClosed ? 'The claim window has ended.'
    : 'Track claims and invite friends.';

  const statusBody = isComplete
    ? 'All spots in your ECHO Circle are confirmed.'
    : `Waiting on ${pendingCount} friend${pendingCount !== 1 ? 's' : ''} to claim.`;

  // Primary CTA logic
  const primaryAction = isComplete || isClosed ? 'wallet' : counts.open > 0 ? 'invite' : pendingCount > 0 ? 'cover' : 'wallet';
  const ctaLabel = primaryAction === 'invite' ? 'Invite friends' : primaryAction === 'cover' ? 'Cover remaining' : 'Go to Wallet';

  const handleCTA = () => {
    if (primaryAction === 'invite') router.push({ pathname: '/circle/invite', params: { id: circle.id } });
    else if (primaryAction === 'cover') store.coverRemaining();
    else router.replace('/(tabs)/wallet');
  };

  const handleRemind = () => {
    const target = circle.members.find((m) => m.status === 'invited' || m.status === 'pending');
    if (target) store.remindMember(target.id);
  };

  const handleCloseCircle = () => {
    store.closeCircle();
    setShowCloseConfirm(false);
  };

  return (
    <View style={[s.root, { backgroundColor: c.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <ScrollView
        contentContainerStyle={[s.scroll, { paddingBottom: 180 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Simple header bar */}
        <View style={[s.headerBar, { paddingTop: insets.top + 18 }]}>
          <ScreenBackButton />
          <Text style={[s.headerTitle, { color: c.text }]}>{headerTitle}</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Event card */}
        <View style={s.section}>
          <CircleEventCard
            imageUrl={circle.eventImageUrl}
            title={circle.eventTitle}
            venue={circle.eventVenue || 'Venue'}
            dateLabel={circle.eventDate ? `${circle.eventDate} · ${circle.eventTime || ''}` : 'Date TBD'}
            countLabel={`${circle.totalTickets} tickets`}
          />
        </View>

        {/* Status card */}
        <View style={s.section}>
          <CircleStatusCard
            state={circle.status as never}
            secured={counts.claimed}
            total={circle.totalTickets}
            timerLabel={isActive ? `${formatTimer(circle.secondsRemaining)} remaining` : undefined}
            bodyText={statusBody}
            actionLabel={isActive && counts.invited > 0 ? 'Remind friend' : undefined}
            onAction={handleRemind}
          >
            {/* Complete: inline member verification + wallet link */}
            {isComplete && (
              <>
                <View style={s.memberGrid}>
                  {activeMembers.slice(0, 4).map((m) => {
                    const ms = STATUS_STYLE[m.status];
                    return (
                      <View key={m.id} style={[s.memberChip, { backgroundColor: c.surface2 }]}>
                        <View style={s.memberDot}>
                          <Ionicons name="person-outline" size={14} color={c.accent} />
                        </View>
                        <Text style={[s.memberName, { color: c.text }]} numberOfLines={1}>{m.name || 'Your ticket'}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                          <Text style={[s.memberStatus, { color: ms.color }]}>{ms.label}</Text>
                          {m.status === 'claimed' && <Ionicons name="checkmark-circle" size={13} color="#10B981" />}
                        </View>
                      </View>
                    );
                  })}
                </View>
                <TouchableOpacity style={[s.walletLink, { borderTopColor: c.hairline }]} onPress={() => router.replace('/(tabs)/wallet')} activeOpacity={0.82}>
                  <Ionicons name="wallet-outline" size={18} color={c.textMuted} />
                  <Text style={[s.walletLinkText, { color: c.textLow }]}>Tickets are ready in Wallet</Text>
                  <Ionicons name="chevron-forward" size={16} color={c.textMuted} />
                </TouchableOpacity>
              </>
            )}
          </CircleStatusCard>
        </View>

        {circleDonationRecords.length > 0 ? (
          <View style={[s.donationSummaryCard, { backgroundColor: c.surface2, borderColor: c.hairline }]}>
            <View style={s.summaryHeader}>
              <Ionicons name="heart-outline" size={20} color={c.accent} />
              <Text style={[s.summaryTitle, { color: c.text }]}>Campaign support</Text>
            </View>
            <Text style={[s.donationSummaryText, { color: c.textLow }]}>
              {circleDonationRecords.length} Circle member{circleDonationRecords.length === 1 ? '' : 's'} supported this campaign. Individual donation amounts stay private in the Circle Hub.
            </Text>
            <SummaryRow label="Aggregate support" value={formatDonationCurrency(circleDonationTotal)} color={c} />
          </View>
        ) : null}

        {/* In-progress: Member list */}
        {isActive && (
          <>
            <Text style={[s.sectionLabel, { color: c.textMuted }]}>Members</Text>
            {activeMembers.map((m) => {
              const ms = STATUS_STYLE[m.status];
              const initial = (m.name || '?')[0].toUpperCase();
              return (
                <View key={m.id} style={[s.memberRow, { backgroundColor: c.surface2, borderColor: c.hairline }]}>
                  <View style={[s.avatar, { backgroundColor: 'rgba(168,85,247,0.08)', borderColor: 'rgba(168,85,247,0.20)' }]}>
                    <Text style={{ color: '#A855F7', fontSize: 16, fontWeight: '700' }}>{initial}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.rowName, { color: c.text }]}>{m.name || 'Open spot'}</Text>
                    <Text style={[s.rowMeta, { color: c.textMuted }]}>{m.status === 'open' ? 'Waiting for invite' : m.status === 'claimed' ? 'Ticket secured' : 'Invite sent'}</Text>
                  </View>
                  <View style={[s.statusBadge, { backgroundColor: ms.bg }]}>
                    <Text style={[s.statusBadgeText, { color: ms.color }]}>{ms.label}</Text>
                  </View>
                </View>
              );
            })}
          </>
        )}

        {/* In-progress: Quick Actions */}
        {isActive && (
          <View style={[s.actionsCard, { backgroundColor: c.surface2, borderColor: c.hairline }]}>
            <Text style={[s.actionsTitle, { color: c.text }]}>Actions</Text>
            {counts.open > 0 && <ActionRow icon="person-add-outline" label="Invite open spots" color={c} onPress={() => router.push({ pathname: '/circle/invite', params: { id: circle.id } })} />}
            {counts.invited + counts.pending > 0 && <ActionRow icon="notifications-outline" label="Send reminder" color={c} onPress={handleRemind} />}
            {pendingCount > 0 && <ActionRow icon="card-outline" label="Cover remaining" color={c} onPress={() => store.coverRemaining()} />}
            {pendingCount > 0 && <ActionRow icon="remove-circle-outline" label="Release unpaid spots" color={c} onPress={() => store.releaseRemaining()} />}
            <ActionRow icon="lock-closed-outline" label="Close Circle" color={c} onPress={() => setShowCloseConfirm(true)} />
          </View>
        )}

        {/* Closed/Complete: Summary */}
        {(isComplete || isClosed) && (
          <View style={[s.summaryCard, { backgroundColor: c.surface2, borderColor: c.hairline }]}>
            <View style={s.summaryHeader}>
              <Ionicons name="checkmark-circle-outline" size={20} color={isComplete ? '#10B981' : c.textMuted} />
              <Text style={[s.summaryTitle, { color: c.text }]}>Circle summary</Text>
            </View>
            <SummaryRow label="Organizer paid" value="1 ticket" color={c} />
            <SummaryRow label="Friends paid" value={`${Math.max(0, counts.claimed - 1)} ticket${counts.claimed - 1 !== 1 ? 's' : ''}`} color={c} />
            <SummaryRow label="Status" value={isComplete ? 'All claimed' : 'Window closed'} color={c} />
          </View>
        )}

        {/* What happens next (in-progress only) */}
        {isActive && (
          <View style={[s.infoCard, { backgroundColor: isDark ? 'rgba(245,158,11,0.04)' : 'rgba(245,158,11,0.06)', borderColor: isDark ? 'rgba(245,158,11,0.10)' : 'rgba(245,158,11,0.14)' }]}>
            <Text style={{ color: '#F59E0B', fontSize: 15, fontWeight: '700', marginBottom: 10 }}>What happens next</Text>
            <InfoRow icon="time-outline" text="Friends have 60 minutes to claim." color={c} />
            <InfoRow icon="people-outline" text="Unclaimed spots can be released or covered." color={c} />
          </View>
        )}
      </ScrollView>

      {/* Bottom CTA */}
      <View style={[s.bottomBar, { paddingBottom: insets.bottom + 12, backgroundColor: c.bg, borderTopColor: c.hairline }]}>
        <GradientCTA label={ctaLabel} onPress={handleCTA} />
        <TouchableOpacity
          style={s.altLink}
          onPress={() => isComplete || isClosed ? router.replace('/(tabs)/wallet') : router.push({ pathname: '/circle/invite', params: { id: circle.id } })}
          activeOpacity={0.82}
        >
          <Text style={[s.altLinkText, { color: c.accent }]}>
            {isComplete || isClosed ? 'View tickets in Wallet' : 'Edit invite'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Inline Close Circle Confirmation ── */}
      <Modal visible={showCloseConfirm} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <View style={[s.modalCard, { backgroundColor: isDark ? '#181C24' : '#FFFFFF', borderColor: c.hairline }]}>
            <View style={s.modalIcon}>
              <Ionicons name="lock-closed-outline" size={26} color="#F59E0B" />
            </View>
            <Text style={[s.modalTitle, { color: c.text }]}>Close this Circle?</Text>
            <Text style={[s.modalBody, { color: c.textLow }]}>
              Paid tickets stay secured. Unclaimed spots will be released and the Circle can no longer accept claims.
            </Text>
            <TouchableOpacity
              style={s.modalPrimary}
              onPress={handleCloseCircle}
              activeOpacity={0.86}
            >
              <Text style={{ color: '#F59E0B', fontSize: 16, fontWeight: '800' }}>Close Circle</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.modalSecondary} onPress={() => setShowCloseConfirm(false)} activeOpacity={0.72}>
              <Text style={{ color: c.textMedium, fontSize: 15, fontWeight: '600' }}>Keep Circle Open</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* ── Helper Components ── */

function ActionRow({ icon, label, color: c, onPress }: { icon: string; label: string; color: any; onPress: () => void }) {
  return (
    <TouchableOpacity style={[s.actionRow, { borderTopColor: c.hairline }]} onPress={onPress} activeOpacity={0.84}>
      <Ionicons name={icon as never} size={18} color={c.accent} />
      <Text style={[s.actionLabel, { color: c.text }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={16} color={c.textMuted} />
    </TouchableOpacity>
  );
}

function SummaryRow({ label, value, color: c }: { label: string; value: string; color: any }) {
  return (
    <View style={s.summaryRow}>
      <Text style={{ color: c.textMuted, fontSize: 15 }}>{label}</Text>
      <Text style={{ color: c.text, fontSize: 15, fontWeight: '600' }}>{value}</Text>
    </View>
  );
}

function InfoRow({ icon, text, color: c }: { icon: string; text: string; color: any }) {
  return (
    <View style={s.infoRow}>
      <Ionicons name={icon as never} size={16} color={c.textMuted} />
      <Text style={{ color: c.textLow, fontSize: 14, lineHeight: 20, flex: 1 }}>{text}</Text>
    </View>
  );
}

/* ── Styles (static defaults, dynamic via inline) ── */

const s = StyleSheet.create({
  root: { flex: 1 },
  centered: { alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: 20 },
  section: { marginBottom: 14 },
  sectionLabel: { fontSize: 15, fontWeight: '600', marginBottom: 10, marginTop: 8 },

  errorTitle: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  errorBody: { fontSize: 15, marginBottom: 24 },
  fallbackBtn: { paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14 },

  /* Header bar */
  headerBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 18 },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', textAlign: 'center' },

  /* Member list (in-progress) */
  memberRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 16, borderRadius: 16, marginBottom: 8,
    borderWidth: 1,
  },
  avatar: {
    width: 42, height: 42, borderRadius: 21,
    borderWidth: 1.5, alignItems: 'center', justifyContent: 'center',
  },
  rowName: { fontSize: 16, fontWeight: '600' },
  rowMeta: { fontSize: 13, marginTop: 2 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  statusBadgeText: { fontSize: 13, fontWeight: '700' },

  /* Actions card */
  actionsCard: {
    padding: 18, borderRadius: 22, marginTop: 14, marginBottom: 14,
    borderWidth: 1,
  },
  actionsTitle: { fontSize: 16, fontWeight: '800', marginBottom: 4 },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderTopWidth: 1 },
  actionLabel: { flex: 1, fontSize: 15, fontWeight: '600' },

  /* Complete: inline members */
  memberGrid: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  memberChip: {
    alignItems: 'center', gap: 4, width: '46%' as ViewStyle['width'],
    paddingVertical: 10, paddingHorizontal: 8, borderRadius: 12,
  },
  memberDot: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(168,85,247,0.08)', borderWidth: 1, borderColor: 'rgba(168,85,247,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  memberName: { fontSize: 13, fontWeight: '600' },
  memberStatus: { fontSize: 12, fontWeight: '600' },

  /* Wallet link */
  walletLink: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 14, borderTopWidth: 1, marginTop: 8,
  },
  walletLinkText: { flex: 1, fontSize: 14 },

  /* Summary card */
  donationSummaryCard: { marginHorizontal: 20, marginTop: 14, padding: 16, borderRadius: 22, borderWidth: 1 },
  donationSummaryText: { fontSize: 12.5, lineHeight: 18, marginBottom: 8 },
  summaryCard: {
    padding: 20, borderRadius: 20, marginTop: 14, borderWidth: 1,
  },
  summaryHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  summaryTitle: { fontSize: 18, fontWeight: '700' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },

  /* Info card */
  infoCard: { padding: 20, borderRadius: 20, marginTop: 14, borderWidth: 1 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },

  /* Bottom CTA */
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1,
  },
  altLink: { alignItems: 'center', marginTop: 14 },
  altLinkText: { fontSize: 15, fontWeight: '600' },

  /* Close Circle Modal */
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.60)',
    alignItems: 'center', justifyContent: 'center', padding: 24,
  },
  modalCard: {
    width: '100%', padding: 28, borderRadius: 28, alignItems: 'center',
    borderWidth: 1,
  },
  modalIcon: {
    width: 58, height: 58, borderRadius: 29,
    backgroundColor: 'rgba(245,158,11,0.12)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.30)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  modalTitle: { fontSize: 24, fontWeight: '800', textAlign: 'center' },
  modalBody: { marginTop: 10, fontSize: 15, lineHeight: 22, textAlign: 'center' },
  modalPrimary: {
    width: '100%', marginTop: 24, paddingVertical: 16, borderRadius: 16,
    backgroundColor: 'rgba(245,158,11,0.15)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.30)',
    alignItems: 'center',
  },
  modalSecondary: { marginTop: 14, paddingVertical: 12, paddingHorizontal: 16 },
});
