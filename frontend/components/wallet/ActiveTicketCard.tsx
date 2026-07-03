/**
 * Wallet Ticket Cards — v16 Rebuild
 * ══════════════════════════════════
 * ActiveTicketCard: still-photo in-app wallet hero card (no tap navigation).
 *   - All actions via three-dot menu or wallet-level CTA
 *   - ECHO NFC icon mark in bottom-right corner
 *   - Circle badge removed (shown separately via CircleWalletCard)
 *
 * SmallTicketCard: Tappable upcoming/past event card with NFC mark.
 */
import React from 'react';
import { View, StyleSheet, TouchableOpacity, ImageBackground, Image, ViewStyle } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radii } from '../../theme/tokens';
import { useDynamicTheme } from '../../theme/dynamicTheme';
import { Text } from '../ui';
import { EnergyChip } from '../social';

// ─── ActiveTicketCard ─────────────────────────────────────────────────────────

type ActiveProps = {
  ticketId: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  venue: string;
  ageRestriction?: number | null;
  isAgeVerified?: boolean;
  imageUrl?: string;
  statusLabel?: string;
  summaryLabel?: string;
  /** Whether an ECHO Circle exists for this ticket's event */
  hasCircle?: boolean;
  /** Fires when "Manage Circle" CTA is tapped */
  onCirclePress?: () => void;
  /** Wallet lifts menu state — fires when user taps ··· */
  onMenuPress?: () => void;
  /** Optional Social Energy snapshot rendered as a subtle chip near the venue line. */
  energy?: import('../../types/socialEnergy').SocialEnergy;
};

export function ActiveTicketCard({
  ticketId,
  eventTitle,
  eventDate,
  eventTime,
  venue,
  ageRestriction,
  isAgeVerified = false,
  imageUrl,
  statusLabel = 'READY FOR ENTRY',
  summaryLabel = 'Tap to enter · Verified by ECHO',
  hasCircle = false,
  onCirclePress,
  energy,
}: ActiveProps) {
  return (
    <View
      style={s.wrap}
      accessibilityRole="summary"
      accessibilityLabel={`Active ticket for ${eventTitle}`}
    >
      <LinearGradient
        colors={['rgba(6,182,212,0.78)', 'rgba(139,92,246,0.62)', 'rgba(236,72,153,0.72)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={s.border}
      >
        <View style={s.imageWrap}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={[StyleSheet.absoluteFillObject, s.image]} resizeMode="cover" />
          ) : null}
          <LinearGradient
            colors={['rgba(10,12,18,0.14)', 'rgba(10,12,18,0.34)', 'rgba(10,12,18,0.72)', 'rgba(10,12,18,0.88)']}
            locations={[0, 0.34, 0.72, 1]}
            style={s.overlay}
          >
            {/* ── Top row: status pill | age badge + three-dot ── */}
            <View style={s.topRow}>
              <View style={s.statusPill}>
                <Ionicons name="checkmark-circle" size={15} color={colors.success} />
                <Text style={s.statusText}>{statusLabel}</Text>
              </View>

              <View style={s.topRight}>
                {ageRestriction ? (
                  <View style={[s.ageBadge, isAgeVerified && s.ageBadgeVerified]}>
                    {isAgeVerified && (
                      <Ionicons name="checkmark" size={11} color="#10B981" />
                    )}
                    <Text style={[s.ageText, isAgeVerified && s.ageTextVerified]}>
                      {ageRestriction}+
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>

            {/* ── Event info ── */}
            <View style={s.contentBlock}>
              <Text style={s.title}>{eventTitle}</Text>
              <Text style={s.meta}>{eventDate} · {eventTime}</Text>
              <Text style={s.location}>{venue}</Text>
            </View>

            {/* ── Bottom summary strip ── */}
            <View style={s.bottomBlock}>
              <View style={s.divider} />
              <View style={s.summaryRow}>
                <Ionicons name="shield-checkmark-outline" size={16} color="rgba(255,255,255,0.88)" />
                <Text style={s.summaryText}>{summaryLabel}</Text>

                {/* ECHO NFC icon mark — consistent with SmallTicketCard */}
                <View style={s.nfcMarkWrap}>
                  <Image
                    source={require('../../assets/images/echo_nfc_mark.png')}
                    style={s.nfcMark}
                    resizeMode="contain"
                  />
                </View>
              </View>

              {/* Social Energy chip — calm "proof of life" signal */}
              {energy ? (
                <View style={s.energyRow}>
                  <EnergyChip energy={energy} />
                </View>
              ) : null}

              {/* ── Manage Circle CTA — only when Circle exists ── */}
              {hasCircle && (
                <TouchableOpacity
                  style={s.circleCta}
                  onPress={() => onCirclePress?.()}
                  activeOpacity={0.86}
                  accessibilityLabel="Manage ECHO Circle"
                >
                  <Ionicons name="people" size={16} color="rgba(123,77,255,0.95)" />
                  <Text style={s.circleCtaText}>Manage Circle</Text>
                  <Ionicons name="chevron-forward" size={14} color="rgba(123,77,255,0.55)" />
                </TouchableOpacity>
              )}
            </View>
          </LinearGradient>
        </View>
      </LinearGradient>

      {/* Boarding pass notch cutouts */}
      <View style={s.notchLeft} />
      <View style={s.notchRight} />
      {/* Perforation dots */}
      <View style={s.perfRow} pointerEvents="none">
        {Array.from({ length: 18 }).map((_, i) => (
          <View key={i} style={s.perfDot} />
        ))}
      </View>
    </View>
  );
}

// ─── SmallTicketCard ──────────────────────────────────────────────────────────

export function SmallTicketCard({
  ticketId,
  eventTitle,
  eventDate,
  eventTime,
  imageUrl,
  ageRestriction,
  rightText,
  subLabel,
  circleId,
  circleClaimed,
  circleTotal,
}: {
  ticketId: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  imageUrl?: string;
  ageRestriction?: number | null;
  rightText?: string;
  subLabel?: string;
  circleId?: string;
  circleClaimed?: number;
  circleTotal?: number;
}) {
  const hasCircle = circleId && circleTotal && circleTotal > 0;

  return (
    <TouchableOpacity
      style={sm.wrap}
      onPress={() => router.push(`/ticket/${ticketId}`)}
      activeOpacity={0.90}
    >
      <ImageBackground
        source={{ uri: imageUrl || 'https://picsum.photos/seed/event/400/200' }}
        imageStyle={sm.bgImage}
        style={sm.card}
      >
        <LinearGradient
          colors={['rgba(10,12,18,0.10)', 'rgba(10,12,18,0.50)', 'rgba(10,12,18,0.92)']}
          locations={[0, 0.45, 1]}
          style={sm.overlay}
        >
          {/* Top: age + ticket count */}
          <View style={sm.topRow}>
            {ageRestriction ? (
              <View style={sm.agePill}>
                <Text style={sm.agePillText}>{ageRestriction}+</Text>
              </View>
            ) : <View />}
            {rightText ? <Text style={sm.rightText}>{rightText}</Text> : null}
          </View>

          {/* Bottom: event info + NFC mark */}
          <View style={sm.bottom}>
            <Text style={sm.title} numberOfLines={1}>{eventTitle}</Text>
            <View style={sm.bottomRow}>
              <View style={{ flex: 1 }}>
                <Text style={sm.meta}>{eventDate} · {eventTime}</Text>
                {subLabel ? (
                  <View style={sm.subRow}>
                    <Ionicons name="lock-closed-outline" size={12} color="rgba(255,255,255,0.55)" />
                    <Text style={sm.subLabel}>{subLabel}</Text>
                  </View>
                ) : null}
                {hasCircle ? (
                  <TouchableOpacity
                    style={sm.circleBadge}
                    onPress={(e: any) => { e.stopPropagation(); router.push(`/circle/${circleId}`); }}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="people" size={13} color="rgba(123,77,255,0.90)" />
                    <Text style={sm.circleText}>{circleClaimed}/{circleTotal} claimed</Text>
                    <Ionicons name="chevron-forward" size={11} color="rgba(255,255,255,0.40)" />
                  </TouchableOpacity>
                ) : null}
              </View>

              {/* NFC mark — bottom right */}
              <Image
                source={require('../../assets/images/echo_nfc_mark.png')}
                style={sm.nfcMark}
                resizeMode="contain"
              />
            </View>
          </View>
        </LinearGradient>
      </ImageBackground>
    </TouchableOpacity>
  );
}

// ─── Active Card Styles ─────────────────────────────────────────────────────

const s = StyleSheet.create({
  wrap: { marginHorizontal: 20, position: 'relative' },
  border: { borderRadius: 28, padding: 1.5 },
  notchLeft: {
    position: 'absolute', left: -8, top: '62%',
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: colors.bg, zIndex: 10,
  } as ViewStyle,
  notchRight: {
    position: 'absolute', right: -8, top: '62%',
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: colors.bg, zIndex: 10,
  } as ViewStyle,
  perfRow: {
    position: 'absolute', left: 12, right: 12, top: '64%',
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    zIndex: 5,
  } as ViewStyle,
  perfDot: {
    width: 3, height: 3, borderRadius: 1.5,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  imageWrap: {
    minHeight: 360, borderRadius: 26, overflow: 'hidden',
    backgroundColor: '#11151D',
  },
  image: { opacity: 0.85, borderRadius: 26 },
  overlay: {
    flex: 1, paddingHorizontal: 22, paddingTop: 22, paddingBottom: 20,
    justifyContent: 'space-between',
  },

  // Top row
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999,
    backgroundColor: 'rgba(12,18,26,0.66)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
  },
  statusText: { fontSize: 13, fontWeight: '700', color: 'rgba(240,255,245,0.95)', letterSpacing: 0.5 },
  topRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ageBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    minWidth: 44, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999,
    backgroundColor: 'rgba(12,18,26,0.62)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
  },
  ageBadgeVerified: { backgroundColor: 'rgba(16,185,129,0.15)', borderColor: '#10B981' },
  ageText: { fontSize: 13, fontWeight: '700', color: '#FFF' },
  ageTextVerified: { color: '#10B981' },
  menuBtn: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.28)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },

  // Content
  contentBlock: { marginTop: 'auto', alignItems: 'center', paddingBottom: 8 },
  title: { fontSize: 23, lineHeight: 30, fontWeight: '700', color: '#FFF', textAlign: 'center' },
  meta: { marginTop: 10, fontSize: 18, fontWeight: '600', color: 'rgba(255,255,255,0.92)', textAlign: 'center' },
  location: { marginTop: 8, fontSize: 16, fontWeight: '500', color: 'rgba(255,255,255,0.84)', textAlign: 'center' },

  // Bottom strip
  bottomBlock: { marginTop: 24 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.12)', marginBottom: 14 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  energyRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, opacity: 0.92 },
  summaryText: { fontSize: 14, fontWeight: '500', color: 'rgba(255,255,255,0.80)', flex: 1 },

  // NFC mark — consistent across active + upcoming cards
  nfcMarkWrap: { marginLeft: 'auto' },
  nfcMark: { width: 26, height: 26, opacity: 0.65 },

  // Circle CTA
  circleCta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginTop: 14, paddingVertical: 12, paddingHorizontal: 18,
    borderRadius: 14, backgroundColor: 'rgba(123,77,255,0.12)',
    borderWidth: 1, borderColor: 'rgba(123,77,255,0.25)',
  },
  circleCtaText: { fontSize: 14, fontWeight: '700', color: 'rgba(123,77,255,0.95)', flex: 1 },
});

// ─── SmallTicketCard Styles ─────────────────────────────────────────────────

const sm = StyleSheet.create({
  wrap: {
    marginHorizontal: 20, marginTop: 14, borderRadius: 20, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  card: { minHeight: 160 },
  bgImage: { resizeMode: 'cover', borderRadius: 20, opacity: 0.85 },
  overlay: { flex: 1, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 16, justifyContent: 'space-between' },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  agePill: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', backgroundColor: 'rgba(0,0,0,0.40)',
  },
  agePillText: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.82)' },
  rightText: {
    fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.80)',
    backgroundColor: 'rgba(0,0,0,0.30)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
  },
  bottom: { marginTop: 'auto' as ViewStyle['marginTop'] },
  bottomRow: { flexDirection: 'row', alignItems: 'flex-end' },
  title: { fontSize: 18, fontWeight: '700', color: '#FFF' },
  meta: { marginTop: 4, fontSize: 13, color: 'rgba(255,255,255,0.75)' },
  subRow: { marginTop: 6, flexDirection: 'row', alignItems: 'center', gap: 5 },
  subLabel: { fontSize: 12, color: 'rgba(255,255,255,0.55)' },
  circleBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start',
    marginTop: 8, paddingVertical: 6, paddingHorizontal: 10,
    borderRadius: 10, backgroundColor: 'rgba(123,77,255,0.12)',
    borderWidth: 1, borderColor: 'rgba(123,77,255,0.25)',
  },
  circleText: { fontSize: 12, fontWeight: '600', color: 'rgba(123,77,255,0.90)' },
  nfcMark: { width: 26, height: 26, opacity: 0.65, marginLeft: 10 },
});
