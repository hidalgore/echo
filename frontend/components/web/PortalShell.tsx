/**
 * ECHO PortalShell — reusable login portal shell.
 * Used by /login (attendee) and /host/login (host).
 * Mock only — no real auth.
 */
import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { brand } from '../../theme/brand';
import { WebCTA } from './WebCTA';

interface Props {
  audience: 'attendee' | 'host';
  /** Side panel: small preview block (e.g. dashboard or pass) */
  sidePanel?: React.ReactNode;
}

export function PortalShell({ audience, sidePanel }: Props) {
  const { width } = useWindowDimensions();
  const compact = width < 960;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const isHost = audience === 'host';
  const otherHref: Href = isHost ? ('/login' as Href) : ('/host/login' as Href);

  return (
    <View style={[styles.outer, compact && styles.outerCompact]}>
      {/* Form column */}
      <View style={[styles.formCol, compact && styles.formColCompact]}>
        <View style={styles.eyebrowRow}>
          <View style={styles.dot} />
          <Text style={styles.eyebrow}>{isHost ? 'HOST PORTAL' : 'ATTENDEE PORTAL'}</Text>
        </View>
        <Text style={styles.title}>{isHost ? 'Sign in to host.' : 'Sign in to ECHO.'}</Text>
        <Text style={styles.subtitle}>
          {isHost
            ? 'Manage events, verify guests, and close out with clean reporting.'
            : 'Access your tickets, ECHO Circles, and wallet-ready passes.'}
        </Text>

        {/* SSO buttons */}
        <View style={styles.ssoRow}>
          <TouchableOpacity style={styles.ssoBtn} activeOpacity={0.85}>
            <Ionicons name="logo-apple" size={18} color="#FFFFFF" />
            <Text style={styles.ssoText}>Sign in with Apple</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.ssoBtn} activeOpacity={0.85}>
            <Ionicons name="logo-google" size={16} color="#FFFFFF" />
            <Text style={styles.ssoText}>Sign in with Google</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or use email</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Email / password fields (mock) */}
        <Text style={styles.fieldLabel}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="you@example.com"
          placeholderTextColor="rgba(255,255,255,0.35)"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        <Text style={styles.fieldLabel}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="••••••••"
          placeholderTextColor="rgba(255,255,255,0.35)"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity style={styles.forgotBtn} activeOpacity={0.7}>
          <Text style={styles.forgotText}>Forgot password?</Text>
        </TouchableOpacity>

        <View style={styles.continueRow}>
          <WebCTA
            label="Continue"
            variant="primary"
            iconRight="arrow-forward"
            size="lg"
            onPress={() => router.push((isHost ? '/host/dashboard' : '/wallet') as never)}
          />
        </View>

        {/* Footer row */}
        <View style={styles.footerRow}>
          <TouchableOpacity activeOpacity={0.7} onPress={() => router.push((isHost ? '/host' : '/search') as never)}>
            <Text style={styles.footerLink}>
              {isHost ? 'New to hosting? Start Hosting' : "Don't have an account? Create one"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.7} onPress={() => router.push(otherHref as never)}>
            <Text style={styles.footerLinkSecondary}>{isHost ? 'Attendee Portal →' : 'Host Portal →'}</Text>
          </TouchableOpacity>
        </View>

        {/* Trust */}
        <View style={styles.trustRow}>
          <Ionicons name="shield-checkmark" size={14} color="rgba(255,255,255,0.6)" />
          <Text style={styles.trustText}>
            ECHO uses secure encryption and never shares your login details with hosts or guests.
          </Text>
        </View>
      </View>

      {/* Side panel */}
      {!compact && (
        <View style={styles.sideCol}>
          {sidePanel ?? (
            <View style={styles.sideEmpty}>
              <Text style={styles.sideEmptyText}>Welcome back.</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 1080,
    paddingHorizontal: 24,
    paddingVertical: 72,
    flexDirection: 'row',
    gap: 48,
    alignItems: 'flex-start',
  },
  outerCompact: { flexDirection: 'column', gap: 32, paddingVertical: 48 },
  formCol: {
    flex: 1,
    padding: 32,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.10)',
    gap: 12,
    maxWidth: 520,
  },
  formColCompact: { padding: 24 },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: brand.primary },
  eyebrow: { color: brand.cyanAccessible, fontSize: 11, fontWeight: '800', letterSpacing: 1.6 },
  title: { color: '#FFFFFF', fontSize: 32, fontWeight: '700', letterSpacing: -0.4 },
  subtitle: { color: 'rgba(255,255,255,0.62)', fontSize: 15, lineHeight: 22, marginBottom: 12 },
  ssoRow: { gap: 8, marginTop: 4 },
  ssoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  ssoText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 12 },
  dividerLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(255,255,255,0.10)' },
  dividerText: { color: 'rgba(255,255,255,0.45)', fontSize: 11, fontWeight: '500', letterSpacing: 0.5 },
  fieldLabel: { color: 'rgba(255,255,255,0.65)', fontSize: 12, fontWeight: '600', letterSpacing: 0.3, marginTop: 6 },
  input: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.10)',
    color: '#FFFFFF',
    fontSize: 14,
  },
  forgotBtn: { alignSelf: 'flex-start', marginTop: 4 },
  forgotText: { color: brand.cyanAccessible, fontSize: 12, fontWeight: '600' },
  continueRow: { marginTop: 16, alignItems: 'flex-start' },
  footerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  footerLink: { color: '#FFFFFF', fontSize: 13, fontWeight: '500' },
  footerLinkSecondary: { color: brand.cyanAccessible, fontSize: 13, fontWeight: '600' },
  trustRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 16 },
  trustText: { color: 'rgba(255,255,255,0.55)', fontSize: 12, lineHeight: 18, flex: 1 },
  sideCol: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 24 },
  sideEmpty: { padding: 48, alignItems: 'center', justifyContent: 'center' },
  sideEmptyText: { color: 'rgba(255,255,255,0.45)', fontSize: 14 },
});

export default PortalShell;
