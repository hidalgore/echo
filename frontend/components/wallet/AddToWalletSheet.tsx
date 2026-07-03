import React, { useEffect, useState, useMemo } from 'react';
import { View, Modal, StyleSheet, TouchableOpacity, Platform, ActivityIndicator, Animated, ScrollView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '../ui';
import { useDynamicTheme } from '../../theme/dynamicTheme';
import { EchoWalletPassCard } from './EchoWalletPassCard';
import { EchoEventTicketCard } from './EchoEventTicketCard';
import { EchoWatchPassPreview } from './EchoWatchPassPreview';
import type { EchoWalletPass } from '../../services/appleWalletPassService';
import { getPreviewPassForUser } from '../../services/appleWalletPassService';
import { useTicketStore } from '../../stores/ticketStore';
import { useEventStore } from '../../stores/eventStore';

/**
 * AddToWalletSheet (v37 — Scrollable, full premium card, watch preview)
 * ════════════════════════════════════════════════════════════════════
 * Bottom sheet with full ECHO Access Pass preview, scrollable so the entire
 * card is always reachable. Auto-picks pass type/state based on user's tickets.
 *
 * States:
 *   idle    → preview pass + watch + features + CTA
 *   adding  → CTA shows spinner + "Preparing pass…"
 *   success → animated checkmark + done
 *
 * Per Image 1 & 2 spec from canonical brand.
 */

interface AddToWalletSheetProps {
  visible: boolean;
  /** Optional override; if absent, auto-picked from user's tickets. */
  pass?: EchoWalletPass;
  onClose: () => void;
}

type SheetState = 'idle' | 'adding' | 'success';

const { height: SCREEN_H } = Dimensions.get('window');
const SHEET_MAX_HEIGHT = SCREEN_H * 0.88;

export function AddToWalletSheet({ visible, pass, onClose }: AddToWalletSheetProps) {
  const { colors: c } = useDynamicTheme();
  const [state, setState] = useState<SheetState>('idle');
  const [checkScale] = useState(new Animated.Value(0));
  const isIOS = Platform.OS === 'ios';
  const provider = isIOS ? 'Apple Wallet' : 'Google Wallet';

  // Auto-pick pass when none provided (Spec: derive from next upcoming ticket)
  const tickets = useTicketStore((s) => s.tickets);
  const getEventById = useEventStore((s) => s.getEventById);
  const autoPickedPass = useMemo(
    () => getPreviewPassForUser(tickets, getEventById),
    [tickets, getEventById],
  );
  const previewPass = pass || autoPickedPass;
  const isEventTicket = previewPass.type === 'event_ticket';

  useEffect(() => {
    if (!visible) {
      setState('idle');
      checkScale.setValue(0);
    }
  }, [visible, checkScale]);

  const handleAdd = () => {
    setState('adding');
    setTimeout(() => {
      setState('success');
      Animated.spring(checkScale, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }).start();
    }, 1200);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.backdrop}>
        <TouchableOpacity style={s.backdropTouch} activeOpacity={1} onPress={state === 'idle' ? onClose : undefined} />
        <View style={[s.sheet, { backgroundColor: c.bg, borderColor: c.hairline, maxHeight: SHEET_MAX_HEIGHT }]}>
          {/* Grab handle */}
          <View style={[s.handle, { backgroundColor: c.hairline }]} />

          {state === 'success' ? (
            <View style={s.successWrap}>
              <Animated.View style={[s.successCircle, { transform: [{ scale: checkScale }] }]}>
                <LinearGradient
                  colors={['#10B981', '#059669']}
                  style={s.successCircleInner}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name="checkmark" size={48} color="#FFFFFF" />
                </LinearGradient>
              </Animated.View>
              <Text style={[s.successTitle, { color: c.text }]}>Added to {provider}</Text>
              <Text style={[s.successBody, { color: c.textTertiary }]}>
                Your ECHO Access Pass is ready. Open {provider} to view it, or just tap your phone at any ECHO event.
              </Text>
              <TouchableOpacity style={[s.doneBtn, { backgroundColor: c.text }]} onPress={onClose} activeOpacity={0.86}>
                <Text style={[s.doneBtnText, { color: c.bg }]}>Done</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={s.scrollContent}
              bounces={false}
            >
              <Text style={[s.title, { color: c.text }]}>Add to {provider}</Text>
              <Text style={[s.subtitle, { color: c.textTertiary }]}>
                Your ECHO Access Pass works as a secure wallet pass. NFC stays primary; QR is hidden by default and syncs to your verified profile.
              </Text>

              {/* Pass preview — full premium size, never clipped */}
              <View style={s.passWrap}>
                {isEventTicket ? (
                  <EchoEventTicketCard pass={previewPass} />
                ) : (
                  <EchoWalletPassCard pass={previewPass} />
                )}
              </View>

              {/* Watch preview row (image 2 right side) */}
              <View style={s.watchRow}>
                <View style={s.watchLabel}>
                  <Ionicons name="watch-outline" size={14} color={c.textTertiary} />
                  <Text style={[s.watchLabelText, { color: c.textTertiary }]}>Also syncs to Apple Watch</Text>
                </View>
                <EchoWatchPassPreview pass={previewPass} />
              </View>

              {/* Feature row */}
              <View style={s.featureRow}>
                <Feature icon="flash-outline" label="NFC tap entry" c={c} />
                <Feature icon="shield-checkmark-outline" label="Verified profile" c={c} />
                <Feature icon="lock-closed-outline" label="QR hidden" c={c} />
              </View>

              {/* Branded CTA */}
              <TouchableOpacity
                style={[s.addBtn, state === 'adding' && s.addBtnDisabled]}
                onPress={handleAdd}
                activeOpacity={0.92}
                disabled={state === 'adding'}
              >
                {state === 'adding' ? (
                  <>
                    <ActivityIndicator color="#FFFFFF" size="small" />
                    <Text style={s.addBtnText}>Preparing pass…</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name={isIOS ? 'logo-apple' : 'wallet'} size={20} color="#FFFFFF" />
                    <View>
                      <Text style={s.addBtnLabelSmall}>Add to</Text>
                      <Text style={s.addBtnText}>{isIOS ? 'Apple Wallet' : 'Google Wallet'}</Text>
                    </View>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={s.cancelBtn} onPress={onClose} activeOpacity={0.7} disabled={state === 'adding'}>
                <Text style={[s.cancelText, { color: c.textMuted }]}>Not now</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

function Feature({ icon, label, c }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; c: ReturnType<typeof useDynamicTheme>['colors'] }) {
  return (
    <View style={s.feature}>
      <View style={[s.featureIcon, { backgroundColor: c.accentSoft }]}>
        <Ionicons name={icon} size={18} color={c.accent} />
      </View>
      <Text style={[s.featureLabel, { color: c.textTertiary }]} numberOfLines={2}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  backdropTouch: { flex: 1 },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, borderTopWidth: 1, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 32 },
  handle: { width: 44, height: 5, borderRadius: 3, alignSelf: 'center', marginBottom: 12 },

  scrollContent: { paddingBottom: 12, gap: 14 },
  title: { fontSize: 24, fontWeight: '900', letterSpacing: -0.4 },
  subtitle: { fontSize: 14, lineHeight: 20 },
  passWrap: { marginTop: 6 },

  watchRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 4 },
  watchLabel: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  watchLabelText: { fontSize: 12.5, fontWeight: '700' },

  featureRow: { flexDirection: 'row', gap: 8, marginVertical: 4 },
  feature: { flex: 1, alignItems: 'center', gap: 8, paddingVertical: 8 },
  featureIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  featureLabel: { fontSize: 11.5, fontWeight: '700', textAlign: 'center' },

  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 56, borderRadius: 28, backgroundColor: '#000000', marginTop: 8 },
  addBtnDisabled: { opacity: 0.7 },
  addBtnLabelSmall: { color: 'rgba(255,255,255,0.72)', fontSize: 11, fontWeight: '700', letterSpacing: 0.4, textTransform: 'uppercase', lineHeight: 13 },
  addBtnText: { color: '#FFFFFF', fontSize: 17, fontWeight: '800', letterSpacing: -0.2 },

  cancelBtn: { alignItems: 'center', paddingVertical: 12 },
  cancelText: { fontSize: 14, fontWeight: '700' },

  successWrap: { alignItems: 'center', paddingVertical: 24, gap: 14 },
  successCircle: { width: 96, height: 96, borderRadius: 48, overflow: 'hidden' },
  successCircleInner: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  successTitle: { fontSize: 22, fontWeight: '900', letterSpacing: -0.4, marginTop: 8 },
  successBody: { fontSize: 14, lineHeight: 20, textAlign: 'center', paddingHorizontal: 16, marginBottom: 8 },
  doneBtn: { height: 52, paddingHorizontal: 48, borderRadius: 26, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  doneBtnText: { fontSize: 16, fontWeight: '800' },
});

export default AddToWalletSheet;
