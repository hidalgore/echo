import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../ui';

type Props = {
  name: string;
  avatarUrl?: string;
  trustText: string;
  nextEventText?: string;
  isFollowing: boolean;
  onPress: () => void;
  onToggleFollow: () => void;
};

export function FollowingHostCard({
  name,
  avatarUrl,
  trustText,
  nextEventText,
  isFollowing,
  onPress,
  onToggleFollow,
}: Props) {
  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={styles.card}>
      {avatarUrl ? <Image source={{ uri: avatarUrl }} style={styles.avatar} /> : <View style={styles.avatarFallback} />}
      <View style={styles.body}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.trust}>{trustText}</Text>
        <Text style={styles.nextLine}>{nextEventText || 'No upcoming events'}</Text>
      </View>
      <View style={styles.rightColumn}>
        <TouchableOpacity activeOpacity={0.85} onPress={onToggleFollow} style={[styles.followPill, !isFollowing && styles.followPillOff]}>
          <Text style={[styles.followText, !isFollowing && styles.followTextOff]}>{isFollowing ? 'Following' : 'Follow'}</Text>
        </TouchableOpacity>
        <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.34)" />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 20,
    marginTop: 14,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: { width: 52, height: 52, borderRadius: 26, marginRight: 14 },
  avatarFallback: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginRight: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  body: { flex: 1, marginRight: 12 },
  name: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  trust: { marginTop: 6, fontSize: 13, color: 'rgba(255,255,255,0.78)' },
  nextLine: { marginTop: 7, fontSize: 13, color: 'rgba(255,255,255,0.56)' },
  rightColumn: { alignItems: 'flex-end', gap: 12 },
  followPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  followPillOff: {
    backgroundColor: 'rgba(139,92,246,0.16)',
    borderColor: 'rgba(139,92,246,0.42)',
  },
  followText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },
  followTextOff: { color: '#D8C8FF' },
});
