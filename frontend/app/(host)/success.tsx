import React from 'react';
import { View, Text, StyleSheet, StatusBar, TouchableOpacity } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, SCREEN_HORIZONTAL_PADDING } from '../../theme/hostTokens';
import { Ionicons } from '@expo/vector-icons';
import { SuccessStateCard } from '../../components/host/SuccessStateCard';
import { PrimaryButton } from '../../components/host/PrimaryButton';
import { SecondaryButton } from '../../components/host/SecondaryButton';
import { useEventStore } from '../../stores/eventStore';
import { useModeStore } from '../../stores/modeStore';

import { ScreenBackButton } from '../../components/shared/ScreenBackButton';
export default function SuccessScreen() {
  const insets = useSafeAreaInsets();
  const { eventId } = useLocalSearchParams<{ eventId?: string }>();
  const event = useEventStore((state) => (eventId ? state.getEventById(eventId) : undefined));
  const setActiveMode = useModeStore((state) => state.setActiveMode);

  // Cleanly switch into Echo (consumer) mode and route to event detail
  const handleViewOnConsumer = () => {
    setActiveMode('echo');
    if (eventId) {
      router.push({ pathname: '/event/[id]', params: { id: eventId } });
    } else {
      router.push('/(tabs)');
    }
  };
  const successDraft = event ? {
    title: event.title,
    venue: event.venue_name,
    date: new Date(event.start_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    startTime: new Date(event.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    price: event.ticket_types[0]?.price || 0,
    capacity: event.ticket_types.reduce((sum, ticket) => sum + ticket.available, 0),
    ageRequirement: event.age_restriction ? `${event.age_restriction}+` : 'All Ages',
    visibility: 'public',
  } : {
    title: 'Event Published', venue: 'Live on ECHO', date: '', startTime: '', price: 0, capacity: 0, ageRequirement: 'All Ages', visibility: 'public'
  };
  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      <ScreenBackButton variant="floating" onPress={() => router.replace('/(host)/(tabs)/events')} accessibilityLabel="Back to Host Events" style={{ position: 'absolute', top: 58, left: 20, zIndex: 10 }} />
      <View style={styles.content}>
        <View style={styles.iconWrap}><Text style={styles.icon}>{'\u2713'}</Text></View>
        <Text style={styles.headline}>Event Published</Text>
        <Text style={styles.subtext}>Your event is now live on ECHO.</Text>
        <View style={{ width: '100%', marginBottom: 24 }}><SuccessStateCard draft={successDraft as never} /></View>
        <View style={{ flex: 1 }} />
        <PrimaryButton label="Open Event Details" onPress={() => router.replace(eventId ? { pathname: '/(host)/event-detail', params: { id: eventId } } : '/(host)/(tabs)/events')} style={{ width: '100%', marginBottom: 12 }} />
        <SecondaryButton label="View on Consumer Side" onPress={handleViewOnConsumer} variant="outline" style={{ width: '100%', marginBottom: 8 }} />
        <SecondaryButton label="Back to My Events" onPress={() => router.replace('/(host)/(tabs)/events')} variant="ghost" style={{ width: '100%', marginBottom: 8 }} />
        <SecondaryButton label="Create Another Event" onPress={() => router.push('/(host)/create')} variant="ghost" style={{ width: '100%', marginBottom: 32 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  backBtn: { position: 'absolute', top: 58, left: 20, zIndex: 10, width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)' },
  content: { flex: 1, paddingHorizontal: SCREEN_HORIZONTAL_PADDING, paddingTop: 48, alignItems: 'center' },
  iconWrap: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.accentGreen + '15', borderWidth: 2, borderColor: colors.accentGreen, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  icon: { fontSize: 32, color: colors.accentGreen, fontWeight: '700' },
  headline: { ...typography.displayLg, color: colors.textPrimary, marginBottom: 8 },
  subtext: { ...typography.bodyMd, color: colors.textTertiary, marginBottom: 24 },
});
