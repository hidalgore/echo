import { useState } from 'react';
import { View, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radii } from '../../theme/tokens';
import { Text, Input, Button } from '../../components/ui';
import { useAuthStore } from '../../stores/authStore';

export default function EmailSignInScreen() {
  const insets = useSafeAreaInsets();
  const { login, isLoading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSignIn = async () => {
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    setError('');
    try {
      await login(email, password);
      router.replace('/(tabs)');
    } catch (e) {
      // Live auth mode: email/password has no backend surface (mock-only).
      setError(e instanceof Error ? e.message : 'Sign-in failed. Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text variant="displayM">Sign in</Text>
          <Text variant="body" color="textMuted" style={{ marginTop: 8 }}>
            Access your tickets, wallet, and live ECHO Circle activity.
          </Text>
        </View>

        <View style={styles.form}>
          <Input label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoFocus />
          <View style={styles.passwordRow}>
            <Input label="Password" value={password} onChangeText={setPassword} secureTextEntry={!showPassword} style={{ flex: 1 }} />
            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(!showPassword)}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
          {!!error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={16} color={colors.danger} />
              <Text variant="caption" style={{ color: colors.danger, marginLeft: 8, flex: 1 }}>{error}</Text>
            </View>
          )}
          <Button title="Sign In" onPress={handleSignIn} loading={isLoading} style={{ marginTop: 10 }} />
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
  passwordRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  eyeBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  errorBox: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 12, borderRadius: radii.sm, backgroundColor: 'rgba(255,59,48,0.08)', borderWidth: 1, borderColor: 'rgba(255,59,48,0.20)' },
});
