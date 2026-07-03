/**
 * TrustRingExplainerSheet — optional bottom sheet on the Trust screen.
 * Plain-language explanation only; no internal risk scoring exposed (spec §24).
 */
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../ui';
import { useDynamicTheme } from '../../theme/dynamicTheme';
import { radii } from '../../theme/tokens';
import { ONBOARDING_COPY } from '../../services/onboarding/onboardingCopy';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function TrustRingExplainerSheet({ visible, onClose }: Props) {
  const { colors: c } = useDynamicTheme();
  const insets = useSafeAreaInsets();
  const copy = ONBOARDING_COPY.trust;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={[styles.backdrop, { backgroundColor: c.scrim }]} onPress={onClose} accessibilityLabel="Close" />
      <View style={[styles.sheet, { backgroundColor: c.sheetBg, paddingBottom: insets.bottom + 20 }]}>
        <View style={[styles.grabber, { backgroundColor: c.hairlineStrong }]} />
        <View style={styles.titleRow}>
          <Ionicons name="shield-checkmark-outline" size={20} color={c.accent} />
          <Text variant="sheetTitle">{copy.sheetTrigger}</Text>
        </View>
        <Text variant="body" color="textMedium" style={styles.body}>{copy.sheetBody}</Text>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1 },
  sheet: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
    borderTopLeftRadius: radii.sheetTop,
    borderTopRightRadius: radii.sheetTop,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  grabber: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  body: { lineHeight: 22 },
});
