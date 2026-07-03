/**
 * AppearanceSheet — Theme Preference Picker (Theme Spec v1.0)
 * ════════════════════════════════════════════════════════════
 * 3 options: Auto (System) / Light / Dark
 * Visual preview thumbnails, immediate apply, persist via AsyncStorage.
 */
import React from 'react';
import { View, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../ui';
import { useDynamicTheme, type AppearancePreference } from '../../theme/dynamicTheme';

type Props = {
  visible: boolean;
  onClose: () => void;
};

const OPTIONS: { key: AppearancePreference; label: string; description: string; icon: string }[] = [
  { key: 'auto',  label: 'Automatic',  description: 'Follows your device setting', icon: 'phone-portrait-outline' },
  { key: 'light', label: 'Light',       description: 'Always use light theme',      icon: 'sunny-outline' },
  { key: 'dark',  label: 'Dark',        description: 'Always use dark theme',       icon: 'moon-outline' },
];

export function AppearanceSheet({ visible, onClose }: Props) {
  const { preference, setPreference, colors, isDark } = useDynamicTheme();

  const handleSelect = (key: AppearancePreference) => {
    setPreference(key);
    // Small delay so user sees the selection before closing
    setTimeout(onClose, 200);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={onClose}>
        <View style={[s.sheet, { backgroundColor: colors.sheet }]} onStartShouldSetResponder={() => true}>
          {/* Handle bar */}
          <View style={[s.handleBar, { backgroundColor: colors.hairlineStrong }]} />

          <Text style={[s.title, { color: colors.text }]}>Appearance</Text>
          <Text style={[s.subtitle, { color: colors.textTertiary }]}>
            Choose how ECHO looks on your device
          </Text>

          {/* Theme preview thumbnails */}
          <View style={s.previewRow}>
            {OPTIONS.map(opt => {
              const isSelected = preference === opt.key;
              const previewBg = opt.key === 'dark' ? '#0F1115'
                : opt.key === 'light' ? '#F5F3EE'
                : isDark ? '#0F1115' : '#F5F3EE';
              const previewText = opt.key === 'dark' ? '#F7F8FA'
                : opt.key === 'light' ? '#151821'
                : isDark ? '#F7F8FA' : '#151821';
              const previewCard = opt.key === 'dark' ? '#161B24'
                : opt.key === 'light' ? '#FFFFFF'
                : isDark ? '#161B24' : '#FFFFFF';

              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[
                    s.previewOption,
                    { borderColor: isSelected ? colors.accent : colors.border },
                    isSelected && { borderWidth: 2 },
                  ]}
                  onPress={() => handleSelect(opt.key)}
                  activeOpacity={0.85}
                >
                  {/* Mini preview */}
                  <View style={[s.previewThumb, { backgroundColor: previewBg }]}>
                    <View style={[s.previewBar, { backgroundColor: previewCard }]} />
                    <View style={[s.previewCardMini, { backgroundColor: previewCard }]}>
                      <View style={[s.previewDot, { backgroundColor: previewText, opacity: 0.3 }]} />
                      <View style={[s.previewLine, { backgroundColor: previewText, opacity: 0.15 }]} />
                    </View>
                    <View style={[s.previewCardMini, { backgroundColor: previewCard, width: '70%' }]}>
                      <View style={[s.previewLine, { backgroundColor: previewText, opacity: 0.15, width: '80%' }]} />
                    </View>
                  </View>

                  {/* Label + radio */}
                  <View style={s.previewLabelRow}>
                    <View style={[
                      s.radio,
                      { borderColor: isSelected ? colors.accent : colors.textDisabled },
                      isSelected && { backgroundColor: colors.accent },
                    ]}>
                      {isSelected && <View style={s.radioInner} />}
                    </View>
                    <Text style={[s.previewLabel, { color: colors.text }]}>{opt.label}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Detail list */}
          <View style={[s.detailList, { borderColor: colors.border }]}>
            {OPTIONS.map(opt => {
              const isSelected = preference === opt.key;
              return (
                <TouchableOpacity
                  key={`detail-${opt.key}`}
                  style={[s.detailRow, { borderBottomColor: colors.divider }]}
                  onPress={() => handleSelect(opt.key)}
                  activeOpacity={0.8}
                >
                  <View style={[s.detailIconWrap, { backgroundColor: isSelected ? colors.accentSoft : colors.surface2 }]}>
                    <Ionicons name={opt.icon as never} size={18} color={isSelected ? colors.accent : colors.textTertiary} />
                  </View>
                  <View style={s.detailInfo}>
                    <Text style={[s.detailLabel, { color: colors.text }]}>{opt.label}</Text>
                    <Text style={[s.detailDesc, { color: colors.textTertiary }]}>{opt.description}</Text>
                  </View>
                  {isSelected && <Ionicons name="checkmark-circle" size={22} color={colors.accent} />}
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity style={[s.doneBtn, { backgroundColor: colors.surface2 }]} onPress={onClose} activeOpacity={0.8}>
            <Text style={[s.doneText, { color: colors.text }]}>Done</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingBottom: 40,
  },
  handleBar: {
    width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 10, marginBottom: 16,
  },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 4 },
  subtitle: { fontSize: 14, marginBottom: 20 },

  // Preview thumbnails
  previewRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  previewOption: {
    flex: 1, borderRadius: 16, borderWidth: 1, overflow: 'hidden',
  },
  previewThumb: {
    height: 80, padding: 10, gap: 6, borderTopLeftRadius: 15, borderTopRightRadius: 15,
  },
  previewBar: { height: 8, borderRadius: 4, width: '60%' },
  previewCardMini: { height: 14, borderRadius: 6, padding: 4, flexDirection: 'row', alignItems: 'center', gap: 4 },
  previewDot: { width: 6, height: 6, borderRadius: 3 },
  previewLine: { height: 3, borderRadius: 1.5, flex: 1 },
  previewLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10 },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFFFFF' },
  previewLabel: { fontSize: 13, fontWeight: '600' },

  // Detail list
  detailList: { borderRadius: 16, borderWidth: 1, overflow: 'hidden', marginBottom: 16 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderBottomWidth: 1 },
  detailIconWrap: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  detailInfo: { flex: 1, gap: 2 },
  detailLabel: { fontSize: 15, fontWeight: '600' },
  detailDesc: { fontSize: 12 },

  doneBtn: { height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  doneText: { fontSize: 15, fontWeight: '600' },
});
