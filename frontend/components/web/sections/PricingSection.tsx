/**
 * ECHO — PricingSection (v59.4, web)
 * ═══════════════════════════════════
 * Locked pricing labels: Launch (Starter) / Pro (Growth) / Elite (Elite).
 * No invented prices — placeholders per founder decision 6A.
 */
import React from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { Text } from '../../ui/Text';
import { Button } from '../../ui/Button';
import { SectionShell } from './SectionShell';

interface Plan {
  name: 'Launch' | 'Pro' | 'Elite';
  subtitle: string;
  price: string;
  blurb: string;
  features: string[];
  featured?: boolean;
}

const PLANS: Plan[] = [
  {
    name: 'Launch', subtitle: 'Starter', price: 'Built for launch',
    blurb: 'Everything a first event needs to go on sale and through the door.',
    features: [
      'Create and publish events',
      'NFC-first Access Pass with QR fallback',
      'Door Mode check-in',
      'Standard payouts and reports',
    ],
  },
  {
    name: 'Pro', subtitle: 'Growth', price: 'Coming soon',
    blurb: 'For hosts running a calendar, not a one-off.',
    features: [
      'Everything in Launch',
      'Scheduled Publish and AI Flyer Scan',
      'Full tier control: VIP, Staff, Sponsor, Backstage, Custom',
      'Team roles and Past Event Analytics',
    ],
    featured: true,
  },
  {
    name: 'Elite', subtitle: 'Elite', price: 'Contact us',
    blurb: 'For venues and operators who run access at scale.',
    features: [
      'Everything in Pro',
      'ECHO Disc hardware program',
      'Advanced Trust Network controls',
      'Priority support and onboarding',
    ],
  },
];

interface PricingSectionProps {
  onStartHosting?: () => void;
}

export function PricingSection({ onStartHosting }: PricingSectionProps) {
  const { width } = useWindowDimensions();
  const isMobile = width < 900;

  return (
    <SectionShell
      nativeID="pricing"
      eyebrow="Pricing"
      title="Plans that scale with the event"
      subtitle="Start free of friction. Grow into the tools your calendar earns."
      align="center"
    >
      <View style={[styles.planRow, isMobile && styles.planRowStacked]}>
        {PLANS.map((p) => (
          <View key={p.name} style={[styles.planCard, p.featured && styles.planFeatured]}>
            {p.featured ? (
              <View style={styles.featuredPill}>
                <Text variant="caption" style={styles.featuredText}>Most hosts choose Pro</Text>
              </View>
            ) : null}
            <Text variant="title" style={styles.planName} accessibilityRole="header">
              {p.name}
            </Text>
            <Text variant="caption" style={styles.planSubtitle}>{p.subtitle}</Text>
            <Text variant="label" style={styles.planPrice}>{p.price}</Text>
            <Text variant="bodySmall" style={styles.planBlurb}>{p.blurb}</Text>
            <View style={styles.featureList}>
              {p.features.map((f) => (
                <View key={f} style={styles.featureRow}>
                  <View style={styles.featureDot} />
                  <Text variant="bodySmall" style={styles.featureText}>{f}</Text>
                </View>
              ))}
            </View>
            <Button
              title="Start Hosting"
              variant={p.featured ? 'primary' : 'outline'}
              onPress={onStartHosting ?? (() => {})}
            />
          </View>
        ))}
      </View>
    </SectionShell>
  );
}

const styles = StyleSheet.create({
  planRow: { flexDirection: 'row', gap: 16, alignItems: 'stretch' },
  planRowStacked: { flexDirection: 'column' },
  planCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    borderRadius: 24,
    padding: 24,
    gap: 8,
  },
  planFeatured: {
    borderColor: 'rgba(123,77,255,0.60)',
    backgroundColor: 'rgba(123,77,255,0.07)',
  },
  featuredPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(123,77,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(123,77,255,0.50)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 6,
  },
  featuredText: { color: '#C9B4FF', fontSize: 11 },
  planName: { color: '#FFFFFF' },
  planSubtitle: {
    color: 'rgba(255,255,255,0.50)',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  planPrice: { color: '#FFB45C', marginTop: 10, fontSize: 16 },
  planBlurb: { color: 'rgba(255,255,255,0.66)', lineHeight: 20, marginBottom: 8 },
  featureList: { gap: 8, marginBottom: 20, flexGrow: 1 },
  featureRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  featureDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.40)', marginTop: 6,
  },
  featureText: { color: 'rgba(255,255,255,0.68)', flex: 1, lineHeight: 19 },
});
