/**
 * Circle Invite — v21 (Theme-Migrated + Polished)
 * ═════════════════════════════════════════════════
 * Post-purchase: organizer's ticket confirmed, invite friends to claim spots.
 * Inline search, friend checkboxes, share link, gradient CTA.
 */
import React, { useState, useEffect, useMemo } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, TextInput, StatusBar, Image, Share } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../../components/ui';
import { CircleEventCard, CircleStatusCard, GradientCTA } from '../../components/circle';
import { useCircleStore } from '../../stores/circleStore';
import { deriveCounts, formatTimer } from '../../services/circleStateModel';
import { getCanonicalInviteUrl } from '../../services/circleRecipientService';
import { useDynamicTheme } from '../../theme/dynamicTheme';

import { ScreenBackButton } from '../../components/shared/ScreenBackButton';
const MOCK_FRIENDS = [
  { id: 'f1', name: 'Jasmine R.', handle: '@jasmine.r', avatar: 'https://picsum.photos/seed/jasmine/100/100' },
  { id: 'f2', name: 'Marcus T.', handle: '@marcus.t', avatar: 'https://picsum.photos/seed/marcus/100/100' },
  { id: 'f3', name: 'Nia L.', handle: '@nialee', avatar: 'https://picsum.photos/seed/nia/100/100' },
  { id: 'f4', name: 'Devon K.', handle: '@devonk', avatar: 'https://picsum.photos/seed/devon/100/100' },
];

export default function CircleInviteScreen() {
  const { colors: c, isDark } = useDynamicTheme();
  const insets = useSafeAreaInsets();
  const { id: routeCircleId } = useLocalSearchParams<{ id?: string }>();
  const { circle, inviteMember, tickTimer } = useCircleStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [isNavigating, setIsNavigating] = useState(false);

  const timerActive = !!circle && circle.secondsRemaining > 0;
  useEffect(() => {
    if (!timerActive) return;
    const iv = setInterval(tickTimer, 1000);
    return () => clearInterval(iv);
  }, [circle?.id, timerActive]);

  if (!circle) {
    return (
      <View style={[s.root, s.centered, { paddingTop: insets.top + 24, backgroundColor: c.bg }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <Text style={[s.errorTitle, { color: c.text }]}>Circle not found</Text>
        <TouchableOpacity style={[s.fallbackBtn, { backgroundColor: c.accentSoft }]} onPress={() => router.replace('/(tabs)/wallet')}>
          <Text style={{ color: c.accent, fontSize: 16, fontWeight: '700' }}>Go to Wallet</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const activeCircleId = Array.isArray(routeCircleId) ? routeCircleId[0] : routeCircleId;

  if (activeCircleId && activeCircleId !== circle.id) {
    return (
      <View style={[s.root, s.centered, { paddingTop: insets.top + 24, backgroundColor: c.bg }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <Text style={[s.errorTitle, { color: c.text }]}>Circle session changed</Text>
        <Text style={[s.errorSub, { color: c.textLow }]}>Open your current Circle from Wallet.</Text>
        <TouchableOpacity style={[s.fallbackBtn, { backgroundColor: c.accentSoft }]} onPress={() => router.replace('/(tabs)/wallet')}>
          <Text style={{ color: c.accent, fontSize: 16, fontWeight: '700' }}>Go to Wallet</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const counts = deriveCounts(circle);
  const openSlots = circle.members.filter(m => m.status === 'open').length;

  const filteredFriends = useMemo(() => {
    if (!searchQuery.trim()) return MOCK_FRIENDS;
    const q = searchQuery.toLowerCase();
    return MOCK_FRIENDS.filter(f => f.name.toLowerCase().includes(q) || f.handle.toLowerCase().includes(q));
  }, [searchQuery]);

  const toggleFriend = (id: string) => {
    setSelectedFriends(prev =>
      prev.includes(id)
        ? prev.filter(f => f !== id)
        : prev.length < openSlots ? [...prev, id] : prev
    );
  };

  const goToHub = () => {
    if (isNavigating) return;
    setIsNavigating(true);
    router.replace(`/circle/${circle.id}`);
  };

  const handleSendInvites = () => {
    if (isNavigating) return;
    const slots = circle.members.filter(m => m.status === 'open');
    selectedFriends.slice(0, slots.length).forEach((fId, index) => {
      const friend = MOCK_FRIENDS.find(f => f.id === fId);
      const slot = slots[index];
      if (friend && slot) {
        inviteMember(slot.id, friend.name, 'echo_search', friend.avatar);
      }
    });
    goToHub();
  };

  const handleShareLink = async () => {
    const inviteUrl = getCanonicalInviteUrl(circle.id);
    await Share.share({
      message: `I saved you a spot for ${circle.eventTitle}. Your spot is reserved, and your ticket is confirmed after age verification and payment. Claim it here: ${inviteUrl}`,
    });
  };

  return (
    <View style={[s.root, { backgroundColor: c.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <ScrollView
        contentContainerStyle={[s.scroll, { paddingBottom: 180 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Simple header — no ECHO wordmark */}
        <View style={[s.header, { paddingTop: insets.top + 18 }]}>
          <ScreenBackButton onPress={goToHub} />
          <View style={s.headerCenter}>
            <Text style={[s.headerTitle, { color: c.text }]}>Invite friends</Text>
            <Text style={[s.headerSub, { color: c.textLow }]}>Your ticket is secured. Friends verify, pay, and secure their own tickets.</Text>
          </View>
        </View>

        <View style={s.section}>
          <CircleEventCard
            imageUrl={circle.eventImageUrl}
            title={circle.eventTitle}
            venue={circle.eventVenue || 'Venue'}
            dateLabel={circle.eventDate ? `${circle.eventDate} · ${circle.eventTime || ''}` : 'Date TBD'}
            countLabel={`${circle.totalTickets} spots total`}
            countIcon="people-outline"
          />
        </View>

        <View style={s.section}>
          <CircleStatusCard
            state="created"
            secured={counts.claimed}
            total={circle.totalTickets}
            timerLabel={`Claim window ends in ${formatTimer(circle.secondsRemaining)}`}
            bodyText="You’ve paid for your ticket. Friends use a universal link, verify age if required, then pay separately."
          />
        </View>

        <Text style={[s.sectionLabel, { color: c.textMuted }]}>Invite via</Text>

        {/* Search input */}
        <View style={[s.searchRow, { backgroundColor: c.surface2, borderColor: c.hairline }]}>
          <Ionicons name="search-outline" size={20} color={c.textMuted} />
          <TextInput
            style={[s.searchInput, { color: c.text }]}
            placeholder="Phone, email, or ECHO username"
            placeholderTextColor={c.textDisabled}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* Friend list */}
        {filteredFriends.map(friend => {
          const isSelected = selectedFriends.includes(friend.id);
          return (
            <TouchableOpacity
              key={friend.id}
              style={[
                s.friendRow,
                { backgroundColor: c.surface2, borderColor: c.hairline },
                isSelected && { borderColor: 'rgba(168,85,247,0.35)', backgroundColor: isDark ? 'rgba(168,85,247,0.06)' : 'rgba(168,85,247,0.08)' },
              ]}
              onPress={() => toggleFriend(friend.id)}
              activeOpacity={0.82}
            >
              <View style={[s.checkbox, { borderColor: c.hairlineStrong }, isSelected && s.checkboxSelected]}>
                {isSelected && <Ionicons name="checkmark" size={16} color="#A855F7" />}
              </View>
              <Image source={{ uri: friend.avatar }} style={[s.friendAvatar, { backgroundColor: c.surface3 }]} />
              <View style={{ flex: 1 }}>
                <Text style={[s.friendName, { color: c.text }]}>{friend.name}</Text>
                <Text style={[s.friendHandle, { color: c.textMuted }]}>{friend.handle}</Text>
              </View>
            </TouchableOpacity>
          );
        })}

        {/* Share invite link */}
        <TouchableOpacity style={[s.shareLinkRow, { backgroundColor: isDark ? 'rgba(168,85,247,0.04)' : 'rgba(168,85,247,0.06)', borderColor: isDark ? 'rgba(168,85,247,0.12)' : 'rgba(168,85,247,0.16)' }]} onPress={handleShareLink} activeOpacity={0.82}>
          <View style={s.shareLinkIcon}>
            <Ionicons name="link-outline" size={20} color="#A855F7" />
          </View>
          <Text style={[s.shareLinkText, { color: c.text }]}>Share invite link</Text>
          <Ionicons name="chevron-forward" size={16} color={c.textMuted} style={{ marginLeft: 'auto' }} />
        </TouchableOpacity>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={[s.bottomBar, { paddingBottom: insets.bottom + 12, backgroundColor: c.bg, borderTopColor: c.hairline }]}>
        <GradientCTA
          label="Send invite"
          onPress={handleSendInvites}
          disabled={selectedFriends.length === 0 || isNavigating || openSlots === 0}
        />
        <TouchableOpacity style={s.skipLink} onPress={goToHub} activeOpacity={0.82}>
          <Text style={[s.skipText, { color: c.accent }]}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  centered: { alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: 20 },
  section: { marginBottom: 14 },
  sectionLabel: { fontSize: 15, fontWeight: '600', marginBottom: 12, marginTop: 8 },

  errorTitle: { fontSize: 22, fontWeight: '700', marginBottom: 10 },
  errorSub: { fontSize: 14, textAlign: 'center', marginBottom: 16 },
  fallbackBtn: { paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14 },

  header: { paddingHorizontal: 22, paddingBottom: 20 },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  headerCenter: { gap: 4 },
  headerTitle: { fontSize: 28, fontWeight: '700' },
  headerSub: { fontSize: 15, lineHeight: 21 },

  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 16, padding: 0 },

  friendRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 14, borderRadius: 16, marginBottom: 8, borderWidth: 1,
  },
  checkbox: {
    width: 28, height: 28, borderRadius: 14, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxSelected: { borderColor: '#A855F7', backgroundColor: 'rgba(168,85,247,0.10)' },
  friendAvatar: { width: 44, height: 44, borderRadius: 22 },
  friendName: { fontSize: 16, fontWeight: '600' },
  friendHandle: { fontSize: 13, marginTop: 1 },

  shareLinkRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 16, borderRadius: 16, marginTop: 4, marginBottom: 8, borderWidth: 1,
  },
  shareLinkIcon: {
    width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(168,85,247,0.10)',
  },
  shareLinkText: { fontSize: 16, fontWeight: '600' },

  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1,
  },
  skipLink: { alignItems: 'center', marginTop: 14 },
  skipText: { fontSize: 15, fontWeight: '600' },
});
