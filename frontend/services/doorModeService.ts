import { getJSON, setJSON } from './persistence';
import { MOCK_HOST_EVENT_RUNTIME } from './mockHostEventSuite';

export type ReaderMode = 'echo_disk' | 'phone_nfc' | 'qr_fallback';
export type ReadinessState = 'ready' | 'caution' | 'blocked';
export type DoorSessionStatus = 'active' | 'paused' | 'closed';
export type EchoDiskStatus = 'empty' | 'registered' | 'verified' | 'needs_recheck' | 'not_detected' | 'serial_mismatch';

export interface EchoDiskSlot {
  slotId: 'primary' | 'backup';
  nickname: string;
  serialNumber: string;
  status: EchoDiskStatus;
  lastVerifiedAt?: string;
}

export interface DoorSession {
  id: string;
  eventId: string;
  eventTitle: string;
  operatorName: string;
  readerMode: ReaderMode;
  status: DoorSessionStatus;
  startedAt: string;
  updatedAt: string;
  checkedInCount: number;
  deniedCount: number;
  lastVerifiedAt?: string;
}

export interface HostEventRuntime {
  eventId: string;
  sold: number;
  checkedIn: number;
  revenue: number;
  status: 'published' | 'live' | 'ended';
  lastDoorSessionId?: string;
  updatedAt: string;
}

export interface DoorReadinessResult {
  state: ReadinessState;
  title: string;
  message: string;
  readerMode: ReaderMode;
  usedRecentVerification: boolean;
  checks: Array<{ label: string; value: string; tone: 'neutral' | 'good' | 'warn' }>;
}

const DOOR_SESSIONS_KEY = 'echo.host.doorSessions.v1';
const HOST_RUNTIME_KEY = 'echo.host.eventRuntime.v1';
const RECENT_VERIFY_WINDOW_MS = 1000 * 60 * 12;

const withMockRuntimeDefaults = (runtime: Record<string, HostEventRuntime>): Record<string, HostEventRuntime> => {
  const now = new Date().toISOString();
  const seeded = Object.fromEntries(
    Object.entries(MOCK_HOST_EVENT_RUNTIME).map(([eventId, value]) => [
      eventId,
      { ...value, updatedAt: now },
    ]),
  ) as Record<string, HostEventRuntime>;
  return { ...seeded, ...runtime };
};


export async function loadDoorSessions(): Promise<DoorSession[]> {
  return getJSON<DoorSession[]>(DOOR_SESSIONS_KEY, []);
}

export async function saveDoorSessions(sessions: DoorSession[]): Promise<void> {
  await setJSON(DOOR_SESSIONS_KEY, sessions);
}

export async function loadHostRuntime(): Promise<Record<string, HostEventRuntime>> {
  const stored = await getJSON<Record<string, HostEventRuntime>>(HOST_RUNTIME_KEY, {});
  return withMockRuntimeDefaults(stored);
}

export async function saveHostRuntime(runtime: Record<string, HostEventRuntime>): Promise<void> {
  await setJSON(HOST_RUNTIME_KEY, runtime);
}

export async function ensureEventRuntime(input: { eventId: string; sold?: number; checkedIn?: number; revenue?: number; status?: HostEventRuntime['status'] }): Promise<HostEventRuntime> {
  const all = await loadHostRuntime();
  const existing = all[input.eventId];
  const next: HostEventRuntime = existing || {
    eventId: input.eventId,
    sold: input.sold ?? 0,
    checkedIn: input.checkedIn ?? 0,
    revenue: input.revenue ?? 0,
    status: input.status ?? 'published',
    updatedAt: new Date().toISOString(),
  };
  all[input.eventId] = { ...next, updatedAt: new Date().toISOString() };
  await saveHostRuntime(all);
  return all[input.eventId];
}

export async function updateEventRuntime(eventId: string, patch: Partial<HostEventRuntime>): Promise<HostEventRuntime> {
  const all = await loadHostRuntime();
  const base = all[eventId] || { eventId, sold: 0, checkedIn: 0, revenue: 0, status: 'published' as const, updatedAt: new Date().toISOString() };
  const next = { ...base, ...patch, updatedAt: new Date().toISOString() };
  all[eventId] = next;
  await saveHostRuntime(all);
  return next;
}

export async function getEventRuntime(eventId?: string): Promise<HostEventRuntime | undefined> {
  if (!eventId) return undefined;
  const all = await loadHostRuntime();
  return all[eventId];
}

export async function getDoorReadiness(params: {
  eventId: string;
  eventTitle: string;
  operatorName: string;
  primaryDisk?: EchoDiskSlot | null;
  backupDisk?: EchoDiskSlot | null;
}): Promise<DoorReadinessResult> {
  const sessions = await loadDoorSessions();
  const recent = sessions.find((session) => session.eventId === params.eventId && session.status !== 'closed');
  const now = Date.now();
  const lastVerifiedAt = recent?.lastVerifiedAt ? new Date(recent.lastVerifiedAt).getTime() : 0;
  const recentOkay = !!lastVerifiedAt && now - lastVerifiedAt < RECENT_VERIFY_WINDOW_MS;

  const selectedDisk = params.primaryDisk?.serialNumber ? params.primaryDisk : params.backupDisk?.serialNumber ? params.backupDisk : null;
  const readerMode: ReaderMode = selectedDisk ? 'echo_disk' : 'phone_nfc';

  if (recentOkay) {
    return {
      state: 'ready',
      title: 'Door Ready',
      message: 'Recent verification found. Reader and event session are ready to continue.',
      readerMode,
      usedRecentVerification: true,
      checks: [
        { label: 'Event loaded', value: 'Ready', tone: 'good' },
        { label: selectedDisk ? 'Echo Disk verified' : 'Reader ready', value: selectedDisk ? selectedDisk.nickname : 'Phone NFC', tone: 'good' },
        { label: 'System state', value: 'Recent verification active', tone: 'good' },
      ],
    };
  }

  if (selectedDisk?.serialNumber) {
    return {
      state: 'ready',
      title: 'Door Ready',
      message: 'Echo Disk matched your saved hardware profile and system checks are clear.',
      readerMode: 'echo_disk',
      usedRecentVerification: false,
      checks: [
        { label: 'Event loaded', value: 'Ready', tone: 'good' },
        { label: 'Echo Disk verified', value: selectedDisk.nickname || selectedDisk.serialNumber, tone: 'good' },
        { label: 'Offline backup', value: 'Ready', tone: 'neutral' },
      ],
    };
  }

  return {
    state: 'caution',
    title: 'Ready with Caution',
    message: 'No Echo Disk was found, so Door Mode will use phone NFC with QR backup.',
    readerMode: 'phone_nfc',
    usedRecentVerification: false,
    checks: [
      { label: 'Event loaded', value: 'Ready', tone: 'good' },
      { label: 'Reader mode', value: 'Phone NFC', tone: 'warn' },
      { label: 'QR backup', value: 'Enabled', tone: 'neutral' },
    ],
  };
}

export async function startDoorSession(params: {
  eventId: string;
  eventTitle: string;
  operatorName: string;
  readerMode: ReaderMode;
}): Promise<DoorSession> {
  const sessions = await loadDoorSessions();
  const existing = sessions.find((session) => session.eventId === params.eventId && session.status !== 'closed');
  const now = new Date().toISOString();
  const next: DoorSession = existing ? {
    ...existing,
    operatorName: params.operatorName,
    readerMode: params.readerMode,
    status: 'active',
    updatedAt: now,
    lastVerifiedAt: now,
  } : {
    id: `door_${Date.now()}`,
    eventId: params.eventId,
    eventTitle: params.eventTitle,
    operatorName: params.operatorName,
    readerMode: params.readerMode,
    status: 'active',
    startedAt: now,
    updatedAt: now,
    checkedInCount: 0,
    deniedCount: 0,
    lastVerifiedAt: now,
  };
  const filtered = sessions.filter((session) => session.id !== next.id);
  filtered.unshift(next);
  await saveDoorSessions(filtered);
  await ensureEventRuntime({ eventId: params.eventId, status: 'live' });
  await updateEventRuntime(params.eventId, { status: 'live', lastDoorSessionId: next.id });
  return next;
}

export async function recordDoorOutcome(eventId: string, outcome: 'approved' | 'denied'): Promise<DoorSession | undefined> {
  const sessions = await loadDoorSessions();
  const current = sessions.find((session) => session.eventId === eventId && session.status === 'active');
  if (!current) return undefined;
  const updated: DoorSession = {
    ...current,
    checkedInCount: outcome === 'approved' ? current.checkedInCount + 1 : current.checkedInCount,
    deniedCount: outcome === 'denied' ? current.deniedCount + 1 : current.deniedCount,
    updatedAt: new Date().toISOString(),
  };
  await saveDoorSessions([updated, ...sessions.filter((session) => session.id !== updated.id)]);
  const runtime = await getEventRuntime(eventId);
  await updateEventRuntime(eventId, {
    checkedIn: outcome === 'approved' ? (runtime?.checkedIn ?? 0) + 1 : runtime?.checkedIn ?? 0,
  });
  return updated;
}

export async function pauseDoorSession(eventId: string): Promise<void> {
  const sessions = await loadDoorSessions();
  const next = sessions.map((session) => session.eventId === eventId && session.status === 'active' ? { ...session, status: 'paused' as const, updatedAt: new Date().toISOString() } : session);
  await saveDoorSessions(next);
}

export async function resumeDoorSession(eventId: string): Promise<void> {
  const sessions = await loadDoorSessions();
  const next = sessions.map((session) => session.eventId === eventId && session.status === 'paused' ? { ...session, status: 'active' as const, updatedAt: new Date().toISOString() } : session);
  await saveDoorSessions(next);
}

export async function closeDoorSession(eventId: string): Promise<void> {
  const sessions = await loadDoorSessions();
  const next = sessions.map((session) => session.eventId === eventId && session.status !== 'closed' ? { ...session, status: 'closed' as const, updatedAt: new Date().toISOString() } : session);
  await saveDoorSessions(next);
  await updateEventRuntime(eventId, { status: 'ended' });
}

export type DoorScanOutcome = 'approved' | 'denied' | 'duplicate' | 'offline_queued';

export interface OfflineDoorCredential {
  ticketId: string;
  eventId: string;
  qrCode: string;
  nfcCredential?: string;
  holderName?: string;
  status: 'valid' | 'used' | 'refunded' | 'transferred';
}

export interface OfflineDoorScanRecord {
  id: string;
  eventId: string;
  ticketId?: string;
  credential: string;
  outcome: DoorScanOutcome;
  reason?: string;
  scannedAt: string;
  synced: boolean;
}

const DOOR_CREDENTIAL_CACHE_KEY = 'echo.host.offlineDoorCredentials.v1';
const DOOR_SCAN_QUEUE_KEY = 'echo.host.offlineDoorScanQueue.v1';

export async function preloadOfflineDoorCredentials(eventId: string, credentials: OfflineDoorCredential[]): Promise<void> {
  const all = await getJSON<Record<string, OfflineDoorCredential[]>>(DOOR_CREDENTIAL_CACHE_KEY, {});
  all[eventId] = credentials;
  await setJSON(DOOR_CREDENTIAL_CACHE_KEY, all);
}

export async function getOfflineDoorCredentials(eventId: string): Promise<OfflineDoorCredential[]> {
  const all = await getJSON<Record<string, OfflineDoorCredential[]>>(DOOR_CREDENTIAL_CACHE_KEY, {});
  return all[eventId] || [];
}

export async function getOfflineDoorScanQueue(eventId?: string): Promise<OfflineDoorScanRecord[]> {
  const queue = await getJSON<OfflineDoorScanRecord[]>(DOOR_SCAN_QUEUE_KEY, []);
  return eventId ? queue.filter((record) => record.eventId === eventId) : queue;
}

async function saveOfflineDoorScanQueue(queue: OfflineDoorScanRecord[]): Promise<void> {
  await setJSON(DOOR_SCAN_QUEUE_KEY, queue);
}

export async function validateDoorCredentialOffline(params: {
  eventId: string;
  credential: string;
  allowQueue?: boolean;
}): Promise<OfflineDoorScanRecord> {
  const credentials = await getOfflineDoorCredentials(params.eventId);
  const queue = await getOfflineDoorScanQueue(params.eventId);
  const matched = credentials.find((item) => item.qrCode === params.credential || item.nfcCredential === params.credential);
  const alreadyScanned = queue.some((record) => record.credential === params.credential && record.outcome === 'approved');
  const now = new Date().toISOString();

  let outcome: DoorScanOutcome = 'denied';
  let reason = 'Credential not found in offline cache.';

  if (alreadyScanned) {
    outcome = 'duplicate';
    reason = 'This credential was already checked in locally.';
  } else if (matched?.status === 'valid') {
    outcome = params.allowQueue === false ? 'approved' : 'offline_queued';
    reason = params.allowQueue === false ? 'Approved from cached attendee list.' : 'Approved offline and queued for sync.';
  } else if (matched) {
    reason = `Ticket is ${matched.status}.`;
  }

  const record: OfflineDoorScanRecord = {
    id: `door_scan_${Date.now()}`,
    eventId: params.eventId,
    ticketId: matched?.ticketId,
    credential: params.credential,
    outcome,
    reason,
    scannedAt: now,
    synced: false,
  };

  await saveOfflineDoorScanQueue([record, ...queue]);
  if (outcome === 'approved' || outcome === 'offline_queued') {
    await recordDoorOutcome(params.eventId, 'approved');
  } else {
    await recordDoorOutcome(params.eventId, 'denied');
  }
  return record;
}

export async function markOfflineDoorQueueSynced(eventId: string): Promise<void> {
  const queue = await getOfflineDoorScanQueue();
  await saveOfflineDoorScanQueue(queue.map((record) => record.eventId === eventId ? { ...record, synced: true } : record));
}
