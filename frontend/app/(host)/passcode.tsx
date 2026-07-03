import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors, spacing } from '../../theme/tokens';
import { ModeSwitchHeader } from '../../components/navigation/ModeSwitchHeader';
import { Text, Card, Input, Button } from '../../components/ui';

export default function HostPasscodeScreen() {
  const insets = useSafeAreaInsets();
  const [pin, setPin] = useState('');
  const [confirm, setConfirm] = useState('');
  const save = () => {
    if (pin.length !== 6 || pin !== confirm) {
      Alert.alert('Passcode', 'Enter matching 6-digit passcodes to continue.');
      return;
    }
    Alert.alert('Passcode Updated', 'Your host passcode has been saved.');
    router.back();
  };
  return <View style={[styles.container,{paddingTop:insets.top}]}><ModeSwitchHeader title="Host Passcode" topInset={0} showNotification showBack /><ScrollView contentContainerStyle={styles.content}><Card style={styles.card}><Text variant="body" style={{marginBottom:8}}>Use a 6-digit host passcode to protect operational actions like resuming Door Mode and ending events.</Text><Text variant="bodySmall" color="textMuted">New Passcode</Text><Input value={pin} onChangeText={setPin} placeholder="Enter 6-digit passcode" keyboardType="number-pad" secureTextEntry /><Text variant="bodySmall" color="textMuted" style={{marginTop:10}}>Confirm Passcode</Text><Input value={confirm} onChangeText={setConfirm} placeholder="Re-enter passcode" keyboardType="number-pad" secureTextEntry /></Card><Button title="Save Passcode" onPress={save} /></ScrollView></View>;
}
const styles=StyleSheet.create({container:{flex:1, backgroundColor:colors.bg}, content:{padding:spacing.screenPaddingX, gap:16, paddingBottom:40}, card:{padding:16}});
