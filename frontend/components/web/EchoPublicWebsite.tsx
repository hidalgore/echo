/**
 * ECHO Public Website — v59.2 Balanced Audience Homepage.
 *
 * SUPERSEDES the v58 "host-first" lock. Locked decisions for v59.2:
 *
 *   Q1 = 1A  Hero: unified, one H1, two equal CTAs.
 *   Q2 = 2B  Brand naming: "ECHO Access" as the product line.
 *   Q3 = 3A  Body: alternating attendee/host bands.
 *   Q4 = 4A  H1: "ECHO Access is the premium platform for events that feel
 *            as good as they look."
 *   Q5 = 5A  CTAs: "Explore Events" / "Become a Host".
 *   Q6 = 6C  "What is ECHO Access" section: side-by-side prose + Access
 *            Pass mockup.
 *
 * Locked section arc (10 bands):
 *   1.  Hero
 *   2.  What is ECHO Access  (side-by-side prose + EchoAccessPassPreview)
 *   3.  ATTENDEE: The Access Pass
 *   4.  HOST: Run the door (Door Mode, NFC + QR fallback)
 *   5.  ATTENDEE: Find events you'll feel (search + Picked for You, calm)
 *   6.  HOST: Premium event pages + checkout
 *   7.  ATTENDEE: Going as a group (ECHO Circle)
 *   8.  HOST: Closeout that closes the loop
 *   9.  SHARED: Trust pillars
 *   10. Closing CTA
 *
 * Locked carry-forward rules:
 *   - "Reserve Access" not "Buy Ticket" (used in body copy).
 *   - Picked for You is calm — no "we watched you" / second counts.
 *   - Age verification BEFORE payment.
 *   - ECHO Circle: leader pays first, then invites; 1-hour timer.
 *   - Donation transparency: cause, amount, routing shown before confirm.
 *   - NFC-primary entry, QR fallback.
 *   - No emoji. No HTML <form> tags. brand.xxx hex inside StyleSheet.create.
 *
 * This is the only file that should hold homepage layout. Both
 * `app/index.tsx` (on web) and `app/web-v2-preview.tsx` render this component.
 */
import React, { useEffect, useRef } from 'react';
import { Animated, Image, Platform, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { brand } from '../../theme/brand';

import { WebShell } from './WebShell';
import { WebSection } from './WebSection';
import { WebCTA } from './WebCTA';
import { WebTrustStrip } from './WebTrustStrip';
import { EchoAccessPassPreview } from './EchoAccessPassPreview';
import { EchoCirclePreview } from './EchoCirclePreview';
import { HostCommandPreview } from './HostCommandPreview';
import { router } from 'expo-router';
import {
  PickedForYouSection,
  NFCAccessSection,
  EchoDiscSection,
  TrustNetworkSection,
  HostOpsSection,
  PricingSection,
  FinalCTASection,
} from './sections';

// ─────────────────────────────────────────────────────────────────────────
// Content (locked v59.2)
// ─────────────────────────────────────────────────────────────────────────

type Pillar = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
};

const TRUST_PILLARS: Pillar[] = [
  {
    icon: 'shield-checkmark-outline',
    title: 'Verified hosts',
    body: 'Every host on ECHO Access is reviewed before they can publish. A verified badge sits on every event page so guests know who they\u2019re buying from.',
  },
  {
    icon: 'lock-closed-outline',
    title: 'Secure checkout',
    body: 'PCI-compliant processor. Card details never touch ECHO servers. Receipts and order history live in your account, never in marketing pipelines.',
  },
  {
    icon: 'finger-print-outline',
    title: 'Age verification before payment',
    body: 'Compliance handled before the charge, not at the door. No surprises for the guest, no last-minute holds, no awkward turnaround on the curb.',
  },
  {
    icon: 'radio-outline',
    title: 'NFC-first entry',
    body: 'Tap to enter. Doors move faster, the line stays calm, and guests never fumble for a barcode in the dark.',
  },
  {
    icon: 'qr-code-outline',
    title: 'QR fallback',
    body: 'If NFC is unavailable, the same pass shows a verifiable QR code. One pass, two entry methods, no panic.',
  },
  {
    icon: 'heart-outline',
    title: 'Donation transparency',
    body: 'When an event supports a nonprofit, the donation amount, cause, and routing are visible to the guest before they confirm.',
  },
];

// ─────────────────────────────────────────────────────────────────────────

export function EchoPublicWebsite() {
  const { width } = useWindowDimensions();
  const compact = width < 880;
  const narrow = width < 640;
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const updateScroll = (event?: Event) => {
      const target = event?.target as HTMLElement | Document | null;
      const targetScroll = target && 'scrollTop' in target ? Number((target as HTMLElement).scrollTop || 0) : 0;
      const win = typeof window !== 'undefined' ? window.scrollY || 0 : 0;
      const doc = typeof document !== 'undefined'
        ? Math.max(document.documentElement?.scrollTop || 0, document.body?.scrollTop || 0)
        : 0;
      scrollY.setValue(Math.max(targetScroll, win, doc));
    };

    updateScroll();
    document.addEventListener('scroll', updateScroll, true);
    window.addEventListener('scroll', updateScroll, { passive: true });
    return () => {
      document.removeEventListener('scroll', updateScroll, true);
      window.removeEventListener('scroll', updateScroll);
    };
  }, [scrollY]);

  const phoneParallax = {
    transform: [
      { translateY: scrollY.interpolate({ inputRange: [0, 520], outputRange: [0, -74], extrapolate: 'clamp' }) },
      { scale: scrollY.interpolate({ inputRange: [0, 520], outputRange: [1, 0.93], extrapolate: 'clamp' }) },
      { rotate: scrollY.interpolate({ inputRange: [0, 520], outputRange: ['-2deg', '-5deg'], extrapolate: 'clamp' }) },
    ],
  };

  const cardsParallax = {
    transform: [
      { translateY: scrollY.interpolate({ inputRange: [0, 520], outputRange: [0, -38], extrapolate: 'clamp' }) },
      { scale: scrollY.interpolate({ inputRange: [0, 520], outputRange: [1, 0.97], extrapolate: 'clamp' }) },
    ],
  };

  return (
    <WebShell ambient>

      {/* ════════════════════════════════════════════════════════════════
          1. HERO — life-like phone, Framer-style parallax, NFC-forward cards
          ════════════════════════════════════════════════════════════════ */}
      <View style={[styles.heroOuter, narrow && styles.heroOuterNarrow]}>
        <View style={styles.heroGlowPurple} pointerEvents="none" />
        <View style={styles.heroGlowOrange} pointerEvents="none" />
        <View style={[styles.heroInner, compact && styles.heroInnerStack]}>
          <View style={[styles.heroCopy, compact && styles.heroCopyStack]}>
            <View style={styles.heroEyebrowPillLight}>
              <View style={styles.heroEyebrowDotPurple} />
              <Text style={styles.heroEyebrowTextDark}>THE PREMIUM ACCESS LAYER</Text>
            </View>

            <Text style={[styles.heroH1Dark, narrow && styles.heroH1DarkNarrow]}>
              The new front door for{' '}
              <Text style={styles.heroGradientText}>live events.</Text>
            </Text>

            <Text style={[styles.heroSubDark, narrow && styles.heroSubDarkNarrow]}>
              ECHO unifies discovery, wallet tickets, NFC entry, age verification,
              group purchasing, and host intelligence into one seamless platform.
            </Text>

            <View style={[styles.heroCtaRow, narrow && styles.heroCtaRowNarrow]}>
              <WebCTA label="Start Hosting" href="/host" variant="primary" size="lg" />
              <WebCTA label="Explore Events" href="/search" variant="secondary" size="lg" />
            </View>
          </View>

          <View style={[styles.heroVisual, compact && styles.heroVisualStack]}>
            <Animated.View style={[styles.heroPhoneWrap, phoneParallax]}>
              <HeroPhoneMock />
            </Animated.View>

            <Animated.View style={[styles.heroFloatingCards, compact && styles.heroFloatingCardsCompact, cardsParallax]}>
              <HeroFeatureCard icon="radio-outline" title="NFC Ready" body="Tap to enter" accent="purple" />
              <HeroFeatureCard icon="shield-checkmark-outline" title="21+ Verified" body="Secure age verification" accent="blue" />
              <HeroFeatureCard icon="people-outline" title="ECHO Circle" body="Friends claim & pay" accent="orange" />
              <HeroFeatureCard icon="wallet-outline" title="Mobile Wallet" body="Tickets ready" accent="purple" />
            </Animated.View>
          </View>
        </View>

        <View style={[styles.nfcFlowStrip, narrow && styles.nfcFlowStripNarrow]}>
          <NfcFlowItem icon="ticket-outline" label="Reserve Ticket" />
          <NfcFlowDivider />
          <NfcFlowItem icon="wallet-outline" label="Add to Wallet" />
          <NfcFlowDivider />
          <NfcFlowItem icon="radio-outline" label="Tap NFC" emphasized />
          <NfcFlowDivider />
          <NfcFlowItem icon="checkmark-circle-outline" label="Enter" />
        </View>
      </View>

      {/* ════════════════════════════════════════════════════════════════
          HOMEPAGE ARC — v59.4.1 section system (locked 10-section arc)
          Hero (above) → Picked For You → NFC Access → ECHO Disc →
          Trust Network → Host Ops → Pricing → Final CTA
          ════════════════════════════════════════════════════════════════ */}
      <PickedForYouSection />
      <NFCAccessSection />
      <EchoDiscSection />
      <TrustNetworkSection />
      <HostOpsSection />
      <PricingSection onStartHosting={() => router.push('/host')} />
      <FinalCTASection
        onStartHosting={() => router.push('/host')}
        onExploreAccess={() => router.push('/search')}
      />

    </WebShell>
  );
}

export default EchoPublicWebsite;


function HeroPhoneMock() {
  return (
    <View style={styles.phoneShadowLayer}>
      <View style={styles.phoneSideButton} />
      <View style={styles.phoneShell}>
        <View style={styles.phoneBezelHighlight} pointerEvents="none" />
        <View style={styles.phoneNotch} pointerEvents="none" />
        <Image
          source={require('../../assets/images/website_hero_discover.png')}
          style={styles.phoneScreenImage}
          resizeMode="cover"
        />
      </View>
    </View>
  );
}

function HeroFeatureCard(props: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
  accent: 'purple' | 'blue' | 'orange';
}) {
  const color = props.accent === 'orange' ? brand.orange : props.accent === 'blue' ? brand.cyan : brand.primary;
  return (
    <View style={styles.heroFeatureCard}>
      <View style={[styles.heroFeatureIcon, { borderColor: `${color}55`, backgroundColor: `${color}12` }]}>
        <Ionicons name={props.icon} size={30} color={color} />
      </View>
      <View style={styles.heroFeatureTextWrap}>
        <Text style={styles.heroFeatureTitle}>{props.title}</Text>
        <Text style={styles.heroFeatureBody}>{props.body}</Text>
      </View>
    </View>
  );
}

function NfcFlowItem(props: { icon: keyof typeof Ionicons.glyphMap; label: string; emphasized?: boolean }) {
  return (
    <View style={[styles.nfcFlowItem, props.emphasized && styles.nfcFlowItemEmphasized]}>
      <Ionicons name={props.icon} size={16} color={props.emphasized ? brand.primary : '#11131A'} />
      <Text style={[styles.nfcFlowLabel, props.emphasized && styles.nfcFlowLabelEmphasized]}>{props.label}</Text>
    </View>
  );
}

function NfcFlowDivider() {
  return <View style={styles.nfcFlowDot} />;
}


// ═════════════════════════════════════════════════════════════════════════
// Band — alternating attendee/host section
// ═════════════════════════════════════════════════════════════════════════

type BandBullet = { icon: keyof typeof Ionicons.glyphMap; text: string };

function Band(props: {
  audience: 'attendee' | 'host';
  eyebrow: string;
  title: string;
  body: string[];
  bullets: BandBullet[];
  ctaLabel: string;
  ctaHref: string;
  visual: React.ReactNode;
  visualSide: 'left' | 'right' | 'bottom';
  compact: boolean;
  narrow: boolean;
}) {
  const { eyebrow, title, body, bullets, ctaLabel, ctaHref, visual, visualSide, compact, narrow } = props;

  const Text_ = (
    <View style={[styles.bandText, compact && styles.bandTextStack]}>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text style={[styles.h2, narrow && styles.h2Narrow]}>{title}</Text>
      {body.map((p, i) => (
        <Text key={i} style={styles.bodyMd}>{p}</Text>
      ))}
      <View style={styles.bulletList}>
        {bullets.map((b, i) => (
          <View key={i} style={styles.bulletRow}>
            <View style={styles.bulletIcon}>
              <Ionicons name={b.icon} size={14} color={brand.cyanAccessible} />
            </View>
            <Text style={styles.bulletText}>{b.text}</Text>
          </View>
        ))}
      </View>
      <View style={styles.bandCtaRow}>
        <WebCTA label={ctaLabel} href={ctaHref} variant="primary" size="md" />
      </View>
    </View>
  );

  const Visual_ = (
    <View style={[styles.bandVisual, compact && styles.bandVisualStack]}>
      {visual}
    </View>
  );

  return (
    <WebSection align="left" maxWidth={1180}>
      <View style={[styles.band, compact && styles.bandStack]}>
        {visualSide === 'left' && !compact ? (
          <>
            {Visual_}
            {Text_}
          </>
        ) : (
          <>
            {Text_}
            {Visual_}
          </>
        )}
      </View>
    </WebSection>
  );
}


// ═════════════════════════════════════════════════════════════════════════
// Mocks — lightweight visual proof tiles
// ═════════════════════════════════════════════════════════════════════════

function DiscoveryMock() {
  const events = [
    { name: 'The Midnight Tour', meta: 'Sat \u00B7 The Crocodile' },
    { name: 'Greenline Festival', meta: 'Fri \u00B7 Pier 62' },
    { name: 'Tide Pool Live', meta: 'Sun \u00B7 Nectar Lounge' },
  ];
  return (
    <View style={styles.mockBrowser}>
      <View style={styles.mockBrowserBar}>
        <View style={[styles.mockDot, { backgroundColor: '#FF5F57' }]} />
        <View style={[styles.mockDot, { backgroundColor: '#FEBC2E' }]} />
        <View style={[styles.mockDot, { backgroundColor: '#28C840' }]} />
        <View style={styles.mockUrl}>
          <Text style={styles.mockUrlText}>getechoaccess.com/search</Text>
        </View>
      </View>
      <View style={styles.mockBody}>
        <View style={styles.mockSearchBar}>
          <Ionicons name="search-outline" size={14} color="rgba(255,255,255,0.45)" />
          <Text style={styles.mockSearchPlaceholder}>events near you</Text>
        </View>
        <View style={styles.mockChipsRow}>
          {['All', 'Music', 'Food', 'Tonight'].map((c, i) => (
            <View key={i} style={[styles.mockChip, i === 0 && styles.mockChipActive]}>
              <Text style={[styles.mockChipText, i === 0 && styles.mockChipTextActive]}>{c}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.mockPickedEyebrow}>PICKED FOR YOU</Text>
        {events.map((e, i) => (
          <View key={i} style={styles.mockEventRow}>
            <View style={styles.mockEventArt} />
            <View style={{ flex: 1 }}>
              <Text style={styles.mockEventName}>{e.name}</Text>
              <Text style={styles.mockEventMeta}>{e.meta}</Text>
            </View>
            <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.35)" />
          </View>
        ))}
      </View>
    </View>
  );
}

function EventPageMock() {
  return (
    <View style={styles.mockBrowser}>
      <View style={styles.mockBrowserBar}>
        <View style={[styles.mockDot, { backgroundColor: '#FF5F57' }]} />
        <View style={[styles.mockDot, { backgroundColor: '#FEBC2E' }]} />
        <View style={[styles.mockDot, { backgroundColor: '#28C840' }]} />
        <View style={styles.mockUrl}>
          <Text style={styles.mockUrlText}>getechoaccess.com/event/midnight-tour</Text>
        </View>
      </View>
      <View style={styles.mockBody}>
        <LinearGradient
          colors={[brand.primary, brand.cyanAccessible]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.mockHeroArt}
        >
          <View style={styles.mockVerifiedBadge}>
            <Ionicons name="shield-checkmark-outline" size={11} color="#FFFFFF" />
            <Text style={styles.mockVerifiedText}>VERIFIED HOST</Text>
          </View>
        </LinearGradient>
        <Text style={styles.mockEventPageTitle}>The Midnight Tour \u2014 Seattle</Text>
        <Text style={styles.mockEventPageMeta}>Sat \u00B7 9:00 PM \u00B7 The Crocodile</Text>
        <View style={styles.mockTierRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.mockTierName}>General Admission</Text>
            <Text style={styles.mockTierMeta}>1 ticket</Text>
          </View>
          <Text style={styles.mockTierPrice}>$45</Text>
        </View>
        <View style={styles.mockTierRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.mockTierName}>VIP</Text>
            <Text style={styles.mockTierMeta}>1 ticket</Text>
          </View>
          <Text style={styles.mockTierPrice}>$120</Text>
        </View>
        <View style={styles.mockReserveBtn}>
          <Text style={styles.mockReserveText}>Reserve Access</Text>
        </View>
      </View>
    </View>
  );
}

function CloseoutMock() {
  return (
    <View style={styles.mockBrowser}>
      <View style={styles.mockBrowserBar}>
        <View style={[styles.mockDot, { backgroundColor: '#FF5F57' }]} />
        <View style={[styles.mockDot, { backgroundColor: '#FEBC2E' }]} />
        <View style={[styles.mockDot, { backgroundColor: '#28C840' }]} />
        <View style={styles.mockUrl}>
          <Text style={styles.mockUrlText}>getechoaccess.com/host/reports</Text>
        </View>
      </View>
      <View style={styles.mockBody}>
        <Text style={styles.mockReportEyebrow}>EVENT CLOSEOUT</Text>
        <Text style={styles.mockReportTitle}>The Midnight Tour</Text>
        <View style={styles.mockReportStats}>
          {[
            { label: 'Attendance', value: '92%', sub: '443 of 482' },
            { label: 'Net payout', value: '$26,212', sub: 'Paying Tue' },
            { label: 'Raised', value: '$4,210', sub: 'Greenline Youth' },
          ].map((s, i) => (
            <View key={i} style={styles.mockReportStat}>
              <Text style={styles.mockReportStatLabel}>{s.label}</Text>
              <Text style={styles.mockReportStatValue}>{s.value}</Text>
              <Text style={styles.mockReportStatSub}>{s.sub}</Text>
            </View>
          ))}
        </View>
        <View style={styles.mockBarRow}>
          {[28, 44, 62, 75, 88, 92, 76, 58, 40, 28, 16, 8].map((h, i) => (
            <View key={i} style={[styles.mockBar, { height: `${h}%` }]} />
          ))}
        </View>
      </View>
    </View>
  );
}


// ═════════════════════════════════════════════════════════════════════════
// Styles
// ═════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  // Hero
  heroOuter: {
    position: 'relative',
    width: '100%',
    overflow: 'hidden',
    paddingHorizontal: 28,
    paddingTop: 96,
    paddingBottom: 46,
    alignItems: 'center',
    backgroundColor: '#F7F1E7',
    borderBottomLeftRadius: 38,
    borderBottomRightRadius: 38,
  },
  heroOuterNarrow: {
    paddingHorizontal: 18,
    paddingTop: 64,
    paddingBottom: 34,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  heroGlowPurple: {
    position: 'absolute',
    right: 265,
    top: 180,
    width: 440,
    height: 520,
    borderRadius: 260,
    backgroundColor: 'rgba(123,77,255,0.28)',
    // @ts-ignore react-native-web supports filter
    filter: 'blur(105px)',
  },
  heroGlowOrange: {
    position: 'absolute',
    right: 20,
    bottom: 34,
    width: 420,
    height: 420,
    borderRadius: 210,
    backgroundColor: 'rgba(255,122,26,0.24)',
    // @ts-ignore react-native-web supports filter
    filter: 'blur(115px)',
  },
  heroInner: {
    width: '100%',
    maxWidth: 1240,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 48,
  },
  heroInnerStack: {
    flexDirection: 'column',
    gap: 42,
    alignItems: 'center',
  },
  heroCopy: {
    flex: 0.92,
    minWidth: 360,
    maxWidth: 520,
    zIndex: 3,
  },
  heroCopyStack: {
    minWidth: 0,
    width: '100%',
    maxWidth: 640,
    alignItems: 'center',
  },
  heroEyebrowPillLight: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(123,77,255,0.12)',
    marginBottom: 26,
  },
  heroEyebrowDotPurple: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: brand.primary,
  },
  heroEyebrowTextDark: {
    color: '#171822',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.0,
  },
  heroH1Dark: {
    color: '#090B12',
    fontSize: 64,
    fontWeight: '900',
    letterSpacing: -1.9,
    lineHeight: 70,
    marginBottom: 22,
  },
  heroH1DarkNarrow: {
    fontSize: 42,
    lineHeight: 47,
    letterSpacing: -1.0,
    textAlign: 'center',
  },
  heroGradientText: {
    color: brand.primary,
    // @ts-ignore react-native-web supports text clipping in generated CSS
    backgroundImage: 'linear-gradient(90deg, #4F46E5 0%, #7B4DFF 32%, #E63DAD 66%, #FF5A1F 100%)',
    // @ts-ignore react-native-web supports text clipping
    WebkitBackgroundClip: 'text',
    // @ts-ignore react-native-web supports text fill
    WebkitTextFillColor: 'transparent',
  },
  heroSubDark: {
    color: '#303440',
    fontSize: 17,
    lineHeight: 28,
    marginBottom: 30,
    maxWidth: 490,
  },
  heroSubDarkNarrow: {
    fontSize: 15,
    lineHeight: 23,
    textAlign: 'center',
  },
  heroCtaRow: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
  },
  heroCtaRowNarrow: {
    flexDirection: 'column',
    width: '100%',
  },
  heroVisual: {
    flex: 1.15,
    minHeight: 640,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    zIndex: 2,
  },
  heroVisualStack: {
    width: '100%',
    minHeight: 0,
    flexDirection: 'column',
  },
  heroPhoneWrap: {
    zIndex: 4,
    marginRight: 270,
  },
  phoneShadowLayer: {
    width: 352,
    height: 690,
    alignItems: 'center',
    justifyContent: 'center',
    // @ts-ignore react-native-web supports drop-shadow
    filter: 'drop-shadow(0px 28px 30px rgba(10,10,20,0.26))',
  },
  phoneSideButton: {
    position: 'absolute',
    right: 3,
    top: 178,
    width: 6,
    height: 72,
    borderRadius: 5,
    backgroundColor: '#1A1B20',
    zIndex: 2,
  },
  phoneShell: {
    width: 318,
    height: 650,
    borderRadius: 50,
    backgroundColor: '#050609',
    borderWidth: 8,
    borderColor: '#17181E',
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000000',
    shadowOpacity: 0.35,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 22 },
  },
  phoneBezelHighlight: {
    position: 'absolute',
    top: 0,
    left: 8,
    right: 8,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.32)',
    zIndex: 4,
  },
  phoneNotch: {
    position: 'absolute',
    top: 12,
    alignSelf: 'center',
    width: 92,
    height: 28,
    borderRadius: 18,
    backgroundColor: '#050609',
    zIndex: 5,
  },
  phoneScreenImage: {
    width: '100%',
    height: '100%',
  },
  heroFloatingCards: {
    position: 'absolute',
    right: 0,
    top: 108,
    gap: 20,
    zIndex: 5,
  },
  heroFloatingCardsCompact: {
    position: 'relative',
    right: 'auto',
    top: 'auto',
    marginTop: 18,
    width: '100%',
    maxWidth: 520,
  },
  heroFeatureCard: {
    width: 238,
    minHeight: 90,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 22,
    paddingVertical: 18,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.78)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.86)',
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  heroFeatureIcon: {
    width: 52,
    height: 52,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  heroFeatureTextWrap: { flex: 1, minWidth: 0 },
  heroFeatureTitle: {
    color: '#11131A',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  heroFeatureBody: {
    color: '#515767',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },
  nfcFlowStrip: {
    width: '100%',
    maxWidth: 620,
    alignSelf: 'center',
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    zIndex: 6,
  },
  nfcFlowStripNarrow: {
    alignSelf: 'center',
    marginLeft: 0,
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 26,
  },
  nfcFlowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  nfcFlowItemEmphasized: {
    backgroundColor: 'rgba(123,77,255,0.12)',
    borderColor: 'rgba(123,77,255,0.22)',
  },
  nfcFlowLabel: {
    color: '#171822',
    fontSize: 11,
    fontWeight: '800',
  },
  nfcFlowLabelEmphasized: {
    color: brand.primary,
  },
  nfcFlowDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(17,19,26,0.22)',
  },
  heroTrustWrap: { marginTop: 48, width: '100%', maxWidth: 760 },

  // Reusable type
  eyebrow: {
    color: brand.cyanAccessible,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    marginBottom: 14,
  },
  h2: {
    color: '#FFFFFF',
    fontSize: 40,
    fontWeight: '800',
    letterSpacing: -0.6,
    lineHeight: 46,
    marginBottom: 18,
  },
  h2Narrow: { fontSize: 28, lineHeight: 34 },
  bodyLg: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 16,
    lineHeight: 26,
    marginBottom: 14,
    maxWidth: 560,
  },
  bodyMd: {
    color: 'rgba(255,255,255,0.68)',
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 12,
    maxWidth: 540,
  },

  // Side-by-side
  sideBySide: {
    flexDirection: 'row',
    gap: 56,
    alignItems: 'center',
  },
  sideBySideStack: { flexDirection: 'column', gap: 36 },
  sideText: { flex: 1.1, minWidth: 0 },
  sideTextStack: { width: '100%' },
  sideVisual: { flex: 1, alignItems: 'center' },
  sideVisualStack: { width: '100%' },

  factRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 18,
    marginTop: 18,
    paddingTop: 22,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  factCell: { flex: 1, minWidth: 0 },
  factDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.08)' },
  factLabel: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  factValue: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },

  // Band
  band: {
    flexDirection: 'row',
    gap: 56,
    alignItems: 'center',
  },
  bandStack: { flexDirection: 'column', gap: 36 },
  bandText: { flex: 1.05, minWidth: 0 },
  bandTextStack: { width: '100%' },
  bandVisual: { flex: 1, alignItems: 'center', minWidth: 0 },
  bandVisualStack: { width: '100%' },

  bulletList: { marginTop: 12, gap: 12 },
  bulletRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bulletIcon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: 'rgba(32,199,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(32,199,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bulletText: { color: 'rgba(255,255,255,0.78)', fontSize: 14, fontWeight: '500', flex: 1 },
  bandCtaRow: { marginTop: 26, flexDirection: 'row' },

  // Trust pillars
  trustGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  trustCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 18,
    padding: 22,
  },
  trustIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(32,199,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(32,199,255,0.22)',
    marginBottom: 14,
  },
  trustTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginBottom: 8,
  },
  trustBody: {
    color: 'rgba(255,255,255,0.62)',
    fontSize: 14,
    lineHeight: 21,
  },

  // Closing
  closing: {
    alignItems: 'center',
    gap: 16,
    paddingVertical: 32,
  },
  closingEyebrow: {
    color: brand.cyanAccessible,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  closingH2: {
    color: '#FFFFFF',
    fontSize: 44,
    fontWeight: '800',
    letterSpacing: -0.7,
    lineHeight: 50,
    textAlign: 'center',
  },
  closingH2Narrow: { fontSize: 30, lineHeight: 36 },
  closingBody: {
    color: 'rgba(255,255,255,0.66)',
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'center',
    maxWidth: 540,
    marginBottom: 14,
  },

  // ─── Mock browser frame (Discovery, Event page, Closeout) ───────────
  mockBrowser: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 18,
    overflow: 'hidden',
  },
  mockBrowserBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  mockDot: { width: 9, height: 9, borderRadius: 5 },
  mockUrl: {
    flex: 1,
    marginLeft: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  mockUrlText: { color: 'rgba(255,255,255,0.55)', fontSize: 11, fontWeight: '500' },
  mockBody: { padding: 18 },

  // Discovery mock
  mockSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 10,
    marginBottom: 12,
  },
  mockSearchPlaceholder: { color: 'rgba(255,255,255,0.45)', fontSize: 13 },
  mockChipsRow: { flexDirection: 'row', gap: 6, marginBottom: 18 },
  mockChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  mockChipActive: { backgroundColor: 'rgba(123,77,255,0.18)', borderColor: 'rgba(123,77,255,0.45)' },
  mockChipText: { color: 'rgba(255,255,255,0.55)', fontSize: 11, fontWeight: '600' },
  mockChipTextActive: { color: '#FFFFFF' },
  mockPickedEyebrow: {
    color: brand.cyanAccessible,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  mockEventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 9,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  mockEventArt: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: 'rgba(123,77,255,0.30)',
  },
  mockEventName: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  mockEventMeta: { color: 'rgba(255,255,255,0.55)', fontSize: 11, marginTop: 1 },

  // Event page mock
  mockHeroArt: {
    aspectRatio: 16 / 9,
    borderRadius: 12,
    marginBottom: 14,
    padding: 10,
  },
  mockVerifiedBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 999,
  },
  mockVerifiedText: { color: '#FFFFFF', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  mockEventPageTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', marginBottom: 4 },
  mockEventPageMeta: { color: 'rgba(255,255,255,0.55)', fontSize: 12, marginBottom: 14 },
  mockTierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  mockTierName: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  mockTierMeta: { color: 'rgba(255,255,255,0.45)', fontSize: 11, marginTop: 1 },
  mockTierPrice: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  mockReserveBtn: {
    backgroundColor: brand.primary,
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: 'center',
    marginTop: 14,
  },
  mockReserveText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700', letterSpacing: 0.2 },

  // Closeout mock
  mockReportEyebrow: {
    color: brand.cyanAccessible,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  mockReportTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', marginBottom: 16 },
  mockReportStats: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  mockReportStat: {
    flex: 1,
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  mockReportStatLabel: { color: 'rgba(255,255,255,0.55)', fontSize: 10, fontWeight: '600', letterSpacing: 0.6, textTransform: 'uppercase' },
  mockReportStatValue: { color: '#FFFFFF', fontSize: 18, fontWeight: '800', marginTop: 4, letterSpacing: -0.3 },
  mockReportStatSub: { color: 'rgba(255,255,255,0.45)', fontSize: 10, marginTop: 2 },
  mockBarRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    height: 56,
  },
  mockBar: {
    flex: 1,
    backgroundColor: 'rgba(32,199,255,0.55)',
    borderRadius: 3,
    minHeight: 4,
  },
});
