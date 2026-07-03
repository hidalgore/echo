/**
 * Happening Now Snap Carousel
 * ════════════════════════════
 * Product behavior:
 * - Fixed-width horizontal carousel with a deterministic snap interval.
 * - Each swipe resolves to one clear active event card; the rail never rests between cards.
 * - Neighboring cards remain partially visible to signal more content.
 * - Scroll position interpolates scale, opacity, and vertical offset for a complete active-card state.
 *
 * Home cards always render still event photos for clarity and performance.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/tokens';
import { Text } from '../ui';
import type { Event } from '../../types';
import { formatDate, formatPrice, formatTime } from '../../utils/format';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_SPACING = 14;
const CARD_W = Math.min(360, Math.round(SCREEN_W * 0.82));
const CARD_H = 318;
const SIDE_PADDING = Math.max(16, Math.round((SCREEN_W - CARD_W) / 2));
const SNAP_INTERVAL = CARD_W + CARD_SPACING;

interface HappeningNowCarouselProps {
  events: Event[];
}

export function HappeningNowCarousel({ events = [] }: HappeningNowCarouselProps) {
  const validEvents = useMemo(() => events.filter((event) => event && event.id), [events]);
  const scrollX = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<ScrollView | null>(null);
  const momentumActiveRef = useRef(false);
  const dragSettleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const clampIndex = useCallback(
    (index: number) => Math.max(0, Math.min(validEvents.length - 1, index)),
    [validEvents.length],
  );

  const resolveToOffset = useCallback(
    (xOffset: number) => {
      if (validEvents.length === 0) return;
      const nextIndex = clampIndex(Math.round(xOffset / SNAP_INTERVAL));
      setActiveIndex(nextIndex);
      scrollRef.current?.scrollTo({ x: nextIndex * SNAP_INTERVAL, animated: true });
    },
    [clampIndex, validEvents.length],
  );

  const handleMomentumBegin = useCallback(() => {
    momentumActiveRef.current = true;
    if (dragSettleTimerRef.current) {
      clearTimeout(dragSettleTimerRef.current);
      dragSettleTimerRef.current = null;
    }
  }, []);

  const handleMomentumEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      momentumActiveRef.current = false;
      resolveToOffset(event.nativeEvent.contentOffset.x);
    },
    [resolveToOffset],
  );

  const handleScrollEndDrag = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      // Handles short drags that do not generate a momentum callback without interrupting fast swipes.
      const offsetX = event.nativeEvent.contentOffset.x;
      if (dragSettleTimerRef.current) clearTimeout(dragSettleTimerRef.current);
      dragSettleTimerRef.current = setTimeout(() => {
        if (!momentumActiveRef.current) resolveToOffset(offsetX);
      }, 90);
    },
    [resolveToOffset],
  );

  useEffect(() => {
    setActiveIndex(0);
    scrollRef.current?.scrollTo({ x: 0, animated: false });
  }, [validEvents.length]);

  useEffect(() => {
    return () => {
      if (dragSettleTimerRef.current) clearTimeout(dragSettleTimerRef.current);
    };
  }, []);

  const scrollToIndex = useCallback(
    (index: number) => {
      const targetIndex = clampIndex(index);
      scrollRef.current?.scrollTo({ x: targetIndex * SNAP_INTERVAL, animated: true });
      setActiveIndex(targetIndex);
    },
    [clampIndex],
  );

  if (validEvents.length === 0) return null;

  return (
    <View style={styles.container}>
      <Animated.ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={SNAP_INTERVAL}
        snapToAlignment="start"
        disableIntervalMomentum
        bounces={false}
        overScrollMode="never"
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContent}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true },
        )}
        onMomentumScrollBegin={handleMomentumBegin}
        onMomentumScrollEnd={handleMomentumEnd}
        onScrollEndDrag={handleScrollEndDrag}
      >
        {validEvents.map((event, index) => (
          <HappeningNowCarouselCard
            key={event.id}
            event={event}
            index={index}
            isActive={activeIndex === index}
            isLast={index === validEvents.length - 1}
            scrollX={scrollX}
            onPressInactive={() => scrollToIndex(index)}
          />
        ))}
      </Animated.ScrollView>

      <View style={styles.dotsRow} accessibilityElementsHidden>
        {validEvents.slice(0, Math.min(validEvents.length, 8)).map((event, index) => (
          <View
            key={event.id}
            style={[
              styles.dot,
              activeIndex === index ? styles.dotActive : styles.dotInactive,
            ]}
          />
        ))}
        {validEvents.length > 8 ? <Text style={styles.dotMore}>+{validEvents.length - 8}</Text> : null}
      </View>
    </View>
  );
}

function HappeningNowCarouselCard({
  event,
  index,
  isActive,
  isLast,
  scrollX,
  onPressInactive,
}: {
  event: Event;
  index: number;
  isActive: boolean;
  isLast: boolean;
  scrollX: Animated.Value;
  onPressInactive: () => void;
}) {
  const inputRange = [
    (index - 1) * SNAP_INTERVAL,
    index * SNAP_INTERVAL,
    (index + 1) * SNAP_INTERVAL,
  ];

  const scale = scrollX.interpolate({
    inputRange,
    outputRange: [0.92, 1, 0.92],
    extrapolate: 'clamp',
  });

  const opacity = scrollX.interpolate({
    inputRange,
    outputRange: [0.72, 1, 0.72],
    extrapolate: 'clamp',
  });

  const translateY = scrollX.interpolate({
    inputRange,
    outputRange: [12, 0, 12],
    extrapolate: 'clamp',
  });

  const imageScale = scrollX.interpolate({
    inputRange,
    outputRange: [1.04, 1, 1.04],
    extrapolate: 'clamp',
  });

  const ticketTypes = event.ticket_types || [];
  const lowestPrice = ticketTypes.length > 0 ? ticketTypes[0].price : 0;
  const staticPosterUri = event.image_url || `https://picsum.photos/seed/${event.id}/700/500`;

  const handlePress = () => {
    if (isActive) {
      router.push(`/event/${event.id}`);
      return;
    }
    onPressInactive();
  };

  return (
    <Animated.View
      style={[
        styles.cardFrame,
        {
          width: CARD_W,
          marginRight: isLast ? 0 : CARD_SPACING,
          opacity,
          transform: [{ translateY }, { scale }],
        },
      ]}
    >
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.9}
        style={styles.cardTouchable}
        accessibilityRole="button"
        accessibilityLabel={`${event.title}, ${event.venue_name}. ${isActive ? 'Open event details' : 'Focus this card'}`}
        accessibilityState={{ selected: isActive }}
      >
        <LinearGradient
          colors={
            isActive
              ? ['rgba(32,199,255,0.56)', 'rgba(123,77,255,0.46)', 'rgba(230,61,173,0.48)']
              : ['rgba(255,255,255,0.11)', 'rgba(255,255,255,0.04)']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardBorder}
        >
          <View
            style={[
              styles.cardInner,
              isActive ? styles.cardInnerActive : styles.cardInnerInactive,
            ]}
          >
            <Animated.Image
              source={{ uri: staticPosterUri }}
              style={[styles.image, { transform: [{ scale: imageScale }] }]}
              resizeMode="cover"
            />

            <LinearGradient
              colors={['rgba(15,17,21,0.04)', 'rgba(15,17,21,0.50)', 'rgba(15,17,21,0.94)']}
              locations={[0, 0.48, 1]}
              style={styles.infoFade}
            >
              <View style={styles.liveTag}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>Happening Now</Text>
              </View>

              <View style={styles.priceTag}>
                <Text style={styles.priceText}>
                  {lowestPrice === 0 ? 'Free' : `From ${formatPrice(lowestPrice)}`}
                </Text>
              </View>

              <View style={styles.infoOverlay}>
                <View style={styles.titleRow}>
                  <Text style={styles.eventTitle} numberOfLines={1}>
                    {event.title}
                  </Text>
                  {event.age_restriction ? (
                    <View style={styles.ageBadge}>
                      <Text style={styles.ageText}>{event.age_restriction}+</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.venue} numberOfLines={1}>{event.venue_name}</Text>
                <Text style={styles.dateTime} numberOfLines={1}>
                  {formatDate(event.start_time)} · {formatTime(event.start_time)}
                </Text>
              </View>
            </LinearGradient>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 10,
  },
  scrollContent: {
    paddingHorizontal: SIDE_PADDING,
    paddingBottom: 14,
  },
  cardFrame: {
    height: CARD_H,
  },
  cardTouchable: {
    flex: 1,
  },
  cardBorder: {
    flex: 1,
    borderRadius: 28,
    padding: 1.5,
  },
  cardInner: {
    flex: 1,
    backgroundColor: colors.bg,
    borderRadius: 26,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cardInnerActive: {
    shadowColor: '#000',
    shadowOpacity: Platform.OS === 'ios' ? 0.28 : 0.22,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  cardInnerInactive: {
    shadowColor: '#000',
    shadowOpacity: Platform.OS === 'ios' ? 0.12 : 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    backgroundColor: colors.surface2,
  },
  infoFade: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  liveTag: {
    position: 'absolute',
    top: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(15,17,21,0.66)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#20C7FF',
  },
  liveText: {
    fontSize: 11.5,
    fontWeight: '900',
    letterSpacing: 0.25,
    color: '#FFFFFF',
  },
  priceTag: {
    position: 'absolute',
    top: 16,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    backgroundColor: 'rgba(123,77,255,0.88)',
  },
  priceText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  infoOverlay: {
    paddingHorizontal: 20,
    paddingBottom: 22,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  eventTitle: {
    flex: 1,
    fontSize: 27,
    fontWeight: '900',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.60)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  ageBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  ageText: {
    fontSize: 13,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.74)',
  },
  venue: {
    fontSize: 16.5,
    color: 'rgba(255,255,255,0.88)',
    marginTop: 6,
    textShadowColor: 'rgba(0,0,0,0.50)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  dateTime: {
    fontSize: 14.5,
    color: 'rgba(255,255,255,0.72)',
    marginTop: 4,
    textShadowColor: 'rgba(0,0,0,0.50)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: -2,
    marginBottom: 8,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    width: 20,
    backgroundColor: 'rgba(255,255,255,0.88)',
  },
  dotInactive: {
    width: 6,
    backgroundColor: 'rgba(255,255,255,0.30)',
  },
  dotMore: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.35)',
    marginLeft: 4,
  },
});

export default HappeningNowCarousel;
