/**
 * SuggestionCard
 * AI-generated suggestion card. Light assistant style, not chatbot.
 * Actions: Use Suggestion, Edit.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, radius, typography } from '../../theme/hostTokens';
import type { AISuggestion } from '../../types/hostEvents';

type Props = {
  suggestion: AISuggestion;
  onAccept: (id: string) => void;
  onEdit: (id: string) => void;
};

export const SuggestionCard: React.FC<Props> = React.memo(
  ({ suggestion, onAccept, onEdit }) => {
    return (
      <View style={[styles.card, suggestion.accepted && styles.cardAccepted]}>
        {/* Title */}
        <Text style={styles.title}>{suggestion.title}</Text>

        {/* Subtitle context */}
        {suggestion.subtitle && (
          <Text style={styles.subtitle}>{suggestion.subtitle}</Text>
        )}

        {/* Suggested value */}
        <View style={styles.valueContainer}>
          <Text style={styles.suggestedValue} numberOfLines={4}>
            {suggestion.suggestedValue}
          </Text>
        </View>

        {/* Current vs suggested for price/capacity */}
        {suggestion.currentValue && (
          <Text style={styles.currentValue}>
            Current: {suggestion.currentValue}
          </Text>
        )}

        {/* Actions */}
        {!suggestion.accepted ? (
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.acceptBtn}
              onPress={() => onAccept(suggestion.id)}
              activeOpacity={0.8}
              accessibilityLabel={`Use suggestion: ${suggestion.title}`}
            >
              <Text style={styles.acceptText}>Use Suggestion</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => onEdit(suggestion.id)}
              accessibilityLabel={`Edit suggestion: ${suggestion.title}`}
            >
              <Text style={styles.editText}>Edit</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.acceptedRow}>
            <Text style={styles.acceptedIcon}>{'\u2713'}</Text>
            <Text style={styles.acceptedText}>Applied</Text>
          </View>
        )}
      </View>
    );
  }
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.base,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.base,
    marginBottom: spacing.md,
  },
  cardAccepted: {
    borderColor: colors.accentGreen + '40',
    backgroundColor: colors.accentGreen + '08',
  },
  title: {
    ...typography.bodyLg,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.bodySm,
    color: colors.textTertiary,
    marginBottom: spacing.md,
  },
  valueContainer: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  suggestedValue: {
    ...typography.bodyMd,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  currentValue: {
    ...typography.bodySm,
    color: colors.textTertiary,
    marginBottom: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  acceptBtn: {
    flex: 1,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.accentViolet + '30',
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  acceptText: {
    ...typography.bodySm,
    fontWeight: '600',
    color: colors.accentViolet,
  },
  editBtn: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    minHeight: 36,
    justifyContent: 'center',
  },
  editText: {
    ...typography.bodySm,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  acceptedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  acceptedIcon: {
    fontSize: 14,
    color: colors.accentGreen,
    marginRight: spacing.xs,
  },
  acceptedText: {
    ...typography.bodySm,
    fontWeight: '600',
    color: colors.accentGreen,
  },
});
