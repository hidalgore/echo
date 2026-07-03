/**
 * /host — Host landing / acquisition page.
 *
 * Locked v59 sections:
 * - Host hero ("Run the room before the doors open.")
 * - Before / During / After lifecycle
 * - Premium event page creation
 * - Ticketing & checkout
 * - Age verification before payment
 * - ECHO Circle group buying
 * - Door Mode NFC + QR
 * - Revenue / Payouts / Reports
 * - Donation tools
 * - Host Command Center preview
 * - Start Hosting CTA
 */
import React from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { type Href } from 'expo-router';
import { brand } from '../../theme/brand';
import { WebShell } from '../../components/web/WebShell';
import { WebSection } from '../../components/web/WebSection';
import { WebCTA } from '../../components/web/WebCTA';
import { HostCommandPreview } from '../../components/web/HostCommandPreview';

export default function HostLandingPage() {
  const { width } = useWindowDimensions();
  const compact = width < 760;

  return (
    <WebShell>
      {/* ── Hero ── */}
      <View style={[styles.heroOuter, compact && styles.heroOuterCompact]}>
        <View style={styles.heroInner}>
          <View style={[styles.heroGrid, compact && styles.heroGridCompact]}>
            <View style={[styles.heroCopy, compact && { width: '100%' }]}>
              <View style={styles.eyebrowPill}>
                <View style={styles.eyebrowDot} />
                <Text style={styles.eyebrowText}>FOR HOSTS</Text>
              </View>
              <Text style={[styles.heroHeadline, compact && styles.heroHeadlineCompact]}>
                Run the room before the doors open.
              </Text>
              <Text style={styles.heroSubhead}>
                Create premium event pages, sell trusted access, verify guests, manage entry, and close out with clean
                reporting — all from ECHO.
              </Text>
              <View style={styles.heroCtaRow}>
                <WebCTA label="Start Hosting" variant="primary" size="lg" iconRight="arrow-forward" href={'/host/login' as Href} />
                <WebCTA label="View Host Tools" variant="secondary" size="lg" href={'/host/dashboard' as Href} />
              </View>
            </View>
            <View style={[styles.heroVisual, compact && { width: '100%' }]}>
              <HostCommandPreview compact={compact} />
            </View>
          </View>
        </View>
      </View>

      {/* ── Lifecycle ── */}
      <WebSection
        eyebrow="EVENT LIFECYCLE"
        title="Before. During. After."
        description="ECHO is designed around the rhythm of a real event — not a generic ticket dashboard."
      >
        <View style={[styles.lifecycleRow, compact && styles.lifecycleRowCompact]}>
          {[
            {
              tag: 'BEFORE',
              tagColor: brand.cyan,
              title: 'Create, price, publish, verify, and promote.',
              points: ['Premium event page builder', 'Ticket tiers + ECHO Circle', 'Age requirement selector', 'Promotion tools'],
            },
            {
              tag: 'DURING',
              tagColor: brand.primary,
              title: 'Door Mode, NFC/QR entry, live check-in status, access alerts.',
              points: ['NFC-first tap entry', 'QR fallback inside ticket', 'Live attendance + risk alerts', 'Door staff command bar'],
            },
            {
              tag: 'AFTER',
              tagColor: brand.magenta,
              title: 'Review attendance, payouts, donations, and event analytics.',
              points: ['Closeout report', 'Payout status', 'Donation breakdown', 'Audience analytics'],
            },
          ].map((stage) => (
            <View key={stage.tag} style={styles.lifecycleCard}>
              <View style={[styles.lifecycleTag, { backgroundColor: stage.tagColor + '22', borderColor: stage.tagColor + '60' }]}>
                <Text style={[styles.lifecycleTagText, { color: stage.tagColor }]}>{stage.tag}</Text>
              </View>
              <Text style={styles.lifecycleTitle}>{stage.title}</Text>
              <View style={styles.lifecyclePoints}>
                {stage.points.map((p) => (
                  <View key={p} style={styles.lifecyclePointRow}>
                    <Ionicons name="checkmark" size={14} color="rgba(255,255,255,0.7)" />
                    <Text style={styles.lifecyclePointText}>{p}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>
      </WebSection>

      {/* ── Feature grid ── */}
      <WebSection
        eyebrow="HOST TOOLS"
        title="Every detail that makes the room feel premium."
        divider
      >
        <View style={[styles.featGrid, compact && styles.featGridCompact]}>
          {[
            { icon: 'create-outline' as const, t: 'Premium event pages', b: 'Editorial layouts, media uploads, host verification badge.' },
            { icon: 'card-outline' as const, t: 'Clean checkout', b: 'Transparent fees, secure payments, mobile-first.' },
            { icon: 'people-outline' as const, t: 'ECHO Circle group buying', b: 'Leader pays, invites friends, each pays their share.' },
            { icon: 'finger-print-outline' as const, t: 'Age verification before payment', b: 'Restricted events run age check before checkout.' },
            { icon: 'flash-outline' as const, t: 'Door Mode (NFC + QR)', b: 'Tap to enter, QR fallback only inside ticket view.' },
            { icon: 'analytics-outline' as const, t: 'Revenue tracking', b: 'Sales velocity, audience signals, risk alerts.' },
            { icon: 'document-text-outline' as const, t: 'Payouts and reports', b: 'CSV / PDF exports, donor lists, donation totals.' },
            { icon: 'heart-outline' as const, t: 'Donation tools', b: 'Verified nonprofit campaigns inside checkout.' },
          ].map((f) => (
            <View key={f.t} style={styles.featCard}>
              <View style={styles.featIconWrap}>
                <Ionicons name={f.icon} size={18} color={brand.cyanAccessible} />
              </View>
              <Text style={styles.featTitle}>{f.t}</Text>
              <Text style={styles.featBody}>{f.b}</Text>
            </View>
          ))}
        </View>
      </WebSection>

      {/* ── Host Command preview ── */}
      <WebSection
        eyebrow="HOST COMMAND CENTER"
        title="One calm view. Every event."
        description="See sales velocity, check-in readiness, audience signals, and risk alerts in one place."
        align="center"
        divider
      >
        <View style={styles.commandWrap}>
          <HostCommandPreview />
        </View>
      </WebSection>

      {/* ── Trust + CTA ── */}
      <WebSection paddingVertical={96} align="center">
        <LinearGradient
          colors={['rgba(123,77,255,0.18)', 'rgba(32,199,255,0.10)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.finalCtaBox}
        >
          <Text style={styles.finalCtaTitle}>Host smarter. Run the room before the doors open.</Text>
          <Text style={styles.finalCtaBody}>
            ECHO gives you a calm, premium command center — from event creation to closeout reporting.
          </Text>
          <View style={styles.finalCtaRow}>
            <WebCTA label="Start Hosting" variant="primary" size="lg" iconRight="arrow-forward" href={'/host/login' as Href} />
            <WebCTA label="See dashboard" variant="secondary" size="lg" href={'/host/dashboard' as Href} />
          </View>
        </LinearGradient>
      </WebSection>
    </WebShell>
  );
}

const styles = StyleSheet.create({
  heroOuter: { width: '100%', paddingHorizontal: 24, paddingTop: 56, paddingBottom: 64 },
  heroOuterCompact: { paddingTop: 32, paddingBottom: 40 },
  heroInner: { alignSelf: 'center', width: '100%', maxWidth: 1240 },
  heroGrid: { flexDirection: 'row', gap: 48, alignItems: 'center' },
  heroGridCompact: { flexDirection: 'column', gap: 32 },
  heroCopy: { flex: 1, gap: 18 },
  eyebrowPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  eyebrowDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: brand.primary },
  eyebrowText: { color: 'rgba(255,255,255,0.78)', fontSize: 11, fontWeight: '700', letterSpacing: 1.0 },
  heroHeadline: { color: '#FFFFFF', fontSize: 52, fontWeight: '800', letterSpacing: -1.0, lineHeight: 58 },
  heroHeadlineCompact: { fontSize: 34, lineHeight: 38, letterSpacing: -0.5 },
  heroSubhead: { color: 'rgba(255,255,255,0.66)', fontSize: 17, lineHeight: 26, maxWidth: 560 },
  heroCtaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8 },
  heroVisual: { flex: 1, alignItems: 'center' },

  lifecycleRow: { flexDirection: 'row', gap: 16 },
  lifecycleRowCompact: { flexDirection: 'column' },
  lifecycleCard: {
    flex: 1,
    padding: 24,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: 12,
  },
  lifecycleTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  lifecycleTagText: { fontSize: 11, fontWeight: '800', letterSpacing: 1.0 },
  lifecycleTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '700', letterSpacing: -0.2, lineHeight: 24 },
  lifecyclePoints: { gap: 8, marginTop: 8 },
  lifecyclePointRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  lifecyclePointText: { color: 'rgba(255,255,255,0.65)', fontSize: 13, lineHeight: 18 },

  featGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  featGridCompact: { gap: 12 },
  featCard: {
    width: '23%',
    minWidth: 240,
    padding: 20,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: 8,
  },
  featIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(32,199,255,0.08)',
  },
  featTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '700', marginTop: 4 },
  featBody: { color: 'rgba(255,255,255,0.58)', fontSize: 13, lineHeight: 19 },

  commandWrap: { width: '100%', alignItems: 'center' },

  finalCtaBox: {
    width: '100%',
    maxWidth: 880,
    padding: 48,
    borderRadius: 28,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  finalCtaTitle: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.5,
    textAlign: 'center',
    lineHeight: 40,
    maxWidth: 640,
  },
  finalCtaBody: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginTop: 12,
    maxWidth: 540,
  },
  finalCtaRow: { marginTop: 28, flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },
});
