/**
 * ECHO — AccessStateChip (v59.4, web)
 * ════════════════════════════════════
 * The five Door Mode validation states for the NFC access section.
 * Accessibility rule: state is conveyed by glyph + label + description,
 * never color alone. No emoji (doctrine) — glyphs are drawn shapes.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../ui/Text';

export type AccessState =
  | 'granted' | 'wrong_zone' | 'already_checked_in' | 'age_check' | 'staff_review';

interface StateMeta {
  label: string;
  description: string;
  tint: string;
  glyph: 'check' | 'cross' | 'repeat' | 'shield' | 'eye';
}

const STATES: Record<AccessState, StateMeta> = {
  granted: {
    label: 'Access Granted',
    description: 'Credential valid for this zone. Door opens the moment it reads.',
    tint: '#34D399', glyph: 'check',
  },
  wrong_zone: {
    label: 'Wrong Zone',
    description: 'Valid pass, wrong area. Staff see exactly which zone it unlocks.',
    tint: '#FFB45C', glyph: 'cross',
  },
  already_checked_in: {
    label: 'Already Checked In',
    description: 'Duplicate admission stopped cold, with the original scan time.',
    tint: '#E63DAD', glyph: 'repeat',
  },
  age_check: {
    label: 'ID / Age Check Required',
    description: 'Flags 21+ verification at the door without exposing personal data.',
    tint: '#7B4DFF', glyph: 'shield',
  },
  staff_review: {
    label: 'Staff Review',
    description: 'Edge cases route to a human with full context, not a guess.',
    tint: '#20C7FF', glyph: 'eye',
  },
};

function Glyph({ kind, tint }: { kind: StateMeta['glyph']; tint: string }) {
  // Minimal drawn glyphs — keeps react-native-svg out of the dependency path.
  switch (kind) {
    case 'check':
      return (
        <View style={glyphStyles.box}>
          <View style={[glyphStyles.checkShort, { backgroundColor: tint }]} />
          <View style={[glyphStyles.checkLong, { backgroundColor: tint }]} />
        </View>
      );
    case 'cross':
      return (
        <View style={glyphStyles.box}>
          <View style={[glyphStyles.barA, { backgroundColor: tint }]} />
          <View style={[glyphStyles.barB, { backgroundColor: tint }]} />
        </View>
      );
    case 'repeat':
      return <View style={[glyphStyles.ringThick, { borderColor: tint }]} />;
    case 'shield':
      return (
        <View style={[glyphStyles.shield, { borderColor: tint }]}>
          <View style={[glyphStyles.shieldDot, { backgroundColor: tint }]} />
        </View>
      );
    case 'eye':
      return (
        <View style={[glyphStyles.ring, { borderColor: tint }]}>
          <View style={[glyphStyles.pupil, { backgroundColor: tint }]} />
        </View>
      );
  }
}

export function AccessStateChip({ state }: { state: AccessState }) {
  const meta = STATES[state];
  return (
    <View
      style={styles.card}
      accessible
      accessibilityLabel={`${meta.label}. ${meta.description}`}
    >
      <View style={[styles.iconWrap, { borderColor: meta.tint }]}>
        <Glyph kind={meta.glyph} tint={meta.tint} />
      </View>
      <View style={styles.copy}>
        <Text variant="label" style={[styles.label, { color: meta.tint }]}>
          {meta.label}
        </Text>
        <Text variant="bodySmall" style={styles.description}>
          {meta.description}
        </Text>
      </View>
    </View>
  );
}

export const ACCESS_STATES: AccessState[] = [
  'granted', 'wrong_zone', 'already_checked_in', 'age_check', 'staff_review',
];

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    borderRadius: 16,
    padding: 16,
    flexGrow: 1,
    flexBasis: 260,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  copy: { flex: 1 },
  label: { fontSize: 14, marginBottom: 4 },
  description: { color: 'rgba(255,255,255,0.64)', fontSize: 13, lineHeight: 19 },
});

const glyphStyles = StyleSheet.create({
  box: { width: 18, height: 18, alignItems: 'center', justifyContent: 'center' },
  checkShort: {
    position: 'absolute', width: 7, height: 2.5, borderRadius: 2,
    transform: [{ rotate: '45deg' }, { translateX: -4 }, { translateY: 3 }],
  },
  checkLong: {
    position: 'absolute', width: 12, height: 2.5, borderRadius: 2,
    transform: [{ rotate: '-50deg' }, { translateX: 2 }],
  },
  barA: { position: 'absolute', width: 16, height: 2.5, borderRadius: 2, transform: [{ rotate: '45deg' }] },
  barB: { position: 'absolute', width: 16, height: 2.5, borderRadius: 2, transform: [{ rotate: '-45deg' }] },
  ring: {
    width: 18, height: 18, borderRadius: 9, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  ringThick: { width: 18, height: 18, borderRadius: 9, borderWidth: 3 },
  pupil: { width: 6, height: 6, borderRadius: 3 },
  shield: {
    width: 16, height: 18, borderWidth: 2, borderTopLeftRadius: 4,
    borderTopRightRadius: 4, borderBottomLeftRadius: 9, borderBottomRightRadius: 9,
    alignItems: 'center', justifyContent: 'center',
  },
  shieldDot: { width: 4, height: 4, borderRadius: 2 },
});
