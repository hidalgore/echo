import { getJSON, setJSON } from './persistence';

export type InventoryHoldStatus = 'active' | 'released' | 'completed' | 'expired';

export interface InventoryHold {
  id: string;
  eventId: string;
  ticketTypeId?: string;
  quantity: number;
  status: InventoryHoldStatus;
  createdAt: string;
  expiresAt: string;
  completedAt?: string;
  releasedAt?: string;
}

const HOLD_KEY = 'echo.checkout.inventoryHolds.v1';
const DEFAULT_HOLD_MS = 1000 * 60 * 8;

async function loadHolds(): Promise<InventoryHold[]> {
  const holds = await getJSON<InventoryHold[]>(HOLD_KEY, []);
  const now = Date.now();
  let changed = false;
  const next = holds.map((hold) => {
    if (hold.status === 'active' && new Date(hold.expiresAt).getTime() <= now) {
      changed = true;
      return { ...hold, status: 'expired' as const };
    }
    return hold;
  });
  if (changed) await setJSON(HOLD_KEY, next);
  return next;
}

async function saveHolds(holds: InventoryHold[]): Promise<void> {
  await setJSON(HOLD_KEY, holds);
}

export async function createInventoryHold(params: {
  eventId: string;
  ticketTypeId?: string;
  quantity: number;
  ttlMs?: number;
}): Promise<InventoryHold> {
  const holds = await loadHolds();
  const now = Date.now();
  const hold: InventoryHold = {
    id: `hold_${params.eventId}_${now}`,
    eventId: params.eventId,
    ticketTypeId: params.ticketTypeId,
    quantity: Math.max(1, Math.floor(params.quantity || 1)),
    status: 'active',
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + (params.ttlMs ?? DEFAULT_HOLD_MS)).toISOString(),
  };
  await saveHolds([hold, ...holds]);
  return hold;
}

export async function completeInventoryHold(holdId?: string | null): Promise<void> {
  if (!holdId) return;
  const holds = await loadHolds();
  const now = new Date().toISOString();
  await saveHolds(holds.map((hold) => hold.id === holdId ? { ...hold, status: 'completed', completedAt: now } : hold));
}

export async function releaseInventoryHold(holdId?: string | null): Promise<void> {
  if (!holdId) return;
  const holds = await loadHolds();
  const now = new Date().toISOString();
  await saveHolds(holds.map((hold) => hold.id === holdId && hold.status === 'active' ? { ...hold, status: 'released', releasedAt: now } : hold));
}

export async function getActiveHoldsForEvent(eventId: string): Promise<InventoryHold[]> {
  const holds = await loadHolds();
  return holds.filter((hold) => hold.eventId === eventId && hold.status === 'active');
}
