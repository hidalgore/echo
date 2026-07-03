/**
 * ECHO Circle Store (Elite Spec v1 — Unified)
 * ═════════════════════════════════════════════
 * Single source of truth for Circle state across ALL screens.
 * Real connected flow — no demo selectors.
 * Timed simulation: invited friends auto-progress through statuses.
 */
import { create } from 'zustand';
import type { EchoCircle, MemberSlotStatus, CircleMember } from '../types/circle';
import { deriveCircleStatus, deriveCounts, deriveEditability } from '../services/circleStateModel';

interface CircleState {
  circle: EchoCircle | null;
  secondsRemaining: number;
  _simulationTimers: ReturnType<typeof setTimeout>[];

  loadCircle: (circle: EchoCircle) => void;
  reset: () => void;
  tickTimer: () => void;

  createCircle: (circle: EchoCircle) => void;
  inviteMember: (slotId: string, name: string, method: CircleMember['inviteMethod'], avatarUrl?: string | null) => void;
  remindMember: (memberId: string) => void;
  replaceMember: (memberId: string, newName: string, method?: CircleMember['inviteMethod']) => void;
  removePendingSlot: (memberId: string) => void;
  claimSpot: (memberId: string) => void;
  coverRemaining: () => void;
  releaseRemaining: () => void;
  expireTimer: () => void;
  markComplete: () => void;
  closeCircle: () => void;

  startClaimSimulation: (memberId: string) => void;
  clearSimulations: () => void;
}

const ACCENT_POOL = ['#E63DAD', '#20C7FF', '#F59E0B', '#10B981', '#7B4DFF', '#FF7A1A', '#FFC247'];

function refreshStatus(circle: EchoCircle): EchoCircle {
  return { ...circle, status: deriveCircleStatus(circle) };
}

export const useCircleStore = create<CircleState>((set, get) => ({
  circle: null,
  secondsRemaining: 0,
  _simulationTimers: [],

  loadCircle: (circle) => {
    const refreshed = refreshStatus(circle);
    set({ circle: refreshed, secondsRemaining: refreshed.secondsRemaining });
  },

  reset: () => {
    get().clearSimulations();
    set({ circle: null, secondsRemaining: 0 });
  },

  tickTimer: () => {
    const { secondsRemaining, circle } = get();
    if (secondsRemaining <= 0 || !circle) return;
    const next = secondsRemaining - 1;
    const updated = { ...circle, secondsRemaining: next };
    if (next <= 0) {
      updated.members = updated.members.map(m =>
        m.status === 'open' || m.status === 'invited' || m.status === 'pending'
          ? { ...m, status: 'expired' as MemberSlotStatus }
          : m
      );
    }
    set({ secondsRemaining: next, circle: refreshStatus(updated) });
  },

  createCircle: (circle) => {
    set({ circle: refreshStatus(circle), secondsRemaining: circle.secondsRemaining });
  },

  inviteMember: (slotId, name, method, avatarUrl) => {
    const { circle } = get();
    if (!circle) return;
    const editability = deriveEditability(circle);
    if (editability !== 'editable') return;

    const idx = circle.members.filter(m => m.status !== 'open').length;
    const accentColor = ACCENT_POOL[idx % ACCENT_POOL.length];

    const members = circle.members.map(m =>
      m.id === slotId && m.status === 'open'
        ? {
            ...m, name, accentColor,
            initials: name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
            avatarUrl: avatarUrl || null,
            status: 'invited' as MemberSlotStatus,
            inviteMethod: method,
            invitedAt: new Date().toISOString(),
          }
        : m
    );
    set({ circle: refreshStatus({ ...circle, members }) });

    const updated = members.find(m => m.id === slotId);
    if (updated && updated.status === 'invited') {
      get().startClaimSimulation(slotId);
    }
  },

  remindMember: () => { /* CIR-06: server-side 5-min cooldown */ },

  replaceMember: (memberId, newName, method) => {
    const { circle } = get();
    if (!circle) return;
    if (circle.replacementsUsed >= circle.maxReplacements) return;
    if (deriveEditability(circle) !== 'editable') return;

    const target = circle.members.find(m => m.id === memberId);
    if (!target || target.hasBeenReplaced || target.status === 'claimed') return;

    const idx = circle.members.filter(m => m.status !== 'open').length;
    const members = circle.members.map(m =>
      m.id === memberId ? { ...m, status: 'replaced' as MemberSlotStatus, hasBeenReplaced: true } : m
    );

    const newMember: CircleMember = {
      id: `mem_replace_${Date.now()}`,
      slotIndex: target.slotIndex,
      name: newName, avatarUrl: null,
      initials: newName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
      accentColor: ACCENT_POOL[idx % ACCENT_POOL.length],
      status: 'invited', isOrganizer: false, amount: circle.pricePerTicket,
      inviteMethod: method, invitedAt: new Date().toISOString(), hasBeenReplaced: false,
    };

    const mi = members.findIndex(m => m.id === memberId);
    members.splice(mi + 1, 0, newMember);

    set({ circle: refreshStatus({ ...circle, members, replacementsUsed: circle.replacementsUsed + 1 }) });
    get().startClaimSimulation(newMember.id);
  },

  removePendingSlot: (memberId) => {
    const { circle } = get();
    if (!circle) return;
    const members = circle.members.map(m =>
      m.id === memberId && (m.status === 'invited' || m.status === 'pending')
        ? { ...m, status: 'open' as MemberSlotStatus, name: null, initials: '' }
        : m
    );
    set({ circle: refreshStatus({ ...circle, members }) });
  },

  claimSpot: (memberId) => {
    const { circle } = get();
    if (!circle) return;
    const members = circle.members.map(m =>
      m.id === memberId && (m.status === 'invited' || m.status === 'pending')
        ? { ...m, status: 'claimed' as MemberSlotStatus, claimedAt: new Date().toISOString() }
        : m
    );
    const updated = refreshStatus({ ...circle, members });
    const counts = deriveCounts(updated);
    if (counts.claimed === updated.totalTickets) updated.status = 'complete';
    set({ circle: updated });
  },

  coverRemaining: () => {
    const { circle } = get();
    if (!circle) return;
    get().clearSimulations();
    const members = circle.members.map(m =>
      m.status === 'open' || m.status === 'expired' || m.status === 'invited' || m.status === 'pending'
        ? { ...m, status: 'claimed' as MemberSlotStatus, name: m.name || 'Covered by you', claimedAt: new Date().toISOString() }
        : m
    );
    set({ circle: refreshStatus({ ...circle, members }), secondsRemaining: 0 });
  },

  releaseRemaining: () => {
    const { circle } = get();
    if (!circle) return;
    get().clearSimulations();
    const members = circle.members.map(m =>
      m.status === 'open' || m.status === 'expired' || m.status === 'invited' || m.status === 'pending'
        ? { ...m, status: 'released' as MemberSlotStatus }
        : m
    );
    set({ circle: refreshStatus({ ...circle, members }), secondsRemaining: 0 });
  },

  expireTimer: () => {
    const { circle } = get();
    if (!circle) return;
    get().clearSimulations();
    const members = circle.members.map(m =>
      m.status === 'open' || m.status === 'invited' || m.status === 'pending'
        ? { ...m, status: 'expired' as MemberSlotStatus }
        : m
    );
    set({ circle: refreshStatus({ ...circle, members, secondsRemaining: 0 }), secondsRemaining: 0 });
  },

  markComplete: () => {
    const { circle } = get();
    if (!circle) return;
    get().clearSimulations();
    set({ circle: { ...circle, status: 'complete' }, secondsRemaining: 0 });
  },

  closeCircle: () => {
    const { circle } = get();
    if (!circle) return;
    get().clearSimulations();
    const members = circle.members.map(m =>
      m.status !== 'claimed' && !m.isOrganizer
        ? { ...m, status: 'released' as MemberSlotStatus }
        : m
    );
    set({ circle: { ...circle, status: 'closed', members }, secondsRemaining: 0 });
  },

  // ── Timed Simulation: invited → pending (6-8s) → claimed (14-18s) ──
  startClaimSimulation: (memberId) => {
    const pendingDelay = 6000 + Math.random() * 2000;
    const claimDelay = 14000 + Math.random() * 4000;

    const t1 = setTimeout(() => {
      const { circle } = get();
      if (!circle) return;
      const m = circle.members.find(x => x.id === memberId);
      if (!m || m.status !== 'invited') return;
      const members = circle.members.map(x =>
        x.id === memberId ? { ...x, status: 'pending' as MemberSlotStatus } : x
      );
      set({ circle: refreshStatus({ ...circle, members }) });
    }, pendingDelay);

    const t2 = setTimeout(() => {
      const { circle } = get();
      if (!circle) return;
      const m = circle.members.find(x => x.id === memberId);
      if (!m || (m.status !== 'invited' && m.status !== 'pending')) return;
      get().claimSpot(memberId);
    }, claimDelay);

    set(state => ({ _simulationTimers: [...state._simulationTimers, t1, t2] }));
  },

  clearSimulations: () => {
    get()._simulationTimers.forEach(t => clearTimeout(t));
    set({ _simulationTimers: [] });
  },
}));
