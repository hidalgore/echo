/**
 * CircleInfoSheet — "How Circles Work" educational bottom sheet
 * ══════════════════════════════════════════════════════════════
 * Triggered from "..." menu on Circle screen.
 * Step-by-step explainer: how Circles work, timer, payments, replacements.
 * No business logic — pure informational.
 */
import React from 'react';
import { View, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/tokens';
import { Text } from '../ui';

type Props = {
  visible: boolean;
  onDismiss: () => void;
};

type StepItem = {
  icon: string;
  title: string;
  body: string;
  accent: string;
};

const STEPS: StepItem[] = [
  {
    icon: 'ticket-outline',
    title: 'Leader starts the Circle',
    body: 'Select 2\u20138 tickets at checkout and choose "Start ECHO Circle." You pay for your ticket first \u2014 your friends are never charged until they join.',
    accent: colors.accent,
  },
  {
    icon: 'paper-plane-outline',
    title: 'Invite your group',
    body: 'Send invites via text, email, ECHO search, or share link. Each friend gets a personal invite with a direct link to join and pay for their own ticket.',
    accent: colors.echoBlue,
  },
  {
    icon: 'time-outline',
    title: '1 hour to complete',
    body: 'The Circle timer starts immediately. Your group has 60 minutes to join and pay. Automatic reminders go out at the halfway mark.',
    accent: colors.pendingAmber,
  },
  {
    icon: 'card-outline',
    title: 'Everyone pays their share',
    body: 'Each member pays individually for their own ticket. You are never charged for someone else\u2019s ticket. Tickets go directly to each person\u2019s Wallet.',
    accent: colors.paidGreen,
  },
  {
    icon: 'swap-horizontal-outline',
    title: 'Replace if needed',
    body: 'If someone declines or doesn\u2019t pay, you can replace them \u2014 up to 3 replacements per Circle. Old invites expire instantly.',
    accent: colors.echoPink,
  },
  {
    icon: 'shield-checkmark-outline',
    title: 'You\u2019re always in control',
    body: 'As the Circle leader, you can purchase remaining tickets yourself at any time, or end the Circle. Paid tickets are always yours \u2014 they\u2019re never refunded if the Circle expires.',
    accent: colors.success,
  },
];

const FAQ: Array<{ q: string; a: string }> = [
  {
    q: 'What happens if time runs out?',
    a: 'Already-paid members keep their tickets. Unclaimed spots return to event inventory. You\u2019ll have an option to cover remaining tickets or release them.',
  },
  {
    q: 'Can I cancel the Circle?',
    a: 'Yes. Cancelling triggers immediate auto-refunds to all paid members. Your own ticket is also refunded.',
  },
  {
    q: 'Is my payment info shared?',
    a: 'Never. Each person enters their own payment method. ECHO processes payments individually \u2014 no shared billing.',
  },
];

export function CircleInfoSheet({ visible, onDismiss }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}>
      <TouchableOpacity style={s.scrim} activeOpacity={1} onPress={onDismiss}>
        <View />
      </TouchableOpacity>
      <View style={[s.sheet, { paddingBottom: insets.bottom + 16 }]}>
        <View style={s.handle} />

        <View style={s.headerRow}>
          <Text style={s.title}>How ECHO Circles Work</Text>
          <TouchableOpacity onPress={onDismiss} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close" size={22} color="rgba(255,255,255,0.60)" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={s.subtitle}>
            Split tickets with friends. Everyone pays their share. No one gets stuck with the bill.
          </Text>

          {/* Steps */}
          {STEPS.map((step, i) => (
            <View key={i} style={s.stepRow}>
              <View style={[s.stepIcon, { backgroundColor: step.accent + '18' }]}>
                <Ionicons name={step.icon as never} size={20} color={step.accent} />
              </View>
              <View style={s.stepContent}>
                <Text style={s.stepNum}>Step {i + 1}</Text>
                <Text style={s.stepTitle}>{step.title}</Text>
                <Text style={s.stepBody}>{step.body}</Text>
              </View>
            </View>
          ))}

          {/* FAQ */}
          <View style={s.faqSection}>
            <Text style={s.faqHeader}>Common Questions</Text>
            {FAQ.map((item, i) => (
              <View key={i} style={s.faqItem}>
                <Text style={s.faqQ}>{item.q}</Text>
                <Text style={s.faqA}>{item.a}</Text>
              </View>
            ))}
          </View>

          <View style={s.trustFooter}>
            <Ionicons name="shield-checkmark-outline" size={14} color="rgba(255,255,255,0.35)" />
            <Text style={s.trustText}>Secure payments. NFC-ready tickets. Wallet-first delivery.</Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.40)' },
  sheet: {
    backgroundColor: colors.sheetBg,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderBottomWidth: 0,
    maxHeight: '88%',
  },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.15)', alignSelf: 'center', marginTop: 12, marginBottom: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, marginBottom: 4 },
  title: { fontSize: 20, fontWeight: '700', color: '#FFFFFF' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 24 },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.55)', lineHeight: 20, marginBottom: 20 },
  // Steps
  stepRow: { flexDirection: 'row', marginBottom: 20, gap: 14 },
  stepIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  stepContent: { flex: 1 },
  stepNum: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.35)', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 2 },
  stepTitle: { fontSize: 16, fontWeight: '600', color: 'rgba(255,255,255,0.92)', marginBottom: 4 },
  stepBody: { fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 19 },
  // FAQ
  faqSection: { marginTop: 8, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)', paddingTop: 20 },
  faqHeader: { fontSize: 14, fontWeight: '700', color: 'rgba(255,255,255,0.70)', letterSpacing: 0.3, marginBottom: 16 },
  faqItem: { marginBottom: 16 },
  faqQ: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.82)', marginBottom: 4 },
  faqA: { fontSize: 13, color: 'rgba(255,255,255,0.50)', lineHeight: 19 },
  // Trust
  trustFooter: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' },
  trustText: { fontSize: 12, color: 'rgba(255,255,255,0.35)' },
});
