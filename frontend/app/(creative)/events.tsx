import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../../components/ui';
import { colors, radii } from '../../theme/tokens';

export default function CreativeEventsScreen() {
  return (
    <View style={styles.root}>
      <View style={styles.card}>
        <Ionicons name="sparkles-outline" size={28} color="#20C7FF" />
        <Text style={styles.title}>Creative events are not active yet</Text>
        <Text style={styles.body}>This route is now protected with a real empty state so users never land on a blank screen.</Text>
        <TouchableOpacity style={styles.cta} onPress={() => router.replace('/(tabs)/index')} activeOpacity={0.86}>
          <Text style={styles.ctaText}>Back to ECHO</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { width: '100%', padding: 22, borderRadius: radii.xl, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', alignItems: 'center' },
  title: { marginTop: 14, color: colors.text, fontSize: 20, fontWeight: '800', textAlign: 'center' },
  body: { marginTop: 8, color: 'rgba(255,255,255,0.55)', fontSize: 14, lineHeight: 20, textAlign: 'center' },
  cta: { marginTop: 18, paddingHorizontal: 20, paddingVertical: 13, borderRadius: radii.pill, backgroundColor: 'rgba(32,199,255,0.14)', borderWidth: 1, borderColor: 'rgba(32,199,255,0.32)' },
  ctaText: { color: '#20C7FF', fontSize: 15, fontWeight: '800' },
});
