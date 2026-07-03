/**
 * ECHO Access Pass Preview — premium visual block.
 *
 * Locked v59 rule:
 * - If user has a purchased ticket, background uses next upcoming event flyer.
 * - If no ticket, background stays premium charcoal.
 */
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { brand } from '../../theme/brand';

interface Props {
  ownerName?: string;
  /** Optional event flyer image. If absent, pass uses charcoal. */
  flyerUrl?: string | null;
  eventTitle?: string;
  eventDate?: string;
  venue?: string;
  /** Tighter style for inline previews */
  compact?: boolean;
}

export function EchoAccessPassPreview({
  ownerName = 'Your Name',
  flyerUrl = null,
  eventTitle = 'No active ticket',
  eventDate = '—',
  venue = 'Pass activates on purchase',
  compact = false,
}: Props) {
  return (
    <View style={[styles.cardOuter, compact && styles.cardOuterCompact]}>
      <View style={styles.cardInner}>
        {flyerUrl ? (
          <Image source={{ uri: flyerUrl }} style={styles.bgImage} resizeMode="cover" />
        ) : (
          <LinearGradient
            colors={['#0F0F14', '#1A1A22', '#0F0F14']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.bgImage}
          />
        )}
        <LinearGradient
          colors={['rgba(8,8,10,0.30)', 'rgba(8,8,10,0.90)']}
          locations={[0.2, 1]}
          style={styles.scrim}
        />

        {/* Top row: ECHO mark + ACCESS PASS */}
        <View style={styles.topRow}>
          <View style={styles.markRow}>
            <View style={styles.markDot} />
            <Text style={styles.markText}>ECHO</Text>
          </View>
          <Text style={styles.passLabel}>ACCESS PASS</Text>
        </View>

        {/* Center identity */}
        <View style={styles.identityBlock}>
          <Text style={styles.passName}>{ownerName}</Text>
          <Text style={styles.passEventTitle} numberOfLines={1}>{eventTitle}</Text>
          <Text style={styles.passMeta}>{eventDate} · {venue}</Text>
        </View>

        {/* Bottom row: entry icons */}
        <View style={styles.bottomRow}>
          <View style={styles.entryChip}>
            <Ionicons name="flash" size={12} color="#FFFFFF" />
            <Text style={styles.entryChipText}>NFC primary</Text>
          </View>
          <View style={styles.entryChip}>
            <Ionicons name="qr-code-outline" size={12} color="#FFFFFF" />
            <Text style={styles.entryChipText}>QR fallback</Text>
          </View>
          <View style={[styles.entryChip, styles.entryChipGlow]}>
            <Ionicons name="wallet" size={12} color="#FFFFFF" />
            <Text style={styles.entryChipText}>Wallet-ready</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardOuter: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 28,
    padding: 2,
    backgroundColor: 'rgba(255,255,255,0.10)',
    // soft glow
    shadowColor: brand.primary,
    shadowOpacity: 0.25,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
  },
  cardOuterCompact: { maxWidth: 320 },
  cardInner: {
    borderRadius: 26,
    overflow: 'hidden',
    aspectRatio: 1.586, // credit-card / wallet-pass ratio
    backgroundColor: '#0E0E12',
    padding: 18,
    justifyContent: 'space-between',
  },
  bgImage: { ...StyleSheet.absoluteFillObject },
  scrim: { ...StyleSheet.absoluteFillObject },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  markRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  markDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: brand.primary },
  markText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800', letterSpacing: 2 },
  passLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },
  identityBlock: { gap: 4 },
  passName: { color: '#FFFFFF', fontSize: 14, fontWeight: '500', opacity: 0.85, letterSpacing: 0.2 },
  passEventTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: '800', letterSpacing: -0.3 },
  passMeta: { color: 'rgba(255,255,255,0.72)', fontSize: 12, fontWeight: '500' },
  bottomRow: { flexDirection: 'row', gap: 6 },
  entryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  entryChipGlow: { backgroundColor: 'rgba(123,77,255,0.55)' },
  entryChipText: { color: '#FFFFFF', fontSize: 10, fontWeight: '600', letterSpacing: 0.2 },
});

export default EchoAccessPassPreview;
