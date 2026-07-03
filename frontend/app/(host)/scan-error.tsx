import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, spacing, radius, SCREEN_HORIZONTAL_PADDING } from '../../theme/hostTokens';
import { ExtractionFieldRow } from '../../components/host/ExtractionFieldRow';
import { PrimaryButton } from '../../components/host/PrimaryButton';
import { SecondaryButton } from '../../components/host/SecondaryButton';
import { mockExtractionFields } from '../../services/hostMock';

export default function ScanErrorScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}><Text style={styles.backArrow}>{'\u2190'}</Text></TouchableOpacity>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Review Scan</Text>
        <Text style={styles.subtitle}>We couldn't read all the details from this flyer.</Text>
        <View style={styles.flyerPreview}><Text style={styles.flyerText}>[Flyer Preview]</Text></View>
        <View style={styles.fields}>{mockExtractionFields.map((f) => <ExtractionFieldRow key={f.label} field={f} />)}</View>
        <PrimaryButton label="Edit Details Manually" onPress={() => router.push({ pathname: '/(host)/preview-edit', params: { draftId: 'draft_002' } })} />
        <SecondaryButton label="Rescan Flyer" onPress={() => router.push('/(host)/flyer-upload')} variant="outline" style={{ marginTop: 12 }} />
        <View style={styles.tips}>
          <Text style={styles.tipsTitle}>Tips for better scanning</Text>
          <Text style={styles.tip}>{'\u2022'} Capture the full flyer</Text>
          <Text style={styles.tip}>{'\u2022'} Avoid glare and shadows</Text>
          <Text style={styles.tip}>{'\u2022'} Keep the image straight</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  backBtn: { paddingHorizontal: SCREEN_HORIZONTAL_PADDING, paddingTop: 12, minWidth: 44, minHeight: 44, justifyContent: 'center' },
  backArrow: { fontSize: 24, color: colors.textSecondary },
  scrollContent: { paddingHorizontal: SCREEN_HORIZONTAL_PADDING, paddingBottom: 48 },
  title: { ...typography.displayLg, color: colors.textPrimary, marginBottom: 8 },
  subtitle: { ...typography.bodyMd, color: colors.textTertiary, marginBottom: 24, lineHeight: 22 },
  flyerPreview: { height: 200, backgroundColor: colors.surface, borderRadius: radius.base, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  flyerText: { fontSize: 13, color: colors.textTertiary },
  fields: { marginBottom: 24 },
  tips: { backgroundColor: colors.surface, borderRadius: radius.base, padding: 16, borderWidth: 1, borderColor: colors.borderSubtle, marginTop: 24 },
  tipsTitle: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 8 },
  tip: { fontSize: 13, color: colors.textTertiary, marginBottom: 4, lineHeight: 20 },
});
