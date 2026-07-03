/**
 * SearchBar
 * Minimal dark surface search input. Placeholder: "Search events".
 */

import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { colors, spacing, radius, typography, SCREEN_HORIZONTAL_PADDING } from '../../theme/hostTokens';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
};

export const SearchBar: React.FC<Props> = ({
  value,
  onChangeText,
  placeholder = 'Search events',
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.iconPlaceholder}>
        <View style={styles.iconCircle} />
      </View>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        returnKeyType="search"
        accessibilityLabel="Search events"
        accessibilityHint="Type to filter your events"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    marginHorizontal: SCREEN_HORIZONTAL_PADDING,
    paddingHorizontal: spacing.base,
    height: 44,
  },
  iconPlaceholder: {
    marginRight: spacing.sm,
  },
  iconCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: colors.textTertiary,
  },
  input: {
    flex: 1,
    ...typography.bodyMd,
    color: colors.textPrimary,
    paddingVertical: 0,
  },
});
