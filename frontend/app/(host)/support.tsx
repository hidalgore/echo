import React from 'react';
import { View, ScrollView, StyleSheet, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '../../theme/tokens';
import { ModeSwitchHeader } from '../../components/navigation/ModeSwitchHeader';
import { Text, Card, Button } from '../../components/ui';

export default function HostSupportScreen() {
  const insets = useSafeAreaInsets();
  return <View style={[styles.container,{paddingTop:insets.top}]}><ModeSwitchHeader title="Host Support" topInset={0} showNotification showBack /><ScrollView contentContainerStyle={styles.content}><Card style={styles.card}><Text variant="title" style={{marginBottom:8}}>Need help?</Text><Text variant="body" color="textMuted">Get help with payouts, event operations, host verification, Door Mode, and closeout reporting.</Text></Card><Button title="Contact Support" onPress={() => Linking.openURL('mailto:support@getechoaccess.com?subject=Host%20Support')} /><Button title="View Help Center" variant="outline" onPress={() => Linking.openURL('https://getechoaccess.com/help/hosts')} /></ScrollView></View>;
}
const styles=StyleSheet.create({container:{flex:1, backgroundColor:colors.bg}, content:{padding:spacing.screenPaddingX, gap:16, paddingBottom:40}, card:{padding:16}});
