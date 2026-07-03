/**
 * Circle Success — v21 (Theme-Migrated + Polished)
 * ════════════════════════════════════════════════
 * Post-payment confirmation → Invite Friends or View in Wallet.
 * Animated gradient ring entrance.
 */
import React, { useEffect, useRef } from 'react';
import {
  View, StyleSheet, Animated, StatusBar, TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../../components/ui';
import { useCircleStore } from '../../stores/circleStore';
import { deriveCounts } from '../../services/circleStateModel';
import { fmtPrice } from '../../services/pricingEngine';
import { useDynamicTheme } from '../../theme/dynamicTheme';

export default function CircleSuccessScreen() {
  const { colors: c, isDark } = useDynamicTheme();
  const insets = useSafeAreaInsets();
  const { circle } = useCircleStore();

  const ringScale = useRef(new Animated.Value(0.4)).current;
  const ringOpacity = useRef(new Animated.Value(0)).current;
  const contentY = useRef(new Animated.Value(30)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const ctaOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(ringScale, { toValue: 1, tension: 50, friction: 8, useNativeDriver: true }),
        Animated.timing(ringOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(contentY, { toValue: 0, duration: 350, useNativeDriver: true }),
        Animated.timing(contentOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
      ]),
      Animated.timing(ctaOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();
  }, []);

  if (!circle) {
    router.replace('/(tabs)/wallet');
    return null;
  }

  const counts = deriveCounts(circle);
  const spotsWaiting = counts.total - counts.claimed;

  return (
    <View style={[s.root, { paddingTop: insets.top, backgroundColor: c.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <LinearGradient
        colors={isDark
          ? ['rgba(123,77,255,0.12)', 'rgba(32,199,255,0.08)', 'rgba(15,17,21,0)']
          : ['rgba(91,63,217,0.08)', 'rgba(14,165,214,0.05)', 'rgba(245,243,238,0)']
        }
        style={s.ambientGlow}
      />

      {/* Gradient Ring */}
      <Animated.View style={[s.ringWrap, { opacity: ringOpacity, transform: [{ scale: ringScale }] }]}>
        <LinearGradient
          colors={['#20C7FF', '#7B4DFF', '#E63DAD', '#FF5A6E', '#FF7A1A', '#FFC247']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.ringOuter}
        >
          <View style={[s.ringInner, { backgroundColor: c.bg }]}>
            <Ionicons name="checkmark" size={40} color="#10B981" />
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Confirmation copy */}
      <Animated.View style={[s.content, { opacity: contentOpacity, transform: [{ translateY: contentY }] }]}>
        <Text style={[s.headline, { color: c.text }]}>Your ticket is confirmed</Text>
        <Text style={[s.subline, { color: c.textLow }]}>
          {spotsWaiting} Circle {spotsWaiting === 1 ? 'spot is' : 'spots are'} now waiting to be claimed
        </Text>

        {/* Event pill */}
        <View style={[s.eventPill, { backgroundColor: c.surface2, borderColor: c.hairline }]}>
          <Ionicons name="calendar-outline" size={16} color={c.textMuted} />
          <Text style={[s.eventPillText, { color: c.textMedium }]}>{circle.eventTitle}</Text>
        </View>

        {/* Key facts */}
        <View style={s.factRow}>
          <View style={s.factItem}>
            <Text style={[s.factValue, { color: c.text }]}>{fmtPrice(circle.pricePerTicket)}</Text>
            <Text style={[s.factLabel, { color: c.textMuted }]}>Your ticket</Text>
          </View>
          <View style={[s.factDivider, { backgroundColor: c.hairline }]} />
          <View style={s.factItem}>
            <Text style={[s.factValue, { color: c.text }]}>{spotsWaiting}</Text>
            <Text style={[s.factLabel, { color: c.textMuted }]}>Spots open</Text>
          </View>
          <View style={[s.factDivider, { backgroundColor: c.hairline }]} />
          <View style={s.factItem}>
            <Text style={[s.factValue, { color: c.text }]}>60 min</Text>
            <Text style={[s.factLabel, { color: c.textMuted }]}>Claim window</Text>
          </View>
        </View>

        {/* Trust reassurance */}
        <View style={s.trustRow}>
          <Ionicons name="shield-checkmark-outline" size={14} color="#10B981" />
          <Text style={s.trustText}>Your ticket is secured even if friends don't join</Text>
        </View>
      </Animated.View>

      {/* CTAs */}
      <Animated.View style={[s.ctaGroup, { opacity: ctaOpacity, paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={s.primaryCta}
          onPress={() => router.replace({ pathname: '/circle/invite', params: { id: circle.id } })}
          activeOpacity={0.88}
        >
          <LinearGradient
            colors={['#20C7FF', '#7B4DFF', '#E63DAD']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={s.primaryCtaGradient}
          >
            <Ionicons name="people-outline" size={18} color="#FFFFFF" />
            <Text style={s.primaryCtaText}>Invite Friends</Text>
            <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.70)" />
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.secondaryCta, { backgroundColor: c.surface2, borderColor: c.hairline }]}
          onPress={() => router.replace('/(tabs)/wallet')}
          activeOpacity={0.7}
        >
          <Text style={[s.secondaryCtaText, { color: c.textMedium }]}>Skip — invite later from Wallet</Text>
        </TouchableOpacity>

        <View style={s.secureRow}>
          <Ionicons name="lock-closed-outline" size={12} color={c.textMuted} />
          <Text style={[s.secureText, { color: c.textMuted }]}>Secure checkout</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, alignItems: 'center' },
  ambientGlow: { position: 'absolute', top: 0, left: 0, right: 0, height: 400 },

  ringWrap: { marginTop: 60, marginBottom: 28 },
  ringOuter: { width: 120, height: 120, borderRadius: 60, padding: 4 },
  ringInner: {
    flex: 1, borderRadius: 60,
    alignItems: 'center', justifyContent: 'center',
  },

  content: { alignItems: 'center', paddingHorizontal: 32 },
  headline: { fontSize: 26, fontWeight: '700', textAlign: 'center', marginBottom: 10 },
  subline: { fontSize: 15, lineHeight: 22, textAlign: 'center', marginBottom: 20 },

  eventPill: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999,
    borderWidth: 1, marginBottom: 24,
  },
  eventPillText: { fontSize: 14, fontWeight: '600' },

  factRow: { flexDirection: 'row', alignItems: 'center', gap: 20, marginBottom: 20 },
  factItem: { alignItems: 'center', gap: 4 },
  factValue: { fontSize: 18, fontWeight: '700' },
  factLabel: { fontSize: 11 },
  factDivider: { width: 1, height: 32 },

  trustRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12,
    backgroundColor: 'rgba(16,185,129,0.06)',
  },
  trustText: { fontSize: 13, color: 'rgba(16,185,129,0.80)' },

  ctaGroup: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 20, gap: 10 },
  primaryCta: { borderRadius: 999, overflow: 'hidden' },
  primaryCtaGradient: {
    height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  primaryCtaText: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
  secondaryCta: {
    alignItems: 'center', paddingVertical: 12, borderRadius: 16, borderWidth: 1,
  },
  secondaryCtaText: { fontSize: 14, fontWeight: '600' },
  secureRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 4,
  },
  secureText: { fontSize: 12 },
});
