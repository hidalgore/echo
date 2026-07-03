/**
 * ECHO — EchoDiscSection (v59.4, web)
 * ════════════════════════════════════
 * Product-style section for ECHO Disc Core, the NFC-first edge
 * check-in device. Uses the official render asset; the flow diagram is
 * drawn as calm node chips, not technical clutter.
 *
 * Asset: assets/web/echo_disc_core_render.png
 */
import React from 'react';
import { Image, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Text } from '../../ui/Text';
import { SectionShell } from './SectionShell';

const SPECS: { title: string; copy: string }[] = [
  { title: 'Portable validation terminal', copy: 'NFC-first credential checks at any door, desk, or gate.' },
  { title: 'Online and offline', copy: 'Validates locally. Stores every scan and syncs when connection returns.' },
  { title: 'Trust Network sync', copy: 'Every scan strengthens the ECHO Trust Network when online.' },
  { title: 'LED ring feedback', copy: 'Color-coded decision ring readable across a dark room.' },
  { title: 'Sound feedback', copy: 'Distinct tone patterns for valid, VIP, and denied — no second-guessing.' },
  { title: 'USB-C power - Wi-Fi sync', copy: 'Simple to power, simple to place, secure-MCU-class architecture.' },
];

const FLOW: string[] = [
  'Cloud Event Package',
  'ECHO Disc',
  'Local Validation Engine',
  'Decision Engine',
  'LED / Sound Feedback',
  'Sync back to ECHO',
];

export function EchoDiscSection() {
  const { width } = useWindowDimensions();
  const isMobile = width < 900;

  return (
    <SectionShell
      nativeID="disc"
      eyebrow="ECHO Disc"
      title="ECHO Disc Core. Built for the door."
      subtitle="The NFC-first edge check-in device for ECHO events. It validates credentials locally, answers with light and sound, and keeps working when the network does not."
    >
      <View style={[styles.row, isMobile && styles.rowStacked]}>
        <View style={styles.renderWrap}>
          <Image
            source={require('../../../assets/web/echo_disc_core_render.png')}
            style={styles.render}
            resizeMode="contain"
            accessibilityLabel="ECHO Disc Core device: a black octagonal NFC terminal with a glowing gradient LED ring and the ECHO mark, labeled tap to enter."
          />
          <Text variant="caption" style={styles.proNote}>
            Disc Core Plus adds battery. Disc Pro adds a QR camera fallback.
          </Text>
        </View>

        <View style={styles.specList}>
          {SPECS.map((s) => (
            <View key={s.title} style={styles.specRow}>
              <View style={styles.specMark} />
              <View style={styles.specCopy}>
                <Text variant="label" style={styles.specTitle}>{s.title}</Text>
                <Text variant="bodySmall" style={styles.specBody}>{s.copy}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View
        style={styles.flowPanel}
        accessible
        accessibilityLabel={`How a scan flows: ${FLOW.join(', then ')}.`}
      >
        <Text variant="label" style={styles.flowTitle}>How a scan flows</Text>
        <View style={styles.flowRow}>
          {FLOW.map((node, i) => (
            <React.Fragment key={node}>
              <View style={styles.flowNode}>
                <Text variant="caption" style={styles.flowNodeText}>{node}</Text>
              </View>
              {i < FLOW.length - 1 ? <View style={styles.flowArrow} /> : null}
            </React.Fragment>
          ))}
        </View>
      </View>
    </SectionShell>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 40, alignItems: 'center' },
  rowStacked: { flexDirection: 'column' },
  renderWrap: { flex: 1, alignItems: 'center', gap: 12 },
  render: { width: '100%', maxWidth: 380, aspectRatio: 333 / 399 },
  proNote: { color: 'rgba(255,255,255,0.50)', textAlign: 'center' },
  specList: { flex: 1, gap: 16 },
  specRow: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  specMark: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: '#FFB45C', marginTop: 6,
  },
  specCopy: { flex: 1 },
  specTitle: { color: '#FFFFFF', marginBottom: 3, fontSize: 15 },
  specBody: { color: 'rgba(255,255,255,0.62)', lineHeight: 20 },
  flowPanel: {
    marginTop: 56,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    borderRadius: 24,
    padding: 24,
    gap: 18,
  },
  flowTitle: {
    color: '#FFB45C',
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontSize: 12,
  },
  flowRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
  },
  flowNode: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  flowNodeText: { color: '#FFFFFF', fontSize: 12 },
  flowArrow: {
    width: 18, height: 2, borderRadius: 1,
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
});
