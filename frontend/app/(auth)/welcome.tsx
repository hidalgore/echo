import { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Image,
  Animated,
  Dimensions,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../../components/ui';
import { useAuthStore } from '../../stores/authStore';

const { width: W, height: H } = Dimensions.get('window');
const isTablet = W >= 768;
const ORB_SIZE = H * 0.28;
const GRADIENT = ['#7DD3FC', '#A78BFA', '#F472B6', '#FB923C'] as const;

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const { hasSeenIntro } = useAuthStore();

  const orbFade = useRef(new Animated.Value(0)).current;
  const textFade = useRef(new Animated.Value(0)).current;
  const ctaFade = useRef(new Animated.Value(0)).current;
  const breathe = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(orbFade, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(textFade, { toValue: 1, duration: 360, useNativeDriver: true }),
      Animated.timing(ctaFade, { toValue: 1, duration: 320, useNativeDriver: true }),
    ]).start(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(breathe, { toValue: 1.025, duration: 2200, useNativeDriver: true }),
          Animated.timing(breathe, { toValue: 1, duration: 2200, useNativeDriver: true }),
        ])
      ).start();
    });
  }, []);

  const handleContinue = () => {
    if (hasSeenIntro) {
      router.push('/(auth)/sign-in');
    } else {
      router.push('/(auth)/intro-carousel');
    }
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <View style={s.backgroundGlow} />

      <Animated.View style={[s.heroWrap, { marginTop: insets.top + 30, opacity: orbFade, transform: [{ scale: breathe }] }]}>
        <Image source={require('../../assets/images/echo_welcome_hero.png')} style={s.orb} resizeMode="contain" />
      </Animated.View>

      <Animated.View style={[s.wordmarkWrap, { opacity: textFade }] }>
        <Text style={s.echoText}>ECHO</Text>
        <Text style={s.accessText}>ACCESS</Text>
      </Animated.View>

      <Animated.View style={[s.copyWrap, { opacity: textFade }] }>
        <Text style={s.title}>Access begins here.</Text>
        <Text style={s.subtitle}>Events, wallet-first entry, and ECHO Circle—built into one premium access system.</Text>
      </Animated.View>

      <Animated.View style={[s.bottomWrap, { opacity: ctaFade, paddingBottom: insets.bottom + 18 }] }>
        <TouchableOpacity activeOpacity={0.9} onPress={handleContinue}>
          <LinearGradient colors={GRADIENT} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={s.ctaBorder}>
            <View style={s.ctaInner}>
              <Text style={s.ctaText}>Continue</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        <Text style={s.trustText}>Wallet-first access. Secure. Private.</Text>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#02030A',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  backgroundGlow: {
    position: 'absolute',
    top: '16%',
    width: W * 0.95,
    height: W * 0.95,
    borderRadius: W * 0.48,
    backgroundColor: 'rgba(123, 92, 255, 0.08)',
  },
  heroWrap: {
    alignItems: 'center',
  },
  orb: {
    width: ORB_SIZE,
    height: ORB_SIZE,
  },
  wordmarkWrap: {
    alignItems: 'center',
    marginTop: 10,
  },
  echoText: {
    fontSize: isTablet ? 50 : 42,
    fontWeight: '700',
    color: '#F5F7FB',
    letterSpacing: 2,
  },
  accessText: {
    marginTop: 6,
    fontSize: isTablet ? 22 : 18,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.80)',
    letterSpacing: 8,
  },
  copyWrap: {
    marginTop: 34,
    width: '100%',
    alignItems: 'center',
  },
  title: {
    fontSize: isTablet ? 34 : 28,
    fontWeight: '500',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 14,
    fontSize: 16,
    lineHeight: 24,
    color: 'rgba(255,255,255,0.68)',
    textAlign: 'center',
    maxWidth: 360,
  },
  bottomWrap: {
    position: 'absolute',
    left: 28,
    right: 28,
    bottom: 0,
  },
  ctaBorder: {
    borderRadius: 18,
    padding: 1.25,
  },
  ctaInner: {
    height: 58,
    borderRadius: 16.5,
    backgroundColor: 'rgba(8, 10, 20, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    color: '#F8FAFC',
    fontSize: 17,
    fontWeight: '600',
  },
  trustText: {
    marginTop: 16,
    color: 'rgba(255,255,255,0.46)',
    textAlign: 'center',
    fontSize: 13,
  },
});
