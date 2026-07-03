import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '../ui';
import { EchoGradientBorder } from './EchoGradientBorder';
import { EchoLogoMark } from './EchoLogoMark';
import { EchoNfcGlyph } from './EchoNfcGlyph';
import { EchoPassStatusBadge } from './EchoPassStatusBadge';
import { EchoVerificationPill } from './EchoVerificationPill';
import type { EchoWalletPass } from '../../services/appleWalletPassService';
import { STATUS_COPY } from '../../services/appleWalletPassService';

/**
 * EchoEventTicketCard
 * ═══════════════════
 * Horizontal Event Ticket variation per spec (Image 2 — EVENT TICKET VARIATION).
 *
 * Layout:
 *   ┌────────────────────────────────────────────────────────┐
 *   │ ECHO                               🛡️ ENTRY READY     │
 *   │ Event Title                                            │
 *   │ Venue · Date · Time                                    │
 *   │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
 *   │ ((•)) Ready to Tap         🛡 21+ VERIFIED    📶 NFC   │
 *   │       Secure NFC access    General Admission           │
 *   │                            Entry Ready                  │
 *   └────────────────────────────────────────────────────────┘
 *
 * Used for purchased event tickets where the event metadata is the focal point,
 * not the access pass itself.
 */
export function EchoEventTicketCard({ pass }: { pass: EchoWalletPass }) {
  const copy = STATUS_COPY[pass.status];
  const disabled = !!copy.locked;
  const showAge = pass.ageRequirement && pass.ageRequirement !== 'none' && pass.ageVerified;
  const eventName = pass.eventName || pass.title;
  const venueLine = pass.venueName && pass.eventDateTime
    ? `${pass.venueName}  ·  ${pass.eventDateTime}`
    : pass.venueName || pass.eventDateTime || pass.subtitle;

  return (
    <EchoGradientBorder radius={22} stroke={1.2} style={s.outer}>
      <LinearGradient
        colors={disabled ? ['#0E1015', '#0B0D12'] : ['#101217', '#0E1015', '#0A0C11']}
        style={s.card}
      >
        {/* Top: wordmark + status badge */}
        <View style={s.topRow}>
          <EchoLogoMark width={60} height={20} />
          <EchoPassStatusBadge status={pass.status} compact />
        </View>

        {/* Event title + venue */}
        <View style={s.eventBlock}>
          <Text style={[s.eventTitle, disabled && s.muted]} numberOfLines={1}>{eventName}</Text>
          {venueLine ? (
            <Text style={s.venueLine} numberOfLines={1}>{venueLine}</Text>
          ) : null}
        </View>

        {/* Divider */}
        <View style={s.divider} />

        {/* Bottom row: NFC indicator + Ready state + Age pill + Tier */}
        <View style={s.bottomRow}>
          <View style={s.nfcBlock}>
            <EchoNfcGlyph size={34} active={!disabled} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={[s.readyLabel, disabled && s.muted]}>{copy.main}</Text>
              <Text style={s.readySub} numberOfLines={1}>{copy.sub}</Text>
            </View>
          </View>

          <View style={s.metaBlock}>
            {showAge ? <EchoVerificationPill label={`${pass.ageRequirement} VERIFIED`} /> : null}
            {pass.ticketTier ? (
              <View style={{ alignItems: 'flex-end', marginTop: showAge ? 6 : 0 }}>
                <Text style={s.tierLabel}>{pass.ticketTier}</Text>
                <Text style={s.tierSub}>Entry Ready</Text>
              </View>
            ) : null}
          </View>
        </View>
      </LinearGradient>
    </EchoGradientBorder>
  );
}

const s = StyleSheet.create({
  outer: { width: '100%', shadowColor: '#7657FF', shadowOpacity: 0.14, shadowRadius: 18, shadowOffset: { width: 0, height: 8 } },
  card: { padding: 16, gap: 12 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  eventBlock: { gap: 4 },
  eventTitle: { fontSize: 22, fontWeight: '900', color: '#F5F7FB', letterSpacing: -0.4 },
  venueLine: { fontSize: 12.5, fontWeight: '700', color: 'rgba(245,247,251,0.62)' },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(255,255,255,0.10)' },
  bottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  nfcBlock: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  readyLabel: { fontSize: 15, fontWeight: '800', color: '#F5F7FB' },
  readySub: { fontSize: 11.5, fontWeight: '600', color: 'rgba(245,247,251,0.55)' },
  metaBlock: { alignItems: 'flex-end' },
  tierLabel: { fontSize: 12, fontWeight: '800', color: '#F5F7FB' },
  tierSub: { fontSize: 10.5, fontWeight: '700', color: 'rgba(245,247,251,0.50)', marginTop: 2 },
  muted: { opacity: 0.45 },
});

export default EchoEventTicketCard;
