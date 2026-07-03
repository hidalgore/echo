/**
 * EchoWordmarkHeader — Gradient ECHO wordmark
 * ═════════════════════════════════════════════
 * Displays E C H O in spaced gradient-colored letters
 * with a title and subtitle below.
 */
import React from 'react';
import { useDynamicTheme } from '../../theme/dynamicTheme';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../ui';

type Props = {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
};

const LETTERS: { char: string; color: string }[] = [
  { char: 'E', color: '#EC4899' },
  { char: 'C', color: '#A855F7' },
  { char: 'H', color: '#7C3AED' },
  { char: 'O', color: '#F59E0B' },
];

export function EchoWordmarkHeader({ title, subtitle, showBack = false, onBack }: Props) {
    const { colors: c, isDark } = useDynamicTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[s.container, { paddingTop: insets.top + 12 }]}>
      {showBack && (
        <TouchableOpacity
          style={s.backBtn}
          onPress={onBack || (() => router.back())}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={22} color={c.textSecondary} />
        </TouchableOpacity>
      )}

      {/* ECHO wordmark */}
      <View style={s.wordmark}>
        {LETTERS.map(({ char, color }) => (
          <Text key={char} style={[s.letter, { color }]}>{char}</Text>
        ))}
      </View>

      {/* Title */}
      <Text style={[s.title, { color: c.text }]}>{title}</Text>

      {/* Subtitle */}
      {subtitle && <Text style={[s.subtitle, { color: c.textLow }]}>{subtitle}</Text>}
    </View>
  );
}

const s = StyleSheet.create({
  container: { alignItems: 'center', paddingHorizontal: 24, paddingBottom: 20 },
  backBtn: {
    position: 'absolute', left: 16, top: 0,
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  wordmark: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    marginBottom: 16,
  },
  letter: { fontSize: 18, fontWeight: '800', letterSpacing: 2 },
  title: {
    fontSize: 32, fontWeight: '700',
    textAlign: 'center', marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center', lineHeight: 22, maxWidth: 320,
  },
});
