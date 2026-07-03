/**
 * /search — ECHO Search / Picked for You web page.
 *
 * Locked v55 + v59 behavior preserved:
 * - Picked for You is calm and premium — never creepy.
 * - Allowed reason labels only (see PICKED_REASONS).
 * - Forbidden language ("we watched you", "12 seconds", etc.) is never rendered.
 *
 * Native /(tabs)/search is the canonical mobile experience. This is the
 * web-only counterpart and never renders on native.
 */
import React, { useMemo, useState } from 'react';
import { Platform, StyleSheet, Text, TextInput, TouchableOpacity, View, useWindowDimensions, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { brand } from '../theme/brand';
import { WebShell } from '../components/web/WebShell';
import { WebSection } from '../components/web/WebSection';
import { EventCardWeb } from '../components/web/EventCardWeb';
import { getPublicWebEvents } from '../services/webPlatformMock';
import type { Event } from '../types';

const CATEGORY_CHIPS = ['All', 'Music', 'Food', 'Comedy', 'Art', 'Tech', 'Community', 'Nightlife', 'Wellness', 'Sports'];
const DATE_CHIPS = ['Any date', 'Today', 'This weekend', 'Next 7 days', 'Next 30 days'];
const PRICE_CHIPS = ['Any price', 'Free', 'Under $25', '$25–$75', '$75+'];
const AGE_CHIPS = ['All ages', '18+', '21+'];

const PICKED_REASONS = [
  'Similar to events you viewed',
  'Matches your music interest',
  'Popular near you',
  'Weekend match',
  'From a host you viewed',
  'Donation available',
];

interface Row {
  key: string;
  title: string;
  subtitle?: string;
  filter: (events: Event[]) => Event[];
  showReason?: boolean;
}

export default function SearchPage() {
  const { width } = useWindowDimensions();
  const compact = width < 760;
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeDate, setActiveDate] = useState('Any date');
  const [activePrice, setActivePrice] = useState('Any price');
  const [activeAge, setActiveAge] = useState('All ages');

  const events = getPublicWebEvents(20);

  const filtered = useMemo(() => {
    let result = events;
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.venue_name.toLowerCase().includes(q) ||
          e.category.toLowerCase().includes(q),
      );
    }
    if (activeCategory !== 'All') {
      result = result.filter((e) => e.category.toLowerCase() === activeCategory.toLowerCase());
    }
    if (activeAge !== 'All ages') {
      const needed = activeAge === '21+' ? 21 : 18;
      result = result.filter((e) => (e.age_restriction ?? 0) >= needed);
    }
    return result;
  }, [events, query, activeCategory, activeAge]);

  const rows: Row[] = [
    {
      key: 'picked',
      title: 'Picked for You',
      subtitle: 'Curated by ECHO AI.',
      filter: (list) => list.slice(0, 6),
      showReason: true,
    },
    { key: 'trending', title: 'Trending Near You', filter: (list) => list.slice(0, 8) },
    { key: 'weekend', title: 'This Weekend', filter: (list) => list.slice(2, 10) },
    { key: 'community', title: 'Community', filter: (list) => list.filter((e) => e.category.toLowerCase() === 'community').slice(0, 8) },
    { key: 'music', title: 'Music', filter: (list) => list.filter((e) => e.category.toLowerCase() === 'music').slice(0, 8) },
    { key: 'food', title: 'Food', filter: (list) => list.filter((e) => e.category.toLowerCase() === 'food').slice(0, 8) },
    { key: 'comedy', title: 'Comedy', filter: (list) => list.filter((e) => e.category.toLowerCase() === 'comedy').slice(0, 8) },
    { key: 'art', title: 'Art', filter: (list) => list.filter((e) => e.category.toLowerCase() === 'art').slice(0, 8) },
    { key: 'tech', title: 'Tech', filter: (list) => list.filter((e) => e.category.toLowerCase() === 'tech').slice(0, 8) },
  ];

  return (
    <WebShell>
      <WebSection paddingVertical={compact ? 32 : 56}>
        <View style={styles.searchHeader}>
          <Text style={styles.h1}>Find the moment.</Text>
          <Text style={styles.h1Sub}>Search verified hosts, curated picks, and events near you.</Text>

          {/* Search bar */}
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color="rgba(255,255,255,0.55)" />
            <TextInput
              style={styles.searchInput}
              value={query}
              onChangeText={setQuery}
              placeholder="Search events, hosts, or moments"
              placeholderTextColor="rgba(255,255,255,0.40)"
              returnKeyType="search"
            />
            {query.length > 0 && (
              <TouchableOpacity activeOpacity={0.7} onPress={() => setQuery('')}>
                <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.5)" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Filter rails */}
        <View style={styles.filtersWrap}>
          <FilterRow label="CATEGORY" chips={CATEGORY_CHIPS} active={activeCategory} onChange={setActiveCategory} />
          <FilterRow label="DATE" chips={DATE_CHIPS} active={activeDate} onChange={setActiveDate} />
          <FilterRow label="PRICE" chips={PRICE_CHIPS} active={activePrice} onChange={setActivePrice} />
          <FilterRow label="AGE" chips={AGE_CHIPS} active={activeAge} onChange={setActiveAge} />
        </View>
      </WebSection>

      {/* Results context bar */}
      <WebSection paddingVertical={0}>
        <View style={styles.contextBar}>
          <Text style={styles.contextText}>
            {filtered.length} events · {activeCategory} · {activeAge}
          </Text>
          <View style={styles.contextRight}>
            <Ionicons name="location-outline" size={14} color="rgba(255,255,255,0.55)" />
            <Text style={styles.contextRightText}>Spanaway, WA</Text>
          </View>
        </View>
      </WebSection>

      {/* Rows */}
      {rows.map((row) => {
        const list = row.filter(filtered);
        if (list.length === 0) return null;
        return (
          <WebSection key={row.key} paddingVertical={compact ? 32 : 48}>
            <View style={styles.rowHeader}>
              <View>
                <Text style={styles.rowTitle}>{row.title}</Text>
                {row.subtitle && <Text style={styles.rowSubtitle}>{row.subtitle}</Text>}
              </View>
            </View>
            <View style={styles.rowGrid}>
              {list.map((event, idx) => (
                <View key={event.id} style={[styles.rowCell, compact && styles.rowCellCompact]}>
                  <EventCardWeb event={event} size="md" />
                  {row.showReason && (
                    <View style={styles.reasonRow}>
                      <Ionicons name="sparkles" size={12} color={brand.cyanAccessible} />
                      <Text style={styles.reasonText}>
                        {PICKED_REASONS[idx % PICKED_REASONS.length]}
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </WebSection>
        );
      })}
    </WebShell>
  );
}

interface FilterRowProps {
  label: string;
  chips: string[];
  active: string;
  onChange: (v: string) => void;
}
function FilterRow({ label, chips, active, onChange }: FilterRowProps) {
  return (
    <View style={styles.filterRow}>
      <Text style={styles.filterLabel}>{label}</Text>
      <View style={styles.filterChipsRow}>
        {chips.map((chip) => (
          <TouchableOpacity
            key={chip}
            activeOpacity={0.85}
            onPress={() => onChange(chip)}
            style={[styles.filterChip, active === chip && styles.filterChipActive]}
          >
            <Text style={[styles.filterChipText, active === chip && styles.filterChipTextActive]}>{chip}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  searchHeader: { gap: 14, maxWidth: 760 },
  h1: { color: '#FFFFFF', fontSize: 38, fontWeight: '800', letterSpacing: -0.5 },
  h1Sub: { color: 'rgba(255,255,255,0.62)', fontSize: 16, lineHeight: 24 },
  searchBar: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  searchInput: { flex: 1, color: '#FFFFFF', fontSize: 16, paddingVertical: 0 },
  filtersWrap: { marginTop: 28, gap: 14 },
  filterRow: { gap: 8 },
  filterLabel: { color: 'rgba(255,255,255,0.50)', fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  filterChipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  filterChipActive: { backgroundColor: brand.primary, borderColor: brand.primary },
  filterChipText: { color: 'rgba(255,255,255,0.82)', fontSize: 13, fontWeight: '500' },
  filterChipTextActive: { color: '#FFFFFF', fontWeight: '700' },

  contextBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  contextText: { color: 'rgba(255,255,255,0.65)', fontSize: 13, fontWeight: '500' },
  contextRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  contextRightText: { color: 'rgba(255,255,255,0.55)', fontSize: 12 },

  rowHeader: { marginBottom: 16, gap: 4 },
  rowTitle: { color: '#FFFFFF', fontSize: 24, fontWeight: '700', letterSpacing: -0.3 },
  rowSubtitle: { color: 'rgba(255,255,255,0.55)', fontSize: 13, fontWeight: '500' },
  rowGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  rowCell: { width: '23%', minWidth: 240, gap: 8 },
  rowCellCompact: { width: '48%' },
  reasonRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 4 },
  reasonText: { color: 'rgba(255,255,255,0.62)', fontSize: 12, fontWeight: '500' },
});
