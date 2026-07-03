/**
 * FlyerUploadCard
 * Upload zone with camera/gallery/file options.
 * Shows preview after selection.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { colors, spacing, radius, typography, TAP_TARGET_MIN } from '../../theme/hostTokens';

type FlyerUploadCardProps = {
  selectedUri?: string;
  onTakePhoto: () => void;
  onUploadImage: () => void;
  onImportFromRoll: () => void;
  onRemove?: () => void;
};

export const FlyerUploadCard: React.FC<FlyerUploadCardProps> = ({
  selectedUri,
  onTakePhoto,
  onUploadImage,
  onImportFromRoll,
  onRemove,
}) => {
  if (selectedUri) {
    return (
      <View style={uploadStyles.previewCard}>
        <View style={uploadStyles.previewImage}>
          <Image source={{ uri: selectedUri }} style={uploadStyles.previewImgActual} resizeMode="cover" />
        </View>
        {onRemove && (
          <TouchableOpacity onPress={onRemove} style={uploadStyles.removeBtn}>
            <Text style={uploadStyles.removeText}>Remove</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={uploadStyles.card}>
      <View style={uploadStyles.zone}>
        <View style={uploadStyles.iconPlaceholder}>
          <Text style={uploadStyles.iconText}>{'\u2191'}</Text>
        </View>
        <Text style={uploadStyles.zoneTitle}>Upload your event flyer</Text>
        <Text style={uploadStyles.zoneSubtitle}>JPG, PNG, or PDF · still flyer required for Home cards</Text>
      </View>

      <View style={uploadStyles.actions}>
        <TouchableOpacity
          style={uploadStyles.optionBtn}
          onPress={onTakePhoto}
          accessibilityLabel="Take a photo of your flyer"
        >
          <Text style={uploadStyles.optionIcon}>{'\u{1F4F7}'}</Text>
          <Text style={uploadStyles.optionText}>Take Photo</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={uploadStyles.optionBtn}
          onPress={onUploadImage}
          accessibilityLabel="Upload an image"
        >
          <Text style={uploadStyles.optionIcon}>{'\u2191'}</Text>
          <Text style={uploadStyles.optionText}>Upload Image</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={uploadStyles.optionBtn}
          onPress={onImportFromRoll}
          accessibilityLabel="Import from camera roll"
        >
          <Text style={uploadStyles.optionIcon}>{'\u{1F5BC}'}</Text>
          <Text style={uploadStyles.optionText}>Camera Roll</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

/**
 * ProcessingStepList
 * Animated step list for flyer extraction progress.
 * Steps: pending → active → complete | error
 */

import type { ProcessingStep } from '../../types/hostEvents';

type ProcessingStepListProps = {
  steps: ProcessingStep[];
};

export const ProcessingStepList: React.FC<ProcessingStepListProps> = ({ steps }) => {
  return (
    <View style={procStyles.container}>
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        return (
          <View key={step.id} style={procStyles.stepRow}>
            {/* Step indicator */}
            <View style={procStyles.indicatorCol}>
              <View
                style={[
                  procStyles.dot,
                  step.status === 'complete' && procStyles.dotComplete,
                  step.status === 'active' && procStyles.dotActive,
                  step.status === 'error' && procStyles.dotError,
                ]}
              >
                {step.status === 'complete' && (
                  <Text style={procStyles.checkmark}>{'\u2713'}</Text>
                )}
                {step.status === 'error' && (
                  <Text style={procStyles.errorMark}>!</Text>
                )}
              </View>
              {!isLast && (
                <View
                  style={[
                    procStyles.line,
                    step.status === 'complete' && procStyles.lineComplete,
                  ]}
                />
              )}
            </View>

            {/* Step label */}
            <Text
              style={[
                procStyles.label,
                step.status === 'active' && procStyles.labelActive,
                step.status === 'complete' && procStyles.labelComplete,
                step.status === 'error' && procStyles.labelError,
              ]}
            >
              {step.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
};

// ─── FlyerUploadCard Styles ──────────────────────────────────────────

const uploadStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.base,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  zone: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.xl,
  },
  iconPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.base,
  },
  iconText: {
    fontSize: 24,
    color: colors.textTertiary,
  },
  zoneTitle: {
    ...typography.bodyLg,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  zoneSubtitle: {
    ...typography.bodySm,
    color: colors.textTertiary,
  },
  actions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  optionBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.base,
    minHeight: TAP_TARGET_MIN,
    justifyContent: 'center',
  },
  optionIcon: {
    fontSize: 20,
    marginBottom: spacing.xs,
  },
  optionText: {
    ...typography.bodySm,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  // Preview state
  previewCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.base,
    overflow: 'hidden',
  },
  previewImage: {
    height: 280,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  previewImgActual: { width: '100%', height: '100%' },
  previewPlaceholder: {
    ...typography.bodyMd,
    color: colors.textTertiary,
  },
  removeBtn: {
    padding: spacing.md,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  removeText: {
    ...typography.bodySm,
    fontWeight: '600',
    color: colors.accentRed,
  },
});

// ─── ProcessingStepList Styles ───────────────────────────────────────

const procStyles = StyleSheet.create({
  container: {
    paddingVertical: spacing.lg,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: 48,
  },
  indicatorCol: {
    width: 32,
    alignItems: 'center',
  },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  dotComplete: {
    borderColor: colors.accentGreen,
    backgroundColor: colors.accentGreen,
  },
  dotActive: {
    borderColor: colors.accentViolet,
    backgroundColor: colors.accentViolet + '20',
  },
  dotError: {
    borderColor: colors.accentRed,
    backgroundColor: colors.accentRed + '20',
  },
  checkmark: {
    fontSize: 11,
    color: colors.bg,
    fontWeight: '700',
  },
  errorMark: {
    fontSize: 11,
    color: colors.accentRed,
    fontWeight: '700',
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: colors.border,
    minHeight: 20,
  },
  lineComplete: {
    backgroundColor: colors.accentGreen,
  },
  label: {
    ...typography.bodyMd,
    color: colors.textTertiary,
    marginLeft: spacing.md,
    marginTop: 1,
  },
  labelActive: {
    color: colors.textPrimary,
    fontWeight: '500',
  },
  labelComplete: {
    color: colors.textSecondary,
  },
  labelError: {
    color: colors.accentRed,
  },
});
