/**
 * components/security/TrustCenter.tsx
 * ════════════════════════════════════
 * Public Trust Center — web-first (Platform.OS === 'web' gate in the route).
 * Surfaces ECHO's security commitments, certifications, and contact for trust
 * questions. No interactive data — static editorial content.
 *
 * Doctrine: tokens only, a11y on all interactives, no emoji, no colour as sole
 * status signal. Web layout: max-width 680, centred.
 */

import React from 'react';
import { View, Text, ScrollView, StyleSheet, Platform, Linking, Pressable } from 'react-native';
import { COLOR, RADIUS, SPACE, TYPE } from '../../theme/a11yTokens';
import { a11yLink } from '../../theme/a11y';

// ─── Content data ─────────────────────────────────────────────────────────────

const PILLARS = [
  {
    id: 'nfc',
    glyph: '[NFC]',
    title: 'NFC-primary access',
    body: 'Every ECHO ticket is backed by a cryptographically signed NFC credential. Your pass cannot be screenshot-duplicated or printed. Tap — done.',
  },
  {
    id: 'wallet',
    glyph: '[wallet]',
    title: 'Wallet-first security',
    body: 'Tickets live in your phone\'s secure wallet, not a screenshot library. If your device is lost, tickets can be remotely invalidated from your account.',
  },
  {
    id: 'payments',
    glyph: '[lock]',
    title: 'PCI-compliant payments',
    body: 'ECHO never stores raw card data. All payment processing is handled by Stripe, a PCI Level 1 certified provider.',
  },
  {
    id: 'shield',
    glyph: '[shield]',
    title: 'TrustShield bot defence',
    body: 'Our real-time scoring engine blocks scalping bots, duplicate tap attempts, and suspicious checkout patterns before they reach you.',
  },
  {
    id: 'transfer',
    glyph: '[transfer]',
    title: 'Verified transfers only',
    body: 'Ticket transfers require identity confirmation on both sides. Transferred passes are re-keyed — the original credential is permanently invalidated.',
  },
  {
    id: 'privacy',
    glyph: '[eye-off]',
    title: 'Privacy by default',
    body: 'ECHO does not sell your data. Attendance data shared with hosts is anonymised and aggregated. You control every personalisation signal.',
  },
];

const CERTS = [
  { id: 'pci', label: 'Stripe PCI Level 1' },
  { id: 'gdpr', label: 'GDPR Compliant' },
  { id: 'ccpa', label: 'CCPA Compliant' },
  { id: 'wcag', label: 'WCAG 2.1 AA' },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function TrustCenter() {
  const isWeb = Platform.OS === 'web';

  return (
    <View style={s.root}>
      <ScrollView
        contentContainerStyle={[s.scroll, isWeb && s.scrollWeb]}
      >
        {/* Hero */}
        <View style={s.hero}>
          <Text style={s.eyebrow}>ECHO Trust Center</Text>
          <Text style={s.heroTitle}>Your ticket, your security.</Text>
          <Text style={s.heroBody}>
            ECHO is built on the belief that attending an event should feel frictionless and safe — for attendees and hosts alike. Here is how we protect every interaction on the platform.
          </Text>
        </View>

        {/* Pillars */}
        <View style={s.pillarsGrid}>
          {PILLARS.map((p) => (
            <View key={p.id} style={[s.pillarCard, isWeb && s.pillarCardWeb]}>
              <Text style={s.pillarGlyph} accessibilityElementsHidden>{p.glyph}</Text>
              <Text style={s.pillarTitle}>{p.title}</Text>
              <Text style={s.pillarBody}>{p.body}</Text>
            </View>
          ))}
        </View>

        {/* Certifications */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Certifications & Standards</Text>
          <View style={s.certRow}>
            {CERTS.map((c) => (
              <View key={c.id} style={s.certBadge} accessible accessibilityLabel={c.label}>
                <Text style={s.certText}>{c.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Contact */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Report a concern</Text>
          <Text style={s.bodyText}>
            If you have discovered a security vulnerability or have a trust concern, contact our team directly. We respond within 24 hours.
          </Text>
          <Pressable
            style={s.linkRow}
            onPress={() => Linking.openURL('mailto:trust@echo.app')}
            {...a11yLink('Email ECHO Trust team', 'Opens your email client to contact the ECHO Trust team')}
          >
            <Text style={s.linkText}>trust@echo.app</Text>
          </Pressable>
        </View>

        {/* Footer note */}
        <Text style={s.footerNote}>
          ECHO is a product of Echo Access, Inc. This page is updated quarterly. Last updated June 2026.
        </Text>
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLOR.dark },
  scroll: { padding: SPACE[24], paddingBottom: SPACE[48] },
  scrollWeb: {
    maxWidth: 680,
    // @ts-ignore — web only
    alignSelf: 'center',
    width: '100%',
  },

  hero: { marginBottom: SPACE[40] },
  eyebrow: {
    fontSize: TYPE['text-xs'].fontSize, fontWeight: '700', letterSpacing: 1.2,
    textTransform: 'uppercase', color: COLOR.primaryCta, marginBottom: SPACE[8],
  },
  heroTitle: { fontSize: TYPE['text-2xl'].fontSize, lineHeight: TYPE['text-2xl'].lineHeight, fontWeight: '800', color: COLOR.on, marginBottom: SPACE[12] },
  heroBody: { fontSize: TYPE['text-md'].fontSize, lineHeight: TYPE['text-md'].lineHeight, color: COLOR.on2 },

  pillarsGrid: { gap: SPACE[12], marginBottom: SPACE[40] },
  pillarCard: {
    backgroundColor: COLOR.darkCard,
    borderRadius: RADIUS.lg,
    padding: SPACE[24],
    gap: SPACE[8],
  },
  pillarCardWeb: {
    // Web: side-by-side 2-col handled by parent or future CSS grid; keep single col for now.
  },
  pillarGlyph: { fontSize: TYPE['text-lg'].fontSize, color: COLOR.on2 },
  pillarTitle: { fontSize: TYPE['text-md'].fontSize, fontWeight: '700', color: COLOR.on },
  pillarBody: { fontSize: TYPE['text-sm'].fontSize, lineHeight: TYPE['text-sm'].lineHeight, color: COLOR.on2 },

  section: { marginBottom: SPACE[32] },
  sectionTitle: {
    fontSize: TYPE['text-lg'].fontSize, fontWeight: '700', color: COLOR.on, marginBottom: SPACE[16],
  },

  certRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACE[8] },
  certBadge: {
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACE[16], paddingVertical: SPACE[8],
  },
  certText: { fontSize: TYPE['text-sm'].fontSize, color: COLOR.on, fontWeight: '600' },

  bodyText: { fontSize: TYPE['text-md'].fontSize, lineHeight: TYPE['text-md'].lineHeight, color: COLOR.on2, marginBottom: SPACE[12] },

  linkRow: { alignSelf: 'flex-start' },
  linkText: { fontSize: TYPE['text-md'].fontSize, color: COLOR.primaryCta, fontWeight: '700', textDecorationLine: 'underline' },

  footerNote: {
    fontSize: TYPE['text-xs'].fontSize, color: COLOR.on2,
    textAlign: 'center', marginTop: SPACE[40], lineHeight: TYPE['text-xs'].lineHeight,
  },
});
