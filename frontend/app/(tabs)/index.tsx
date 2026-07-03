import { useEffect, useMemo, useState } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, TouchableOpacity, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/tokens';
import { useDynamicTheme } from '../../theme/dynamicTheme';
import { Text } from '../../components/ui';
import { HomeHeader, DatePillRow, CategoryChipRow, HappeningNowCarousel, TrendingCarousel, UpcomingList, SectionHeader } from '../../components/home';
import { useEventStore } from '../../stores/eventStore';
import { sortByStartAsc, filterByDatePill, filterByCity } from '../../utils/event';
import { useLocationStore } from '../../stores/locationStore';
import { useEchoHeaderVisibility } from '../../components/navigation/useEchoHeaderVisibility';
import { useEchoTabBarVisibility } from '../../components/navigation/useEchoTabBarVisibility';

export default function HomeScreen() {
  const { colors: c } = useDynamicTheme();
  const insets = useSafeAreaInsets();
  const fetchEvents = useEventStore((s) => s.fetchEvents);
  const trending = useEventStore((s) => s.trending);
  const happeningNow = useEventStore((s) => s.happeningNow);
  const upcoming = useEventStore((s) => s.upcoming);
  const savedIds = useEventStore((s) => s.savedIds);
  const toggleSaved = useEventStore((s) => s.toggleSaved);
  const isLoading = useEventStore((s) => s.isLoading);
  const location = useLocationStore((s) => s.location);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const { visible: headerVisible, onScroll: handleHeaderScroll, headerAnimatedStyle } = useEchoHeaderVisibility();
  const { onScroll: handleTabBarScroll } = useEchoTabBarVisibility();

  const handleScroll = (event: any) => {
    handleHeaderScroll(event);
    handleTabBarScroll(event);
  };

  // Header overlay metrics: status bar inset + 12px top padding + 72px content
  const headerHeight = insets.top + 84;

  const categoryMatches = (eventCategory: string, selected: string) => {
    const normalized = eventCategory.toLowerCase();
    if (selected === 'community') {
      return ['community', 'nonprofit', 'wellness', 'social'].some((alias) =>
        normalized === alias || normalized.includes(alias)
      );
    }
    return normalized === selected;
  };

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // ─── Apply filters: city → date → category → sort ─────────────────
  const filterByCategory = (items: typeof upcoming) => {
    if (!selectedCategory) return items;
    return items.filter((event) => categoryMatches(event.category, selectedCategory));
  };

  const filteredHappeningNow = useMemo(() => {
    const byCity = filterByCity(happeningNow.length ? happeningNow : trending, location?.city);
    const dated = filterByDatePill(byCity, selectedDate);
    return filterByCategory(dated);
  }, [happeningNow, trending, selectedDate, selectedCategory, location?.city]);

  const filteredTrending = useMemo(() => {
    const byCity = filterByCity(trending, location?.city);
    const dated = filterByDatePill(byCity, selectedDate);
    return filterByCategory(dated);
  }, [trending, selectedDate, selectedCategory, location?.city]);

  const savedIdList = useMemo(() => Array.from(savedIds), [savedIds]);

  const filteredUpcoming = useMemo(() => {
    const byCity = filterByCity(upcoming, location?.city);
    const dated = filterByDatePill(byCity, selectedDate);
    return sortByStartAsc(filterByCategory(dated));
  }, [upcoming, selectedDate, selectedCategory, location?.city]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchEvents();
    setRefreshing(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      {/* ScrollView fills the entire screen; content extends under the header */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingTop: headerHeight }}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            progressViewOffset={headerHeight}
            refreshing={refreshing || isLoading}
            onRefresh={onRefresh}
            tintColor={c.accent}
          />
        }
      >
        <View style={styles.headerCopy}>
          <Text style={[styles.screenTitle, { color: c.text }]}>Discover</Text>
          <Text variant="caption" color="textMuted" style={styles.screenSubtitle}>Events curated for you</Text>
        </View>
        <DatePillRow selectedDate={selectedDate} onDateChange={setSelectedDate} />

        {filteredHappeningNow.length === 0 && filteredTrending.length === 0 && filteredUpcoming.length === 0 && location?.city ? (
          <View style={cityEmptyStyles.wrap}>
            <View style={[cityEmptyStyles.iconWrap, { backgroundColor: c.accentSoft, borderColor: c.accent + '25' }]}>
              <Ionicons name="location-outline" size={40} color={c.accent + '60'} />
            </View>
            <Text style={[cityEmptyStyles.title, { color: c.text }]}>No events in {location.city} yet</Text>
            <Text style={[cityEmptyStyles.body, { color: c.textLow }]}>We're expanding fast. Events in {location.display} will show up here as hosts create them.</Text>
            <TouchableOpacity style={[cityEmptyStyles.cta, { backgroundColor: c.accentSoft, borderColor: c.accent + '35' }]} onPress={() => router.push('/profile/notifications')}>
              <Ionicons name="notifications-outline" size={16} color={c.accent} />
              <Text style={[cityEmptyStyles.ctaText, { color: c.accent }]}>Notify me when events drop</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {filteredHappeningNow.length > 0 && (
              <>
                <SectionHeader title="Happening Now" />
                <HappeningNowCarousel events={filteredHappeningNow} />
              </>
            )}

            {filteredTrending.length > 0 && (
              <>
                <SectionHeader title="Trending" />
                <TrendingCarousel
                  events={filteredTrending.slice(0, 6)}
                  savedIds={savedIdList}
                  onToggleSaved={toggleSaved}
                />
              </>
            )}

            <CategoryChipRow selectedCategory={selectedCategory} onCategoryChange={setSelectedCategory} />

            <SectionHeader title="Upcoming Events" count={filteredUpcoming.length} />
            <UpcomingList events={filteredUpcoming} initialLimit={6} />
          </>
        )}
        <View style={{ height: 148 }} />
      </ScrollView>

      {/* Header floats absolutely on top; opaque bg when visible, fades to transparent when scrolled */}
      <Animated.View
        style={[styles.headerOverlay, { backgroundColor: c.bg }, headerAnimatedStyle]}
        pointerEvents={headerVisible ? 'auto' : 'none'}
      >
        <HomeHeader />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  headerOverlay: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  headerCopy: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 14 },
  screenTitle: { fontSize: 32, fontWeight: '900', letterSpacing: -0.7, lineHeight: 40 },
  screenSubtitle: { marginTop: 3, fontSize: 13.5 },
});

const cityEmptyStyles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingHorizontal: 40, paddingTop: 60, paddingBottom: 40 },
  iconWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(123,77,255,0.08)', alignItems: 'center', justifyContent: 'center', marginBottom: 20, borderWidth: 1, borderColor: 'rgba(123,77,255,0.15)' },
  title: { fontSize: 20, fontWeight: '700', color: '#F5F7FB', textAlign: 'center', marginBottom: 10 },
  body: { fontSize: 14, lineHeight: 21, color: 'rgba(255,255,255,0.50)', textAlign: 'center', marginBottom: 24 },
  cta: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14, backgroundColor: 'rgba(123,77,255,0.10)', borderWidth: 1, borderColor: 'rgba(123,77,255,0.22)' },
  ctaText: { fontSize: 14, fontWeight: '600', color: 'rgba(123,77,255,0.85)' },
});
