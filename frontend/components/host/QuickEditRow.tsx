/**
 * QuickEditRow
 * Lightweight inline-editable row for EventPreviewQuickEditScreen.
 * Supports text, date, time, number, currency, select, multiline.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from 'react-native';
import { colors, spacing, radius, typography, TAP_TARGET_MIN } from '../../theme/hostTokens';
import type { QuickEditFieldType } from '../../types/hostEvents';

type QuickEditRowProps = {
  label: string;
  value: string;
  type: QuickEditFieldType;
  required: boolean;
  options?: string[];
  placeholder?: string;
  onChange: (newValue: string) => void;
};

export const QuickEditRow: React.FC<QuickEditRowProps> = ({
  label,
  value,
  type,
  required,
  options,
  placeholder,
  onChange,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const [showPicker, setShowPicker] = useState(false);

  const handleSave = () => {
    onChange(localValue);
    setIsEditing(false);
  };

  const handleSelectOption = (option: string) => {
    onChange(option);
    setShowPicker(false);
  };

  const isEmpty = !value || value === '0';

  // Select type — show picker
  if (type === 'select' && options) {
    return (
      <View style={styles.row}>
        <View style={styles.labelRow}>
          <Text style={styles.label}>{label}</Text>
          {required && <Text style={styles.required}>*</Text>}
        </View>
        <TouchableOpacity
          style={styles.selectBtn}
          onPress={() => setShowPicker(true)}
          accessibilityLabel={`Select ${label}`}
          accessibilityHint={`Current value: ${value || 'Not set'}`}
        >
          <Text style={[styles.value, isEmpty && styles.valuePlaceholder]}>
            {value || placeholder || 'Select'}
          </Text>
          <Text style={styles.chevron}>{'\u203A'}</Text>
        </TouchableOpacity>

        <Modal
          visible={showPicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowPicker(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            onPress={() => setShowPicker(false)}
            activeOpacity={1}
          >
            <View style={styles.pickerSheet}>
              <Text style={styles.pickerTitle}>{label}</Text>
              {options.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[styles.pickerOption, opt === value && styles.pickerOptionActive]}
                  onPress={() => handleSelectOption(opt)}
                >
                  <Text
                    style={[
                      styles.pickerOptionText,
                      opt === value && styles.pickerOptionTextActive,
                    ]}
                  >
                    {opt}
                  </Text>
                  {opt === value && <Text style={styles.pickerCheck}>{'\u2713'}</Text>}
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={styles.pickerCloseBtn}
                onPress={() => setShowPicker(false)}
              >
                <Text style={styles.pickerCloseText}>Done</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    );
  }

  // Inline editable row
  return (
    <View style={styles.row}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {required && <Text style={styles.required}>*</Text>}
      </View>
      {isEditing ? (
        <View style={styles.editContainer}>
          <TextInput
            style={[styles.input, type === 'multiline' && styles.inputMultiline]}
            value={localValue}
            onChangeText={setLocalValue}
            placeholder={placeholder}
            placeholderTextColor={colors.textDisabled}
            multiline={type === 'multiline'}
            keyboardType={
              type === 'number' || type === 'currency' ? 'numeric' : 'default'
            }
            autoFocus
            returnKeyType={type === 'multiline' ? 'default' : 'done'}
            onSubmitEditing={type !== 'multiline' ? handleSave : undefined}
            accessibilityLabel={`Edit ${label}`}
          />
          <View style={styles.editActions}>
            <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
              <Text style={styles.saveBtnText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setLocalValue(value);
                setIsEditing(false);
              }}
              style={styles.cancelBtn}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.valueContainer}
          onPress={() => setIsEditing(true)}
          accessibilityLabel={`Edit ${label}: ${value || 'Not set'}`}
        >
          <Text
            style={[styles.value, isEmpty && styles.valuePlaceholder]}
            numberOfLines={type === 'multiline' ? 3 : 1}
          >
            {type === 'currency' && value ? `$${value}` : value || placeholder || 'Tap to edit'}
          </Text>
          <Text style={styles.editIcon}>Edit</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

/**
 * VisibilitySegmentedControl
 * Public / Private / Invite Only segmented selector.
 */

import type { EventVisibility } from '../../types/hostEvents';

type VisibilityProps = {
  value: EventVisibility;
  onChange: (v: EventVisibility) => void;
};

const VISIBILITY_OPTIONS: { key: EventVisibility; label: string }[] = [
  { key: 'public', label: 'Public' },
  { key: 'private', label: 'Private' },
  { key: 'invite_only', label: 'Invite Only' },
];

export const VisibilitySegmentedControl: React.FC<VisibilityProps> = ({
  value,
  onChange,
}) => {
  return (
    <View style={segStyles.container} accessibilityRole="radiogroup">
      {VISIBILITY_OPTIONS.map((opt) => {
        const isActive = opt.key === value;
        return (
          <TouchableOpacity
            key={opt.key}
            style={[segStyles.segment, isActive && segStyles.segmentActive]}
            onPress={() => onChange(opt.key)}
            accessibilityRole="radio"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={opt.label}
          >
            <Text style={[segStyles.segmentText, isActive && segStyles.segmentTextActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

/**
 * BottomActionBar
 * Persistent bottom bar with primary + secondary actions.
 * Safe area aware.
 */

type BottomActionBarProps = {
  primaryLabel: string;
  onPrimary: () => void;
  primaryDisabled?: boolean;
  secondaryLabel?: string;
  onSecondary?: () => void;
};

export const BottomActionBar: React.FC<BottomActionBarProps> = ({
  primaryLabel,
  onPrimary,
  primaryDisabled = false,
  secondaryLabel,
  onSecondary,
}) => {
  return (
    <View style={barStyles.container}>
      {secondaryLabel && onSecondary && (
        <TouchableOpacity
          style={barStyles.secondaryBtn}
          onPress={onSecondary}
          accessibilityLabel={secondaryLabel}
        >
          <Text style={barStyles.secondaryText}>{secondaryLabel}</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity
        style={[barStyles.primaryBtn, primaryDisabled && barStyles.primaryDisabled]}
        onPress={onPrimary}
        disabled={primaryDisabled}
        activeOpacity={0.8}
        accessibilityLabel={primaryLabel}
        accessibilityState={{ disabled: primaryDisabled }}
      >
        <Text
          style={[barStyles.primaryText, primaryDisabled && barStyles.primaryTextDisabled]}
        >
          {primaryLabel}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

// ─── QuickEditRow Styles ─────────────────────────────────────────────

const styles = StyleSheet.create({
  row: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  label: {
    ...typography.labelSm,
    color: colors.textTertiary,
  },
  required: {
    ...typography.labelSm,
    color: colors.accentRed,
    marginLeft: spacing.xxs,
  },
  valueContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: TAP_TARGET_MIN - 8,
  },
  value: {
    ...typography.bodyMd,
    color: colors.textPrimary,
    flex: 1,
  },
  valuePlaceholder: {
    color: colors.textDisabled,
  },
  editIcon: {
    ...typography.bodySm,
    fontWeight: '600',
    color: colors.textTertiary,
    marginLeft: spacing.sm,
  },
  chevron: {
    fontSize: 18,
    color: colors.textTertiary,
    marginLeft: spacing.sm,
  },
  selectBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: TAP_TARGET_MIN - 8,
  },
  // Edit mode
  editContainer: {
    marginTop: spacing.xs,
  },
  input: {
    ...typography.bodyMd,
    color: colors.textPrimary,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.borderFocus,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: TAP_TARGET_MIN,
  },
  inputMultiline: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  saveBtn: {
    backgroundColor: colors.textPrimary,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.xs,
  },
  saveBtnText: {
    ...typography.bodySm,
    fontWeight: '600',
    color: colors.bg,
  },
  cancelBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  cancelBtnText: {
    ...typography.bodySm,
    color: colors.textTertiary,
  },
  // Modal picker
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  pickerSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
    paddingHorizontal: spacing.lg,
  },
  pickerTitle: {
    ...typography.bodyLg,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.base,
    textAlign: 'center',
  },
  pickerOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    minHeight: TAP_TARGET_MIN,
  },
  pickerOptionActive: {
    backgroundColor: colors.surfaceElevated,
  },
  pickerOptionText: {
    ...typography.bodyMd,
    color: colors.textSecondary,
  },
  pickerOptionTextActive: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  pickerCheck: {
    fontSize: 16,
    color: colors.accentGreen,
  },
  pickerCloseBtn: {
    marginTop: spacing.base,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  pickerCloseText: {
    ...typography.bodyMd,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});

// ─── Segmented Control Styles ────────────────────────────────────────

const segStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    padding: spacing.xxs,
  },
  segment: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    alignItems: 'center',
    minHeight: TAP_TARGET_MIN - 8,
    justifyContent: 'center',
  },
  segmentActive: {
    backgroundColor: colors.textPrimary,
  },
  segmentText: {
    ...typography.bodySm,
    fontWeight: '600',
    color: colors.textTertiary,
  },
  segmentTextActive: {
    color: colors.bg,
  },
});

// ─── BottomActionBar Styles ──────────────────────────────────────────

const barStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.base,
    paddingBottom: spacing.xxl,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    gap: spacing.md,
  },
  primaryBtn: {
    flex: 2,
    backgroundColor: colors.textPrimary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    minHeight: TAP_TARGET_MIN,
    justifyContent: 'center',
  },
  primaryDisabled: {
    backgroundColor: colors.surfaceHover,
    opacity: 0.5,
  },
  primaryText: {
    ...typography.bodyLg,
    fontWeight: '600',
    color: colors.bg,
  },
  primaryTextDisabled: {
    color: colors.textDisabled,
  },
  secondaryBtn: {
    flex: 1,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    alignItems: 'center',
    minHeight: TAP_TARGET_MIN,
    justifyContent: 'center',
  },
  secondaryText: {
    ...typography.bodyMd,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
