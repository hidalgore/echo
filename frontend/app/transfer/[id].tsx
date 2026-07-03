/**
 * Transfer — Screen 1: Enter Recipient
 * ══════════════════════════════════════════════════════
 * Method toggle: Contact | ECHO ID
 *
 * Contact mode: searchable mock contact list
 * ECHO ID mode: text input for @echoID handle
 *
 * On select → push to /transfer/confirm with
 *   { ticketId, recipientName, recipientHandle, method }
 */

import React, { useState, useMemo } from 'react';
import {
  View, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, StatusBar, Image, KeyboardAvoidingView, Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/tokens';
import { Text } from '../../components/ui';
import { useTicketStore } from '../../stores/ticketStore';
import { useEventStore } from '../../stores/eventStore';
import { formatDate, formatTime } from '../../utils/format';
import { logEvent, useValueTransitionLogger } from '../../services/logging';

import { ScreenBackButton } from '../../components/shared/ScreenBackButton';
// ─── Mock contacts ────────────────────────────────────────────────────────────

type Contact = {
  id: string;
  name: string;
  echoId: string;
  avatarUrl?: string;
  isFriend: boolean;
};

const MOCK_CONTACTS: Contact[] = [
  { id: 'c1', name: 'Jordan Lee',    echoId: '@jordanlee',   isFriend: true },
  { id: 'c2', name: 'Maya Patel',    echoId: '@mayapatel',   isFriend: true },
  { id: 'c3', name: 'Chris Nguyen',  echoId: '@chrisnguyen', isFriend: true },
  { id: 'c4', name: 'Alex Rivera',   echoId: '@alexrivera',  isFriend: false },
  { id: 'c5', name: 'Sam Torres',    echoId: '@samtorres',   isFriend: false },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function TransferRecipientScreen() {
  const insets = useSafeAreaInsets();
  const { id: ticketId } = useLocalSearchParams<{ id: string }>();

  const getTicketById = useTicketStore(s => s.getTicketById);
  const getEventById  = useEventStore(s => s.getEventById);
  const ticket        = getTicketById(ticketId);
  const event         = ticket ? getEventById(ticket.event_id) : undefined;

  type Method = 'contact' | 'echo_id';
  const [method,    setMethod]    = useState<Method>('contact');
  const [search,    setSearch]    = useState('');
  const [echoIdVal, setEchoIdVal] = useState('');
  const [selected,  setSelected]  = useState<Contact | null>(null);

  useValueTransitionLogger('transfer.recipient', 'method', method, { logInitial: true });
  useValueTransitionLogger('transfer.recipient', 'selectedContactId', selected?.id ?? null);

  const filtered = useMemo(() => {
    if (!search.trim()) return MOCK_CONTACTS;
    const q = search.toLowerCase();
    return MOCK_CONTACTS.filter(
      c => c.name.toLowerCase().includes(q) || c.echoId.toLowerCase().includes(q)
    );
  }, [search]);

  const canContinue = method === 'contact'
    ? !!selected
    : echoIdVal.trim().length >= 3;

  const handleContinue = () => {
    const recipientName   = method === 'contact'
      ? selected!.name
      : echoIdVal.trim();
    const recipientHandle = method === 'contact'
      ? selected!.echoId
      : echoIdVal.trim().startsWith('@') ? echoIdVal.trim() : `@${echoIdVal.trim()}`;

    logEvent('transfer.recipient', 'recipient_confirmed', {
      ticketId,
      method,
      selectedContactId: selected?.id ?? null,
      usedEchoIdInput: method === 'echo_id',
    });

    router.push({
      pathname: '/transfer/confirm',
      params: {
        ticketId,
        recipientName,
        recipientHandle,
        method,
      },
    });
  };

  return (
    <KeyboardAvoidingView
      style={[t.root, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" />

      {/* ── Header ── */}
      <View style={t.header}>
        <ScreenBackButton />
        <Text style={t.headerTitle}>Transfer Ticket</Text>
        <View style={t.headerSpacer} />
      </View>

      <ScrollView
        style={t.scroll}
        contentContainerStyle={[t.content, { paddingBottom: 120 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Ticket summary card ── */}
        {event && (
          <View style={t.ticketCard}>
            <View style={t.ticketIconWrap}>
              <LinearGradient
                colors={['rgba(6,182,212,0.8)', 'rgba(139,92,246,0.7)', 'rgba(236,72,153,0.7)']}
                style={t.ticketIcon}
              >
                <Ionicons name="ticket-outline" size={20} color="#FFF" />
              </LinearGradient>
            </View>
            <View style={t.ticketBody}>
              <Text style={t.ticketTitle} numberOfLines={1}>{event.title}</Text>
              <Text style={t.ticketMeta}>
                {formatDate(event.start_time)} · {formatTime(event.start_time)}
              </Text>
              <Text style={t.ticketVenue} numberOfLines={1}>{event.venue_name}</Text>
            </View>
          </View>
        )}

        {/* ── Method toggle ── */}
        <View style={t.toggleRow}>
          <ToggleChip
            label="By Contact"
            icon="people-outline"
            active={method === 'contact'}
            onPress={() => {
              logEvent('transfer.recipient', 'method_selected', { from: method, to: 'contact' });
              setMethod('contact');
              setSelected(null);
            }}
          />
          <ToggleChip
            label="By ECHO ID"
            icon="at-outline"
            active={method === 'echo_id'}
            onPress={() => {
              logEvent('transfer.recipient', 'method_selected', { from: method, to: 'echo_id' });
              setMethod('echo_id');
              setSelected(null);
            }}
          />
        </View>

        {/* ── Contact mode ── */}
        {method === 'contact' && (
          <>
            <View style={t.searchWrap}>
              <Ionicons name="search-outline" size={16} color={colors.textMuted} style={t.searchIcon} />
              <TextInput
                style={t.searchInput}
                placeholder="Search by name or ECHO ID…"
                placeholderTextColor={colors.textMuted}
                value={search}
                onChangeText={setSearch}
                autoCorrect={false}
                autoCapitalize="none"
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="close-circle" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            {filtered.length > 0 && (
              <View style={t.list}>
                {filtered.map(contact => (
                  <ContactRow
                    key={contact.id}
                    contact={contact}
                    selected={selected?.id === contact.id}
                    onPress={() => {
                      const next = selected?.id === contact.id ? null : contact;
                      logEvent('transfer.recipient', 'contact_toggled', {
                        contactId: contact.id,
                        selected: !!next,
                      });
                      setSelected(next);
                    }}
                  />
                ))}
              </View>
            )}

            {filtered.length === 0 && (
              <View style={t.empty}>
                <Ionicons name="person-outline" size={32} color={colors.textMuted} />
                <Text style={t.emptyText}>No contacts found</Text>
              </View>
            )}
          </>
        )}

        {/* ── ECHO ID mode ── */}
        {method === 'echo_id' && (
          <View style={t.echoIdWrap}>
            <Text style={t.echoIdLabel}>Enter recipient's ECHO ID</Text>
            <View style={t.echoIdInputRow}>
              <Text style={t.atSign}>@</Text>
              <TextInput
                style={t.echoIdInput}
                placeholder="echohandle"
                placeholderTextColor={colors.textMuted}
                value={echoIdVal.startsWith('@') ? echoIdVal.slice(1) : echoIdVal}
                onChangeText={v => setEchoIdVal(v)}
                autoCorrect={false}
                autoCapitalize="none"
                returnKeyType="done"
              />
            </View>
            <Text style={t.echoIdHint}>
              Ask your friend for their ECHO ID from their profile page.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* ── Fixed CTA ── */}
      <View style={[t.footer, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity
          style={[t.ctaBtn, !canContinue && t.ctaBtnDisabled]}
          onPress={canContinue ? handleContinue : undefined}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={canContinue
              ? ['#20C7FF', '#7B4DFF', '#E63DAD']
              : ['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.06)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={t.ctaGradient}
          >
            <Text style={[t.ctaText, !canContinue && t.ctaTextDim]}>
              Review Transfer
            </Text>
            <Ionicons
              name="arrow-forward"
              size={17}
              color={canContinue ? '#FFF' : colors.textMuted}
            />
          </LinearGradient>
        </TouchableOpacity>
        <Text style={t.ctaHint}>Recipient has 48 hours to accept</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ToggleChip({
  label, icon, active, onPress,
}: { label: string; icon: any; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[t.chip, active && t.chipActive]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Ionicons name={icon} size={15} color={active ? '#FFF' : colors.textMuted} />
      <Text style={[t.chipLabel, active && t.chipLabelActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function ContactRow({
  contact, selected, onPress,
}: { contact: Contact; selected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[t.contactRow, selected && t.contactRowSelected]}
      onPress={onPress}
      activeOpacity={0.82}
    >
      <View style={t.avatar}>
        <Text style={t.avatarText}>{contact.name[0]}</Text>
      </View>
      <View style={t.contactBody}>
        <Text style={t.contactName}>{contact.name}</Text>
        <Text style={t.contactHandle}>{contact.echoId}</Text>
      </View>
      <View style={[t.radio, selected && t.radioActive]}>
        {selected && <Ionicons name="checkmark" size={14} color="#FFF" />}
      </View>
    </TouchableOpacity>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const t = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0F1115' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.07)',
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: '#FFF' },
  headerSpacer: { width: 40 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 20 },

  // Ticket card
  ticketCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 14,
    marginBottom: 22,
  },
  ticketIconWrap: { marginRight: 14 },
  ticketIcon: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: 'center', justifyContent: 'center',
  },
  ticketBody: { flex: 1 },
  ticketTitle: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  ticketMeta:  { fontSize: 12, color: colors.textMuted, marginTop: 3 },
  ticketVenue: { fontSize: 12, color: colors.textMuted, marginTop: 2 },

  // Toggle
  toggleRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  chip: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 7, paddingVertical: 12, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  chipActive: {
    backgroundColor: 'rgba(139,92,246,0.16)',
    borderColor: 'rgba(139,92,246,0.45)',
  },
  chipLabel: { fontSize: 14, fontWeight: '600', color: colors.textMuted },
  chipLabelActive: { color: '#FFF' },

  // Search
  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 12, height: 46, marginBottom: 14,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: '#FFF' },

  // Contact list
  list: {
    borderRadius: 18, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  contactRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 14,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  contactRowSelected: { backgroundColor: 'rgba(139,92,246,0.08)' },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(139,92,246,0.22)',
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  avatarText: { fontSize: 16, fontWeight: '700', color: '#C4B5FD' },
  contactBody: { flex: 1 },
  contactName: { fontSize: 15, fontWeight: '600', color: '#FFF' },
  contactHandle: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  radio: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.20)',
    alignItems: 'center', justifyContent: 'center',
  },
  radioActive: { backgroundColor: '#7B4DFF', borderColor: '#7B4DFF' },

  // Empty
  empty: { alignItems: 'center', paddingVertical: 32, gap: 8 },
  emptyText: { fontSize: 14, color: colors.textMuted },

  // ECHO ID
  echoIdWrap: { gap: 10 },
  echoIdLabel: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  echoIdInputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
    paddingHorizontal: 14, height: 52,
  },
  atSign: { fontSize: 18, fontWeight: '700', color: colors.accent, marginRight: 4 },
  echoIdInput: { flex: 1, fontSize: 16, color: '#FFF' },
  echoIdHint: { fontSize: 12, color: colors.textMuted, lineHeight: 17 },

  // Footer CTA
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 20, paddingTop: 14,
    backgroundColor: '#0F1115',
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)',
  },
  ctaBtn: { borderRadius: 18, overflow: 'hidden', marginBottom: 8 },
  ctaBtnDisabled: { opacity: 0.5 },
  ctaGradient: {
    height: 54, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  ctaText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
  ctaTextDim: { color: colors.textMuted },
  ctaHint: { fontSize: 12, color: colors.textMuted, textAlign: 'center' },
});
