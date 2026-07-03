/**
 * ECHO'd Experience — Visibility (4/5)
 * ════════════════════════════════════
 * Choose sharing scope. Default: host feedback only.
 */
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/tokens';
import { Text } from '../../components/ui';
import { useEchodStore } from '../../stores/echodStore';
import type { EchodVisibility } from '../../types/echod';

import { ScreenBackButton } from '../../components/shared/ScreenBackButton';
const OPTIONS: { value: EchodVisibility; title: string; body: string; icon: string; recommended?: boolean }[] = [
  {
    value: 'public',
    title: 'Public on ECHO',
    body: 'Help future guests with your review and approved photos.',
    icon: 'globe-outline',
  },
  {
    value: 'host_only',
    title: 'Host feedback only',
    body: 'Visible only to ECHO and the host.',
    icon: 'people-outline',
    recommended: true,
  },
  {
    value: 'private',
    title: 'Private to ECHO',
    body: 'Used to improve event quality and recommendations.',
    icon: 'lock-closed-outline',
  },
];

export default function EchodVisibility() {
  const insets = useSafeAreaInsets();
  const { ticketId, eventId } = useLocalSearchParams<{ ticketId: string; eventId: string }>();
  const { draft, setVisibility, submit } = useEchodStore();

  const handleSubmit = () => {
    submit();
    router.replace({ pathname: '/echod/success', params: { ticketId, eventId } });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <ScreenBackButton />
        <Text style={styles.headerLabel}>ECHO'd Experience</Text>
        <View style={styles.backBtnSpacer} />
      </View>

      {/* Progress 4/5 */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: '80%' }]} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Choose how this is shared</Text>

        {OPTIONS.map(({ value, title, body, icon, recommended }) => {
          const selected = draft?.visibility === value;
          return (
            <TouchableOpacity
              key={value}
              style={[styles.option, selected && styles.optionSelected]}
              onPress={() => setVisibility(value)}
              activeOpacity={0.85}
            >
              <View style={styles.optionLeft}>
                {/* Radio */}
                <View style={[styles.radio, selected && styles.radioSelected]}>
                  {selected ? <View style={styles.radioDot} /> : null}
                </View>
                <Ionicons name={icon as never} size={20} color={selected ? colors.textHigh : colors.textMuted} style={styles.optionIcon} />
              </View>
              <View style={styles.optionBody}>
                <View style={styles.optionTitleRow}>
                  <Text style={[styles.optionTitle, selected && styles.optionTitleSelected]}>{title}</Text>
                  {recommended ? (
                    <View style={styles.recommendedBadge}>
                      <Text style={styles.recommendedText}>Recommended</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.optionDesc}>{body}</Text>
              </View>
            </TouchableOpacity>
          );
        })}

        <View style={styles.helperRow}>
          <Ionicons name="shield-checkmark-outline" size={14} color={colors.textMuted} />
          <Text style={styles.helperText}>Your feedback helps improve future experiences</Text>
        </View>
      </View>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={[styles.primaryBtn, !draft?.rating && styles.primaryBtnDisabled]}
          onPress={handleSubmit}
          activeOpacity={0.88}
          disabled={!draft?.rating}
        >
          <Text style={styles.primaryBtnText}>Submit</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.82}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.04)' },
  backBtnSpacer: { width: 40 },
  headerLabel: { fontSize: 13, fontWeight: '600', color: colors.textMuted, letterSpacing: 0.8, textTransform: 'uppercase' },
  progressTrack: { height: 4, backgroundColor: 'rgba(255,255,255,0.08)', marginHorizontal: 20, borderRadius: 2, marginTop: 4 },
  progressFill: { height: 4, backgroundColor: 'rgba(255,255,255,0.45)', borderRadius: 2 },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 32 },
  sectionTitle: { fontSize: 22, fontWeight: '700', color: colors.textHigh, marginBottom: 24 },
  option: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
  },
  optionSelected: { borderColor: 'rgba(255,255,255,0.25)', backgroundColor: 'rgba(255,255,255,0.06)' },
  optionLeft: { flexDirection: 'row', alignItems: 'center', marginRight: 14, marginTop: 2 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  radioSelected: { borderColor: colors.textHigh },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.textHigh },
  optionIcon: { marginLeft: 10 },
  optionBody: { flex: 1 },
  optionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  optionTitle: { fontSize: 16, fontWeight: '700', color: 'rgba(255,255,255,0.70)' },
  optionTitleSelected: { color: colors.textHigh },
  recommendedBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: 'rgba(16,185,129,0.15)' },
  recommendedText: { fontSize: 11, fontWeight: '700', color: '#10B981' },
  optionDesc: { fontSize: 14, color: 'rgba(255,255,255,0.50)', lineHeight: 20 },
  helperRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 20, justifyContent: 'center' },
  helperText: { fontSize: 13, color: colors.textMuted },
  footer: { paddingHorizontal: 24, gap: 14, alignItems: 'center', paddingTop: 12 },
  primaryBtn: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnDisabled: { opacity: 0.4 },
  primaryBtnText: { fontSize: 17, fontWeight: '700', color: colors.textHigh },
  backText: { fontSize: 15, color: colors.textMuted },
});
