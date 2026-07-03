/**
 * /verify-age — Age verification handoff page (web).
 *
 * Locked v59 behavior:
 * - Headline: "Verify on your phone."
 * - QR placeholder + text/email link options.
 * - 3-step list explaining what happens.
 * - Privacy copy: data discarded after verification.
 * - Mock success/failure states gated by ?state= query.
 *
 * This is a polished MVP shell. Real ID verification is a SWAP-POINT.
 */
import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { brand } from '../theme/brand';
import { WebShell } from '../components/web/WebShell';
import { WebSection } from '../components/web/WebSection';
import { WebCTA } from '../components/web/WebCTA';

type State = 'default' | 'success' | 'failure';

const STEPS = [
  { title: 'Scan or open the link', body: 'Use your phone\u2019s camera on the QR code, or tap the SMS / email link we sent.' },
  { title: 'Confirm your ID', body: 'Quick capture of your government ID + a selfie match. Takes about 30 seconds.' },
  { title: 'Return to checkout', body: 'You\u2019ll come back here automatically once verification completes. Then you can finish your reservation.' },
];

export default function VerifyAgePage() {
  if (Platform.OS !== 'web') return null;
  const params = useLocalSearchParams<{ state?: string }>();
  const state: State = params.state === 'success' ? 'success' : params.state === 'failure' ? 'failure' : 'default';
  const { width } = useWindowDimensions();
  const compact = width < 760;

  if (state === 'success') {
    return (
      <WebShell ambient>
        <WebSection align="center" maxWidth={620}>
          <View style={[styles.statusCard, { borderColor: 'rgba(32,199,255,0.35)' }]}>
            <View style={[styles.statusIcon, { backgroundColor: 'rgba(32,199,255,0.18)' }]}>
              <Ionicons name="checkmark" size={32} color={brand.cyanAccessible} />
            </View>
            <Text style={styles.statusTitle}>Verified.</Text>
            <Text style={styles.statusBody}>
              You\u2019re cleared for age-restricted events. We don\u2019t keep your ID image or selfie. Only the verified-status flag stays on your account.
            </Text>
            <WebCTA label="Return to Checkout" href="/wallet" variant="primary" size="lg" />
          </View>
        </WebSection>
      </WebShell>
    );
  }

  if (state === 'failure') {
    return (
      <WebShell ambient>
        <WebSection align="center" maxWidth={620}>
          <View style={[styles.statusCard, { borderColor: 'rgba(255,181,76,0.35)' }]}>
            <View style={[styles.statusIcon, { backgroundColor: 'rgba(255,181,76,0.18)' }]}>
              <Ionicons name="alert-circle-outline" size={32} color="#FFB54C" />
            </View>
            <Text style={styles.statusTitle}>Verification didn\u2019t complete.</Text>
            <Text style={styles.statusBody}>
              The check couldn\u2019t confirm your age. Try again with better lighting, or contact support. Your reservation will hold until verification is sorted.
            </Text>
            <View style={[styles.statusActions, compact && { flexDirection: 'column' }]}>
              <WebCTA label="Try Again" href="/verify-age" variant="primary" size="md" />
              <WebCTA label="Contact Support" href="/trust" variant="secondary" size="md" />
            </View>
          </View>
        </WebSection>
      </WebShell>
    );
  }

  return (
    <WebShell ambient>
      <WebSection
        eyebrow="AGE VERIFICATION"
        title="Verify on your phone."
        description="This event is age-restricted. Verify before payment so checkout stays clean. Takes about 30 seconds."
        align="center"
        maxWidth={780}
      >
        <View style={[styles.layout, compact && { flexDirection: 'column' }]}>
          {/* QR side */}
          <View style={[styles.qrSide, compact && { width: '100%' }]}>
            <View style={styles.qrBox}>
              <View style={styles.qrPlaceholder}>
                {/* Mock QR pattern */}
                <View style={styles.qrGrid}>
                  {Array.from({ length: 64 }).map((_, i) => (
                    <View
                      key={i}
                      style={[
                        styles.qrCell,
                        ((i * 7) % 13 < 6) && styles.qrCellOn,
                      ]}
                    />
                  ))}
                </View>
                <View style={[styles.qrCorner, { top: 8, left: 8 }]} />
                <View style={[styles.qrCorner, { top: 8, right: 8 }]} />
                <View style={[styles.qrCorner, { bottom: 8, left: 8 }]} />
              </View>
              <Text style={styles.qrLabel}>Scan with your phone camera</Text>
            </View>
            <View style={styles.linkRow}>
              <TouchableOpacity style={styles.linkBtn}>
                <Ionicons name="chatbubble-outline" size={16} color="#FFFFFF" />
                <Text style={styles.linkBtnText}>Send SMS link</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.linkBtn}>
                <Ionicons name="mail-outline" size={16} color="#FFFFFF" />
                <Text style={styles.linkBtnText}>Send email link</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Steps side */}
          <View style={[styles.stepsSide, compact && { width: '100%' }]}>
            {STEPS.map((s, i) => (
              <View key={i} style={styles.stepRow}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{i + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.stepTitle}>{s.title}</Text>
                  <Text style={styles.stepBody}>{s.body}</Text>
                </View>
              </View>
            ))}
            <View style={styles.privacyCard}>
              <Ionicons name="shield-checkmark-outline" size={18} color={brand.cyanAccessible} />
              <Text style={styles.privacyTitle}>What we keep</Text>
              <Text style={styles.privacyBody}>
                Only the verified-status flag. The ID image and selfie are discarded after the check completes. They are not stored, shared, or used for marketing.
              </Text>
            </View>
          </View>
        </View>
      </WebSection>
    </WebShell>
  );
}

const styles = StyleSheet.create({
  layout: {
    flexDirection: 'row',
    gap: 32,
    alignItems: 'flex-start',
    width: '100%',
  },
  qrSide: {
    flex: 1,
    alignItems: 'center',
    gap: 16,
  },
  qrBox: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 22,
    padding: 24,
    alignItems: 'center',
    gap: 14,
    width: '100%',
    maxWidth: 320,
  },
  qrPlaceholder: {
    width: 220,
    height: 220,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    position: 'relative',
  },
  qrGrid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
  },
  qrCell: {
    width: '11.4%',
    aspectRatio: 1,
    backgroundColor: 'transparent',
  },
  qrCellOn: {
    backgroundColor: '#06060A',
  },
  qrCorner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderWidth: 4,
    borderColor: '#06060A',
  },
  qrLabel: {
    color: 'rgba(255,255,255,0.62)',
    fontSize: 12,
    fontWeight: '500',
  },
  linkRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  linkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  linkBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  stepsSide: {
    flex: 1.1,
    gap: 14,
  },
  stepRow: {
    flexDirection: 'row',
    gap: 14,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 18,
  },
  stepNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(123,77,255,0.20)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  stepTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  stepBody: {
    color: 'rgba(255,255,255,0.62)',
    fontSize: 13,
    lineHeight: 20,
  },
  privacyCard: {
    backgroundColor: 'rgba(32,199,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(32,199,255,0.18)',
    borderRadius: 14,
    padding: 18,
    gap: 6,
    marginTop: 6,
  },
  privacyTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  privacyBody: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 13,
    lineHeight: 20,
  },
  statusCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderRadius: 24,
    padding: 40,
    alignItems: 'center',
    gap: 16,
  },
  statusIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  statusTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  statusBody: {
    color: 'rgba(255,255,255,0.66)',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 460,
    marginBottom: 8,
  },
  statusActions: {
    flexDirection: 'row',
    gap: 12,
  },
});
