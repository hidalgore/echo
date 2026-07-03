/**
 * /host/create-event — Host event creation wizard (mock UI only).
 *
 * Locked v59 sections:
 * - Event basics
 * - Media upload placeholder
 * - Ticket setup
 * - Age requirement selector
 * - Donation campaign selector
 * - Location / venue
 * - Date / time
 * - Publish preview
 * - Save draft + Publish Event CTAs
 */
import React, { useState } from 'react';
import { Platform, StyleSheet, Text, TextInput, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { brand } from '../../theme/brand';
import { WebShell } from '../../components/web/WebShell';
import { WebSection } from '../../components/web/WebSection';
import { WebCTA } from '../../components/web/WebCTA';

type Field = { label: string; placeholder: string; value: string; multi?: boolean };

const AGE_OPTIONS = ['All ages', '18+', '21+'];
const DONATION_OPTIONS = ['No donation', 'Attach donation campaign', 'Choose existing campaign'];

export default function CreateEventPage() {
  if (Platform.OS !== 'web') return null;
  const { width } = useWindowDimensions();
  const compact = width < 880;

  const [basics, setBasics] = useState<Field[]>([
    { label: 'Event name', placeholder: 'The Midnight Tour \u2014 Seattle', value: '' },
    { label: 'Short description', placeholder: 'One sentence guests will see in search', value: '' },
    { label: 'Full description', placeholder: 'Tell the story of the night', value: '', multi: true },
  ]);
  const [age, setAge] = useState(0);
  const [donation, setDonation] = useState(0);

  return (
    <WebShell ambient>
      {/* Header */}
      <WebSection align="left" paddingVertical={40} maxWidth={1100}>
        <View style={[styles.header, compact && { flexDirection: 'column', alignItems: 'flex-start', gap: 12 }]}>
          <View>
            <Text style={styles.eyebrow}>CREATE EVENT</Text>
            <Text style={styles.title}>New event</Text>
            <Text style={styles.sub}>Build the page guests will actually feel.</Text>
          </View>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.draftBtn}>
              <Ionicons name="save-outline" size={16} color="#FFFFFF" />
              <Text style={styles.draftBtnText}>Save Draft</Text>
            </TouchableOpacity>
            <WebCTA label="Publish Event" href="/host/dashboard" variant="primary" size="md" icon="rocket-outline" />
          </View>
        </View>
      </WebSection>

      {/* Body two-col */}
      <WebSection align="left" paddingVertical={40} maxWidth={1100}>
        <View style={[styles.grid, compact && { flexDirection: 'column' }]}>
          {/* LEFT: form */}
          <View style={[styles.colMain, compact && { width: '100%' }]}>
            {/* Basics */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Event basics</Text>
              {basics.map((f, i) => (
                <View key={i} style={{ marginBottom: 14 }}>
                  <Text style={styles.fieldLabel}>{f.label}</Text>
                  <TextInput
                    placeholder={f.placeholder}
                    placeholderTextColor="rgba(255,255,255,0.35)"
                    value={f.value}
                    onChangeText={(t) => {
                      const next = [...basics];
                      next[i] = { ...next[i], value: t };
                      setBasics(next);
                    }}
                    multiline={f.multi}
                    style={[styles.input, f.multi && { minHeight: 96, paddingTop: 12 }]}
                  />
                </View>
              ))}
            </View>

            {/* Media */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Cover & media</Text>
              <View style={styles.uploadBox}>
                <Ionicons name="image-outline" size={22} color="rgba(255,255,255,0.55)" />
                <Text style={styles.uploadTitle}>Drop a cover image</Text>
                <Text style={styles.uploadSub}>1024 \u00D7 1024 minimum \u00B7 JPG or PNG</Text>
              </View>
            </View>

            {/* Tickets */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Ticket setup</Text>
              {[
                { name: 'General Admission', price: '$45', qty: '400' },
                { name: 'VIP', price: '$120', qty: '60' },
              ].map((t, i) => (
                <View key={i} style={styles.ticketRow}>
                  <Text style={styles.ticketName}>{t.name}</Text>
                  <Text style={styles.ticketMeta}>{t.qty} available \u00B7 {t.price}</Text>
                </View>
              ))}
              <TouchableOpacity style={styles.addRow}>
                <Ionicons name="add-circle-outline" size={18} color={brand.cyanAccessible} />
                <Text style={styles.addRowText}>Add ticket tier</Text>
              </TouchableOpacity>
            </View>

            {/* Age */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Age requirement</Text>
              <Text style={styles.lockNote}>
                Age verification happens before payment when required, so checkout stays clean and compliant.
              </Text>
              <View style={styles.chipRow}>
                {AGE_OPTIONS.map((opt, i) => (
                  <TouchableOpacity
                    key={i}
                    onPress={() => setAge(i)}
                    style={[styles.chip, age === i && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, age === i && styles.chipTextActive]}>{opt}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Donation */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Donation campaign</Text>
              <View style={styles.chipRow}>
                {DONATION_OPTIONS.map((opt, i) => (
                  <TouchableOpacity
                    key={i}
                    onPress={() => setDonation(i)}
                    style={[styles.chip, donation === i && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, donation === i && styles.chipTextActive]}>{opt}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Venue + Date */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Location & timing</Text>
              <View style={{ marginBottom: 12 }}>
                <Text style={styles.fieldLabel}>Venue name</Text>
                <TextInput placeholder="The Crocodile" placeholderTextColor="rgba(255,255,255,0.35)" style={styles.input} />
              </View>
              <View style={{ marginBottom: 12 }}>
                <Text style={styles.fieldLabel}>Address</Text>
                <TextInput placeholder="2200 2nd Ave, Seattle, WA" placeholderTextColor="rgba(255,255,255,0.35)" style={styles.input} />
              </View>
              <View style={[styles.rowSplit, compact && { flexDirection: 'column' }]}>
                <View style={[{ flex: 1 }, compact && { width: '100%', marginBottom: 12 }]}>
                  <Text style={styles.fieldLabel}>Doors</Text>
                  <TextInput placeholder="Sat, 9:00 PM" placeholderTextColor="rgba(255,255,255,0.35)" style={styles.input} />
                </View>
                <View style={[{ flex: 1 }, compact && { width: '100%' }]}>
                  <Text style={styles.fieldLabel}>End</Text>
                  <TextInput placeholder="Sun, 2:00 AM" placeholderTextColor="rgba(255,255,255,0.35)" style={styles.input} />
                </View>
              </View>
            </View>
          </View>

          {/* RIGHT: preview */}
          <View style={[styles.colSide, compact && { width: '100%' }]}>
            <View style={styles.previewCard}>
              <View style={styles.previewMedia}>
                <Ionicons name="image-outline" size={28} color="rgba(255,255,255,0.4)" />
                <Text style={styles.previewMediaText}>Cover preview</Text>
              </View>
              <View style={{ padding: 16 }}>
                <Text style={styles.previewBadgeRow}>
                  <Text style={styles.previewBadge}>VERIFIED HOST</Text>
                </Text>
                <Text style={styles.previewTitle}>{basics[0]?.value || 'Event name'}</Text>
                <Text style={styles.previewMeta}>Saturday \u00B7 9:00 PM \u00B7 The Crocodile</Text>
                <View style={styles.previewBtn}>
                  <Text style={styles.previewBtnText}>Reserve Access</Text>
                </View>
              </View>
            </View>
            <Text style={styles.previewHint}>Live preview updates as you edit.</Text>
          </View>
        </View>
      </WebSection>
    </WebShell>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  draftBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  draftBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  eyebrow: {
    color: brand.cyanAccessible,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
    marginBottom: 6,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  sub: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 14,
  },
  grid: {
    flexDirection: 'row',
    gap: 24,
    alignItems: 'flex-start',
  },
  colMain: { flex: 1.6 },
  colSide: { flex: 1 },
  card: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 18,
    padding: 22,
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginBottom: 14,
  },
  fieldLabel: {
    color: 'rgba(255,255,255,0.62)',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    color: '#FFFFFF',
    fontSize: 14,
  },
  uploadBox: {
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.12)',
    borderStyle: 'dashed',
    borderRadius: 14,
    paddingVertical: 32,
    alignItems: 'center',
    gap: 6,
  },
  uploadTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  uploadSub: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 12,
  },
  ticketRow: {
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  ticketName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  ticketMeta: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    paddingVertical: 8,
  },
  addRowText: {
    color: brand.cyanAccessible,
    fontSize: 13,
    fontWeight: '600',
  },
  lockNote: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 14,
    fontStyle: 'italic',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  chipActive: {
    backgroundColor: 'rgba(123,77,255,0.18)',
    borderColor: 'rgba(123,77,255,0.45)',
  },
  chipText: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  rowSplit: {
    flexDirection: 'row',
    gap: 12,
  },
  previewCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 18,
    overflow: 'hidden',
  },
  previewMedia: {
    aspectRatio: 4 / 5,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  previewMediaText: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 12,
  },
  previewBadgeRow: {
    marginBottom: 8,
  },
  previewBadge: {
    color: brand.cyanAccessible,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  previewTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  previewMeta: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 13,
    marginBottom: 14,
  },
  previewBtn: {
    backgroundColor: brand.primary,
    paddingVertical: 11,
    alignItems: 'center',
    borderRadius: 999,
  },
  previewBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  previewHint: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 12,
    marginTop: 10,
    textAlign: 'center',
  },
});
