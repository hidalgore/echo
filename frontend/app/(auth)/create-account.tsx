import { useState } from 'react';
import { View, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radii } from '../../theme/tokens';
import { Text, Input, Button } from '../../components/ui';
import { useAuthStore } from '../../stores/authStore';

export default function CreateAccountScreen() {
  const insets = useSafeAreaInsets();
  const { register, isLoading } = useAuthStore();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleCreate = async () => {
    if (!firstName || !lastName || !email || !password) {
      setError('Complete all fields to create your account.');
      return;
    }
    setError('');
    await register({ first_name: firstName, last_name: lastName, email, password });
    router.replace('/(tabs)');
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text variant="displayM">Create account</Text>
          <Text variant="body" color="textMuted" style={{ marginTop: 8 }}>
            Set up your premium ECHO account and keep every ticket in one wallet-first identity.
          </Text>
        </View>

        <View style={styles.form}>
          <Input label="First name" value={firstName} onChangeText={setFirstName} autoFocus />
          <Input label="Last name" value={lastName} onChangeText={setLastName} />
          <Input label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          <Input label="Password" value={password} onChangeText={setPassword} secureTextEntry />
          {!!error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={16} color={colors.danger} />
              <Text variant="caption" style={{ color: colors.danger, marginLeft: 8, flex: 1 }}>{error}</Text>
            </View>
          )}
          <Button title="Create Account" onPress={handleCreate} loading={isLoading} style={{ marginTop: 10 }} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  container: { paddingHorizontal: spacing.screenPaddingX, paddingTop: 60, paddingBottom: 48, flexGrow: 1 },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.04)', marginBottom: 28 },
  header: { marginBottom: 34 },
  form: { gap: 16 },
  errorBox: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 12, borderRadius: radii.sm, backgroundColor: 'rgba(255,59,48,0.08)', borderWidth: 1, borderColor: 'rgba(255,59,48,0.20)' },
});
