import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDynamicTheme } from '../../theme/dynamicTheme';
import { Text } from '../ui';

interface SectionHeaderProps {
  title: string;
  count?: number;
  onSeeAll?: () => void;
  showCount?: boolean;
}

export function SectionHeader({ title, count, onSeeAll, showCount = false }: SectionHeaderProps) {
  const { colors: c } = useDynamicTheme();

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <Text style={[styles.title, { color: c.text }]}>{title}</Text>
        {showCount && count !== undefined && (
          <View style={[styles.countBadge, { backgroundColor: c.surface2, borderColor: c.hairline }]}>
            <Text variant="caption" style={{ color: c.textSecondary }}>{count}</Text>
          </View>
        )}
      </View>

      <TouchableOpacity onPress={onSeeAll} style={styles.seeAll} activeOpacity={0.72}>
        <Text style={[styles.seeAllText, { color: c.textMuted }]}>View all</Text>
        <Ionicons name="chevron-forward" size={18} color={c.text} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 44,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 10,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 22,
    lineHeight: 27,
    fontWeight: '800',
    letterSpacing: -0.35,
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
  },
  seeAll: {
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingLeft: 12,
  },
  seeAllText: {
    fontSize: 15,
    fontWeight: '650',
  },
});

export default SectionHeader;
