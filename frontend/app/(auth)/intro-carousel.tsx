import { useMemo, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  ImageBackground,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../../components/ui';
import { useAuthStore } from '../../stores/authStore';

const { width: W, height: H } = Dimensions.get('window');
const SLIDE_W = W;
const BG = require('../../assets/images/echo_welcome_hero.png');
const slides = [
  {
    title: "Find what's happening.",
    body: 'Music, culture, tech, sports, and community.',
  },
  {
    title: 'Your ticket lives in your Wallet.',
    body: 'Tap to enter. No screenshots. No confusion.',
  },
  {
    title: 'Split tickets instantly.',
    body: 'Invite friends. Everyone pays their share.',
  },
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);
  const { markIntroSeen } = useAuthStore();

  const handleFinish = async () => {
    await markIntroSeen();
    router.replace('/(auth)/sign-in');
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(e.nativeEvent.contentOffset.x / SLIDE_W);
    if (next !== index) setIndex(next);
  };

  const nextLabel = useMemo(() => (index === slides.length - 1 ? 'Get started' : 'Next'), [index]);

  const handleNext = async () => {
    if (index === slides.length - 1) {
      await handleFinish();
      return;
    }
    scrollRef.current?.scrollTo({ x: (index + 1) * SLIDE_W, animated: true });
  };

  return (
    <View style={s.root}>
      <ImageBackground source={BG} resizeMode="cover" style={s.bg} imageStyle={s.bgImage}>
        <LinearGradient colors={['rgba(3,4,10,0.90)', 'rgba(7,8,16,0.72)', 'rgba(3,4,10,0.96)']} style={StyleSheet.absoluteFill} />
        <View style={[s.topRow, { paddingTop: insets.top + 8 }] }>
          <TouchableOpacity onPress={handleFinish} activeOpacity={0.7}>
            <Text style={s.skip}>Skip</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          decelerationRate="fast"
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
        >
          {slides.map((slide, slideIndex) => (
            <View key={slide.title} style={s.slide}>
              <View style={s.card}>
                <LinearGradient colors={['rgba(255,255,255,0.10)', 'rgba(255,255,255,0.03)']} style={s.cardStroke}>
                  <View style={s.cardInner}>
                    <Text style={s.cardTitle}>{slide.title}</Text>
                    <Text style={s.cardBody}>{slide.body}</Text>
                    {slideIndex === 1 ? (
                      <View style={s.iconRow}>
                        <Text style={s.nfcIcon}>◔◔</Text>
                        <Text style={s.qrIcon}>⌘</Text>
                      </View>
                    ) : null}
                    {slideIndex === 2 ? (
                      <TouchableOpacity activeOpacity={0.9} onPress={handleNext}>
                        <LinearGradient colors={['#7DD3FC', '#A78BFA', '#F472B6']} style={s.inlineCtaBorder}>
                          <View style={s.inlineCtaInner}>
                            <Text style={s.inlineCtaText}>Get started</Text>
                          </View>
                        </LinearGradient>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </LinearGradient>
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={[s.footer, { paddingBottom: insets.bottom + 18 }] }>
          <View style={s.dots}>
            {slides.map((_, i) => <View key={i} style={[s.dot, i === index && s.dotActive]} />)}
          </View>
          {index < slides.length - 1 ? (
            <TouchableOpacity onPress={handleNext} activeOpacity={0.85}>
              <Text style={s.next}>{nextLabel}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </ImageBackground>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#03040A' },
  bg: { flex: 1 },
  bgImage: { opacity: 0.35 },
  topRow: {
    alignItems: 'flex-end',
    paddingHorizontal: 24,
  },
  skip: {
    color: '#F5F7FB',
    fontSize: 18,
    fontWeight: '500',
  },
  slide: {
    width: SLIDE_W,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  card: {
    width: Math.min(W - 56, 360),
    minHeight: H * 0.50,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: 'rgba(13,16,28,0.42)',
  },
  cardStroke: { flex: 1, padding: 1 },
  cardInner: {
    flex: 1,
    borderRadius: 27,
    backgroundColor: 'rgba(9,12,20,0.36)',
    paddingHorizontal: 28,
    paddingVertical: 34,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 38,
  },
  cardBody: {
    marginTop: 18,
    color: 'rgba(255,255,255,0.66)',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  iconRow: {
    marginTop: 34,
    flexDirection: 'row',
    gap: 24,
    opacity: 0.55,
  },
  nfcIcon: { color: '#A78BFA', fontSize: 26 },
  qrIcon: { color: '#7DD3FC', fontSize: 26 },
  inlineCtaBorder: {
    marginTop: 34,
    borderRadius: 18,
    padding: 1.2,
    width: '100%',
  },
  inlineCtaInner: {
    height: 54,
    borderRadius: 16.8,
    backgroundColor: 'rgba(13,16,28,0.82)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inlineCtaText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    gap: 14,
  },
  dots: {
    flexDirection: 'row',
    gap: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.36)',
  },
  dotActive: { backgroundColor: '#FFFFFF' },
  next: {
    color: '#F5F7FB',
    fontSize: 16,
    fontWeight: '600',
  },
});
