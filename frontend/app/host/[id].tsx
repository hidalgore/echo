import { useEffect, useMemo, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  LayoutAnimation,
  Platform,
  UIManager,
  Linking,
  TextStyle,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../../components/ui';
import { useHostStore } from '../../stores/hostStore';
import { formatDate, formatTime } from '../../utils/format';

import { ScreenBackButton } from '../../components/shared/ScreenBackButton';
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function HostProfileScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [pastExpanded, setPastExpanded] = useState(false);
  const { initializeHosts, getHostById, getUpcomingEventsForHost, getPastEventsForHost, toggleFollow } = useHostStore();

  useEffect(() => {
    initializeHosts();
  }, [initializeHosts]);

  const host = useMemo(() => getHostById(id), [getHostById, id]);
  const upcomingEvents = useMemo(() => getUpcomingEventsForHost(id), [getUpcomingEventsForHost, id]);
  const pastEvents = useMemo(() => getPastEventsForHost(id), [getPastEventsForHost, id]);

  if (!host) {
    return (
      <View style={styles.emptyPage}>
        <Text style={styles.emptyTitle}>Host not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backAction}>
          <Text style={styles.backActionText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <ScreenBackButton variant="floating" />
          <Text style={styles.headerTitle}>Host</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.heroCard}>
          <Image source={{ uri: host.avatarUrl }} style={styles.avatar} />
          <View style={styles.heroTextWrap}>
            <Text style={styles.hostName}>{host.name}</Text>
            <Text style={styles.trustText}>{host.rating.toFixed(1)} • {host.isTrusted ? 'Trusted Host' : 'Host'} • {host.attendeeCount} attendees</Text>
            {host.website ? (
              <TouchableOpacity onPress={() => Linking.openURL(host.website!)} activeOpacity={0.7} style={styles.websiteRow}>
                <Ionicons name="globe-outline" size={14} color="rgba(123,77,255,0.80)" />
                <Text style={styles.websiteText} numberOfLines={1}>{host.website.replace(/^https?:\/\//, '')}</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Follow + Socials row */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={() => toggleFollow(host.id)}
              style={[styles.followButton, !host.isFollowing && styles.followButtonOff]}
            >
              <Text style={[styles.followButtonText, !host.isFollowing && styles.followButtonTextOff]}>{host.isFollowing ? 'Following' : 'Follow'}</Text>
            </TouchableOpacity>

            {host.socialLinks && host.socialLinks.length > 0 ? (
              <View style={styles.socialIconRow}>
                {host.socialLinks.map((link) => {
                  const iconMap: Record<string, string> = {
                    instagram: 'logo-instagram',
                    facebook: 'logo-facebook',
                    tiktok: 'logo-tiktok',
                    youtube: 'logo-youtube',
                    x: 'logo-twitter',
                    other: 'link-outline',
                  };
                  return (
                    <TouchableOpacity
                      key={link.platform}
                      style={styles.socialIconBtn}
                      onPress={() => Linking.openURL(link.url)}
                      activeOpacity={0.7}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <Ionicons name={(iconMap[link.platform] || 'link-outline') as never} size={18} color="rgba(255,255,255,0.60)" />
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bio</Text>
          <View style={styles.bioCard}>
            <Text style={styles.bioText}>{host.bio}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming Events</Text>
          {upcomingEvents.length ? (
            upcomingEvents.map((event) => (
              <TouchableOpacity key={event.id} style={styles.eventCard} onPress={() => router.push(`/event/${event.id}`)} activeOpacity={0.9}>
                <Image source={{ uri: event.image_url }} style={styles.eventImage} />
                <View style={styles.eventBody}>
                  <Text style={styles.eventTitle} numberOfLines={1}>{event.title}</Text>
                  <Text style={styles.eventMeta}>{formatDate(event.start_time)} • {formatTime(event.start_time)}</Text>
                  <Text style={styles.eventMeta} numberOfLines={1}>{event.venue_name}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.34)" />
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyCardTitle}>No upcoming events</Text>
              <Text style={styles.emptyCardBody}>This host does not have live ticketed ECHO events right now.</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          activeOpacity={0.86}
          style={[styles.section, styles.pastHeader]}
          onPress={() => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setPastExpanded((prev) => !prev);
          }}
        >
          <Text style={styles.sectionTitle}>Past Events</Text>
          <Ionicons name={pastExpanded ? 'chevron-up' : 'chevron-down'} size={18} color="rgba(255,255,255,0.56)" />
        </TouchableOpacity>

        {pastExpanded ? (
          <View style={styles.pastWrap}>
            {pastEvents.length ? (
              pastEvents.map((event) => (
                <TouchableOpacity key={event.id} style={styles.pastRow} onPress={() => router.push(`/event/${event.id}`)} activeOpacity={0.88}>
                  <View style={styles.pastBody}>
                    <Text style={styles.pastTitle} numberOfLines={1}>{event.title}</Text>
                    <Text style={styles.pastMeta}>{formatDate(event.start_time)} • {event.venue_name}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.30)" />
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyCardTitle}>No past events</Text>
                <Text style={styles.emptyCardBody}>Completed events from this host will appear here.</Text>
              </View>
            )}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F1115' },
  emptyPage: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0F1115', padding: 24 },
  emptyTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '700' },
  backAction: { marginTop: 16, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  backActionText: { color: '#FFFFFF', fontWeight: '600' },
  header: { paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 18 },
  iconButton: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  headerTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '700' },
  headerSpacer: { width: 42, height: 42 },
  heroCard: { marginHorizontal: 20, borderRadius: 28, padding: 18, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  avatar: { width: 78, height: 78, borderRadius: 39, marginBottom: 16 },
  heroTextWrap: { marginBottom: 16 },
  hostName: { color: '#FFFFFF', fontSize: 24, fontWeight: '700' },
  trustText: { marginTop: 8, color: 'rgba(255,255,255,0.76)', fontSize: 14, lineHeight: 20 },
  followButton: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.10)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)' },
  followButtonOff: { backgroundColor: 'rgba(123,77,255,0.16)', borderColor: 'rgba(123,77,255,0.42)' },
  followButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  followButtonTextOff: { color: '#D8C8FF' },
  // Website link
  websiteRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  websiteText: { fontSize: 14, fontWeight: '500', color: 'rgba(123,77,255,0.80)', textDecorationLine: 'underline' as TextStyle['textDecorationLine'] },
  // Action row (Follow + socials)
  actionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  // Social icons
  socialIconRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  socialIconBtn: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  section: { marginTop: 26, paddingHorizontal: 20 },
  sectionTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', marginBottom: 12 },
  bioCard: { borderRadius: 22, padding: 16, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  bioText: { color: 'rgba(255,255,255,0.74)', fontSize: 15, lineHeight: 22 },
  eventCard: { borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', padding: 12, flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  eventImage: { width: 72, height: 72, borderRadius: 16, marginRight: 14 },
  eventBody: { flex: 1, marginRight: 12 },
  eventTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  eventMeta: { marginTop: 6, color: 'rgba(255,255,255,0.64)', fontSize: 13 },
  emptyCard: { borderRadius: 22, padding: 18, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  emptyCardTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  emptyCardBody: { marginTop: 8, color: 'rgba(255,255,255,0.62)', fontSize: 14, lineHeight: 20 },
  pastHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pastWrap: { paddingHorizontal: 20 },
  pastRow: { marginTop: 12, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 16, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', flexDirection: 'row', alignItems: 'center' },
  pastBody: { flex: 1, marginRight: 12 },
  pastTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  pastMeta: { marginTop: 6, color: 'rgba(255,255,255,0.62)', fontSize: 13 },
});
