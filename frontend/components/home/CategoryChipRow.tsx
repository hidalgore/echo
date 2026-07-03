import React from 'react';
import { ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../../theme/tokens';
import { Text } from '../ui';

const CATEGORIES: Array<{ id: string | null; label: string }> = [
  { id: null, label: 'All' },
  { id: 'music', label: 'Music' },
  { id: 'art', label: 'Art' },
  { id: 'tech', label: 'Tech' },
  { id: 'food', label: 'Food' },
  { id: 'comedy', label: 'Comedy' },
  { id: 'community', label: 'Community' },
];

interface CategoryChipRowProps {
  selectedCategory: string | null;
  onCategoryChange: (id: string | null) => void;
}

export function CategoryChipRow({ selectedCategory, onCategoryChange }: CategoryChipRowProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {CATEGORIES.map((cat) => {
        const isActive = cat.id === selectedCategory;
        return (
          <TouchableOpacity
            key={cat.id || 'all'}
            style={[styles.chip, isActive && styles.chipActive]}
            onPress={() => onCategoryChange(cat.id)}
            activeOpacity={0.72}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={`${cat.label} category`}
          >
            <Text
              variant="meta"
              style={{ color: isActive ? colors.bg : colors.textHigh }}
            >
              {cat.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  chipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
});

export default CategoryChipRow;
