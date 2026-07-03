/**
 * OnboardingShell — shared scaffold for onboarding screens.
 * Owns safe-area insets, dark background, optional skip + progress header, a
 * scrollable content area, and a fixed bottom action zone. One primary action
 * per screen (ECHO principle). Color tokens are inlined (never inside
 * StyleSheet.create).
 */
import { ComponentType, ReactNode } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../ui';
import { useDynamicTheme } from '../../theme/dynamicTheme';
import { OnboardingProgress } from './OnboardingProgress';

interface Props {
  children: ReactNode;
  footer?: ReactNode;
  onSkip?: () => void;
  skipLabel?: string;
  progress?: { step: number; total: number };
  scroll?: boolean;
}

export function OnboardingShell({ children, footer, onSkip, skipLabel = 'Skip', progress, scroll = true }: Props) {
  const insets = useSafeAreaInsets();
  const { colors: c } = useDynamicTheme();

  const Body: ComponentType<any> = scroll ? ScrollView : View;
  const bodyProps = scroll
    ? { contentContainerStyle: styles.scrollContent, showsVerticalScrollIndicator: false }
    : { style: styles.staticBody };

  return (
    <View style={[styles.root, { backgroundColor: c.bg, paddingTop: insets.top }]}>
      <View style={styles.header}>
        {progress ? <OnboardingProgress step={progress.step} total={progress.total} /> : <View />}
        {onSkip ? (
          <TouchableOpacity
            onPress={onSkip}
            accessibilityRole="button"
            accessibilityLabel={skipLabel}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={styles.skipBtn}
          >
            <Text variant="actionText" color="textMedium">{skipLabel}</Text>
          </TouchableOpacity>
        ) : (
          <View />
        )}
      </View>

      <Body {...(bodyProps as any)}>{children}</Body>

      {footer ? (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16, borderTopColor: c.hairline }]}>{footer}</View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    minHeight: 44,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  skipBtn: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 4 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 24, flexGrow: 1 },
  staticBody: { flex: 1, paddingHorizontal: 24, paddingTop: 8 },
  footer: { paddingHorizontal: 24, paddingTop: 14, borderTopWidth: 1 },
});
