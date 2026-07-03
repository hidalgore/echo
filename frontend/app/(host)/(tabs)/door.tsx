import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../../../components/ui';
import { colors } from '../../../theme/hostTokens';
import { useEventStore } from '../../../stores/eventStore';
import { useHostProfileStore } from '../../../stores/hostProfileStore';
import {
  closeDoorSession,
  getDoorReadiness,
  getEventRuntime,
  loadDoorSessions,
  pauseDoorSession,
  recordDoorOutcome,
  resumeDoorSession,
  startDoorSession,
  type DoorReadinessResult,
  type DoorSession,
} from '../../../services/doorModeService';
import { compileCloseoutReport, markCloseoutReportEmailed, type CloseoutAttendee } from '../../../services/eventCloseoutReportService';

type SurfaceState = 'startup' | 'ready' | 'scanning' | 'approved' | 'denied' | 'offline' | 'paused' | 'closed';

export default function HostDoorScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id?: string }>();
  const hydrateEvents = useEventStore((s) => s.hydrate);
  const events = useEventStore((s) => s.events);
  const hydrateHost = useHostProfileStore((s) => s.hydrate);
  const profile = useHostProfileStore((s) => s.profile);
  const primaryDisk = useHostProfileStore((s) => s.primaryDisk);
  const backupDisk = useHostProfileStore((s) => s.backupDisk);
  const doorModePasscode = useHostProfileStore((s) => s.doorModePasscode);
  const setDoorModePasscode = useHostProfileStore((s) => s.setDoorModePasscode);
  const verifyDoorModePasscode = useHostProfileStore((s) => s.verifyDoorModePasscode);

  const activeEvent = useMemo(() => {
    if (params.id) return events.find((event) => String(event.id) === String(params.id));
    return events.find((event) => (event.host_name || '').trim() === (profile.displayName || '').trim())
      || events.find((event) => String(event.id).startsWith('evt_host_'))
      || events[0];
  }, [events, params.id, profile.displayName]);

  const doorTiming = useMemo(() => {
    if (!activeEvent?.start_time) return { tooEarly: false, minutesUntilStart: 0, opensAtLabel: '' };
    const startMs = new Date(activeEvent.start_time).getTime();
    if (!Number.isFinite(startMs)) return { tooEarly: false, minutesUntilStart: 0, opensAtLabel: '' };
    const unlockMs = startMs - (2 * 60 * 60 * 1000);
    const now = Date.now();
    const opensAt = new Date(unlockMs).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    return {
      tooEarly: now < unlockMs,
      minutesUntilStart: Math.max(0, Math.ceil((startMs - now) / 60000)),
      opensAtLabel: opensAt,
    };
  }, [activeEvent?.start_time]);

  const [loading, setLoading] = useState(true);
  const [surfaceState, setSurfaceState] = useState<SurfaceState>('startup');
  const [readiness, setReadiness] = useState<DoorReadinessResult | null>(null);
  const [session, setSession] = useState<DoorSession | null>(null);
  const [checkedIn, setCheckedIn] = useState(0);
  const [denied, setDenied] = useState(0);
  const [showOptions, setShowOptions] = useState(false);
  const [attendeeSheet, setAttendeeSheet] = useState<'checked' | 'remaining' | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showResumePasscode, setShowResumePasscode] = useState(false);
  const [resumeCode, setResumeCode] = useState('');
  const [preflightPasscode, setPreflightPasscode] = useState('');
  const [showAllCheckedInPrompt, setShowAllCheckedInPrompt] = useState(false);
  const [closeoutStarted, setCloseoutStarted] = useState(false);

  useEffect(() => {
    (async () => {
      await Promise.all([hydrateEvents(), hydrateHost()]);
    })();
  }, [hydrateEvents, hydrateHost]);


  useEffect(() => {
    if (doorTiming.tooEarly || !doorModePasscode) return;
    let Brightness: any = null;
    let previousBrightness: number | null = null;
    let mounted = true;

    (async () => {
      try {
        Brightness = require('expo-brightness');
        previousBrightness = await Brightness.getBrightnessAsync();
        if (mounted) {
          await Brightness.setBrightnessAsync(1);
          setTimeout(() => Brightness?.setBrightnessAsync?.(1).catch?.(() => {}), 350);
        }
      } catch {
        // Brightness support is optional in local/web builds.
      }
    })();

    return () => {
      mounted = false;
      if (Brightness && previousBrightness !== null) {
        Brightness.setBrightnessAsync(previousBrightness).catch(() => {});
      }
    };
  }, [doorTiming.tooEarly, doorModePasscode]);

  useEffect(() => {
    if (!activeEvent) return;
    let mounted = true;
    (async () => {
      setLoading(true);
      const result = await getDoorReadiness({
        eventId: activeEvent.id,
        eventTitle: activeEvent.title,
        operatorName: profile.displayName || 'ECHO Host',
        primaryDisk,
        backupDisk,
      });
      const runtime = await getEventRuntime(activeEvent.id);
      const sessions = await loadDoorSessions();
      const activeSession = sessions.find((item) => item.eventId === activeEvent.id && item.status !== 'closed') || null;
      if (!mounted) return;
      setReadiness(result);
      setSession(activeSession);
      setCheckedIn(runtime?.checkedIn ?? activeSession?.checkedInCount ?? 0);
      setDenied(activeSession?.deniedCount ?? 0);
      setSurfaceState(activeSession?.status === 'paused' ? 'paused' : activeSession?.status === 'closed' ? 'closed' : activeSession ? 'ready' : 'startup');
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, [activeEvent, profile.displayName, primaryDisk, backupDisk]);

  if (!activeEvent) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyWrap}>
          <Text style={styles.title}>No host event available</Text>
          <Text style={styles.sub}>Publish an event first, then launch Door Mode.</Text>
        </View>
      </View>
    );
  }

  const capacity = activeEvent.ticket_types.reduce((sum, ticket) => sum + ticket.available, 0);
  const remaining = Math.max(capacity - checkedIn, 0);
  const ageRule = activeEvent.age_restriction ? `${activeEvent.age_restriction}+ EVENT` : 'ALL AGES EVENT';
  const eventDate = new Date(activeEvent.start_time).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const eventTime = new Date(activeEvent.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  const checkedAttendees = useMemo<CloseoutAttendee[]>(() => (
    Array.from({ length: Math.min(checkedIn, 24) }, (_, index) => ({
      id: `checked_${index + 1}`,
      name: ['Maya Johnson', 'Alex Carter', 'Jordan Lee', 'Nia Brooks', 'Marcus Reed', 'Taylor Stone'][index % 6],
      ticket: index % 3 === 0 ? 'VIP' : 'General Admission',
      time: `${Math.max(1, index + 1)}m ago`,
      status: 'checked_in' as const,
    }))
  ), [checkedIn]);

  const remainingAttendees = useMemo<CloseoutAttendee[]>(() => (
    Array.from({ length: Math.min(remaining, 40) }, (_, index) => ({
      id: `remaining_${index + 1}`,
      name: ['Chris Morgan', 'Sam Rivera', 'Avery King', 'Devon Gray', 'Jasmine Cole', 'Noah Price'][index % 6],
      ticket: index % 4 === 0 ? 'VIP' : 'General Admission',
      status: 'remaining' as const,
    }))
  ), [remaining]);

  useEffect(() => {
    if (!activeEvent || closeoutStarted || surfaceState === 'closed') return;
    if (capacity > 0 && checkedIn > 0 && remaining === 0) {
      setShowAllCheckedInPrompt(true);
    }
  }, [activeEvent, capacity, checkedIn, remaining, closeoutStarted, surfaceState]);

  const onStart = async () => {
    if (!readiness) return;
    const next = await startDoorSession({
      eventId: activeEvent.id,
      eventTitle: activeEvent.title,
      operatorName: profile.displayName || 'ECHO Host',
      readerMode: readiness.readerMode,
    });
    setSession(next);
    setSurfaceState('ready');
  };

  const simulateScan = async (outcome: 'approved' | 'denied') => {
    if (surfaceState === 'closed' || surfaceState === 'paused') return;
    setSurfaceState('scanning');
    setTimeout(async () => {
      const next = await recordDoorOutcome(activeEvent.id, outcome);
      if (outcome === 'approved') setCheckedIn((v) => v + 1);
      else setDenied((v) => v + 1);
      if (next) setSession(next);
      setSurfaceState(outcome);
      setTimeout(() => setSurfaceState('ready'), outcome === 'approved' ? 850 : 1100);
    }, 430);
  };

  const handleTapTarget = async () => {
    if (surfaceState === 'startup') {
      await onStart();
      return;
    }
    if (surfaceState === 'ready' || surfaceState === 'offline') {
      await simulateScan('approved');
    }
  };
  const runDoorSystemTest = () => {
    setShowOptions(false);
    setSurfaceState('scanning');
    setTimeout(() => setSurfaceState('ready'), 900);
  };

  const requestExitDoorMode = () => {
    setShowOptions(false);
    setShowExitConfirm(true);
  };

  const confirmExitDoorMode = () => {
    setShowExitConfirm(false);
    router.replace('/(host)/(tabs)/events');
  };

  const closeEvent = async () => {
    if (closeoutStarted) return;
    setCloseoutStarted(true);
    setShowOptions(false);
    setShowAllCheckedInPrompt(false);

    const report = await compileCloseoutReport({
      eventId: activeEvent.id,
      eventTitle: activeEvent.title,
      hostEmail: profile.displayName ? `${profile.displayName.toLowerCase().replace(/[^a-z0-9]+/g, '.')}@getechoaccess.com` : 'host@getechoaccess.com',
      checkedInCount: checkedIn,
      remainingCount: remaining,
      deniedCount: denied,
      capacity,
      checkedAttendees,
      remainingAttendees,
    });

    await markCloseoutReportEmailed(report.id);
    await closeDoorSession(activeEvent.id);
    setSurfaceState('closed');

    Alert.alert(
      'Event closed',
      'Attendance and analytics are compiled. The attendee list has been emailed to the host and is available in Payouts & Reports for download.',
      [{ text: 'Dashboard', onPress: () => router.replace('/(host)/(tabs)/overview') }],
    );
  };

  const pauseDoor = async () => {
    await pauseDoorSession(activeEvent.id);
    setSurfaceState('paused');
  };

  const requestResumeDoor = () => {
    setResumeCode('');
    setShowResumePasscode(true);
  };

  const confirmResumeDoor = async () => {
    if (!doorModePasscode || doorModePasscode.length !== 6) {
      Alert.alert('Passcode not set', 'Set a 6-digit Door Mode passcode in Host Profile before resuming from pause.');
      return;
    }
    if (!verifyDoorModePasscode(resumeCode)) {
      Alert.alert('Incorrect passcode', 'Enter the 6-digit Door Mode passcode to resume scanning.');
      return;
    }
    await resumeDoorSession(activeEvent.id);
    setShowResumePasscode(false);
    setSurfaceState('ready');
  };

  const savePreflightPasscode = () => {
    if (!/^\d{6}$/.test(preflightPasscode.trim())) {
      Alert.alert('Passcode required', 'Create a 6-digit passcode before entering Door Mode. This protects pause and resume during live entry.');
      return;
    }
    setDoorModePasscode(preflightPasscode.trim());
    setPreflightPasscode('');
  };

  if (doorTiming.tooEarly) {
    const hoursUntil = Math.ceil(doorTiming.minutesUntilStart / 60);
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#0B0F17', '#111827', '#0B0F17']} style={StyleSheet.absoluteFill} />
        <View style={[styles.preflightWrap, { paddingTop: insets.top + 28, paddingBottom: insets.bottom + 120 }]}>
          <View style={styles.preflightCard}>
            <View style={styles.preflightIconWrap}>
              <Ionicons name="lock-closed-outline" size={30} color="#20C7FF" />
            </View>
            <Text style={styles.preflightTitle}>Door Mode opens 2 hours before the event</Text>
            <Text style={styles.preflightBody}>
              Door Mode is protected because it controls live access, brightness, scanning, closeout, and attendee entry. This event starts in about {hoursUntil} hour{hoursUntil === 1 ? '' : 's'}.
            </Text>
            <View style={styles.preflightInfoRow}>
              <Ionicons name="time-outline" size={17} color="rgba(245,247,251,0.62)" />
              <Text style={styles.preflightInfoText}>Available around {doorTiming.opensAtLabel}</Text>
            </View>
            <TouchableOpacity style={styles.preflightPrimary} onPress={() => router.replace('/(host)/(tabs)/events')} activeOpacity={0.86}>
              <Text style={styles.preflightPrimaryText}>Back to Events</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  if (!doorModePasscode) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#0B0F17', '#111827', '#0B0F17']} style={StyleSheet.absoluteFill} />
        <View style={[styles.preflightWrap, { paddingTop: insets.top + 28, paddingBottom: insets.bottom + 120 }]}>
          <View style={styles.preflightCard}>
            <View style={styles.preflightIconWrap}>
              <Ionicons name="keypad-outline" size={30} color="#E63DAD" />
            </View>
            <Text style={styles.preflightTitle}>Set Door Mode passcode</Text>
            <Text style={styles.preflightBody}>
              Create a 6-digit passcode before entering Door Mode. ECHO will require this code to resume scanning after a pause so the door cannot be reopened by accident.
            </Text>
            <TextInput
              value={preflightPasscode}
              onChangeText={setPreflightPasscode}
              placeholder="Create 6-digit passcode"
              keyboardType="number-pad"
              secureTextEntry
              maxLength={6}
              placeholderTextColor="rgba(255,255,255,0.30)"
              style={styles.preflightInput}
            />
            <TouchableOpacity style={styles.preflightPrimary} onPress={savePreflightPasscode} activeOpacity={0.86}>
              <Text style={styles.preflightPrimaryText}>Save & Continue</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.preflightSecondary} onPress={() => router.replace('/(host)/(tabs)/profile')} activeOpacity={0.78}>
              <Text style={styles.preflightSecondaryText}>Manage in Host Profile</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0B0F17', '#111827', '#0B0F17']}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.content, { paddingTop: insets.top + 18, paddingBottom: insets.bottom + 84 }]}>
        <View style={styles.eventBlock}>
          <View style={styles.topControlRow}>
            {activeEvent.age_restriction ? (
              <View style={styles.ageBadgeTopLeft}>
                <Text style={styles.ageBadgeTopLeftText}>{activeEvent.age_restriction}+</Text>
              </View>
            ) : <View style={styles.topSideSpacer} />}
            <Text style={styles.eventTitle} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.74}>
              {activeEvent.title}
            </Text>
            <TouchableOpacity style={styles.moreBtn} onPress={() => setShowOptions(true)} activeOpacity={0.78}>
              <Ionicons name="ellipsis-horizontal" size={22} color="rgba(245,247,251,0.82)" />
            </TouchableOpacity>
          </View>
        </View>

        <Pressable style={styles.targetWrap} onPress={handleTapTarget}>
          <View style={styles.targetOuterGlow} />
          <LinearGradient
            colors={targetGradient(surfaceState)}
            start={{ x: 0.05, y: 0.92 }}
            end={{ x: 0.95, y: 0.1 }}
            style={styles.targetRing}
          >
            <View style={styles.targetCore}>
              <Ionicons name={targetIcon(surfaceState)} size={96} color={targetIconColor(surfaceState)} style={styles.targetPhoneIcon} />
              <Text style={styles.targetMain}>{targetMain(surfaceState, loading)}</Text>
              <Text style={styles.targetSub}>{targetSub(surfaceState, readiness)}</Text>
            </View>
          </LinearGradient>
        </Pressable>

        <View style={styles.countRow}>
          <TouchableOpacity style={styles.countBlock} onPress={() => setAttendeeSheet('checked')} activeOpacity={0.78}>
            <Text style={styles.countLabel}>Checked In</Text>
            <Text style={styles.countValue}>{checkedIn}</Text>
          </TouchableOpacity>
          <View style={styles.countDivider} />
          <TouchableOpacity style={styles.countBlock} onPress={() => setAttendeeSheet('remaining')} activeOpacity={0.78}>
            <Text style={styles.countLabel}>Remaining</Text>
            <Text style={styles.countValue}>{remaining}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statusBlock}>
          <Text style={[styles.statusText, { color: statusColor(surfaceState) }]}>{statusText(surfaceState, loading)}</Text>
        </View>

        <View style={styles.bottomActions}>
          <TouchableOpacity
            style={styles.closeEventCta}
            onPress={() => Alert.alert('Close Event?', 'This ends entry and moves the event to closeout.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Close Event', style: 'destructive', onPress: closeEvent },
            ])}
            activeOpacity={0.82}
          >
            <Text style={styles.closeEventCtaText}>Close Event</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.pauseResumeCta, surfaceState === 'paused' ? styles.resumeCta : styles.pauseCta]}
            onPress={surfaceState === 'paused' ? requestResumeDoor : pauseDoor}
            activeOpacity={0.86}
          >
            <Ionicons name={surfaceState === 'paused' ? 'play-outline' : 'pause-outline'} size={17} color={surfaceState === 'paused' ? '#0B0F17' : 'rgba(245,247,251,0.82)'} />
            <Text style={[styles.pauseResumeCtaText, surfaceState !== 'paused' && styles.pauseCtaText]}>{surfaceState === 'paused' ? 'Resume' : 'Pause Door'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal visible={showAllCheckedInPrompt} transparent animationType="fade" onRequestClose={() => setShowAllCheckedInPrompt(false)}>
        <View style={styles.confirmBackdrop}>
          <View style={styles.confirmCard}>
            <Ionicons name="checkmark-done-circle-outline" size={34} color="#A7F3D0" style={{ alignSelf: 'center', marginBottom: 10 }} />
            <Text style={styles.confirmTitle}>All attendees checked in</Text>
            <Text style={styles.confirmBody}>
              Everyone on the attendee list has been checked in. Would you like to close the event now? ECHO will compile attendance, analytics, and email the attendee list to the host.
            </Text>
            <View style={styles.confirmActions}>
              <TouchableOpacity style={styles.confirmCancel} onPress={() => setShowAllCheckedInPrompt(false)}>
                <Text style={styles.confirmCancelText}>Keep Open</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmPrimary} onPress={closeEvent}>
                <Text style={styles.confirmPrimaryText}>Close Event</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showExitConfirm} transparent animationType="fade" onRequestClose={() => setShowExitConfirm(false)}>
        <View style={styles.confirmBackdrop}>
          <View style={styles.confirmCard}>
            <Ionicons name="shield-checkmark-outline" size={30} color="#F8D49A" style={{ alignSelf: 'center', marginBottom: 10 }} />
            <Text style={styles.confirmTitle}>Exit Door Mode?</Text>
            <Text style={styles.confirmBody}>Door Mode is locked for live entry. Exiting should only happen when a trusted host is finished managing the door.</Text>
            <View style={styles.confirmActions}>
              <TouchableOpacity style={styles.confirmCancel} onPress={() => setShowExitConfirm(false)}>
                <Text style={styles.confirmCancelText}>Stay</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmPrimary} onPress={confirmExitDoorMode}>
                <Text style={styles.confirmPrimaryText}>Exit Door</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showResumePasscode} transparent animationType="fade" onRequestClose={() => setShowResumePasscode(false)}>
        <View style={styles.confirmBackdrop}>
          <View style={styles.confirmCard}>
            <Ionicons name="lock-closed-outline" size={30} color="#A7F3D0" style={{ alignSelf: 'center', marginBottom: 10 }} />
            <Text style={styles.confirmTitle}>Resume Door Mode</Text>
            <Text style={styles.confirmBody}>Enter the 6-digit Door Mode passcode set in Host Profile to resume scanning.</Text>
            <TextInput
              value={resumeCode}
              onChangeText={setResumeCode}
              style={styles.resumeInput}
              placeholder="••••••"
              placeholderTextColor="rgba(255,255,255,0.30)"
              keyboardType="number-pad"
              maxLength={6}
              secureTextEntry
              autoFocus
            />
            <View style={styles.confirmActions}>
              <TouchableOpacity style={styles.confirmCancel} onPress={() => setShowResumePasscode(false)}>
                <Text style={styles.confirmCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmPrimary} onPress={confirmResumeDoor}>
                <Text style={styles.confirmPrimaryText}>Resume</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showOptions} transparent animationType="fade" onRequestClose={() => setShowOptions(false)}>
        <View style={styles.sheetBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowOptions(false)} />
          <View style={styles.optionsSheet}>
            <TouchableOpacity style={styles.sheetHandleTouch} onPress={() => setShowOptions(false)} activeOpacity={0.82}><LinearGradient colors={['#20C7FF', '#7B4DFF', '#E63DAD']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.sheetHandle} /></TouchableOpacity>
            <Text style={styles.sheetTitle}>Door Options</Text>
            <OptionRow icon="hardware-chip-outline" label="Test Door Mode" sub="Run a quick system readiness test" onPress={runDoorSystemTest} />
            <OptionRow icon="cloud-offline-outline" label={surfaceState === 'offline' ? 'Return Online' : 'Offline Mode'} sub="Use cached credentials when connection is weak" onPress={() => { setShowOptions(false); setSurfaceState(surfaceState === 'offline' ? 'ready' : 'offline'); }} />
            <OptionRow icon="exit-outline" label="Exit Door Mode" sub="Leave this locked door screen" danger onPress={requestExitDoorMode} />
          </View>
        </View>
      </Modal>

      <AttendeeSheet
        type={attendeeSheet}
        onClose={() => setAttendeeSheet(null)}
        attendees={attendeeSheet === 'checked' ? checkedAttendees : remainingAttendees}
        total={attendeeSheet === 'checked' ? checkedIn : remaining}
      />
    </View>
  );
}

function OptionRow({ icon, label, sub, onPress, danger = false }: {
  icon: any; label: string; sub: string; onPress: () => void; danger?: boolean;
}) {
  return (
    <TouchableOpacity style={styles.optionRow} onPress={onPress} activeOpacity={0.82}>
      <View style={[styles.optionIcon, danger && styles.optionIconDanger]}>
        <Ionicons name={icon} size={20} color={danger ? '#FCA5A5' : 'rgba(245,247,251,0.78)'} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.optionLabel, danger && { color: '#FCA5A5' }]}>{label}</Text>
        <Text style={styles.optionSub}>{sub}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color="rgba(245,247,251,0.28)" />
    </TouchableOpacity>
  );
}

function AttendeeSheet({ type, attendees, total, onClose }: {
  type: 'checked' | 'remaining' | null;
  attendees: Array<any>;
  total: number;
  onClose: () => void;
}) {
  const title = type === 'checked' ? 'Checked In' : 'Remaining';
  return (
    <Modal visible={!!type} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.sheetBackdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.attendeeSheet}>
          <TouchableOpacity style={styles.sheetHandleTouch} onPress={onClose} activeOpacity={0.82}><LinearGradient colors={['#20C7FF', '#7B4DFF', '#E63DAD']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.sheetHandle} /></TouchableOpacity>
          <View style={styles.attendeeSheetHeader}>
            <Text style={styles.sheetTitle}>{title}</Text>
            <Text style={styles.sheetCount}>{total}</Text>
          </View>
          <ScrollView style={styles.attendeeList} showsVerticalScrollIndicator={false}>
            {attendees.length ? attendees.map((attendee, index) => (
              <View key={attendee.id} style={styles.attendeeRow}>
                <View style={styles.attendeeAvatar}>
                  <Text style={styles.attendeeInitial}>{String(attendee.name || '?').charAt(0)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.attendeeName}>{attendee.name}</Text>
                  <Text style={styles.attendeeMeta}>{attendee.ticket} · {attendee.time || (attendee.status === 'remaining' ? 'Not checked in' : 'Checked in')}</Text>
                </View>
                <Ionicons name={type === 'checked' ? 'checkmark-circle-outline' : 'time-outline'} size={20} color={type === 'checked' ? '#A7F3D0' : 'rgba(245,247,251,0.42)'} />
              </View>
            )) : (
              <View style={styles.emptyAttendeeState}>
                <Text style={styles.optionSub}>No attendees to show yet.</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function targetIcon(state: SurfaceState) {
  if (state === 'approved') return 'checkmark-circle-outline';
  if (state === 'denied') return 'close-circle-outline';
  if (state === 'scanning') return 'radio-outline';
  if (state === 'offline') return 'cloud-offline-outline';
  if (state === 'paused') return 'lock-closed-outline';
  if (state === 'closed') return 'lock-closed-outline';
  return 'phone-portrait-outline';
}

function targetIconColor(state: SurfaceState) {
  if (state === 'approved') return '#A7F3D0';
  if (state === 'denied') return '#FCA5A5';
  if (state === 'offline' || state === 'paused') return '#FCD34D';
  return 'rgba(245,247,251,0.90)';
}

function targetGradient(state: SurfaceState): [string, string, string] {
  if (state === 'approved') return ['#10B981', '#20C7FF', '#7B4DFF'];
  if (state === 'denied') return ['#EF4444', '#F59E0B', '#E63DAD'];
  if (state === 'offline' || state === 'paused') return ['#F59E0B', '#7B4DFF', '#20C7FF'];
  return ['#20C7FF', '#7B4DFF', '#E63DAD'];
}

function targetMain(state: SurfaceState, loading: boolean) {
  if (loading) return 'CHECKING';
  if (state === 'startup') return 'START';
  if (state === 'scanning') return 'SCANNING';
  if (state === 'approved') return 'APPROVED';
  if (state === 'denied') return 'DENIED';
  if (state === 'offline') return 'TAP PHONE';
  if (state === 'paused') return 'PAUSED';
  if (state === 'closed') return 'CLOSED';
  return 'TAP PHONE';
}

function targetSub(state: SurfaceState, readiness: DoorReadinessResult | null) {
  if (state === 'startup') return readiness?.state === 'blocked' ? 'SETUP NEEDED' : 'TO BEGIN';
  if (state === 'scanning') return 'VERIFYING';
  if (state === 'approved') return 'ENTRY RECORDED';
  if (state === 'denied') return 'CHECK LOG';
  if (state === 'offline') return 'CACHED MODE';
  if (state === 'paused') return 'NO SCANS';
  if (state === 'closed') return 'SESSION ENDED';
  return 'OR DISC';
}

function statusText(state: SurfaceState, loading: boolean) {
  if (loading) return 'CHECKING';
  if (state === 'startup') return 'READY WHEN STARTED';
  if (state === 'scanning') return 'SCANNING';
  if (state === 'approved') return 'ENTRY APPROVED';
  if (state === 'denied') return 'ENTRY DENIED';
  if (state === 'offline') return 'OFFLINE READY';
  if (state === 'paused') return 'PAUSED';
  if (state === 'closed') return 'CLOSED';
  return 'READY';
}

function statusColor(state: SurfaceState) {
  if (state === 'approved' || state === 'ready') return '#A7F3D0';
  if (state === 'denied' || state === 'closed') return '#FCA5A5';
  if (state === 'offline' || state === 'paused' || state === 'startup') return '#FCD34D';
  return '#A7F3D0';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  preflightWrap: { flex: 1, paddingHorizontal: 24, alignItems: 'center', justifyContent: 'center' },
  preflightCard: { width: '100%', borderRadius: 30, padding: 24, backgroundColor: 'rgba(255,255,255,0.045)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)', alignItems: 'center', overflow: 'hidden' },
  preflightIconWrap: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 18, backgroundColor: 'rgba(255,255,255,0.055)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  preflightTitle: { color: '#F5F7FB', fontSize: 24, lineHeight: 30, fontWeight: '800', textAlign: 'center', marginBottom: 10 },
  preflightBody: { color: 'rgba(245,247,251,0.66)', fontSize: 15, lineHeight: 22, textAlign: 'center', marginBottom: 18 },
  preflightInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 999, paddingHorizontal: 13, paddingVertical: 9, backgroundColor: 'rgba(255,255,255,0.055)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', marginBottom: 18 },
  preflightInfoText: { color: 'rgba(245,247,251,0.72)', fontSize: 13, fontWeight: '700' },
  preflightInput: { width: '100%', minHeight: 54, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.11)', backgroundColor: 'rgba(0,0,0,0.22)', paddingHorizontal: 16, color: '#F5F7FB', fontSize: 16, textAlign: 'center', marginBottom: 14 },
  preflightPrimary: { width: '100%', minHeight: 54, borderRadius: 999, backgroundColor: '#20C7FF', alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  preflightPrimaryText: { color: '#071018', fontSize: 16, fontWeight: '800' },
  preflightSecondary: { marginTop: 14, paddingVertical: 8, paddingHorizontal: 12 },
  preflightSecondaryText: { color: 'rgba(245,247,251,0.58)', fontSize: 13, fontWeight: '700' },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eventBlock: {
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 0,
    minHeight: 76,
    position: 'relative',
  },
  eventTitle: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 25,
    lineHeight: 29,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.5,
    paddingHorizontal: 10,
  },
  eventVenue: {
    color: 'rgba(245,247,251,0.56)',
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '600',
    marginTop: 7,
    textAlign: 'center',
  },
  eventTime: {
    color: 'rgba(245,247,251,0.54)',
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'center',
  },
  topControlRow: {
    alignSelf: 'stretch',
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  topSideSpacer: {
    width: 52,
    height: 40,
  },
  ageBadgeTopLeft: {
    minWidth: 53,
    height: 40,
    borderRadius: 20,
    paddingHorizontal: 13,
    backgroundColor: 'rgba(248,212,154,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(248,212,154,0.24)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ageBadgeTopLeftText: {
    color: '#F8D49A',
    fontSize: 17.8,
    fontWeight: '900',
  },
  targetWrap: {
    width: 374,
    height: 374,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -8,
  },
  targetOuterGlow: {
    position: 'absolute',
    width: 408,
    height: 408,
    borderRadius: 204,
    borderWidth: 2.5,
    borderColor: 'rgba(32,199,255,0.22)',
    backgroundColor: 'rgba(255,255,255,0.018)',
    shadowColor: '#7B4DFF',
    shadowOpacity: 0.52,
    shadowRadius: 45,
    shadowOffset: { width: 0, height: 0 },
  },
  targetRing: {
    width: 344,
    height: 344,
    borderRadius: 172,
    padding: 10,
    shadowColor: '#20C7FF',
    shadowOpacity: 0.66,
    shadowRadius: 35,
    shadowOffset: { width: 0, height: 11 },
    elevation: 30,
  },
  targetCore: {
    flex: 1,
    borderRadius: 162,
    backgroundColor: '#111827',
    borderWidth: 2.5,
    borderTopColor: 'rgba(255,255,255,0.27)',
    borderLeftColor: 'rgba(255,255,255,0.18)',
    borderRightColor: 'rgba(0,0,0,0.36)',
    borderBottomColor: 'rgba(0,0,0,0.46)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.62,
    shadowRadius: 23,
    shadowOffset: { width: 0, height: -9 },
  },
  targetPhoneIcon: {
    marginBottom: 10,
    opacity: 0.96,
  },
  targetMain: {
    color: colors.textPrimary,
    fontSize: 23,
    lineHeight: 27,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 0.4,
  },
  targetSub: {
    color: 'rgba(245,247,251,0.56)',
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 0,
  },
  countRow: {
    width: '100%',
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -4,
  },
  countBlock: { flex: 1, alignItems: 'center' },
  countLabel: {
    color: 'rgba(245,247,251,0.45)',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  countValue: {
    color: colors.textPrimary,
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '800',
    marginTop: 2,
  },
  countDivider: {
    width: 1,
    height: 34,
    backgroundColor: 'rgba(255,255,255,0.14)',
    marginHorizontal: 18,
  },
  statusBlock: { alignItems: 'center', minHeight: 34, justifyContent: 'center' },
  statusText: {
    fontSize: 23,
    lineHeight: 27,
    fontWeight: '900',
    letterSpacing: 2,
  },
  statusRule: {
    width: 0,
    height: 0,
  },
  title: { color: colors.textPrimary, fontSize: 24, fontWeight: '700', textAlign: 'center' },
  sub: { color: colors.textSecondary, fontSize: 14, lineHeight: 21, textAlign: 'center' },

  moreBtn: {
    width: 42,
    height: 33,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.045)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomActions: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 26,
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  closeEventCta: {
    minHeight: 48,
    borderRadius: 18,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.26)',
    backgroundColor: 'rgba(239,68,68,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeEventCtaText: {
    color: '#FCA5A5',
    fontSize: 14,
    fontWeight: '800',
  },
  pauseResumeCta: {
    minHeight: 50,
    borderRadius: 999,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minWidth: 142,
  },
  pauseCta: {
    backgroundColor: 'rgba(255,255,255,0.095)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  resumeCta: {
    backgroundColor: '#A7F3D0',
  },
  pauseResumeCtaText: {
    color: '#0B0F17',
    fontSize: 14,
    fontWeight: '900',
  },
  pauseCtaText: {
    color: 'rgba(245,247,251,0.82)',
  },
  confirmBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.68)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  confirmCard: {
    width: '100%',
    borderRadius: 26,
    padding: 22,
    backgroundColor: '#151B26',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  confirmTitle: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  confirmBody: {
    color: 'rgba(245,247,251,0.62)',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 16,
  },
  confirmActions: {
    flexDirection: 'row',
    gap: 10,
  },
  confirmCancel: {
    flex: 1,
    height: 48,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmCancelText: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  confirmPrimary: {
    flex: 1,
    height: 48,
    borderRadius: 15,
    backgroundColor: '#F8D49A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmPrimaryText: {
    color: '#0B0F17',
    fontSize: 15,
    fontWeight: '900',
  },
  resumeInput: {
    height: 54,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(167,243,208,0.22)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    color: colors.textPrimary,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 6,
    marginBottom: 16,
  },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.54)',
    justifyContent: 'flex-end',
  },
  optionsSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: '#151B26',
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 30,
  },
  attendeeSheet: {
    maxHeight: '72%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: '#151B26',
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 28,
  },
  sheetHandleTouch: {
    alignSelf: 'center',
    width: 68,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  sheetHandle: {
    width: 52,
    height: 3,
    borderRadius: 999,
  },
  sheetTitle: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 12,
  },
  optionRow: {
    minHeight: 68,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    paddingHorizontal: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.055)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionIconDanger: {
    backgroundColor: 'rgba(239,68,68,0.10)',
  },
  optionLabel: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
  },
  optionSub: {
    color: 'rgba(245,247,251,0.46)',
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
  attendeeSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sheetCount: {
    color: '#A7F3D0',
    fontSize: 22,
    fontWeight: '900',
  },
  attendeeList: {
    maxHeight: 420,
  },
  attendeeRow: {
    minHeight: 62,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  attendeeAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(32,199,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  attendeeInitial: {
    color: colors.textPrimary,
    fontWeight: '900',
  },
  attendeeName: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
  },
  attendeeMeta: {
    color: 'rgba(245,247,251,0.46)',
    fontSize: 12,
    marginTop: 2,
  },
  emptyAttendeeState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
});
