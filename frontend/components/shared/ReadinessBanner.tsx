import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/tokens';
import { Text, Glass } from '../ui';

interface ReadinessBannerProps {
  items: string[];
}

export function ReadinessBanner({ items }: ReadinessBannerProps) {
  return (
    <Glass style={styles.container}>
      <Ionicons name="warning" size={20} color={colors.warning} />
      <Text variant="caption" color="textSecondary" style={styles.text}>
        Complete setup: {items.join(', ')}
      </Text>
    </Glass>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginBottom: 16, borderRadius: 12, padding: 12 },
  text: { marginLeft: 8, flex: 1 },
});
