import React from 'react';
import { Image, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '../ui';
import { EchoGradientBorder } from './EchoGradientBorder';
import { EchoLogoMark } from './EchoLogoMark';
import { EchoPassStatusBadge } from './EchoPassStatusBadge';
import { EchoVerificationPill } from './EchoVerificationPill';
import type { EchoWalletPass } from '../../services/appleWalletPassService';
import { STATUS_COPY } from '../../services/appleWalletPassService';

export function EchoWalletPassCard({ pass, compact = false }: { pass: EchoWalletPass; compact?: boolean }) {
  const copy = STATUS_COPY[pass.status];
  const disabled = !!copy.locked;
  const showAge = pass.ageRequirement && pass.ageRequirement !== 'none' && pass.ageVerified;
  const hasEventFlyerBackground = !!pass.backgroundImageUrl;
  const bottomTitle = pass.eventName || (pass.type === 'event_ticket' ? pass.eventName : 'ECHO Access');
  const bottomSub = pass.eventName && pass.venueName && pass.eventDateTime
    ? `${pass.venueName} · ${pass.eventDateTime}`
    : pass.type === 'event_ticket'
      ? `${pass.venueName} · ${pass.eventDateTime}`
      : 'Verified profile';
  return (
    <EchoGradientBorder radius={compact ? 22 : 28} stroke={1.2} style={[s.outer, compact && s.outerCompact]}>
      <LinearGradient
        colors={disabled ? ['#111217', '#0D0E13'] : hasEventFlyerBackground ? ['rgba(16,18,23,0.20)', 'rgba(17,18,26,0.72)', 'rgba(11,13,18,0.94)'] : ['#101217', '#11121A', '#0B0D12']}
        style={[s.card, compact && s.cardCompact]}
      >
        {hasEventFlyerBackground ? (
          <>
            <Image source={{ uri: pass.backgroundImageUrl as string }} style={s.flyerBg} resizeMode="cover" />
            <LinearGradient
              colors={['rgba(5,6,10,0.12)', 'rgba(5,6,10,0.60)', 'rgba(5,6,10,0.92)']}
              locations={[0, 0.46, 1]}
              style={s.flyerScrim}
            />
          </>
        ) : null}
        <View style={s.topRow}>
          <EchoLogoMark width={compact ? 58 : 72} height={compact ? 20 : 24} />
          <EchoPassStatusBadge status={pass.status} compact={compact} />
        </View>

        {/* Center brand logo removed — corner EchoLogoMark is the single brand mark.
            Spacer preserves vertical rhythm and lets the event flyer show through. */}
        <View style={s.brandCenter} />

        <View style={s.actionRow}>
          <View style={{ flex: 1 }}>
            <Text style={[s.actionTitle, compact && s.actionTitleCompact, disabled && s.muted]}>{copy.main}</Text>
            <Text style={[s.actionSub, compact && s.actionSubCompact]}>{copy.sub}</Text>
          </View>
        </View>

        {showAge ? (
          <View style={s.pillRow}>
            <EchoVerificationPill label={`${pass.ageRequirement} VERIFIED`} />
          </View>
        ) : null}

        <View style={s.bottomRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.bottomTitle}>{bottomTitle}</Text>
            <Text style={s.bottomSub}>{bottomSub}</Text>
          </View>
          <View style={s.contactlessCircle}>
            <Ionicons name="radio-outline" size={22} color="rgba(245,246,250,0.82)" />
          </View>
        </View>
      </LinearGradient>
    </EchoGradientBorder>
  );
}

const s = StyleSheet.create({
  outer: { width: '100%', shadowColor: '#7657FF', shadowOpacity: 0.16, shadowRadius: 20, shadowOffset: { width: 0, height: 10 } },
  outerCompact: { shadowRadius: 12 },
  card: { minHeight: 238, padding: 18, borderRadius: 27, backgroundColor: '#101217', overflow: 'hidden' },
  cardCompact: { minHeight: 158, padding: 13, borderRadius: 21 },
  flyerBg: { ...StyleSheet.absoluteFillObject, width: undefined, height: undefined, opacity: 0.72 },
  flyerScrim: { ...StyleSheet.absoluteFillObject },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brandCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 76 },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 13, marginTop: 4 },
  actionTitle: { color: '#F5F6FA', fontSize: 24, fontWeight: '800', letterSpacing: -0.3 },
  actionTitleCompact: { fontSize: 17 },
  actionSub: { color: '#A7A9B3', fontSize: 13, marginTop: 2, fontWeight: '600' },
  actionSubCompact: { fontSize: 10.5 },
  muted: { color: '#A7A9B3' },
  pillRow: { alignItems: 'flex-start', marginTop: 11 },
  bottomRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 10 },
  bottomTitle: { color: '#F5F6FA', fontSize: 14, fontWeight: '700' },
  bottomSub: { color: '#A7A9B3', fontSize: 12, marginTop: 2 },
  contactlessCircle: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor: 'rgba(255,255,255,0.20)', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.04)' },
});
