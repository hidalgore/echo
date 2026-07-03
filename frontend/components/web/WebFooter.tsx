/**
 * ECHO WebFooter — global footer
 * Locked v59 sections: Platform / Host / Trust / Nonprofit / Portals / Trust strip.
 */
import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';

type Col = { title: string; links: { label: string; href: Href }[] };

const COLUMNS: Col[] = [
  {
    title: 'For Attendees',
    links: [
      { label: 'Explore Events', href: '/search' as Href },
      { label: 'How It Works', href: '/trust' as Href },
      { label: 'ECHO Circle', href: '/search' as Href },
      { label: 'Your Wallet', href: '/wallet' as Href },
    ],
  },
  {
    title: 'For Hosts',
    links: [
      { label: 'Start Hosting', href: '/host' as Href },
      { label: 'Host Dashboard', href: '/host/dashboard' as Href },
      { label: 'Create Event', href: '/host/create-event' as Href },
      { label: 'Reports & Payouts', href: '/host/reports' as Href },
    ],
  },
  {
    title: 'Trust',
    links: [
      { label: 'Trust & Access', href: '/trust' as Href },
      { label: 'Age Verification', href: '/verify-age' as Href },
      { label: 'Wallet & Entry', href: '/wallet' as Href },
      { label: 'Refund Policy', href: '/trust' as Href },
    ],
  },
  {
    title: 'Nonprofit',
    links: [
      { label: 'Donation Tools', href: '/nonprofits' as Href },
      { label: 'Verified Causes', href: '/nonprofits' as Href },
      { label: 'Transparency', href: '/nonprofits' as Href },
    ],
  },
  {
    title: 'Portals',
    links: [
      { label: 'Attendee Sign In', href: '/login' as Href },
      { label: 'Host Sign In', href: '/host/login' as Href },
    ],
  },
];

const TRUST_BADGES = [
  { icon: 'shield-checkmark' as const, label: 'Secure checkout' },
  { icon: 'wallet' as const, label: 'Wallet-ready' },
  { icon: 'flash' as const, label: 'NFC + QR' },
  { icon: 'finger-print' as const, label: 'Verified hosts' },
];

export function WebFooter() {
  const { width } = useWindowDimensions();
  const isCompact = width < 880;
  if (Platform.OS !== 'web') return null;

  return (
    <View style={styles.outer}>
      <View style={styles.inner}>
        {/* Brand statement */}
        <View style={[styles.topRow, isCompact && styles.topRowCompact]}>
          <View style={styles.brandCol}>
            <Image source={require('../../assets/images/echo_wordmark.png')} style={styles.wordmark} resizeMode="contain" />
            <Text style={styles.brandStatement}>
              ECHO is the premium access layer for culture-driven events — built for trusted discovery, secure checkout,
              faster entry, and smarter host closeout.
            </Text>
          </View>

          <View style={[styles.colsWrap, isCompact && styles.colsWrapCompact]}>
            {COLUMNS.map((col) => (
              <View key={col.title} style={styles.col}>
                <Text style={styles.colTitle}>{col.title}</Text>
                {col.links.map((l) => (
                  <TouchableOpacity key={l.label} activeOpacity={0.7} onPress={() => router.push(l.href as never)}>
                    <Text style={styles.colLink}>{l.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </View>
        </View>

        {/* Trust strip */}
        <View style={styles.trustStrip}>
          {TRUST_BADGES.map((b) => (
            <View key={b.label} style={styles.badge}>
              <Ionicons name={b.icon} size={14} color="rgba(255,255,255,0.85)" />
              <Text style={styles.badgeText}>{b.label}</Text>
            </View>
          ))}
        </View>

        {/* Bottom */}
        <View style={styles.bottomRow}>
          <Text style={styles.copyText}>© {new Date().getFullYear()} ECHO. All rights reserved.</Text>
          <View style={styles.bottomLinksRow}>
            <Text style={styles.bottomLink}>Privacy</Text>
            <Text style={styles.bottomLink}>Terms</Text>
            <Text style={styles.bottomLink}>Cookies</Text>
            <Text style={styles.bottomLink}>Accessibility</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    width: '100%',
    paddingHorizontal: 24,
    paddingVertical: 64,
    backgroundColor: '#08080A',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  inner: { alignSelf: 'center', width: '100%', maxWidth: 1240 },
  topRow: { flexDirection: 'row', gap: 48, alignItems: 'flex-start' },
  topRowCompact: { flexDirection: 'column', gap: 32 },
  brandCol: { flex: 1, maxWidth: 320 },
  wordmark: { width: 96, height: 26, marginBottom: 16 },
  brandStatement: { color: 'rgba(255,255,255,0.55)', fontSize: 13, lineHeight: 20 },
  colsWrap: { flex: 2, flexDirection: 'row', flexWrap: 'wrap', gap: 32 },
  colsWrapCompact: { gap: 24 },
  col: { minWidth: 140, gap: 10 },
  colTitle: { color: '#FFFFFF', fontSize: 13, fontWeight: '700', letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 4 },
  colLink: { color: 'rgba(255,255,255,0.62)', fontSize: 14, paddingVertical: 2 },
  trustStrip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 40,
    paddingTop: 24,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  badgeText: { color: 'rgba(255,255,255,0.78)', fontSize: 12, fontWeight: '500' },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.04)',
    flexWrap: 'wrap',
    gap: 12,
  },
  copyText: { color: 'rgba(255,255,255,0.40)', fontSize: 12 },
  bottomLinksRow: { flexDirection: 'row', gap: 18 },
  bottomLink: { color: 'rgba(255,255,255,0.50)', fontSize: 12 },
});

export default WebFooter;
