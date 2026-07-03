/**
 * ECHO Circle Preview — visual block illustrating group buying.
 * Locked language: "Bring your circle." Leader pays first, then invites.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { brand } from '../../theme/brand';

type Slot = { state: 'paid' | 'joined' | 'invited' | 'empty'; initial?: string };

const DEFAULT_SLOTS: Slot[] = [
  { state: 'paid', initial: 'S' },
  { state: 'paid', initial: 'M' },
  { state: 'joined', initial: 'J' },
  { state: 'invited', initial: 'A' },
  { state: 'empty' },
  { state: 'empty' },
];

interface Props {
  slots?: Slot[];
  totalLabel?: string;
}

export function EchoCirclePreview({ slots = DEFAULT_SLOTS, totalLabel = 'The Midnight Tour · 4 of 6 in' }: Props) {
  return (
    <View style={styles.outer}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>ECHO CIRCLE</Text>
          <Text style={styles.title}>Bring your circle.</Text>
          <Text style={styles.body}>
            Lead the room. You pay first to lock the group, then invite up to seven others. Each member pays their own
            share, individually — never split awkwardly.
          </Text>
        </View>
      </View>

      <View style={styles.slotsRow}>
        {slots.map((slot, i) => (
          <View key={i} style={styles.slotWrap}>
            <View style={[styles.slot, slot.state === 'empty' && styles.slotEmpty]}>
              {slot.state === 'paid' && (
                <LinearGradient
                  colors={[brand.cyan, brand.primary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFillObject}
                />
              )}
              {slot.state === 'joined' && <View style={[StyleSheet.absoluteFillObject, styles.joinedFill]} />}
              {slot.state === 'invited' && <View style={[StyleSheet.absoluteFillObject, styles.invitedFill]} />}
              <Text style={styles.slotInitial}>{slot.initial || '+'}</Text>
              {slot.state === 'paid' && (
                <View style={styles.checkBadge}>
                  <Ionicons name="checkmark" size={9} color="#0E0E12" />
                </View>
              )}
            </View>
            <Text style={styles.slotLabel}>
              {slot.state === 'paid' ? 'Paid' : slot.state === 'joined' ? 'Joined' : slot.state === 'invited' ? 'Invited' : 'Open'}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.footerRow}>
        <View style={styles.timerPill}>
          <Ionicons name="time" size={12} color={brand.cyanAccessible} />
          <Text style={styles.timerText}>52 min remaining</Text>
        </View>
        <Text style={styles.totalText}>{totalLabel}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    borderRadius: 24,
    padding: 24,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: 24,
  },
  header: { gap: 4 },
  eyebrow: { color: brand.cyanAccessible, fontSize: 11, fontWeight: '800', letterSpacing: 1.6 },
  title: { color: '#FFFFFF', fontSize: 24, fontWeight: '700', letterSpacing: -0.3, marginTop: 6 },
  body: { color: 'rgba(255,255,255,0.62)', fontSize: 14, lineHeight: 21, marginTop: 8, maxWidth: 460 },
  slotsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  slotWrap: { alignItems: 'center', gap: 6 },
  slot: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  slotEmpty: {
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'transparent',
  },
  joinedFill: { backgroundColor: 'rgba(123,77,255,0.45)' },
  invitedFill: { backgroundColor: 'rgba(255,255,255,0.04)' },
  slotInitial: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  checkBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotLabel: { color: 'rgba(255,255,255,0.55)', fontSize: 10, fontWeight: '600', letterSpacing: 0.2 },
  footerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 },
  timerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(32,199,255,0.10)',
  },
  timerText: { color: brand.cyanAccessible, fontSize: 11, fontWeight: '700' },
  totalText: { color: 'rgba(255,255,255,0.55)', fontSize: 12, fontWeight: '500' },
});

export default EchoCirclePreview;
