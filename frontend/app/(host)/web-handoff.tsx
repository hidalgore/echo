import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Linking } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, radius, SCREEN_HORIZONTAL_PADDING } from '../../theme/hostTokens';

export default function WebHandoffScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}><Text style={styles.backArrow}>{'\u2190'}</Text></TouchableOpacity>
      <View style={styles.content}>
        <View style={styles.card}>
          <View style={styles.iconWrap}><Text style={{ fontSize: 28 }}>{'\u{1F4BB}'}</Text></View>
          <Text style={styles.title}>Continue on Web</Text>
          <Text style={styles.message}>For advanced event configuration, continue on the web dashboard.</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => Linking.openURL('https://dashboard.echo.events').catch(() => {})} activeOpacity={0.8}>
            <Text style={styles.primaryText}>Continue on Web</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.back()} style={{ paddingVertical: 8 }}>
            <Text style={styles.secondaryText}>Keep Mobile Setup</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  backBtn: { paddingHorizontal: SCREEN_HORIZONTAL_PADDING, paddingTop: 12, minWidth: 44, minHeight: 44, justifyContent: 'center' },
  backArrow: { fontSize: 24, color: colors.textSecondary },
  content: { flex: 1, paddingHorizontal: SCREEN_HORIZONTAL_PADDING, justifyContent: 'center' },
  card: { backgroundColor: colors.surface, borderRadius: radius.base, borderWidth: 1, borderColor: colors.border, padding: 24, alignItems: 'center' },
  iconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.surfaceElevated, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  title: { ...typography.displayMd, color: colors.textPrimary, marginBottom: 8 },
  message: { ...typography.bodyMd, color: colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  primaryBtn: { width: '100%', backgroundColor: colors.textPrimary, borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginBottom: 12 },
  primaryText: { fontSize: 17, fontWeight: '600', color: colors.bg },
  secondaryText: { fontSize: 15, fontWeight: '600', color: colors.textTertiary },
});
