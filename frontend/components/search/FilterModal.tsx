import React, { useState, useEffect, useMemo } from 'react';
import {
  View, ScrollView, StyleSheet, TouchableOpacity, Modal,
  Animated, Dimensions, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing, sizes, typography, motion } from '../../theme/tokens';
import { Text, Glass } from '../ui';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface FilterState {
  date: string;
  price: string;
  age: string;
  distance: string;
  categories: string[];
  venueType: string;
  accessibility: string[];
  sortBy: string;
}

export const DEFAULT_FILTERS: FilterState = {
  date: 'all',
  price: 'all',
  age: 'all',
  distance: '10',
  categories: [],
  venueType: 'all',
  accessibility: [],
  sortBy: 'relevance',
};

export interface FilterPreset {
  id: string;
  name: string;
  icon: string;
  filters: Partial<FilterState>;
}

const QUICK_PRESETS: FilterPreset[] = [
  { id: 'tonight', name: 'Free Tonight', icon: 'moon', filters: { date: 'today', price: 'free' } },
  { id: 'weekend', name: 'This Weekend', icon: 'calendar', filters: { date: 'weekend' } },
  { id: 'nearby', name: 'Walking Distance', icon: 'walk', filters: { distance: '1' } },
  { id: 'accessible', name: 'Accessible', icon: 'accessibility', filters: { accessibility: ['wheelchair'] } },
];

const DATE_OPTIONS = [
  { id: 'all', label: 'All Dates' },
  { id: 'today', label: 'Today' },
  { id: 'tomorrow', label: 'Tomorrow' },
  { id: 'weekend', label: 'This Weekend' },
  { id: 'week', label: 'This Week' },
];

const PRICE_OPTIONS = [
  { id: 'all', label: 'Any Price' },
  { id: 'free', label: 'Free' },
  { id: 'paid', label: 'Paid' },
  { id: 'under50', label: 'Under $50' },
];

const AGE_OPTIONS = [
  { id: 'all', label: 'All Ages' },
  { id: '18', label: '18+' },
  { id: '21', label: '21+' },
];

const DISTANCE_OPTIONS = [
  { id: '1', label: '1 mi' },
  { id: '5', label: '5 mi' },
  { id: '10', label: '10 mi' },
  { id: '25', label: '25 mi' },
  { id: '50', label: '50 mi' },
];

const CATEGORY_OPTIONS = [
  { id: 'music', label: 'Music', icon: 'musical-notes' },
  { id: 'art', label: 'Art & Culture', icon: 'color-palette' },
  { id: 'tech', label: 'Tech', icon: 'hardware-chip' },
  { id: 'food', label: 'Food & Drink', icon: 'restaurant' },
  { id: 'sports', label: 'Sports', icon: 'football' },
  { id: 'comedy', label: 'Comedy', icon: 'happy' },
  { id: 'nightlife', label: 'Nightlife', icon: 'wine' },
];

const VENUE_OPTIONS = [
  { id: 'all', label: 'All Venues' },
  { id: 'indoor', label: 'Indoor', icon: 'business' },
  { id: 'outdoor', label: 'Outdoor', icon: 'sunny' },
  { id: 'virtual', label: 'Virtual', icon: 'videocam' },
];

const ACCESSIBILITY_OPTIONS = [
  { id: 'wheelchair', label: 'Wheelchair Accessible', icon: 'accessibility' },
  { id: 'asl', label: 'ASL Interpreter', icon: 'hand-left' },
  { id: 'audio', label: 'Audio Description', icon: 'ear' },
  { id: 'sensory', label: 'Sensory Friendly', icon: 'eye-off' },
];

const SORT_OPTIONS = [
  { id: 'relevance', label: 'Relevance' },
  { id: 'date', label: 'Date (Soonest)' },
  { id: 'price_low', label: 'Price (Low to High)' },
  { id: 'distance', label: 'Distance' },
  { id: 'popular', label: 'Popularity' },
];

function FilterChip({ label, isActive, onPress, icon }: { label: string; isActive: boolean; onPress: () => void; icon?: string }) {
  return (
    <TouchableOpacity style={[styles.chip, isActive && styles.chipActive]} onPress={onPress} activeOpacity={0.7}>
      {icon && <Ionicons name={`${icon}-outline` as never} size={14} color={isActive ? colors.bg : colors.text} style={{ marginRight: 4 }} />}
      <Text variant="meta" style={{ color: isActive ? colors.bg : colors.text }}>{label}</Text>
    </TouchableOpacity>
  );
}

function MultiChip({ label, isActive, onPress, icon }: { label: string; isActive: boolean; onPress: () => void; icon?: string }) {
  return (
    <TouchableOpacity style={[styles.multiChip, isActive && styles.multiChipActive]} onPress={onPress} activeOpacity={0.7}>
      {icon && <Ionicons name={`${icon}-outline` as never} size={20} color={isActive ? colors.accent : colors.textMuted} />}
      <Text variant="meta" style={[styles.multiChipText, isActive && styles.multiChipTextActive]}>{label}</Text>
      {isActive && <Ionicons name="checkmark-outline" size={20} color={colors.accent} />}
    </TouchableOpacity>
  );
}

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  filters: FilterState;
  onApply: (filters: FilterState) => void;
  resultCount: number;
}

export function FilterModal({ visible, onClose, filters, onApply, resultCount }: FilterModalProps) {
  const [localFilters, setLocalFilters] = useState<FilterState>(filters);
  const [showSort, setShowSort] = useState(false);
  const slideAnim = React.useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    if (visible) {
      setLocalFilters(filters);
      Animated.timing(slideAnim, { 
        toValue: 0, 
        duration: motion.duration.sheetOpen,
        useNativeDriver: true 
      }).start();
    } else {
      Animated.timing(slideAnim, { 
        toValue: SCREEN_HEIGHT, 
        duration: motion.duration.sheetClose,
        useNativeDriver: true 
      }).start();
    }
  }, [visible]);

  const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }));
  };

  const toggleArray = (key: 'categories' | 'accessibility', value: string) => {
    setLocalFilters(prev => {
      const arr = prev[key];
      return { ...prev, [key]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value] };
    });
  };

  const applyPreset = (preset: FilterPreset) => setLocalFilters(prev => ({ ...prev, ...preset.filters }));
  const handleReset = () => setLocalFilters(DEFAULT_FILTERS);
  const handleApply = () => { onApply(localFilters); onClose(); };

  const hasActiveFilters = useMemo(() => {
    return localFilters.date !== 'all' || 
           localFilters.price !== 'all' || 
           localFilters.age !== 'all' || 
           localFilters.distance !== '10' || 
           localFilters.categories.length > 0 || 
           localFilters.venueType !== 'all' || 
           localFilters.accessibility.length > 0;
  }, [localFilters]);

  const sortLabel = SORT_OPTIONS.find(o => o.id === localFilters.sortBy)?.label || 'Relevance';

  return (
    <Modal visible={visible} transparent animationType="none">
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />
        <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.sheetInner}>
            {/* Header */}
            <View style={styles.header}>
              <Text variant="sheetTitle">Filters</Text>
              <View style={styles.headerRight}>
                {hasActiveFilters && <View style={styles.dot} />}
                <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                  <Ionicons name="close-outline" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              {/* Quick Combos */}
              <View style={styles.section}>
                <Text variant="sectionTitle">QUICK FILTERS</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
                  {QUICK_PRESETS.map(p => (
                    <TouchableOpacity key={p.id} style={styles.preset} onPress={() => applyPreset(p)} activeOpacity={0.7}>
                      <Ionicons name={`${p.icon}-outline` as never} size={20} color={colors.accent} />
                      <Text variant="meta" style={{ color: colors.text, marginLeft: 6 }}>{p.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Sort */}
              <View style={styles.section}>
                <Text variant="sectionTitle">SORT BY</Text>
                <TouchableOpacity style={styles.sortBtn} onPress={() => setShowSort(!showSort)}>
                  <Text variant="eventTitle" style={{ color: colors.text }}>{sortLabel}</Text>
                  <Ionicons name={showSort ? 'chevron-up-outline' : 'chevron-down-outline'} size={22} color={colors.textMuted} />
                </TouchableOpacity>
                {showSort && (
                  <Glass style={styles.sortList}>
                    {SORT_OPTIONS.map(o => (
                      <TouchableOpacity 
                        key={o.id} 
                        style={[styles.sortOption, localFilters.sortBy === o.id && styles.sortActive]} 
                        onPress={() => { updateFilter('sortBy', o.id); setShowSort(false); }}
                      >
                        <Text variant="eventTitle" style={{ color: localFilters.sortBy === o.id ? colors.accent : colors.text }}>{o.label}</Text>
                        {localFilters.sortBy === o.id && <Ionicons name="checkmark-outline" size={20} color={colors.accent} />}
                      </TouchableOpacity>
                    ))}
                  </Glass>
                )}
              </View>

              {/* Date */}
              <View style={styles.section}>
                <Text variant="sectionTitle">DATE</Text>
                <View style={styles.chips}>{DATE_OPTIONS.map(o => (
                  <FilterChip key={o.id} label={o.label} isActive={localFilters.date === o.id} onPress={() => updateFilter('date', o.id)} />
                ))}</View>
              </View>

              {/* Category */}
              <View style={styles.section}>
                <Text variant="sectionTitle">CATEGORY</Text>
                <View style={styles.multiGrid}>{CATEGORY_OPTIONS.map(o => (
                  <MultiChip key={o.id} label={o.label} icon={o.icon} isActive={localFilters.categories.includes(o.id)} onPress={() => toggleArray('categories', o.id)} />
                ))}</View>
              </View>

              {/* Price */}
              <View style={styles.section}>
                <Text variant="sectionTitle">PRICE</Text>
                <View style={styles.chips}>{PRICE_OPTIONS.map(o => (
                  <FilterChip key={o.id} label={o.label} isActive={localFilters.price === o.id} onPress={() => updateFilter('price', o.id)} />
                ))}</View>
              </View>

              {/* Age */}
              <View style={styles.section}>
                <Text variant="sectionTitle">AGE</Text>
                <View style={styles.chips}>{AGE_OPTIONS.map(o => (
                  <FilterChip key={o.id} label={o.label} isActive={localFilters.age === o.id} onPress={() => updateFilter('age', o.id)} />
                ))}</View>
              </View>

              {/* Distance */}
              <View style={styles.section}>
                <Text variant="sectionTitle">DISTANCE</Text>
                <View style={styles.chips}>{DISTANCE_OPTIONS.map(o => (
                  <FilterChip key={o.id} label={o.label} isActive={localFilters.distance === o.id} onPress={() => updateFilter('distance', o.id)} />
                ))}</View>
                <Text variant="notifTime" style={{ marginTop: 8 }}>Uses approximate location. Never stored.</Text>
              </View>

              {/* Venue */}
              <View style={styles.section}>
                <Text variant="sectionTitle">VENUE TYPE</Text>
                <View style={styles.chips}>{VENUE_OPTIONS.map(o => (
                  <FilterChip key={o.id} label={o.label} icon={o.icon} isActive={localFilters.venueType === o.id} onPress={() => updateFilter('venueType', o.id)} />
                ))}</View>
              </View>

              {/* Accessibility */}
              <View style={styles.section}>
                <Text variant="sectionTitle">ACCESSIBILITY</Text>
                <View style={styles.multiGrid}>{ACCESSIBILITY_OPTIONS.map(o => (
                  <MultiChip key={o.id} label={o.label} icon={o.icon} isActive={localFilters.accessibility.includes(o.id)} onPress={() => toggleArray('accessibility', o.id)} />
                ))}</View>
              </View>

              <View style={{ height: 120 }} />
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
              <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
                <Text variant="actionText" style={{ color: colors.textMuted }}>RESET</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyBtn} onPress={handleApply}>
                <Text variant="actionText" style={{ color: colors.text }}>SHOW {resultCount} RESULTS</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.closeTextBtn} onPress={onClose}>
                <Text variant="actionText" style={{ color: colors.textMuted }}>CLOSE</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.overlayDim },
  sheet: { maxHeight: SCREEN_HEIGHT * 0.92, borderTopLeftRadius: 16, borderTopRightRadius: 16, overflow: 'hidden' },
  sheetInner: { flex: 1, backgroundColor: colors.sheet },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.hairline },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.danger },
  closeBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1, paddingHorizontal: 16 },
  section: { marginTop: 24 },
  preset: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: colors.unreadRowBg, borderWidth: 1, borderColor: colors.accent, marginRight: 8, minHeight: 44 },
  sortBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.hairline, borderRadius: 12, padding: 16, marginTop: 12, minHeight: 44 },
  sortList: { marginTop: 8, borderRadius: 12, overflow: 'hidden' },
  sortOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, minHeight: 60, borderBottomWidth: 1, borderBottomColor: colors.hairline },
  sortActive: { backgroundColor: colors.unreadRowBg },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  chip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.hairline, minHeight: 44 },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  multiGrid: { gap: 8, marginTop: 12 },
  multiChip: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.hairline, gap: 8, minHeight: 44 },
  multiChipActive: { borderColor: colors.accent, backgroundColor: colors.unreadRowBg },
  multiChipText: { flex: 1, color: colors.textMuted },
  multiChipTextActive: { color: colors.text },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 16, paddingBottom: Platform.OS === 'ios' ? 36 : 16, borderTopWidth: 1, borderTopColor: colors.hairline, backgroundColor: colors.surface },
  resetBtn: { padding: 8, minHeight: 44, justifyContent: 'center' },
  applyBtn: { flex: 1, marginHorizontal: 8, paddingVertical: 16, borderRadius: 24, alignItems: 'center', backgroundColor: colors.accent, minHeight: 44, justifyContent: 'center' },
  closeTextBtn: { padding: 8, minHeight: 44, justifyContent: 'center' },
});
