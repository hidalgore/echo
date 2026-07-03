import React from 'react';
import { View, ScrollView, StyleSheet, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '../../theme/tokens';
import { ModeSwitchHeader } from '../../components/navigation/ModeSwitchHeader';
import { Text, Card, Button } from '../../components/ui';

export default function HostPayoutSettingsScreen() {
  const insets = useSafeAreaInsets();
  return <View style={[styles.container,{paddingTop:insets.top}]}><ModeSwitchHeader title="Payout Settings" topInset={0} showNotification showBack /><ScrollView contentContainerStyle={styles.content}><Card style={styles.card}><Text variant="title" style={{marginBottom:8}}>Connected payout account</Text><Text variant="body" color="textMuted">Chase Business Checking •••• 2048</Text><Text variant="bodySmall" color="textMuted" style={{marginTop:12}}>This is where event payouts, closeout releases, and host earnings are delivered.</Text></Card><Button title="Update Payout Account" onPress={() => Linking.openURL('https://getechoaccess.com/host/payouts/connect')} /></ScrollView></View>;
}
const styles=StyleSheet.create({container:{flex:1, backgroundColor:colors.bg}, content:{padding:spacing.screenPaddingX, gap:16, paddingBottom:40}, card:{padding:16}});
