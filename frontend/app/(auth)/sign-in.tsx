import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Image, TouchableOpacity, Animated, Dimensions, StatusBar, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../../components/ui';
import { useAuthStore } from '../../stores/authStore';
import { colors, gradients } from '../../theme/tokens';

const { width: W, height: H } = Dimensions.get('window');
const WORDMARK_W = W * 0.65;

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { loginWithApple, loginWithGoogle, continueAsGuest } = useAuthStore();
  const logoFade = useRef(new Animated.Value(0)).current;
  const contentFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(logoFade, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(contentFade, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleAuth = async (provider: 'apple' | 'google') => {
    try {
      await (provider === 'apple' ? loginWithApple() : loginWithGoogle());
      router.replace('/(tabs)');
    } catch (e) {
      Alert.alert('Sign-in failed', e instanceof Error ? e.message : 'Please try again.');
    }
  };

  const handleGuest = () => {
    // Fire-and-forget: guest browsing must not wait on (or fail with) the
    // session call — the store logs failures and public endpoints still work.
    continueAsGuest();
    router.replace('/(tabs)');
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Wordmark */}
      <Animated.View style={[s.logoWrap, { opacity: logoFade, marginTop: insets.top + H * 0.10 }]}>
        <Image
          source={require('../../assets/images/echo_wordmark.png')}
          style={s.wordmark}
          resizeMode="contain"
        />
        <Text style={s.tagline}>ACCESS. SIGNAL. MOMENT.</Text>
      </Animated.View>

      {/* Auth buttons */}
      <Animated.View style={[s.authWrap, { opacity: contentFade, paddingBottom: insets.bottom + 24 }]}>
        {/* Apple */}
        <TouchableOpacity onPress={() => handleAuth('apple')} activeOpacity={0.88} style={s.btnOuter}>
          <LinearGradient colors={[...gradients.echo]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={s.btnGrad}>
            <View style={s.btnInner}>
              <Ionicons name="logo-apple" size={20} color="#F5F7FB" />
              <Text style={s.btnText}>Continue with Apple</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Google */}
        <TouchableOpacity onPress={() => handleAuth('google')} activeOpacity={0.88} style={s.btnOuter}>
          <LinearGradient colors={[...gradients.echo]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={s.btnGrad}>
            <View style={s.btnInner}>
              <Text style={s.googleG}>G</Text>
              <Text style={s.btnText}>Continue with Google</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Guest */}
        <TouchableOpacity onPress={handleGuest} activeOpacity={0.85} style={s.guestBtn}>
          <Text style={s.guestText}>Explore as Guest</Text>
          <Text style={s.guestSub}>(Limited features until sign-in)</Text>
        </TouchableOpacity>

        {/* Sign Up */}
        <TouchableOpacity onPress={() => router.push('/(auth)/create-account')} activeOpacity={0.85} style={s.signUpBtn}>
          <LinearGradient colors={[colors.accent, '#E63DAD']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.signUpGrad}>
            <Text style={s.signUpText}>Create Account</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Trust */}
        <View style={s.trustRow}>
          <Ionicons name="shield-checkmark-outline" size={13} color="rgba(255,255,255,0.28)" />
          <Text style={s.trustText}>Your identity stays yours. ECHO never sells personal data.</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000000' },
  logoWrap: { alignItems: 'center' },
  wordmark: { width: WORDMARK_W, height: WORDMARK_W / 3.45 },
  tagline: { marginTop: 16, fontSize: 12, fontWeight: '600', letterSpacing: 3, color: 'rgba(245,247,251,0.45)' },
  authWrap: { position: 'absolute', left: 28, right: 28, bottom: 0 },
  btnOuter: { marginBottom: 12 },
  btnGrad: { borderRadius: 18, padding: 1.2 },
  btnInner: {
    height: 56, borderRadius: 16.8, backgroundColor: 'rgba(8,10,20,0.92)',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
  },
  btnText: { color: '#F5F7FB', fontSize: 17, fontWeight: '600' },
  googleG: { color: '#F5F7FB', fontSize: 18, fontWeight: '700' },
  guestBtn: {
    height: 56, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(255,255,255,0.03)', alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  guestText: { color: '#F5F7FB', fontSize: 16, fontWeight: '500' },
  guestSub: { color: 'rgba(255,255,255,0.35)', fontSize: 12, marginTop: 2 },
  signUpBtn: { borderRadius: 18, overflow: 'hidden', marginBottom: 16 },
  signUpGrad: { height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  signUpText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
  trustRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  trustText: { color: 'rgba(255,255,255,0.28)', fontSize: 12 },
});
