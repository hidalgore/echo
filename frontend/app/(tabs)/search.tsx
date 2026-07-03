import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '../../theme/tokens';
import { Text } from '../../components/ui';
import { ModeSwitchHeader } from '../../components/navigation/ModeSwitchHeader';
import { useEchoHeaderVisibility } from '../../components/navigation/useEchoHeaderVisibility';
import { FilterModal, FilterState, DEFAULT_FILTERS } from '../../components/search';
import { useSpeechRecognition } from '../../services/speech';
import { getPickedForYouEvents, searchService, type PickedForYouEvent } from '../../services/search';
import { SearchResultItem, SearchSuggestion } from '../../types';
import { addSearchFeedback } from '../../services/searchFeedbackService';

const EMPTY_RESULTS = { all: 0, events: 0, help: 0, support: 0 };

const INTENT_CHIPS = [
  { label: 'Tonight', query: 'events tonight near me' },
  { label: 'This Weekend', query: 'events this weekend near me' },
  { label: 'Near Me', query: 'events near me' },
  { label: 'Music', query: 'music events near me' },
  { label: 'Food', query: 'food events near me' },
  { label: 'Free', query: 'free events near me' },
];

// Narrow chips are one-shot query triggers EXCEPT the leading 21+ chip,
// which is a sticky toggle bound to filters.age (v59.3 — Q8 / Q9).
const NARROW_CHIPS = [
  { label: 'Under $50', query: 'events under $50 that match my taste' },
  { label: 'Good for Groups', query: 'events good for groups near me' },
  { label: 'With Food', query: 'events with food near me' },
  { label: 'Donation Events', query: 'events with nonprofit donation options' },
];

function getAiSummary(query: string) {
  const q = query.toLowerCase();
  if (q.includes('date')) return 'Best matches for a polished weekend night out.';
  if (q.includes('21+')) return 'Showing age-aware events that fit a 21+ night out.';
  if (q.includes('group')) return 'Strong options that work well for groups and ECHO Circle planning.';
  if (q.includes('donation') || q.includes('nonprofit')) return 'Donation-enabled events and verified community experiences.';
  if (q.includes('food')) return 'Events with food, social energy, and nearby atmosphere.';
  if (q.includes('music')) return 'Music-forward picks matched to your recent event style.';
  if (q.includes('weekend')) return 'Weekend-ready events selected to reduce the search work.';
  return 'Best matches based on your search and recent ECHO interests.';
}

function SearchSuggestionRow({ item, onPress }: { item: SearchSuggestion; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.suggestionRow} onPress={onPress} activeOpacity={0.86}>
      <View style={styles.suggestionLeft}>
        <View style={styles.suggestionIconWrap}>
          <Ionicons name={(item.icon as never) || 'sparkles-outline'} size={17} color={colors.echoBlueAccessible} />
        </View>
        <Text variant="body">{item.label}</Text>
      </View>
      <Ionicons name="chevron-forward-outline" size={18} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

function ResultCard({ item, onPress }: { item: SearchResultItem; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={styles.resultOuter}>
      <View style={styles.resultCard}>
        <View style={styles.resultIconWrap}>
          <Ionicons
            name={(item.icon as never) || 'sparkles-outline'}
            size={18}
            color={item.type === 'event' ? colors.echoBlueAccessible : item.type === 'help' ? colors.warning : colors.success}
          />
        </View>
        <View style={styles.resultContent}>
          <Text variant="eventTitle" numberOfLines={2}>{item.title}</Text>
          {!!item.subtitle && <Text variant="meta" color="textMuted" style={styles.resultSubtitle} numberOfLines={2}>{item.subtitle}</Text>}
          {!!item.body && <Text variant="caption" color="textMedium" style={styles.resultBody} numberOfLines={2}>{item.body}</Text>}
          <View style={styles.resultMetaRow}>
            <Text variant="label" color={item.type === 'event' ? 'accent' : item.type === 'help' ? 'warning' : 'success'}>{item.type}</Text>
            {!!item.ctaLabel && <Text variant="caption" color="textMuted">{item.ctaLabel}</Text>}
          </View>
        </View>
        <Ionicons name="chevron-forward-outline" size={18} color={colors.textMuted} />
      </View>
    </TouchableOpacity>
  );
}

function PickedForYouCard({ pick, onPressReason, onFeedback }: { pick: PickedForYouEvent; onPressReason: (pick: PickedForYouEvent) => void; onFeedback: (pick: PickedForYouEvent) => void }) {
  const lowestPrice = Math.min(...pick.event.ticket_types.map((ticket) => ticket.price ?? 0));
  const price = lowestPrice === 0 ? 'Free' : `From $${lowestPrice}`;
  const date = new Date(pick.event.start_time).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <TouchableOpacity style={styles.pickCard} activeOpacity={0.92} onPress={() => router.push(`/event/${pick.event.id}`)} onLongPress={() => onFeedback(pick)}>
      <Image source={{ uri: pick.event.image_url || 'https://picsum.photos/seed/echo-pick/400/260' }} style={styles.pickImage} resizeMode="cover" />
      <LinearGradient colors={['rgba(5,6,10,0.08)', 'rgba(5,6,10,0.42)', 'rgba(5,6,10,0.92)']} style={styles.pickOverlay}>
        <View style={styles.pickTopRow}>
          {pick.event.age_restriction ? <View style={styles.agePill}><Text style={styles.agePillText}>{pick.event.age_restriction}+</Text></View> : <View />}
          <TouchableOpacity style={styles.moreButton} onPress={() => onFeedback(pick)} activeOpacity={0.8}>
            <Ionicons name="ellipsis-horizontal" size={15} color="#FFFFFF" />
          </TouchableOpacity>
          {pick.event.donation_campaign ? <View style={styles.donationPill}><Ionicons name="heart" size={11} color="#FFFFFF" /><Text style={styles.donationPillText}>Donation</Text></View> : null}
        </View>
        <View style={styles.pickBottom}>
          <TouchableOpacity style={styles.reasonPill} onPress={() => onPressReason(pick)} activeOpacity={0.86}>
            <Ionicons name="sparkles" size={12} color={colors.echoBlueAccessible} />
            <Text style={styles.reasonText}>{pick.primaryReasonLabel}</Text>
          </TouchableOpacity>
          <Text style={styles.pickTitle} numberOfLines={1}>{pick.event.title}</Text>
          <Text style={styles.pickMeta} numberOfLines={1}>{date} · {pick.event.venue_name} · {price}</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const { visible: headerVisible, onScroll: handleHeaderScroll, headerAnimatedStyle } = useEchoHeaderVisibility();
  const inputRef = useRef<TextInput>(null);
  const [query, setQuery] = useState('');
  const [draftQuery, setDraftQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [counts, setCounts] = useState(EMPTY_RESULTS);
  const [selectedPick, setSelectedPick] = useState<PickedForYouEvent | null>(null);

  // Match Home's overlay metrics so the inline "Search" H1 clears the header.
  const headerHeight = insets.top + 84;

  const pickedForYou = useMemo(() => getPickedForYouEvents({ limit: 5 }), []);
  const { isListening, transcript, startListening, stopListening } = useSpeechRecognition();

  useEffect(() => {
    searchService.searchAll({ query: '', filters }).then((response) => {
      setSuggestions(response.suggestions);
      setResults(response.results.slice(0, 4));
      setCounts(response.counts);
    });
  }, []);

  useEffect(() => {
    if (transcript) setDraftQuery(transcript);
  }, [transcript]);

  const runSearch = async (nextQuery: string = draftQuery) => {
    setIsSearching(true);
    const response = await searchService.searchAll({ query: nextQuery, filters });
    setQuery(nextQuery.trim());
    setResults(response.results);
    setSuggestions(response.suggestions);
    setCounts(response.counts);
    setIsSearching(false);
  };

  const handleApplyFilters = async (applied: FilterState) => {
    setFilters(applied);
    setShowFilters(false);
    await runSearch(draftQuery);
  };

  const handleVoicePress = async () => {
    if (isListening) {
      stopListening();
      return;
    }
    await startListening();
  };

  const grouped = useMemo(() => ({
    events: results.filter((item) => item.type === 'event'),
    help: results.filter((item) => item.type === 'help'),
    support: results.filter((item) => item.type === 'support'),
  }), [results]);

  const activeFilterCount = Object.entries(filters).filter(([k, v]) => {
    if (k === 'categories') return (v as string[]).length > 0;
    if (k === 'accessibility') return (v as string[]).length > 0;
    return v !== DEFAULT_FILTERS[k as keyof FilterState];
  }).length;

  // v59.3 — Sticky 21+ toggle (Q9 = 9B). Bound to filters.age.
  const isAgeRestricted = filters.age === '21';
  const hasActiveSearchState = !!query || !!draftQuery || activeFilterCount > 0;

  const handleToggle21Plus = async () => {
    const next = { ...filters, age: isAgeRestricted ? 'all' : '21' };
    setFilters(next);
    // Re-run search with the new age filter so results refresh.
    setIsSearching(true);
    const response = await searchService.searchAll({ query: draftQuery, filters: next });
    setQuery(draftQuery.trim());
    setResults(response.results);
    setSuggestions(response.suggestions);
    setCounts(response.counts);
    setIsSearching(false);
  };

  // v59.3 — Clear-all action (Q7 = 7C). X icon + sticky pill both invoke this.
  const handleClearAll = async () => {
    setQuery('');
    setDraftQuery('');
    setFilters(DEFAULT_FILTERS);
    inputRef.current?.blur();
    setIsSearching(true);
    const response = await searchService.searchAll({ query: '', filters: DEFAULT_FILTERS });
    setResults(response.results.slice(0, 4));
    setSuggestions(response.suggestions);
    setCounts(response.counts);
    setIsSearching(false);
  };

  const openResult = (item: SearchResultItem) => {
    if (item.route) {
      router.push(item.route as never);
      return;
    }
    if (item.type === 'support') {
      setDraftQuery('contact event support');
      runSearch('contact event support');
    }
  };

  const askEcho = (nextQuery: string) => {
    setDraftQuery(nextQuery);
    runSearch(nextQuery);
  };

  const handlePickFeedback = (pick: PickedForYouEvent) => {
    Alert.alert('Tune Picked for You', pick.event.title, [
      {
        text: 'More like this',
        onPress: () => void addSearchFeedback({ eventId: pick.event.id, hostName: pick.event.host_name, category: pick.event.category, action: 'more_like_this' }),
      },
      {
        text: 'Not interested',
        style: 'destructive',
        onPress: () => void addSearchFeedback({ eventId: pick.event.id, hostName: pick.event.host_name, category: pick.event.category, action: 'not_interested' }),
      },
      {
        text: 'Hide this host',
        style: 'destructive',
        onPress: () => void addSearchFeedback({ eventId: pick.event.id, hostName: pick.event.host_name, category: pick.event.category, action: 'hide_host' }),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const hasQuery = !!query;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingTop: headerHeight, paddingBottom: 160 }}
        showsVerticalScrollIndicator={false}
        onScroll={handleHeaderScroll}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerCopy}>
          <Text style={styles.screenTitle}>Search</Text>
          <Text variant="caption" color="textMuted" style={styles.screenSubtitle}>Find the right event faster.</Text>
        </View>

        <View style={styles.searchModule}>
          <LinearGradient colors={['rgba(32,199,255,0.26)', 'rgba(230,61,173,0.20)', 'rgba(255,122,26,0.14)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.inputGlow}>
            <View style={styles.inputRow}>
              <Ionicons name="sparkles-outline" size={20} color={colors.echoBlueAccessible} style={styles.searchIcon} />
              <TextInput
                ref={inputRef}
                style={styles.input}
                value={draftQuery}
                onChangeText={setDraftQuery}
                placeholder="Ask ECHO or search events"
                placeholderTextColor={colors.textMuted}
                autoCorrect={false}
                returnKeyType="search"
                onSubmitEditing={() => runSearch(draftQuery)}
              />
              {hasActiveSearchState ? (
                <TouchableOpacity style={styles.iconButton} onPress={handleClearAll} activeOpacity={0.82} accessibilityLabel="Clear search and filters">
                  <Ionicons name="close" size={18} color={colors.textMedium} />
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity style={[styles.iconButton, isListening && styles.iconButtonActive]} onPress={handleVoicePress} activeOpacity={0.82}>
                <Ionicons name={isListening ? 'mic' : 'mic-outline'} size={18} color={isListening ? colors.text : colors.textMedium} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.iconButton, activeFilterCount > 0 && styles.filterActive]} onPress={() => setShowFilters(true)} activeOpacity={0.82}>
                <Ionicons name="options-outline" size={18} color={activeFilterCount > 0 ? colors.bg : colors.textMedium} />
              </TouchableOpacity>
            </View>
          </LinearGradient>

          {hasActiveSearchState ? (
            <TouchableOpacity style={styles.clearAllPill} onPress={handleClearAll} activeOpacity={0.86} accessibilityLabel="Clear all filters and return to default search">
              <Ionicons name="close-circle" size={14} color={colors.echoBlueAccessible} />
              <Text style={styles.clearAllPillText}>
                Clear all{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
              </Text>
            </TouchableOpacity>
          ) : null}

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.intentRow}>
            {INTENT_CHIPS.map((item) => (
              <TouchableOpacity key={item.label} style={styles.intentChip} onPress={() => askEcho(item.query)} activeOpacity={0.86}>
                <Text variant="caption" style={styles.intentChipText}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {!hasQuery ? (
          <View style={styles.defaultContent}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionTitle}>Picked for You</Text>
                <Text variant="caption" color="textMuted" style={{ marginTop: 2 }}>Curated by ECHO AI.</Text>
              </View>
              <View style={styles.aiMiniPill}>
                <Ionicons name="sparkles" size={12} color={colors.echoBlueAccessible} />
                <Text style={styles.aiMiniPillText}>Smart picks</Text>
              </View>
            </View>

            {pickedForYou.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pickStrip}>
                {pickedForYou.map((pick) => <PickedForYouCard key={pick.event.id} pick={pick} onPressReason={setSelectedPick} onFeedback={handlePickFeedback} />)}
              </ScrollView>
            ) : (
              <View style={styles.coldStartCard}>
                <Ionicons name="sparkles-outline" size={22} color={colors.echoBlueAccessible} />
                <Text style={styles.coldStartTitle}>Start exploring and ECHO will personalize this space.</Text>
                <Text variant="caption" color="textMuted" style={styles.coldStartBody}>Trending near you, verified hosts, community events, and donation-enabled events will appear first.</Text>
              </View>
            )}

            <View style={styles.narrowBlock}>
              <Text style={styles.narrowTitle}>Ask ECHO to narrow it down</Text>
              <View style={styles.narrowChipWrap}>
                {/* v59.3 — Sticky 21+ toggle (Q8 / Q9). Bound to filters.age. */}
                <TouchableOpacity
                  key="21plus-toggle"
                  style={[styles.narrowChip, isAgeRestricted && styles.narrowChipActive]}
                  onPress={handleToggle21Plus}
                  activeOpacity={0.86}
                  accessibilityLabel={isAgeRestricted ? 'Disable 21 plus filter' : 'Enable 21 plus filter'}
                  accessibilityState={{ selected: isAgeRestricted }}
                >
                  {isAgeRestricted ? (
                    <Ionicons name="checkmark" size={13} color={colors.text} style={{ marginRight: 4 }} />
                  ) : null}
                  <Text variant="caption" style={[styles.narrowChipText, isAgeRestricted && styles.narrowChipTextActive]}>21+</Text>
                </TouchableOpacity>

                {NARROW_CHIPS.map((item) => (
                  <TouchableOpacity key={item.label} style={styles.narrowChip} onPress={() => askEcho(item.query)} activeOpacity={0.86}>
                    <Text variant="caption" style={styles.narrowChipText}>{item.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* v59.3 — "Recent ways to search" block intentionally removed. */}
          </View>
        ) : null}

        {isSearching ? (
          <View style={styles.centerState}>
            <ActivityIndicator color={colors.echoBlueAccessible} />
            <Text variant="caption" color="textMuted" style={{ marginTop: 12 }}>ECHO is finding the best matches...</Text>
          </View>
        ) : null}

        {hasQuery && !isSearching && results.length === 0 ? (
          <View style={styles.centerState}>
            <Ionicons name="search-outline" size={46} color={colors.textMuted} />
            <Text variant="title" style={{ marginTop: 14 }}>No perfect matches yet.</Text>
            <Text variant="caption" color="textMuted" style={styles.emptyBody}>Try widening the date, distance, or price range.</Text>
            <View style={styles.emptyActions}>
              {['This Weekend', 'Near Me', 'Remove Filters'].map((label) => (
                <TouchableOpacity key={label} style={styles.emptyChip} onPress={() => askEcho(label === 'Remove Filters' ? 'events near me' : label.toLowerCase())}>
                  <Text variant="caption">{label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : null}

        {hasQuery && !isSearching && results.length > 0 ? (
          <View style={styles.resultsWrap}>
            <View style={styles.aiAnswerCard}>
              <View style={styles.aiBadge}>
                <Ionicons name="sparkles" size={14} color={colors.echoBlueAccessible} />
                <Text variant="label" style={styles.aiBadgeText}>ECHO AI</Text>
              </View>
              <Text style={styles.aiSummary}>{getAiSummary(query)}</Text>
              <Text variant="caption" color="textMuted" style={{ marginTop: 6 }}>
                {counts.events} event matches · refined from “{query}”
              </Text>
            </View>

            {grouped.events.length > 0 && (
              <View style={styles.group}>
                <Text style={styles.groupLabel}>Events</Text>
                {grouped.events.map((item) => <ResultCard key={item.id} item={item} onPress={() => openResult(item)} />)}
              </View>
            )}

            {grouped.help.length > 0 && (
              <View style={styles.group}>
                <Text style={styles.groupLabel}>AI Help</Text>
                {grouped.help.map((item) => <ResultCard key={item.id} item={item} onPress={() => openResult(item)} />)}
              </View>
            )}

            {grouped.support.length > 0 && (
              <View style={styles.group}>
                <Text style={styles.groupLabel}>Support</Text>
                {grouped.support.map((item) => <ResultCard key={item.id} item={item} onPress={() => openResult(item)} />)}
              </View>
            )}
          </View>
        ) : null}
      </ScrollView>

      {/* Absolute overlay header — mirrors Home's pattern so the inline H1 sits below it (v59.3 Q1 = 1A). */}
      <Animated.View
        style={[styles.headerOverlay, headerAnimatedStyle]}
        pointerEvents={headerVisible ? 'auto' : 'none'}
      >
        <ModeSwitchHeader title="Search" topInset={insets.top} showNotification />
      </Animated.View>

      <FilterModal visible={showFilters} onClose={() => setShowFilters(false)} filters={filters} onApply={handleApplyFilters} resultCount={counts.all} />

      <Modal visible={!!selectedPick} transparent animationType="fade" onRequestClose={() => setSelectedPick(null)}>
        <Pressable style={styles.reasonBackdrop} onPress={() => setSelectedPick(null)}>
          <Pressable style={styles.reasonSheet}>
            <View style={styles.reasonHandle} />
            <View style={styles.reasonHeaderRow}>
              <Ionicons name="sparkles" size={18} color={colors.echoBlueAccessible} />
              <Text style={styles.reasonTitle}>Why ECHO picked this</Text>
            </View>
            <Text style={styles.reasonBody}>
              ECHO matched this event to your recent interest in {selectedPick?.explanation || 'similar events, nearby timing, and verified hosts'}.
            </Text>
            <TouchableOpacity style={styles.reasonPrimary} onPress={() => setSelectedPick(null)} activeOpacity={0.86}>
              <Text style={styles.reasonPrimaryText}>Got it</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  scroll: { flex: 1, paddingHorizontal: spacing.screenPaddingX },
  headerOverlay: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  headerCopy: { paddingTop: 8, paddingBottom: 14 },
  screenTitle: { color: colors.text, fontSize: 32, fontWeight: '900', letterSpacing: -0.7, lineHeight: 40 },
  screenSubtitle: { marginTop: 3, fontSize: 13.5 },
  searchModule: { paddingBottom: 16, marginBottom: 8 },
  inputGlow: { borderRadius: 24, padding: 1 },
  inputRow: { minHeight: 58, borderRadius: 23, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', backgroundColor: 'rgba(12,14,22,0.96)', flexDirection: 'row', alignItems: 'center', paddingLeft: 16, paddingRight: 8 },
  searchIcon: { marginRight: 10 },
  input: { flex: 1, color: colors.text, fontSize: 16, fontWeight: '700', paddingVertical: 14 },
  iconButton: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.055)', marginLeft: 6 },
  iconButtonActive: { backgroundColor: 'rgba(255,122,26,0.18)' },
  filterActive: { backgroundColor: colors.text },
  clearAllPill: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 15, marginTop: 10, backgroundColor: 'rgba(32,199,255,0.10)', borderWidth: 1, borderColor: 'rgba(32,199,255,0.26)' },
  clearAllPillText: { color: colors.echoBlueAccessible, fontSize: 12, fontWeight: '800' },
  intentRow: { gap: 9, paddingTop: 14, paddingRight: 16 },
  intentChip: { borderRadius: 18, paddingHorizontal: 14, paddingVertical: 9, backgroundColor: 'rgba(255,255,255,0.055)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  intentChipText: { color: colors.textMedium, fontWeight: '800' },
  defaultContent: { gap: 18 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  sectionTitle: { color: colors.text, fontSize: 20, fontWeight: '900', letterSpacing: -0.3 },
  aiMiniPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 15, backgroundColor: 'rgba(32,199,255,0.10)', borderWidth: 1, borderColor: 'rgba(32,199,255,0.18)' },
  aiMiniPillText: { color: colors.echoBlueAccessible, fontSize: 11, fontWeight: '900' },
  pickStrip: { gap: 12, paddingRight: 18 },
  pickCard: { width: 286, height: 188, borderRadius: 24, overflow: 'hidden', backgroundColor: '#101217', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)' },
  pickImage: { ...StyleSheet.absoluteFillObject, width: undefined, height: undefined },
  pickOverlay: { flex: 1, padding: 14, justifyContent: 'space-between' },
  pickTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  moreButton: { marginLeft: 'auto', width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.42)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)' },
  agePill: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.48)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)' },
  agePillText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
  donationPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 12, backgroundColor: 'rgba(230,61,173,0.52)' },
  donationPillText: { color: '#FFFFFF', fontSize: 10.5, fontWeight: '900' },
  pickBottom: { gap: 7 },
  reasonPill: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14, backgroundColor: 'rgba(5,6,10,0.64)', borderWidth: 1, borderColor: 'rgba(32,199,255,0.26)' },
  reasonText: { color: colors.text, fontSize: 11.5, fontWeight: '800' },
  pickTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '900', letterSpacing: -0.3 },
  pickMeta: { color: 'rgba(255,255,255,0.74)', fontSize: 12.5, fontWeight: '700' },
  narrowBlock: { padding: 15, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.045)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  narrowTitle: { color: colors.text, fontSize: 15, fontWeight: '900', marginBottom: 12 },
  narrowChipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  narrowChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 9, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  narrowChipActive: { backgroundColor: 'rgba(32,199,255,0.14)', borderColor: 'rgba(32,199,255,0.42)' },
  narrowChipText: { color: colors.textMedium, fontWeight: '800' },
  narrowChipTextActive: { color: colors.text },
  suggestionsBlock: { gap: 10 },
  suggestionRow: { minHeight: 58, borderRadius: 18, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.045)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  suggestionLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  suggestionIconWrap: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(32,199,255,0.10)' },
  coldStartCard: { minHeight: 142, borderRadius: 22, padding: 18, alignItems: 'flex-start', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.045)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  coldStartTitle: { color: colors.text, fontSize: 17, fontWeight: '900', marginTop: 10 },
  coldStartBody: { marginTop: 7, lineHeight: 18 },
  centerState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 44, paddingHorizontal: 24 },
  emptyBody: { marginTop: 8, textAlign: 'center', lineHeight: 18 },
  emptyActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, justifyContent: 'center', marginTop: 16 },
  emptyChip: { paddingHorizontal: 13, paddingVertical: 9, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.06)' },
  resultsWrap: { gap: 18, paddingTop: 4 },
  aiAnswerCard: { borderRadius: 22, padding: 16, backgroundColor: 'rgba(32,199,255,0.07)', borderWidth: 1, borderColor: 'rgba(32,199,255,0.16)' },
  aiBadge: { flexDirection: 'row', alignItems: 'center' },
  aiBadgeText: { marginLeft: 6, color: colors.echoBlueAccessible },
  aiSummary: { color: colors.text, fontSize: 17, fontWeight: '900', lineHeight: 22, marginTop: 8 },
  group: { gap: 10 },
  groupLabel: { color: colors.textMuted, fontSize: 12, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 },
  resultOuter: { borderRadius: 18 },
  resultCard: { borderRadius: 18, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(255,255,255,0.045)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  resultIconWrap: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.06)' },
  resultContent: { flex: 1 },
  resultSubtitle: { marginTop: 4 },
  resultBody: { marginTop: 7 },
  resultMetaRow: { marginTop: 9, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  reasonBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.66)', justifyContent: 'flex-end' },
  reasonSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, backgroundColor: '#0B0D12', borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.12)', padding: 22, paddingBottom: 34 },
  reasonHandle: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.16)', marginBottom: 18 },
  reasonHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  reasonTitle: { color: colors.text, fontSize: 20, fontWeight: '900', letterSpacing: -0.3 },
  reasonBody: { color: colors.textMedium, fontSize: 14, lineHeight: 21, marginTop: 12 },
  reasonPrimary: { height: 50, borderRadius: 25, backgroundColor: colors.text, alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  reasonPrimaryText: { color: '#05060A', fontSize: 15, fontWeight: '900' },
});
