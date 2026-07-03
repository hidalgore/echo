import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../ui';

type Mode = 'circle' | 'pay_all';

type Props = {
  quantity: number;
  mode: Mode;
  onChangeMode: (m: Mode) => void;
  onPressInfo: () => void;
};

export function EchoCircleSelector({ quantity, mode, onChangeMode, onPressInfo }: Props) {
  const invites = Math.max(quantity - 1, 0);
  const slideY = useRef(new Animated.Value(16)).current;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.timing(slideY, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[s.wrap, { opacity: fade, transform: [{ translateY: slideY }] }]}>
      {/* ── Primary: ECHO Circle ── */}
      <TouchableOpacity
        style={[s.primaryCard, mode === 'circle' && s.primarySelected]}
        onPress={() => onChangeMode('circle')}
        activeOpacity={0.85}
      >
        {/* Title row */}
        <View style={s.titleRow}>
          <Text style={s.primaryTitle}>ECHO Circle</Text>
          <TouchableOpacity onPress={onPressInfo} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={s.infoBtn}>
            <Ionicons name="information-circle" size={18} color="rgba(140,110,255,0.80)" />
          </TouchableOpacity>
        </View>

        {/* Subcopy */}
        <Text style={s.subcopy}>
          Only pay for your ticket now.{'\n'}Invite friends to claim the rest.
        </Text>

        {/* Meta chips */}
        <View style={s.metaRow}>
          <Chip label={`${quantity} tickets total`} />
          <Chip label="1 due now" />
          <Chip label={`${invites} invite${invites !== 1 ? 's' : ''} after checkout`} />
        </View>

        {/* Trust strip */}
        <View style={s.trustStrip}>
          <TrustItem label="15 min to join" />
          <TrustItem label="Spots release automatically" />
          <TrustItem label="No extra charge to you" />
        </View>
      </TouchableOpacity>

      {/* ── Secondary: Pay for all ── */}
      <TouchableOpacity
        style={[s.secondaryCard, mode === 'pay_all' && s.secondarySelected]}
        onPress={() => onChangeMode('pay_all')}
        activeOpacity={0.85}
      >
        <Text style={s.secondaryTitle}>Pay for all tickets now</Text>
        <Text style={s.secondarySub}>Buy every ticket now and send them later</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Sub-components ──

function Chip({ label }: { label: string }) {
  return (
    <View style={s.chip}>
      <Text style={s.chipText}>{label}</Text>
    </View>
  );
}

function TrustItem({ label }: { label: string }) {
  return (
    <View style={s.trustItem}>
      <Ionicons name="checkmark" size={13} color="rgba(16,185,129,0.80)" />
      <Text style={s.trustText}>{label}</Text>
    </View>
  );
}

// ── Styles ──

const s = StyleSheet.create({
  wrap: { marginHorizontal: 20 },

  // Primary card
  primaryCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 16,
    minHeight: 148,
  },
  primarySelected: {
    borderColor: 'rgba(140,110,255,0.55)',
    shadowColor: 'rgba(140,110,255,0.30)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },

  // Title row
  titleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  primaryTitle: { fontSize: 18, fontWeight: '600', color: '#FFFFFF' },
  infoBtn: { marginLeft: 6, width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },

  // Subcopy
  subcopy: { fontSize: 14, color: 'rgba(255,255,255,0.72)', lineHeight: 20, marginBottom: 12, maxWidth: 310 },

  // Meta chips
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  chip: {
    height: 26, paddingHorizontal: 10, borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.06)', justifyContent: 'center',
  },
  chipText: { fontSize: 12, fontWeight: '500', color: 'rgba(255,255,255,0.70)' },

  // Trust strip
  trustStrip: { gap: 6 },
  trustItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  trustText: { fontSize: 13, color: 'rgba(255,255,255,0.65)' },

  // Secondary card
  secondaryCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginTop: 12,
    minHeight: 84,
    justifyContent: 'center',
  },
  secondarySelected: {
    borderColor: 'rgba(255,255,255,0.25)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  secondaryTitle: { fontSize: 16, fontWeight: '500', color: 'rgba(255,255,255,0.85)' },
  secondarySub: { fontSize: 13, color: 'rgba(255,255,255,0.50)', marginTop: 3 },
});
