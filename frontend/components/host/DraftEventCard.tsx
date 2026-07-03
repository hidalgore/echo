/**
 * DraftEventCard
 * Encourages completion. Shows title, draft badge, "Continue Setup" CTA.
 * No fake metrics on drafts.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, radius, typography, shadows, SCREEN_HORIZONTAL_PADDING } from '../../theme/hostTokens';
import { StatusBadge } from './StatusBadge';
import type { HostEvent } from '../../types/hostEvents';

type DraftProps = {
  event: HostEvent;
  onContinueSetup: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

export const DraftEventCard: React.FC<DraftProps> = React.memo(
  ({ event, onContinueSetup, onEdit, onDelete }) => {
    return (
      <View style={draftStyles.card}>
        {/* Amber accent border for draft state */}
        <View style={draftStyles.accentBorder} />

        <View style={draftStyles.content}>
          <View style={draftStyles.headerRow}>
            <StatusBadge variant="status" status="draft" />
            <TouchableOpacity
              onPress={onDelete}
              style={draftStyles.moreBtn}
              accessibilityLabel="Delete draft"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={draftStyles.moreIcon}>{'\u22EF'}</Text>
            </TouchableOpacity>
          </View>

          <Text style={draftStyles.title}>{event.title}</Text>
          {event.venue ? (
            <Text style={draftStyles.meta}>{event.venue}</Text>
          ) : (
            <Text style={draftStyles.metaMissing}>Venue not set</Text>
          )}

          <View style={draftStyles.actions}>
            <TouchableOpacity
              style={draftStyles.continueBtn}
              onPress={onContinueSetup}
              activeOpacity={0.8}
              accessibilityLabel="Continue setting up this event"
            >
              <Text style={draftStyles.continueBtnText}>Continue Setup</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onEdit}
              style={draftStyles.editBtn}
              accessibilityLabel="Edit draft"
            >
              <Text style={draftStyles.editText}>Edit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }
);

/**
 * PastEventCard
 * Final summary: tickets sold, final revenue, completed badge.
 * Actions: view analytics, duplicate.
 */

type PastProps = {
  event: HostEvent;
  onViewAnalytics: () => void;
  onDuplicate: () => void;
};

export const PastEventCard: React.FC<PastProps> = React.memo(
  ({ event, onViewAnalytics, onDuplicate }) => {
    const formattedRevenue = `$${event.revenue.toLocaleString()}`;

    return (
      <View style={pastStyles.card}>
        <View style={pastStyles.content}>
          <View style={pastStyles.headerRow}>
            <StatusBadge variant="status" status="past" />
            <TouchableOpacity
              onPress={onDuplicate}
              style={pastStyles.duplicateBtn}
              accessibilityLabel="Duplicate event"
            >
              <Text style={pastStyles.duplicateText}>Duplicate</Text>
            </TouchableOpacity>
          </View>

          <Text style={pastStyles.title}>{event.title}</Text>
          <Text style={pastStyles.meta}>
            {event.venue} {'\u00B7'} {event.date}
          </Text>

          <View style={pastStyles.statsRow}>
            <Text style={pastStyles.stat}>
              {event.ticketsSold} tickets sold
            </Text>
            <Text style={pastStyles.statDivider}>{'\u00B7'}</Text>
            <Text style={pastStyles.stat}>{formattedRevenue}</Text>
          </View>

          {event.healthLabel === 'Completed' && (
            <View style={pastStyles.completedBadge}>
              <Text style={pastStyles.completedText}>Completed</Text>
            </View>
          )}

          <TouchableOpacity
            onPress={onViewAnalytics}
            style={pastStyles.analyticsBtn}
            accessibilityLabel="View analytics"
          >
            <Text style={pastStyles.analyticsText}>View Analytics</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
);

// ─── Draft Styles ────────────────────────────────────────────────────

const draftStyles = StyleSheet.create({
  card: {
    marginHorizontal: SCREEN_HORIZONTAL_PADDING,
    borderRadius: radius.base,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    ...shadows.card,
  },
  accentBorder: {
    height: 2,
    backgroundColor: colors.statusDraft,
  },
  content: {
    padding: spacing.base,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  moreBtn: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreIcon: {
    fontSize: 18,
    color: colors.textTertiary,
  },
  title: {
    ...typography.bodyLg,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xxs,
  },
  meta: {
    ...typography.bodySm,
    color: colors.textTertiary,
    marginBottom: spacing.base,
  },
  metaMissing: {
    ...typography.bodySm,
    color: colors.textDisabled,
    fontStyle: 'italic',
    marginBottom: spacing.base,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  continueBtn: {
    flex: 1,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.statusDraft + '40',
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  continueBtnText: {
    ...typography.bodySm,
    fontWeight: '600',
    color: colors.statusDraft,
  },
  editBtn: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    minHeight: 44,
    justifyContent: 'center',
  },
  editText: {
    ...typography.bodySm,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});

// ─── Past Styles ─────────────────────────────────────────────────────

const pastStyles = StyleSheet.create({
  card: {
    marginHorizontal: SCREEN_HORIZONTAL_PADDING,
    borderRadius: radius.base,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    ...shadows.card,
  },
  content: {
    padding: spacing.base,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  duplicateBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    minHeight: 36,
    justifyContent: 'center',
  },
  duplicateText: {
    ...typography.bodySm,
    fontWeight: '600',
    color: colors.textTertiary,
  },
  title: {
    ...typography.bodyLg,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.xxs,
  },
  meta: {
    ...typography.bodySm,
    color: colors.textTertiary,
    marginBottom: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  stat: {
    ...typography.metricSm,
    color: colors.textSecondary,
  },
  statDivider: {
    marginHorizontal: spacing.sm,
    color: colors.textTertiary,
  },
  completedBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    backgroundColor: colors.badgeBg,
    borderRadius: radius.pill,
    marginBottom: spacing.md,
  },
  completedText: {
    ...typography.labelSm,
    color: colors.textTertiary,
  },
  analyticsBtn: {
    paddingVertical: spacing.sm,
    alignSelf: 'flex-start',
  },
  analyticsText: {
    ...typography.bodySm,
    fontWeight: '600',
    color: colors.accentBlue,
  },
});
