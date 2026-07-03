import React from 'react';
import { View, StyleSheet, TouchableOpacity, Modal, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../ui';

type Props = {
  visible: boolean;
  onDismiss: () => void;
};

export function EchoCircleInfoSheet({ visible, onDismiss }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}>
      <TouchableOpacity style={s.scrim} activeOpacity={1} onPress={onDismiss}>
        <View />
      </TouchableOpacity>
      <View style={[s.sheet, { paddingBottom: insets.bottom + 20 }]}>
        {/* Handle */}
        <View style={s.handle} />

        {/* Soundball accent */}
        <View style={s.accentRow}>
          <View style={s.accentDot} />
        </View>

        {/* Title */}
        <Text style={s.title}>What is ECHO Circle?</Text>

        {/* Body */}
        <Text style={s.body}>
          ECHO Circle lets you start a group purchase without paying for everyone upfront.
        </Text>
        <Text style={s.body}>
          You secure your own ticket now, then invite friends to claim theirs. If someone doesn't join in time, their spot is released automatically.
        </Text>

        {/* Benefits */}
        <View style={s.benefits}>
          <Benefit text="Only pay for your ticket now" />
          <Benefit text="Easy invite flow after checkout" />
          <Benefit text="No extra charge for unclaimed spots" />
        </View>

        {/* Dismiss */}
        <TouchableOpacity style={s.gotItBtn} onPress={onDismiss} activeOpacity={0.85}>
          <Text style={s.gotItText}>Got it</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

function Benefit({ text }: { text: string }) {
  return (
    <View style={s.benefitRow}>
      <Ionicons name="checkmark-circle" size={16} color="rgba(59,130,246,0.80)" />
      <Text style={s.benefitText}>{text}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.24)',
  },
  sheet: {
    backgroundColor: 'rgba(28,30,38,0.97)',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderBottomWidth: 0,
    paddingHorizontal: 24,
    paddingTop: 12,
    // Frosted glass approximation
    ...(Platform.OS === 'ios' ? { backdropFilter: 'blur(40px)' } : {}),
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'center',
    marginBottom: 16,
  },
  accentRow: { alignItems: 'flex-end', marginBottom: 4 },
  accentDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(59,130,246,0.20)',
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.35)',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 14,
  },
  body: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.72)',
    lineHeight: 22,
    marginBottom: 10,
  },
  benefits: {
    marginTop: 8,
    marginBottom: 20,
    gap: 10,
  },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  benefitText: { fontSize: 15, color: 'rgba(255,255,255,0.85)', flex: 1 },
  gotItBtn: {
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gotItText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
