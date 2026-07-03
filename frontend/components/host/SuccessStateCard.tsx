/**
 * SuccessStateCard
 * Celebration card for event published success.
 * Shows mini event summary with subtle success accent.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, radius, typography, shadows } from '../../theme/hostTokens';
import type { EventDraft } from '../../types/hostEvents';

type SuccessStateCardProps = {
  draft: EventDraft;
};

export const SuccessStateCard: React.FC<SuccessStateCardProps> = ({ draft }) => {
  return (
    <View style={successStyles.card}>
      {/* Success accent */}
      <View style={successStyles.accentBar} />

      <View style={successStyles.content}>
        <Text style={successStyles.title}>{draft.title}</Text>
        <Text style={successStyles.venue}>{draft.venue}</Text>
        <Text style={successStyles.meta}>
          {draft.date} {'\u00B7'} {draft.startTime}
        </Text>
        <View style={successStyles.detailsRow}>
          {draft.price > 0 && <Text style={successStyles.detail}>${draft.price}</Text>}
          {draft.capacity > 0 && (
            <Text style={successStyles.detail}>
              {draft.price > 0 ? ' \u00B7 ' : ''}
              {draft.capacity} tickets
            </Text>
          )}
          {draft.ageRequirement !== 'All Ages' && (
            <Text style={successStyles.detail}>
              {' \u00B7 '}{draft.ageRequirement}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
};

/**
 * WebHandoffCard
 * Graceful web transition card. Communicates that advanced editing continues on web.
 */

type WebHandoffCardProps = {
  reason?: string;
  onContinueOnWeb: () => void;
  onKeepMobile: () => void;
};

import { TouchableOpacity } from 'react-native';

export const WebHandoffCard: React.FC<WebHandoffCardProps> = ({
  reason,
  onContinueOnWeb,
  onKeepMobile,
}) => {
  return (
    <View style={handoffStyles.card}>
      {/* Icon placeholder */}
      <View style={handoffStyles.iconContainer}>
        <Text style={handoffStyles.iconText}>{'\u{1F4BB}'}</Text>
      </View>

      <Text style={handoffStyles.title}>Continue on Web</Text>
      <Text style={handoffStyles.message}>
        {reason || 'For advanced event configuration, continue on the web dashboard.'}
      </Text>

      <TouchableOpacity
        style={handoffStyles.primaryBtn}
        onPress={onContinueOnWeb}
        activeOpacity={0.8}
        accessibilityLabel="Continue on web dashboard"
      >
        <Text style={handoffStyles.primaryText}>Continue on Web</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={handoffStyles.secondaryBtn}
        onPress={onKeepMobile}
        accessibilityLabel="Keep mobile setup"
      >
        <Text style={handoffStyles.secondaryText}>Keep Mobile Setup</Text>
      </TouchableOpacity>
    </View>
  );
};

// ─── Success Styles ──────────────────────────────────────────────────

const successStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.base,
    overflow: 'hidden',
    ...shadows.card,
  },
  accentBar: {
    height: 3,
    backgroundColor: colors.accentGreen,
  },
  content: {
    padding: spacing.base,
  },
  title: {
    ...typography.displayMd,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  venue: {
    ...typography.bodyMd,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  meta: {
    ...typography.bodySm,
    color: colors.textTertiary,
    marginBottom: spacing.md,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detail: {
    ...typography.bodySm,
    color: colors.textSecondary,
  },
});

// ─── Handoff Styles ──────────────────────────────────────────────────

const handoffStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.base,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    alignItems: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.base,
  },
  iconText: {
    fontSize: 28,
  },
  title: {
    ...typography.displayMd,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  message: {
    ...typography.bodyMd,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  primaryBtn: {
    width: '100%',
    backgroundColor: colors.textPrimary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  primaryText: {
    ...typography.bodyLg,
    fontWeight: '600',
    color: colors.bg,
  },
  secondaryBtn: {
    paddingVertical: spacing.sm,
  },
  secondaryText: {
    ...typography.bodyMd,
    fontWeight: '600',
    color: colors.textTertiary,
  },
});
