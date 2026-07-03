import React from 'react';
import { ScrollView, StyleSheet, Switch, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ModeSwitchHeader } from '../../components/navigation/ModeSwitchHeader';
import { Card, Text } from '../../components/ui';
import { colors, radii, spacing } from '../../theme/tokens';
import { useNotificationStore } from '../../stores/notificationStore';

function PreferenceRow({ label, body, value, onValueChange }: { label: string; body: string; value: boolean; onValueChange: (next: boolean) => void }) {
  return (
    <Card style={styles.prefCard}>
      <View style={{ flex: 1 }}>
        <Text variant="body" style={styles.prefTitle}>{label}</Text>
        <Text variant="bodySmall" color="textMuted" style={styles.prefBody}>{body}</Text>
      </View>
      <Switch value={value} onValueChange={onValueChange} />
    </Card>
  );
}

export default function NotificationPreferencesScreen() {
  const insets = useSafeAreaInsets();
  const preferences = useNotificationStore((state) => state.preferences);
  const updatePreferences = useNotificationStore((state) => state.updatePreferences);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}> 
      <ModeSwitchHeader title="Notification Intelligence" topInset={0} showBack />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.heroCard}>
          <Text variant="label" color="textMuted">ECHO INTELLIGENT ENGAGEMENT V2</Text>
          <Text variant="title" style={styles.heroTitle}>Smarter updates. Less noise.</Text>
          <Text variant="bodySmall" color="textMuted" style={styles.heroBody}>
            ECHO uses quiet hours, send-time optimization, action suppression, and fatigue control to keep notifications useful.
          </Text>
        </Card>

        <PreferenceRow label="Push notifications" body="Primary channel for time-sensitive ticket, Circle, and entry updates." value={preferences.pushEnabled} onValueChange={(pushEnabled) => updatePreferences({ pushEnabled })} />
        <PreferenceRow label="Email updates" body="Receipts, closeout reports, donation updates, and fallback event reminders." value={preferences.emailEnabled} onValueChange={(emailEnabled) => updatePreferences({ emailEnabled })} />
        <PreferenceRow label="SMS for Circle invites" body="Used only for Circle claim links and critical recipient reminders when enabled." value={preferences.smsEnabled} onValueChange={(smsEnabled) => updatePreferences({ smsEnabled })} />
        <PreferenceRow label="Quiet hours" body={`${preferences.quietHoursStart}–${preferences.quietHoursEnd}; urgent access and door operations may still appear in-app.`} value={preferences.quietHoursEnabled} onValueChange={(quietHoursEnabled) => updatePreferences({ quietHoursEnabled })} />
        <PreferenceRow label="Event reminders" body="Entry readiness, NFC status, saved event expiration, and doors-open notices." value={preferences.eventReminders} onValueChange={(eventReminders) => updatePreferences({ eventReminders })} />
        <PreferenceRow label="Circle updates" body="Invite claim status, timer warnings, complete states, and organizer actions." value={preferences.circleUpdates} onValueChange={(circleUpdates) => updatePreferences({ circleUpdates })} />
        <PreferenceRow label="Host insights" body="Sales momentum, door readiness, closeout reports, and promotion recommendations." value={preferences.hostInsights} onValueChange={(hostInsights) => updatePreferences({ hostInsights })} />
        <PreferenceRow label="Donation campaign updates" body="Verified nonprofit campaign progress and goal-reached updates." value={preferences.donationUpdates} onValueChange={(donationUpdates) => updatePreferences({ donationUpdates })} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.screenPaddingX, gap: 12, paddingBottom: 56 },
  heroCard: { padding: 16, borderRadius: radii.xl, backgroundColor: colors.bgCard },
  heroTitle: { marginTop: 6, color: colors.text },
  heroBody: { marginTop: 10 },
  prefCard: { padding: 14, borderRadius: radii.lg, flexDirection: 'row', alignItems: 'center', gap: 12 },
  prefTitle: { color: colors.text, fontWeight: '700' },
  prefBody: { marginTop: 5, paddingRight: 6 },
});
