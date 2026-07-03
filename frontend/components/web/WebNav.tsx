/**
 * ECHO WebNav — Premium top navigation pill
 *
 * Locked behavior (v59):
 * - Always renders on web, never on native.
 * - Pill / glass style on charcoal background.
 * - ECHO mark left, balanced nav center, primary CTA right.
 * - Mobile web collapses to a compact hamburger row.
 */
import React, { useState } from 'react';
import { Image, Platform, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { brand } from '../../theme/brand';

type NavLink = { label: string; href: Href };

const PRIMARY_LINKS: NavLink[] = [
  { label: 'Explore', href: '/search' as Href },
  { label: 'For Hosts', href: '/host' as Href },
  { label: 'Trust', href: '/trust' as Href },
  { label: 'Pricing', href: '/pricing' as Href },
];

const PORTAL_LINKS: NavLink[] = [
  { label: 'Attendee Portal', href: '/login' as Href },
  { label: 'Host Portal', href: '/host/login' as Href },
];

export function WebNav() {
  const { width } = useWindowDimensions();
  const isCompact = width < 920;
  const [menuOpen, setMenuOpen] = useState(false);

  const go = (href: Href) => {
    setMenuOpen(false);
    router.push(href as never);
  };

  if (Platform.OS !== 'web') return null;

  return (
    <View style={styles.outerWrap}>
      <View style={[styles.container, isCompact && styles.containerCompact]}>
        {/* Brand */}
        <TouchableOpacity activeOpacity={0.85} onPress={() => go('/' as Href)} style={styles.brandWrap}>
          <Image source={require('../../assets/images/echo_wordmark.png')} style={styles.wordmark} resizeMode="contain" />
        </TouchableOpacity>

        {/* Center links — desktop only */}
        {!isCompact && (
          <View style={styles.linksRow}>
            {PRIMARY_LINKS.map((l) => (
              <TouchableOpacity key={l.label} activeOpacity={0.7} onPress={() => go(l.href)} style={styles.linkBtn}>
                <Text style={styles.linkText}>{l.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Right cluster */}
        <View style={styles.rightCluster}>
          {!isCompact && (
            <TouchableOpacity activeOpacity={0.8} onPress={() => go('/login' as Href)} style={styles.signInBtn}>
              <Text style={styles.signInText}>Sign In</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity activeOpacity={0.88} onPress={() => go('/host' as Href)} style={styles.ctaBtn}>
            <Text style={styles.ctaText}>Start Hosting</Text>
          </TouchableOpacity>
          {isCompact && (
            <TouchableOpacity activeOpacity={0.8} onPress={() => setMenuOpen((v) => !v)} style={styles.menuBtn}>
              <Ionicons name={menuOpen ? 'close' : 'menu'} size={22} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Mobile drawer */}
      {isCompact && menuOpen && (
        <View style={styles.drawer}>
          {[...PRIMARY_LINKS, ...PORTAL_LINKS].map((l) => (
            <TouchableOpacity key={l.label} activeOpacity={0.7} onPress={() => go(l.href)} style={styles.drawerLink}>
              <Text style={styles.drawerLinkText}>{l.label}</Text>
              <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.5)" />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  outerWrap: {
    width: '100%',
    paddingHorizontal: 24,
    paddingTop: 20,
    position: 'relative',
    zIndex: 100,
  },
  container: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 1240,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(20, 20, 24, 0.72)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  containerCompact: {
    paddingHorizontal: 16,
    gap: 12,
  },
  brandWrap: { flexShrink: 0 },
  wordmark: { width: 96, height: 26 },
  linksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
  linkBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 },
  linkText: { color: 'rgba(255,255,255,0.78)', fontSize: 14, fontWeight: '500', letterSpacing: 0.2 },
  rightCluster: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  signInBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999 },
  signInText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  ctaBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: brand.primary,
  },
  ctaText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700', letterSpacing: 0.1 },
  menuBtn: { padding: 8, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.06)' },
  drawer: {
    marginTop: 8,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 1240,
    backgroundColor: 'rgba(14,14,16,0.96)',
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.10)',
    paddingVertical: 6,
  },
  drawerLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  drawerLinkText: { color: '#FFFFFF', fontSize: 15, fontWeight: '500' },
});

export default WebNav;
