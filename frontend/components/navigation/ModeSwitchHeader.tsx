import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, StyleSheet, TouchableOpacity, View, TextInput, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing } from '../../theme/tokens';
import { Glass, Text } from '../ui';
import { EchoLineIcon } from './EchoLineIcon';
import { EchoMark } from '../shared/EchoMark';
import { getRoleColor, getRoleLabel, UserRole, useModeStore } from '../../stores/modeStore';
import { NotificationSheet } from '../notifications';
import { useLocationStore, type UserLocation } from '../../stores/locationStore';
import { useNotificationStore } from '../../stores/notificationStore';
import { hostAnalytics } from '../../services/analytics';

interface ModeSwitchHeaderProps {
  title: string;
  showNotification?: boolean;
  topInset?: number;
  /** Shows a premium host back affordance on pushed HOST screens. Primary tab screens keep this false. */
  showBack?: boolean;
}

const roleDestination: Record<UserRole, string> = {
  attendee: '/(tabs)/index',
  host: '/(host)/(tabs)/overview',
};

export function ModeSwitchHeader({ title, showNotification = false, topInset = 0, showBack = false }: ModeSwitchHeaderProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [locationSearch, setLocationSearch] = useState('');
  const currentRole = useModeStore((s) => s.currentRole);
  const setRole = useModeStore((s) => s.setRole);
  const canAccessRole = useModeStore((s) => s.canAccessRole);
  const location = useLocationStore((s) => s.location);
  const initLocation = useLocationStore((s) => s.initialize);
  const setLocation = useLocationStore((s) => s.setLocation);
  const searchCities = useLocationStore((s) => s.searchCities);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const hasUnreadNotifications = unreadCount > 0;
  const insets = useSafeAreaInsets();
  const resolvedTopInset = Math.max(topInset, insets.top);

  useEffect(() => {
    void initLocation();
  }, [initLocation]);

  const locationResults = useMemo(() => searchCities(locationSearch), [locationSearch, searchCities]);

  const handleSelectLocation = useCallback((loc: UserLocation) => {
    void setLocation(loc);
    setShowLocationPicker(false);
    setLocationSearch('');
  }, [setLocation]);

  return (
    <>
      <View style={[styles.container, { paddingTop: resolvedTopInset + 12 }]}> 
        {/* Left: hamburger + solid ECHO brand */}
        <View style={styles.left}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => (showBack ? router.back() : setShowMenu(true))}
            activeOpacity={0.72}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel={showBack ? 'Back' : 'Open menu'}
          >
            <Ionicons name={showBack ? 'chevron-back' : 'menu-outline'} size={showBack ? 27 : 28} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.echoBrandText}>{currentRole === 'host' ? 'HOST' : 'ECHO'}</Text>
        </View>

        {/* Center: official ECHO icon, visually centered between brand and location */}
        <TouchableOpacity
          style={styles.centerEchoIcon}
          activeOpacity={0.78}
          onPress={() => router.push('/(tabs)/index')}
          accessibilityRole="button"
          accessibilityLabel="Open ECHO Home"
        >
          <EchoMark size={47} />
        </TouchableOpacity>

        {/* Right: location + notification */}
        <View style={styles.right}>
          {/* Location */}
          <TouchableOpacity style={styles.locationBtn} onPress={() => setShowLocationPicker(true)} activeOpacity={0.7}>
            <Ionicons name="location-outline" size={15} color="rgba(255,255,255,0.58)" />
            <Text style={styles.locationText} numberOfLines={1}>{location?.city || '...'}</Text>
            <Ionicons name="chevron-down" size={12} color="rgba(255,255,255,0.38)" />
          </TouchableOpacity>

          {showNotification ? (
            <TouchableOpacity style={styles.notificationBtn} onPress={() => setShowNotifications(true)} activeOpacity={0.78} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <EchoLineIcon
                name="notifications"
                size={31}
                state={hasUnreadNotifications ? 'active' : 'default'}
                notificationWaiting={hasUnreadNotifications}
              />
              {hasUnreadNotifications ? <View style={styles.unreadDot} /> : null}
            </TouchableOpacity>
          ) : (
            <View style={styles.modePill}>
              <Text variant="caption" style={[styles.modePillText, { color: getRoleColor(currentRole) }]}>{getRoleLabel(currentRole)}</Text>
            </View>
          )}
        </View>
      </View>

      <Modal visible={showMenu} transparent animationType="fade" onRequestClose={() => setShowMenu(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setShowMenu(false)}>
          <Glass style={styles.menu}>
            {canAccessRole('host') ? (
              <>
                {/* HOST activated — show ECHO/HOST switch */}
                <TouchableOpacity
                  style={[styles.menuRow, currentRole === 'attendee' && styles.menuRowActive]}
                  onPress={() => { hostAnalytics.modeSwitched(currentRole, 'attendee'); setRole('attendee'); setShowMenu(false); router.replace('/(tabs)'); }}
                  activeOpacity={0.72}
                >
                  <Ionicons name="musical-notes-outline" size={18} color={currentRole === 'attendee' ? '#7B4DFF' : colors.textMuted} />
                  <View style={styles.menuRowContent}>
                    <Text style={[styles.menuRowTitle, currentRole === 'attendee' && { color: '#7B4DFF' }]}>ECHO</Text>
                    <Text style={styles.menuRowSub}>Discover and attend events</Text>
                  </View>
                  {currentRole === 'attendee' ? <Ionicons name="checkmark" size={18} color="#7B4DFF" /> : null}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.menuRow, currentRole === 'host' && styles.menuRowActive]}
                  onPress={() => { hostAnalytics.modeSwitched(currentRole, 'host'); setRole('host'); setShowMenu(false); router.replace('/(host)/(tabs)/overview'); }}
                  activeOpacity={0.72}
                >
                  <Ionicons name="flash-outline" size={18} color={currentRole === 'host' ? '#20C7FF' : colors.textMuted} />
                  <View style={styles.menuRowContent}>
                    <Text style={[styles.menuRowTitle, currentRole === 'host' && { color: '#20C7FF' }]}>HOST</Text>
                    <Text style={styles.menuRowSub}>Create and manage events</Text>
                  </View>
                  {currentRole === 'host' ? <Ionicons name="checkmark" size={18} color="#20C7FF" /> : null}
                </TouchableOpacity>
              </>
            ) : (
              <>
                {/* HOST not activated — show ECHO (current) + Become a Host */}
                <View style={[styles.menuRow, styles.menuRowActive]}>
                  <Ionicons name="musical-notes-outline" size={18} color="#7B4DFF" />
                  <View style={styles.menuRowContent}>
                    <Text style={[styles.menuRowTitle, { color: '#7B4DFF' }]}>ECHO</Text>
                    <Text style={styles.menuRowSub}>Discover and attend events</Text>
                  </View>
                  <Ionicons name="checkmark" size={18} color="#7B4DFF" />
                </View>

                <TouchableOpacity
                  style={styles.menuRow}
                  onPress={() => { setShowMenu(false); router.push('/host-application'); }}
                  activeOpacity={0.72}
                >
                  <Ionicons name="flash-outline" size={18} color="#20C7FF" />
                  <View style={styles.menuRowContent}>
                    <Text style={[styles.menuRowTitle, { color: '#20C7FF' }]}>Become a Host</Text>
                    <Text style={styles.menuRowSub}>Create events and sell tickets</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.25)" />
                </TouchableOpacity>
              </>
            )}
          </Glass>
        </TouchableOpacity>
      </Modal>

      {showNotification ? <NotificationSheet visible={showNotifications} onClose={() => setShowNotifications(false)} /> : null}

      {/* Location picker — top dropdown sheet */}
      <Modal visible={showLocationPicker} transparent animationType="slide" onRequestClose={() => { setShowLocationPicker(false); setLocationSearch(''); }}>
        <View style={styles.locDropdown}>
          <View style={[styles.locSheet, { paddingTop: topInset + 12 }]}>
            <View style={styles.locHeaderRow}>
              <Text style={styles.locTitle}>Choose your city</Text>
              <TouchableOpacity onPress={() => { setShowLocationPicker(false); setLocationSearch(''); }} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close" size={22} color="rgba(255,255,255,0.60)" />
              </TouchableOpacity>
            </View>
            <View style={styles.locInputWrap}>
              <Ionicons name="search-outline" size={16} color="rgba(255,255,255,0.35)" />
              <TextInput
                style={styles.locInput}
                value={locationSearch}
                onChangeText={setLocationSearch}
                placeholder="Search cities..."
                placeholderTextColor="rgba(255,255,255,0.25)"
                autoFocus
                autoCapitalize="words"
              />
              {locationSearch.length > 0 && (
                <TouchableOpacity onPress={() => setLocationSearch('')}>
                  <Ionicons name="close-circle" size={16} color="rgba(255,255,255,0.30)" />
                </TouchableOpacity>
              )}
            </View>
            <FlatList
              data={locationResults}
              keyExtractor={(item) => item.display}
              style={styles.locList}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => {
                const isActive = location?.display === item.display;
                return (
                  <TouchableOpacity
                    style={[styles.locRow, isActive && styles.locRowActive]}
                    onPress={() => handleSelectLocation(item)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="location" size={16} color={isActive ? colors.accent : 'rgba(255,255,255,0.35)'} />
                    <Text style={[styles.locRowText, isActive && styles.locRowTextActive]}>{item.display}</Text>
                    {isActive && <Ionicons name="checkmark" size={16} color={colors.accent} />}
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <View style={styles.locEmpty}>
                  <Text style={styles.locEmptyText}>No cities match "{locationSearch}"</Text>
                </View>
              }
            />
          </View>
          <TouchableOpacity style={styles.locScrim} activeOpacity={1} onPress={() => { setShowLocationPicker(false); setLocationSearch(''); }} />
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 72,
    paddingHorizontal: Math.max(spacing.screenPaddingX, 20),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
  },
  left: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  right: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 12 },
  // Location
  locationBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 6, paddingHorizontal: 2, borderRadius: 8, backgroundColor: 'transparent' },
  locationText: { fontSize: 14, fontWeight: '800', letterSpacing: -0.1, color: 'rgba(255,255,255,0.86)', maxWidth: 92 },
  iconBtn: {
    width: 42,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  centerEchoIcon: {
    position: 'absolute',
    left: '50%',
    marginLeft: -23.5,
    bottom: 3,
    width: 47,
    height: 47,
    alignItems: 'center',
    justifyContent: 'center',
  },
  echoBrandText: { fontSize: 25, fontWeight: '900', letterSpacing: 2.7, color: '#FFFFFF' },
  // ─── Right side ─────────────────────────────────────────
  notificationBtn: {
    width: 36,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  unreadDot: {
    position: 'absolute',
    top: 8,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E63DAD',
  },
  modePill: {
    minWidth: 68,
    height: 30,
    borderRadius: 15,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.glassBorder,
    backgroundColor: colors.surface2,
  },
  modePillText: { fontWeight: '700', letterSpacing: 0.5, fontSize: 11 },
  overlay: { flex: 1, backgroundColor: colors.overlayDim, paddingTop: 104, paddingHorizontal: 16 },
  menu: { padding: 16, borderRadius: radii.xl },
  roleOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 56,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  roleOptionTitle: { fontWeight: '800', fontSize: 15 },
  roleActive: { backgroundColor: colors.surface2, marginHorizontal: -16, paddingHorizontal: 16, borderRadius: radii.md },
  roleDisabled: { opacity: 0.7 },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14 },
  menuRowActive: { backgroundColor: 'rgba(255,255,255,0.04)', marginHorizontal: -16, paddingHorizontal: 16, borderRadius: 14 },
  menuRowContent: { flex: 1 },
  menuRowTitle: { fontSize: 15, fontWeight: '700', color: colors.textHigh },
  menuRowSub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  // Location dropdown
  locDropdown: { flex: 1 },
  locSheet: {
    backgroundColor: '#12161E', borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
    paddingHorizontal: 20, paddingBottom: 20,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: 12,
  },
  locScrim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  locHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  locTitle: { fontSize: 18, fontWeight: '700', color: '#F5F7FB' },
  locInputWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 46, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', backgroundColor: 'rgba(255,255,255,0.04)', paddingHorizontal: 14 },
  locInput: { flex: 1, fontSize: 15, color: '#F5F7FB', height: 46 },
  locList: { marginTop: 10, maxHeight: 300 },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 13, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
  locRowActive: { backgroundColor: 'rgba(123,77,255,0.06)', marginHorizontal: -4, paddingHorizontal: 8, borderRadius: 10 },
  locRowText: { flex: 1, fontSize: 15, color: 'rgba(255,255,255,0.70)' },
  locRowTextActive: { color: '#F5F7FB', fontWeight: '600' },
  locEmpty: { paddingVertical: 24, alignItems: 'center' },
  locEmptyText: { fontSize: 14, color: 'rgba(255,255,255,0.35)' },
});

export default ModeSwitchHeader;
